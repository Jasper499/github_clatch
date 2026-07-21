"""Fetch Weibo hot search boards (热搜 / 实时上升 / 城事民生)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

WEIBO_HOT_URL = "https://weibo.com/ajax/side/hotSearch"
WEIBO_BAND_URL = "https://weibo.com/ajax/statuses/hot_band"
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

# Categories that read as local/civic "城事" when official 同城榜 is unavailable.
LOCAL_CATEGORY_HINTS = (
    "社会",
    "民生",
    "时事",
    "突发",
    "灾害",
    "天气",
    "交通",
    "城事",
    "地方",
    "城市",
)


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


def _entry_to_item(entry: dict, owner: str) -> dict | None:
    if entry.get("is_ad"):
        return None
    word = (entry.get("word") or entry.get("note") or "").strip()
    if not word:
        return None
    label = entry.get("label_name") or ""
    category = entry.get("category") or ""
    desc_parts = [part for part in (label, category) if part]
    item = {
        "title": word,
        "description": " · ".join(desc_parts),
        "url": _build_topic_url(entry),
        "score": _parse_hot_value(entry.get("num")),
        "owner": owner,
        "label": label,
    }
    if category:
        item["category"] = category
    onboard = entry.get("onboard_time")
    if isinstance(onboard, (int, float)) and onboard > 0:
        item["onboardTime"] = int(onboard)
    return item


def _parse_list(entries: list, *, owner: str, limit: int) -> list[dict]:
    items: list[dict] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        item = _entry_to_item(entry, owner)
        if not item:
            continue
        items.append(item)
        if len(items) >= limit:
            break
    return items


def fetch_hotsearch_payload() -> dict:
    try:
        data = _http_get(WEIBO_HOT_URL, BROWSER_HEADERS)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"Weibo hotSearch error ({exc.code}): {body}", file=sys.stderr)
        return {}
    except urllib.error.URLError as exc:
        print(f"Weibo hotSearch error: {exc}", file=sys.stderr)
        return {}
    if data.get("ok") != 1:
        print("Weibo hotSearch returned unexpected payload.", file=sys.stderr)
        return {}
    return data.get("data") or {}


def fetch_hot_band_payload() -> dict:
    try:
        data = _http_get(WEIBO_BAND_URL, BROWSER_HEADERS)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"Weibo hot_band error ({exc.code}): {body}", file=sys.stderr)
        return {}
    except urllib.error.URLError as exc:
        print(f"Weibo hot_band error: {exc}", file=sys.stderr)
        return {}
    if data.get("ok") != 1:
        print("Weibo hot_band returned unexpected payload.", file=sys.stderr)
        return {}
    return data.get("data") or {}


def fetch_weibo(limit: int = 30) -> list[dict]:
    payload = fetch_hotsearch_payload()
    return _parse_list(payload.get("realtime") or [], owner="微博热搜", limit=limit)


def fetch_weibo_realtime(limit: int = 30) -> list[dict]:
    """Realtime rising board: hot_band sorted by onboard_time desc."""
    payload = fetch_hot_band_payload()
    entries = [e for e in (payload.get("band_list") or []) if isinstance(e, dict)]
    entries.sort(key=lambda e: e.get("onboard_time") or 0, reverse=True)
    return _parse_list(entries, owner="微博实时", limit=limit)


def _is_local_category(category: str) -> bool:
    return any(hint in category for hint in LOCAL_CATEGORY_HINTS)


def fetch_weibo_local(limit: int = 30) -> list[dict]:
    """
    City/local-interest board.

    Official 同城榜 needs login + geo and is not stably available to CI.
    Fallback: keep social/civic topics from the public hot_band.
    """
    payload = fetch_hot_band_payload()
    entries = [
        e
        for e in (payload.get("band_list") or [])
        if isinstance(e, dict) and _is_local_category(str(e.get("category") or ""))
    ]
    # Prefer higher heat within the civic subset.
    entries.sort(key=lambda e: _parse_hot_value(e.get("num")), reverse=True)
    items = _parse_list(entries, owner="微博同城", limit=limit)
    if items:
        return items
    # Soft fallback: keep labeled "新/沸" social-ish rows so the tab is never empty.
    soft = [
        e
        for e in (payload.get("band_list") or [])
        if isinstance(e, dict)
        and (e.get("label_name") in {"新", "沸", "热"} or "社会" in str(e.get("category") or ""))
    ]
    soft.sort(key=lambda e: _parse_hot_value(e.get("num")), reverse=True)
    return _parse_list(soft, owner="微博同城", limit=limit)


def weibo_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "热搜榜",
        "description": f"微博热搜榜（{fetched_date}，共 {len(items)} 条，约每 6 小时更新）",
        "updateFrequency": "every-6h",
        "fetchedDate": fetched_date,
        "items": items,
    }


def weibo_realtime_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "实时",
        "description": (
            f"微博实时上升榜（按上榜时间排序，{fetched_date}，共 {len(items)} 条，约每 6 小时更新）"
        ),
        "updateFrequency": "every-6h",
        "fetchedDate": fetched_date,
        "items": items,
    }


def weibo_local_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "同城",
        "description": (
            f"城事/社会民生向热搜（公开接口暂无官方同城榜；"
            f"{fetched_date}，共 {len(items)} 条，约每 6 小时更新）"
        ),
        "updateFrequency": "every-6h",
        "fetchedDate": fetched_date,
        "items": items,
    }


def weibo_catalog_entry() -> dict:
    return {
        "id": "weibo",
        "label": "微博",
        "children": [
            {"id": "weibo", "sourceKey": "weibo"},
            {"id": "weiboRealtime", "sourceKey": "weiboRealtime"},
            {"id": "weiboLocal", "sourceKey": "weiboLocal"},
        ],
    }


def iso_date_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")
