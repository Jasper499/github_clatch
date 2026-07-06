#!/usr/bin/env python3
"""Fetch trending GitHub repos and Hacker News stories for the last N days."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_weibo import fetch_weibo, weibo_catalog_entry, weibo_source_meta, iso_date_today

PERIOD_DAYS = 7
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"
USER_AGENT = "clatch-weekly-updater/1.0"


def http_get(url: str, headers: dict | None = None) -> dict | list:
    req_headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)

    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token and "api.github.com" in url:
        req_headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def iso_date(days_ago: int) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return dt.strftime("%Y-%m-%d")


def fetch_github_repos(query_suffix: str, limit: int = 20) -> list[dict]:
    since = iso_date(PERIOD_DAYS)
    q = f"{query_suffix} stars:>10"
    params = urllib.parse.urlencode(
        {
            "q": q,
            "sort": "stars",
            "order": "desc",
            "per_page": str(min(limit, 30)),
        }
    )
    url = f"https://api.github.com/search/repositories?{params}"

    try:
        data = http_get(url)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"GitHub API error ({exc.code}): {body}", file=sys.stderr)
        if exc.code == 403 and "rate limit" in body.lower():
            print(
                "提示：设置 GITHUB_TOKEN 环境变量可提高 API 限额。",
                file=sys.stderr,
            )
        return []

    items = []
    for repo in data.get("items", [])[:limit]:
        items.append(
            {
                "title": repo.get("full_name") or repo.get("name", "unknown"),
                "description": repo.get("description") or "",
                "url": repo.get("html_url", ""),
                "stars": repo.get("stargazers_count", 0),
                "language": repo.get("language") or "",
                "owner": (repo.get("owner") or {}).get("login", ""),
            }
        )
    return items


def fetch_hackernews(limit: int = 20) -> list[dict]:
    since_ts = int(
        (datetime.now(timezone.utc) - timedelta(days=PERIOD_DAYS)).timestamp()
    )
    params = urllib.parse.urlencode(
        {
            "tags": "story",
            "numericFilters": f"created_at_i>{since_ts}",
            "hitsPerPage": str(min(limit, 30)),
        }
    )
    url = f"https://hn.algolia.com/api/v1/search?{params}"

    try:
        data = http_get(url)
    except urllib.error.URLError as exc:
        print(f"Hacker News API error: {exc}", file=sys.stderr)
        return []

    items = []
    for hit in data.get("hits", [])[:limit]:
        title = hit.get("title") or hit.get("story_title") or "Untitled"
        object_id = hit.get("objectID") or hit.get("story_id")
        story_url = hit.get("url") or f"https://news.ycombinator.com/item?id={object_id}"
        items.append(
            {
                "title": title,
                "description": hit.get("story_text") or "",
                "url": story_url,
                "score": hit.get("points") or hit.get("story_score") or 0,
                "comments": hit.get("num_comments") or hit.get("story_comment_count") or 0,
                "owner": hit.get("author") or hit.get("story_by") or "",
            }
        )

    items.sort(key=lambda x: x.get("score", 0), reverse=True)
    return items


def build_payload() -> dict:
    since = iso_date(PERIOD_DAYS)
    today = iso_date(0)
    new_repos = fetch_github_repos(f"created:>{since}")
    active_repos = fetch_github_repos(f"pushed:>{since}")
    hn_stories = fetch_hackernews()
    weibo_items = fetch_weibo()

    return {
        "updatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "periodDays": PERIOD_DAYS,
        "weekLabel": f"{since} ~ {today}",
        "catalog": [
            {
                "id": "github",
                "label": "GitHub",
                "children": [
                    {"id": "github", "sourceKey": "github"},
                    {"id": "githubActive", "sourceKey": "githubActive"},
                ],
            },
            {
                "id": "hackernews",
                "label": "Hacker News",
                "children": [
                    {"id": "hackernews", "sourceKey": "hackernews"},
                ],
            },
            weibo_catalog_entry(),
        ],
        "sources": {
            "github": {
                "label": "GitHub 热门新项目",
                "description": f"近 {PERIOD_DAYS} 天内创建、按 Star 数排序的开源项目",
                "items": new_repos,
            },
            "githubActive": {
                "label": "GitHub 活跃项目",
                "description": f"近 {PERIOD_DAYS} 天内有推送、按 Star 数排序的热门仓库",
                "items": active_repos,
            },
            "hackernews": {
                "label": "Hacker News 热门",
                "description": f"近 {PERIOD_DAYS} 天内 HN 社区高互动技术讨论",
                "items": hn_stories,
            },
            "weibo": weibo_source_meta(today, weibo_items),
        },
        "weiboUpdatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }


def main() -> int:
    print(f"正在抓取近 {PERIOD_DAYS} 天热门内容…")
    payload = build_payload()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    counts = {k: len(v["items"]) for k, v in payload["sources"].items()}
    print(f"已写入 {OUTPUT}")
    print(f"  GitHub 新项目: {counts['github']} 条")
    print(f"  GitHub 活跃:   {counts['githubActive']} 条")
    print(f"  Hacker News:   {counts['hackernews']} 条")
    print(f"  微博热搜:      {counts.get('weibo', 0)} 条")
    print(f"  更新时间:      {payload['updatedAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
