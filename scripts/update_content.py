#!/usr/bin/env python3
"""Weekly GitHub trending updater — writes sources/meta/history (no content.json)."""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_github import PERIOD_DAYS, fetch_github_repos
from history import publish_source_update, utc_now_iso


def iso_date(days_ago: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return dt.strftime("%Y-%m-%d")


def github_catalog_entry() -> dict:
    return {
        "id": "github",
        "label": "GitHub",
        "children": [
            {"id": "github", "sourceKey": "github"},
            {"id": "githubActive", "sourceKey": "githubActive"},
        ],
    }


def build_github_sources() -> dict:
    since = iso_date(PERIOD_DAYS)
    new_repos = fetch_github_repos(f"created:>{since}", since)
    active_repos = fetch_github_repos(f"pushed:>{since}", since)
    return {
        "github": {
            "label": "GitHub 热门新项目",
            "description": f"近 {PERIOD_DAYS} 天内创建、按 Star 数排序的开源项目（含 README）",
            "items": new_repos,
        },
        "githubActive": {
            "label": "GitHub 活跃项目",
            "description": f"近 {PERIOD_DAYS} 天内有推送、按 Star 数排序的热门仓库（含 README）",
            "items": active_repos,
        },
    }


def main() -> int:
    print(f"正在抓取近 {PERIOD_DAYS} 天 GitHub 热门项目及 README…")
    since = iso_date(PERIOD_DAYS)
    today = iso_date(0)
    github_sources = build_github_sources()

    if not any(github_sources[key]["items"] for key in github_sources):
        print("GitHub 抓取失败，未写入文件。", file=sys.stderr)
        return 1

    now = utc_now_iso()
    publish_source_update(
        github_sources,
        meta_fields={
            "periodDays": PERIOD_DAYS,
            "weekLabel": f"{since} ~ {today}",
            "githubUpdatedAt": now,
            "updatedAt": now,
        },
        catalog_nodes=[github_catalog_entry()],
    )

    counts = {k: len(v["items"]) for k, v in github_sources.items()}
    readme_counts = {
        k: sum(1 for item in v["items"] if item.get("readme"))
        for k, v in github_sources.items()
    }
    print("已发布 sources/meta/history（未写 content.json）")
    print(f"  GitHub 新项目: {counts['github']} 条，README {readme_counts['github']} 篇")
    print(f"  GitHub 活跃:   {counts['githubActive']} 条，README {readme_counts['githubActive']} 篇")
    print(f"  更新时间:      {now}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
