#!/usr/bin/env python3
"""Daily updater for K-Dense-AI/scientific-agent-skills — merges into content.json."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_scientific_agent_skills import (
    build_scientific_skills_payload,
    scientific_skills_catalog_entry,
)
from history import save_sources_from_content

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"
NOTIFY_PATH = ROOT / "data" / "scientific-agent-skills-notify.json"
SOURCE_KEYS = ["scientificSkills", "scientificSkillsCommits"]


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
    entry = scientific_skills_catalog_entry()
    for index, node in enumerate(catalog):
        if node.get("id") == "scientificSkills":
            catalog[index] = entry
            return
    catalog.append(entry)


def _previous_sha(content: dict) -> str:
    for key in SOURCE_KEYS:
        sha = (content.get("sources") or {}).get(key, {}).get("latestSha")
        if sha:
            return sha
    return content.get("scientificSkillsLatestSha") or ""


def _write_notify(payload: dict, previous_sha: str, changed: bool) -> None:
    repo = payload.get("repo") or {}
    commits = payload["sources"]["scientificSkillsCommits"]["items"]
    skills = [i for i in payload["sources"]["scientificSkills"]["items"] if i.get("label") == "skill"]
    latest = commits[0] if commits else {}

    notify = {
        "changed": changed,
        "fetchedAt": payload["fetchedAt"],
        "previousSha": previous_sha,
        "latestSha": payload.get("latestSha") or "",
        "repo": repo.get("fullName") or "K-Dense-AI/scientific-agent-skills",
        "repoUrl": repo.get("url") or "https://github.com/K-Dense-AI/scientific-agent-skills",
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
    print("正在抓取 K-Dense-AI/scientific-agent-skills …")
    try:
        payload = build_scientific_skills_payload()
    except Exception as exc:  # noqa: BLE001
        print(f"抓取失败: {exc}", file=sys.stderr)
        return 1

    if not payload["sources"]["scientificSkills"]["items"]:
        print("未获取到 Skills 条目，未写入。", file=sys.stderr)
        return 1

    content = _load_content()
    previous_sha = _previous_sha(content)
    latest_sha = payload.get("latestSha") or ""
    changed = (not previous_sha) or (previous_sha != latest_sha)

    content.setdefault("sources", {}).update(payload["sources"])
    content["scientificSkillsUpdatedAt"] = payload["fetchedAt"]
    content["scientificSkillsLatestSha"] = latest_sha
    content["updatedAt"] = content["scientificSkillsUpdatedAt"]
    _ensure_catalog(content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    save_sources_from_content(content, SOURCE_KEYS)
    _write_notify(payload, previous_sha, changed)

    skill_count = sum(
        1 for i in payload["sources"]["scientificSkills"]["items"] if i.get("label") == "skill"
    )
    commit_count = len(payload["sources"]["scientificSkillsCommits"]["items"])
    print(f"已写入 {OUTPUT}")
    print(f"  Skills: {skill_count}")
    print(f"  提交:   {commit_count}")
    print(f"  SHA:    {latest_sha[:7] if latest_sha else '-'}")
    print(f"  变更:   {'是' if changed else '否（与上次相同）'}")
    print(f"  通知:   {NOTIFY_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
