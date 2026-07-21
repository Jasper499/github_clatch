"""Archive per-source content snapshots for historical browsing.

Also publishes lightweight artifacts for the website:
- data/sources/{sourceKey}.json  — latest payload per source (on-demand fetch)
- data/meta.json                 — catalog + timestamps without item bodies
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
HISTORY_DIR = DATA_DIR / "history"
SOURCES_DIR = DATA_DIR / "sources"
MANIFEST_PATH = DATA_DIR / "manifest.json"
META_PATH = DATA_DIR / "meta.json"
MAX_SNAPSHOTS_PER_SOURCE = 120


META_COPY_FIELDS = (
    "updatedAt",
    "periodDays",
    "weekLabel",
    "githubUpdatedAt",
    "hackernewsUpdatedAt",
    "weiboUpdatedAt",
    "journalsUpdatedAt",
    "natureSkillsUpdatedAt",
    "scientificSkillsUpdatedAt",
    "natureSkillsLatestSha",
    "scientificSkillsLatestSha",
)


def iso_date_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def iso_snapshot_id() -> str:
    """Unique snapshot id per run (UTC), safe for filenames on Windows/Linux."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        with MANIFEST_PATH.open(encoding="utf-8") as f:
            return json.load(f)
    return {"version": 1, "sources": {}}


def _slim_items_without_readme(source_data: dict) -> dict:
    """Drop bulky README bodies for lite/history payloads."""
    items = source_data.get("items")
    if not isinstance(items, list):
        return dict(source_data)
    slim_items = []
    for item in items:
        if not isinstance(item, dict):
            slim_items.append(item)
            continue
        slim_items.append({k: v for k, v in item.items() if k != "readme"})
    out = dict(source_data)
    out["items"] = slim_items
    return out


def write_latest_source(source_key: str, source_data: dict) -> Path:
    """Write data/sources/{key}.json and a README-free .lite.json companion."""
    SOURCES_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "sourceKey": source_key,
        "savedAt": utc_now_iso(),
        **source_data,
    }
    out_file = SOURCES_DIR / f"{source_key}.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    lite_payload = {
        "sourceKey": source_key,
        "savedAt": payload["savedAt"],
        **_slim_items_without_readme(source_data),
    }
    lite_file = SOURCES_DIR / f"{source_key}.lite.json"
    with lite_file.open("w", encoding="utf-8") as f:
        json.dump(lite_payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return out_file


def load_meta() -> dict:
    if META_PATH.exists():
        with META_PATH.open(encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
    return {"catalog": [], "sources": {}}


def source_stub(source_data: dict) -> dict:
    stub = {k: v for k, v in source_data.items() if k != "items"}
    stub["itemCount"] = len(source_data.get("items") or [])
    return stub


def upsert_catalog_node(catalog: list, node: dict) -> None:
    node_id = node.get("id")
    if not node_id:
        return
    for index, existing in enumerate(catalog):
        if existing.get("id") == node_id:
            catalog[index] = node
            return
    catalog.append(node)


def write_meta(meta: dict) -> Path:
    meta = dict(meta)
    meta["generatedAt"] = utc_now_iso()
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    with META_PATH.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return META_PATH


def patch_meta(
    *,
    meta_fields: dict | None = None,
    source_updates: dict[str, dict] | None = None,
    catalog_nodes: list[dict] | None = None,
) -> dict:
    """Merge timestamps / source stubs / catalog into meta.json without content.json."""
    meta = load_meta()
    meta.setdefault("catalog", [])
    meta.setdefault("sources", {})
    if meta_fields:
        for key, value in meta_fields.items():
            if value is not None:
                meta[key] = value
    if source_updates:
        for key, data in source_updates.items():
            meta["sources"][key] = source_stub(data)
    if catalog_nodes:
        for node in catalog_nodes:
            upsert_catalog_node(meta["catalog"], node)
    write_meta(meta)
    return meta


def write_feeds(meta: dict, source_updates: dict[str, dict] | None = None) -> None:
    """Write a lightweight JSON feed and Atom feed for the latest items."""
    feeds_dir = DATA_DIR / "feeds"
    feeds_dir.mkdir(parents=True, exist_ok=True)
    site = "https://jasper499.github.io/github_clatch"
    entries: list[dict] = []

    # Prefer just-updated sources; fill from lite files for others when building full feed.
    keys = list((source_updates or {}).keys()) or list((meta.get("sources") or {}).keys())
    seen: set[str] = set()
    for key in keys:
        if key in seen:
            continue
        seen.add(key)
        payload = (source_updates or {}).get(key)
        if payload is None:
            lite = SOURCES_DIR / f"{key}.lite.json"
            full = SOURCES_DIR / f"{key}.json"
            path = lite if lite.exists() else full
            if not path.exists():
                continue
            with path.open(encoding="utf-8") as f:
                payload = json.load(f)
        label = payload.get("label") or key
        for item in (payload.get("items") or [])[:8]:
            if not isinstance(item, dict):
                continue
            title = item.get("title") or ""
            url = item.get("url") or f"{site}/#/{key}"
            entries.append(
                {
                    "sourceKey": key,
                    "sourceLabel": label,
                    "title": title,
                    "url": url,
                    "score": item.get("score") or item.get("stars"),
                }
            )

    generated = utc_now_iso()
    json_feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": "HJL Clatch",
        "home_page_url": f"{site}/",
        "feed_url": f"{site}/data/feeds/all.json",
        "description": "GitHub / HN / Weibo / Journals / Skills aggregator",
        "items": [
            {
                "id": f"{e['sourceKey']}:{e['url']}",
                "url": e["url"],
                "title": f"[{e['sourceLabel']}] {e['title']}",
                "date_published": meta.get("updatedAt") or generated,
            }
            for e in entries[:40]
        ],
    }
    with (feeds_dir / "all.json").open("w", encoding="utf-8") as f:
        json.dump(json_feed, f, ensure_ascii=False, indent=2)
        f.write("\n")

    atom_items = []
    for e in entries[:40]:
        title = (
            (e["title"] or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
        link = (e["url"] or "").replace("&", "&amp;")
        atom_items.append(
            f"""  <entry>
    <title>[{e['sourceLabel']}] {title}</title>
    <link href="{link}"/>
    <id>{link}</id>
    <updated>{generated}</updated>
  </entry>"""
        )
    atom = f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>HJL Clatch</title>
  <link href="{site}/"/>
  <link rel="self" href="{site}/data/feeds/all.xml"/>
  <updated>{generated}</updated>
  <id>{site}/</id>
{chr(10).join(atom_items)}
</feed>
"""
    with (feeds_dir / "all.xml").open("w", encoding="utf-8") as f:
        f.write(atom)


def publish_source_update(
    sources: dict[str, dict],
    *,
    meta_fields: dict | None = None,
    catalog_nodes: list[dict] | None = None,
) -> dict:
    """Canonical publisher: sources + history + meta (+ feeds). Skips content.json."""
    for key, data in sources.items():
        write_latest_source(key, data)
        save_source_snapshot(key, data)

    fields = dict(meta_fields or {})
    if "updatedAt" not in fields:
        fields["updatedAt"] = utc_now_iso()
    meta = patch_meta(
        meta_fields=fields,
        source_updates=sources,
        catalog_nodes=catalog_nodes,
    )
    write_feeds(meta, sources)
    return meta


def previous_meta_sha(*field_names: str) -> str:
    meta = load_meta()
    for name in field_names:
        value = meta.get(name)
        if value:
            return str(value)
    sources = meta.get("sources") or {}
    for src in sources.values():
        if isinstance(src, dict) and src.get("latestSha"):
            return str(src["latestSha"])
    return ""


def prune_history_readmes() -> tuple[int, int]:
    """Strip README bodies from existing history JSON files. Returns (files, bytes_saved)."""
    touched = 0
    saved = 0
    if not HISTORY_DIR.exists():
        return 0, 0
    for path in HISTORY_DIR.rglob("*.json"):
        try:
            raw = path.read_bytes()
            data = json.loads(raw.decode("utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict) or not isinstance(data.get("items"), list):
            continue
        slim = _slim_items_without_readme(data)
        if slim == data:
            continue
        new_raw = (json.dumps(slim, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        saved += max(0, len(raw) - len(new_raw))
        path.write_bytes(new_raw)
        touched += 1
    return touched, saved


def write_meta_from_content(content: dict) -> Path:
    """Write slim meta.json (no item bodies) for fast first paint."""
    sources_meta: dict = {}
    for key, src in (content.get("sources") or {}).items():
        if not isinstance(src, dict):
            continue
        stub = {k: v for k, v in src.items() if k != "items"}
        stub["itemCount"] = len(src.get("items") or [])
        sources_meta[key] = stub

    meta = {field: content.get(field) for field in META_COPY_FIELDS if content.get(field) is not None}
    meta["catalog"] = content.get("catalog") or []
    meta["sources"] = sources_meta
    return write_meta(meta)


def publish_content_artifacts(content: dict, source_keys: list[str] | None = None) -> None:
    """Refresh sources/*.json (selected or all) and meta.json from content.json."""
    sources = content.get("sources") or {}
    keys = source_keys if source_keys is not None else list(sources.keys())
    selected = {key: sources[key] for key in keys if key in sources and isinstance(sources[key], dict)}
    for key, data in selected.items():
        write_latest_source(key, data)
    write_meta_from_content(content)
    write_feeds(load_meta(), selected or None)


def save_source_snapshot(source_key: str, source_data: dict, snapshot_date: str | None = None) -> str:
    """Persist one source snapshot and update manifest.

    Each run gets its own snapshot id (UTC timestamp) so same-day updates
    (e.g. Weibo every 6 hours) are kept instead of overwriting.
    Returns the snapshot id used as history filename stem.
    """
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    source_dir = HISTORY_DIR / source_key
    source_dir.mkdir(parents=True, exist_ok=True)

    base_id = snapshot_date or iso_snapshot_id()
    snap_id = base_id
    if snapshot_date is None:
        # Avoid rare same-second collisions when workflow_dispatch is re-run.
        suffix = 2
        while (source_dir / f"{snap_id}.json").exists():
            snap_id = f"{base_id}-{suffix}"
            suffix += 1

    calendar_day = snap_id[:10] if len(snap_id) >= 10 else iso_date_today()

    payload = {
        "date": snap_id,
        "day": calendar_day,
        "sourceKey": source_key,
        "savedAt": utc_now_iso(),
        **_slim_items_without_readme(source_data),
    }

    out_file = source_dir / f"{snap_id}.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    manifest = _load_manifest()
    entries = manifest.setdefault("sources", {}).setdefault(source_key, [])
    # Only replace an entry with the exact same snapshot id (idempotent re-run).
    entries = [e for e in entries if e.get("date") != snap_id]
    entries.insert(
        0,
        {
            "date": snap_id,
            "day": calendar_day,
            "savedAt": payload["savedAt"],
            "itemCount": len(source_data.get("items", [])),
        },
    )
    entries.sort(key=lambda e: e.get("savedAt") or e.get("date") or "", reverse=True)
    kept = entries[:MAX_SNAPSHOTS_PER_SOURCE]
    manifest["sources"][source_key] = kept
    manifest["updatedAt"] = utc_now_iso()

    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Drop orphan snapshot files not referenced by the trimmed manifest.
    keep_names = {f"{e.get('date')}.json" for e in kept if e.get("date")}
    for stale in source_dir.glob("*.json"):
        if stale.name not in keep_names:
            try:
                stale.unlink()
            except OSError:
                pass

    return snap_id


def save_sources_from_content(content: dict, source_keys: list[str]) -> None:
    sources = content.get("sources", {})
    for key in source_keys:
        if key in sources and sources[key].get("items") is not None:
            save_source_snapshot(key, sources[key])
    publish_content_artifacts(content)


def seed_from_content(content_path: Path | None = None) -> int:
    """One-time helper: archive all sources currently in content.json."""
    path = content_path or (DATA_DIR / "content.json")
    if not path.exists():
        return 1
    with path.open(encoding="utf-8") as f:
        content = json.load(f)
    keys = list(content.get("sources", {}).keys())
    save_sources_from_content(content, keys)
    print(f"已归档 {len(keys)} 个数据源到 history/，并生成 sources/ + meta.json")
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(seed_from_content())
