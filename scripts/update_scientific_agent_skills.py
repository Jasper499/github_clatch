#!/usr/bin/env python3
"""Daily updater for K-Dense-AI/scientific-agent-skills — writes sources/meta/history."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_scientific_agent_skills import (
    build_scientific_skills_payload,
    scientific_skills_catalog_entry,
)
from history import previous_meta_sha, publish_source_update

ROOT = Path(__file__).resolve().parent.parent
NOTIFY_PATH = ROOT / "data" / "scientific-agent-skills-notify.json"


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

    previous_sha = previous_meta_sha("scientificSkillsLatestSha")
    latest_sha = payload.get("latestSha") or ""
    changed = (not previous_sha) or (previous_sha != latest_sha)

    publish_source_update(
        payload["sources"],
        meta_fields={
            "scientificSkillsUpdatedAt": payload["fetchedAt"],
            "scientificSkillsLatestSha": latest_sha,
            "updatedAt": payload["fetchedAt"],
        },
        catalog_nodes=[scientific_skills_catalog_entry()],
    )
    _write_notify(payload, previous_sha, changed)

    skill_count = sum(
        1 for i in payload["sources"]["scientificSkills"]["items"] if i.get("label") == "skill"
    )
    commit_count = len(payload["sources"]["scientificSkillsCommits"]["items"])
    print("已发布 sources/meta/history（未写 content.json）")
    print(f"  Skills: {skill_count}")
    print(f"  提交:   {commit_count}")
    print(f"  SHA:    {latest_sha[:7] if latest_sha else '-'}")
    print(f"  变更:   {'是' if changed else '否（与上次相同）'}")
    print(f"  通知:   {NOTIFY_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
