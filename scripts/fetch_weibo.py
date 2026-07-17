"""Fetch Weibo realtime hot search list."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

WEIBO_HOT_URL = "https://weibo.com/ajax/side/hotSearch"
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": "https://weibo.com/",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
}


def _http_get(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _build_topic_url(entry: dict) -> str:
    word = entry.get("word") or entry.get("note") or ""
    key = entry.get("word_scheme") or f"#{word}"
    query = urllib.parse.quote(key)
    return f"https://s.weibo.com/weibo?q={query}&t=31&band_rank=1&Refer=top"


def _parse_hot_value(value) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return 0


def fetch_weibo(limit: int = 30) -> list[dict]:
    try:
        data = _http_get(WEIBO_HOT_URL, BROWSER_HEADERS)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"Weibo API error ({exc.code}): {body}", file=sys.stderr)
        return []
    except urllib.error.URLError as exc:
        print(f"Weibo API error: {exc}", file=sys.stderr)
        return []

    if data.get("ok") != 1:
        print("Weibo API returned unexpected payload.", file=sys.stderr)
        return []

    items = []
    for entry in data.get("data", {}).get("realtime", []):
        if entry.get("is_ad"):
            continue

        word = (entry.get("word") or entry.get("note") or "").strip()
        if not word:
            continue

        label = entry.get("label_name") or ""
        category = entry.get("category") or ""
        desc_parts = [part for part in (label, category) if part]
        description = " · ".join(desc_parts)

        items.append(
            {
                "title": word,
                "description": description,
                "url": _build_topic_url(entry),
                "score": _parse_hot_value(entry.get("num")),
                "owner": "微博热搜",
                "label": label,
            }
        )

        if len(items) >= limit:
            break

    return items


def weibo_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "微博热搜",
        "description": f"当日微博实时热搜榜（{fetched_date}，共 {len(items)} 条，每 6 小时更新）",
        "updateFrequency": "twice-daily",
        "fetchedDate": fetched_date,
        "items": items,
    }


def weibo_catalog_entry() -> dict:
    return {
        "id": "weibo",
        "label": "微博",
        "children": [{"id": "weibo", "sourceKey": "weibo"}],
    }


def iso_date_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")
