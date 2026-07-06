"""Fetch Hacker News top stories from Algolia API."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

LOOKBACK_DAYS = 7
USER_AGENT = "clatch-hn-updater/1.0"


def _http_get(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def iso_date_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def fetch_hackernews(limit: int = 20) -> list[dict]:
    since_ts = int(
        (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).timestamp()
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
        data = _http_get(url)
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


def hackernews_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "Hacker News 热门",
        "description": (
            f"近 {LOOKBACK_DAYS} 天 HN 高互动讨论（{fetched_date}，共 {len(items)} 条）"
        ),
        "updateFrequency": "twice-daily",
        "fetchedDate": fetched_date,
        "items": items,
    }


def hackernews_catalog_entry() -> dict:
    return {
        "id": "hackernews",
        "label": "Hacker News",
        "children": [{"id": "hackernews", "sourceKey": "hackernews"}],
    }
