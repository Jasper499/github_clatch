#!/usr/bin/env python3
"""Weekly GitHub trending updater — merges into existing content.json."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_github import PERIOD_DAYS, fetch_github_repos
from history import save_sources_from_content

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def iso_date(days_ago: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return dt.strftime("%Y-%m-%d")


def _load_content() -> dict:
    if OUTPUT.exists():
        with OUTPUT.open(encoding="utf-8") as f:
            return json.load(f)

    today = iso_date(0)
    return {
        "updatedAt": _utc_now_iso(),
        "periodDays": PERIOD_DAYS,
        "weekLabel": today,
        "catalog": [],
        "sources": {},
    }


def _ensure_github_catalog(content: dict) -> None:
    catalog = content.setdefault("catalog", [])
    github_entry = {
        "id": "github",
        "label": "GitHub",
        "children": [
            {"id": "github", "sourceKey": "github"},
            {"id": "githubActive", "sourceKey": "githubActive"},
        ],
    }
    for index, node in enumerate(catalog):
        if node.get("id") == "github":
            catalog[index] = github_entry
            return
    catalog.insert(0, github_entry)


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

    content = _load_content()
    content["periodDays"] = PERIOD_DAYS
    content["weekLabel"] = f"{since} ~ {today}"
    content["githubUpdatedAt"] = _utc_now_iso()
    content["updatedAt"] = content["githubUpdatedAt"]
    content.setdefault("sources", {}).update(github_sources)
    _ensure_github_catalog(content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    save_sources_from_content(content, list(github_sources.keys()))

    counts = {k: len(v["items"]) for k, v in github_sources.items()}
    readme_counts = {
        k: sum(1 for item in v["items"] if item.get("readme"))
        for k, v in github_sources.items()
    }
    print(f"已写入 {OUTPUT}")
    print(f"  GitHub 新项目: {counts['github']} 条，README {readme_counts['github']} 篇")
    print(f"  GitHub 活跃:   {counts['githubActive']} 条，README {readme_counts['githubActive']} 篇")
    print(f"  更新时间:      {content['githubUpdatedAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
