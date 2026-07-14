#!/usr/bin/env python3
"""Daily updater for Yuan1z0825/nature-skills — merges into content.json."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_nature_skills import build_nature_skills_payload, nature_skills_catalog_entry
from history import save_sources_from_content

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"
NOTIFY_PATH = ROOT / "data" / "nature-skills-notify.json"
SOURCE_KEYS = ["natureSkills", "natureSkillsCommits"]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_content() -> dict:
    if OUTPUT.exists():
        with OUTPUT.open(encoding="utf-8") as f:
            return json.load(f)
    return {
        "updatedAt": _utc_now_iso(),
        "periodDays": 7,
        "weekLabel": "",
        "catalog": [],
        "sources": {},
    }


def _ensure_catalog(content: dict) -> None:
    catalog = content.setdefault("catalog", [])
    entry = nature_skills_catalog_entry()
    for index, node in enumerate(catalog):
        if node.get("id") == "natureSkills":
            catalog[index] = entry
            return
    catalog.append(entry)


def _previous_sha(content: dict) -> str:
    for key in SOURCE_KEYS:
        sha = (content.get("sources") or {}).get(key, {}).get("latestSha")
        if sha:
            return sha
    return content.get("natureSkillsLatestSha") or ""


def _write_notify(payload: dict, previous_sha: str, changed: bool) -> None:
    repo = payload.get("repo") or {}
    commits = payload["sources"]["natureSkillsCommits"]["items"]
    skills = [i for i in payload["sources"]["natureSkills"]["items"] if i.get("label") == "skill"]
    latest = commits[0] if commits else {}

    notify = {
        "changed": changed,
        "fetchedAt": payload["fetchedAt"],
        "previousSha": previous_sha,
        "latestSha": payload.get("latestSha") or "",
        "repo": repo.get("fullName") or "Yuan1z0825/nature-skills",
        "repoUrl": repo.get("url") or "https://github.com/Yuan1z0825/nature-skills",
        "stars": repo.get("stars", 0),
        "skillCount": len(skills),
        "latestCommit": {
            "title": latest.get("title") or "",
            "url": latest.get("url") or "",
            "sha": latest.get("sha") or "",
            "published": latest.get("published") or "",
        },
        "siteUrl": "https://jasper499.github.io/github_clatch/",
        "recentCommits": [
            {"title": c.get("title"), "sha": c.get("sha"), "url": c.get("url")}
            for c in commits[:5]
        ],
    }
    with NOTIFY_PATH.open("w", encoding="utf-8") as f:
        json.dump(notify, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main() -> int:
    print("正在抓取 Yuan1z0825/nature-skills …")
    try:
        payload = build_nature_skills_payload()
    except Exception as exc:  # noqa: BLE001
        print(f"抓取失败: {exc}", file=sys.stderr)
        return 1

    if not payload["sources"]["natureSkills"]["items"]:
        print("未获取到 Skills 条目，未写入。", file=sys.stderr)
        return 1

    content = _load_content()
    previous_sha = _previous_sha(content)
    latest_sha = payload.get("latestSha") or ""
    changed = (not previous_sha) or (previous_sha != latest_sha)

    content.setdefault("sources", {}).update(payload["sources"])
    content["natureSkillsUpdatedAt"] = payload["fetchedAt"]
    content["natureSkillsLatestSha"] = latest_sha
    content["updatedAt"] = content["natureSkillsUpdatedAt"]
    _ensure_catalog(content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    save_sources_from_content(content, SOURCE_KEYS)
    _write_notify(payload, previous_sha, changed)

    skill_count = sum(
        1 for i in payload["sources"]["natureSkills"]["items"] if i.get("label") == "skill"
    )
    commit_count = len(payload["sources"]["natureSkillsCommits"]["items"])
    print(f"已写入 {OUTPUT}")
    print(f"  Skills: {skill_count}")
    print(f"  提交:   {commit_count}")
    print(f"  SHA:    {latest_sha[:7] if latest_sha else '-'}")
    print(f"  变更:   {'是' if changed else '否（与上次相同）'}")
    print(f"  通知:   {NOTIFY_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
