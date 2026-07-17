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
MAX_SNAPSHOTS_PER_SOURCE = 60

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


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        with MANIFEST_PATH.open(encoding="utf-8") as f:
            return json.load(f)
    return {"version": 1, "sources": {}}


def write_latest_source(source_key: str, source_data: dict) -> Path:
    """Write data/sources/{key}.json for on-demand frontend loading."""
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
    return out_file


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
    meta["generatedAt"] = utc_now_iso()

    with META_PATH.open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return META_PATH


def publish_content_artifacts(content: dict, source_keys: list[str] | None = None) -> None:
    """Refresh sources/*.json (selected or all) and meta.json from content.json."""
    sources = content.get("sources") or {}
    keys = source_keys if source_keys is not None else list(sources.keys())
    for key in keys:
        if key in sources and isinstance(sources[key], dict):
            write_latest_source(key, sources[key])
    write_meta_from_content(content)


def save_source_snapshot(source_key: str, source_data: dict, snapshot_date: str | None = None) -> str:
    """Persist one source snapshot and update manifest. Returns snapshot date."""
    date = snapshot_date or iso_date_today()
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    source_dir = HISTORY_DIR / source_key
    source_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "date": date,
        "sourceKey": source_key,
        "savedAt": utc_now_iso(),
        **source_data,
    }

    out_file = source_dir / f"{date}.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    manifest = _load_manifest()
    entries = manifest.setdefault("sources", {}).setdefault(source_key, [])
    entries = [e for e in entries if e.get("date") != date]
    entries.insert(
        0,
        {
            "date": date,
            "savedAt": payload["savedAt"],
            "itemCount": len(source_data.get("items", [])),
        },
    )
    entries.sort(key=lambda e: e.get("date", ""), reverse=True)
    manifest["sources"][source_key] = entries[:MAX_SNAPSHOTS_PER_SOURCE]
    manifest["updatedAt"] = utc_now_iso()

    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return date


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
