"""Fetch China Daily most-viewed / homepage hot stories."""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

USER_AGENT = (
    "Mozilla/5.0 (compatible; clatch-china-daily-updater/1.0; "
    "+https://jasper499.github.io/github_clatch/)"
)
TOPNEWS_URLS = (
    "https://www.chinadaily.com.cn/html/topnews/ismp_en-1.js",
    "https://www.chinadaily.com.cn/html/topnews/ismp_en-2.js",
    "https://www.chinadaily.com.cn/html/topnews/ismp_en-7.js",
)
HOME_URL = "https://www.chinadaily.com.cn/"
HOME_ARTICLE_RE = re.compile(
    r'href="(//www\.chinadaily\.com\.cn/a/(\d{6})/(\d{2})/WS[^"]+\.html)"'
    r"[^>]*>([^<]{8,220})<",
    re.I,
)
CD_JSON_RE = re.compile(r"var\s+cd_json\s*=\s*(\[[\s\S]*?\])\s*;?\s*$")
META_DESC_RE = re.compile(
    r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']',
    re.I,
)
META_DESC_RE_ALT = re.compile(
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']',
    re.I,
)
TITLE_RE = re.compile(r"<title>([^<]+)</title>", re.I)
AUTHOR_RE = re.compile(
    r'(?:By|by)\s+([A-Z][A-Za-z.\-\' ]{2,60})\s*(?:\||<|,|\n)',
)
IMG_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+'
    r'content=["\']([^"\']+)["\']',
    re.I,
)


def iso_date_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _http_get_text(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/javascript,application/json,*/*",
            "Referer": "https://www.chinadaily.com.cn/",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
        try:
            return raw.decode(charset, errors="replace")
        except LookupError:
            return raw.decode("utf-8", errors="replace")


def _normalize_url(url: str) -> str:
    u = (url or "").strip()
    if u.startswith("//"):
        u = "https:" + u
    u = u.replace("http://", "https://")
    # Prefer main site host for identity
    u = u.replace("https://europe.chinadaily.com.cn/", "https://www.chinadaily.com.cn/")
    u = u.replace("https://usa.chinadaily.com.cn/", "https://www.chinadaily.com.cn/")
    u = u.replace("https://africa.chinadaily.com.cn/", "https://www.chinadaily.com.cn/")
    return u.rstrip("/")


def _parse_pv(value) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        digits = re.sub(r"[^\d]", "", value)
        if digits.isdigit():
            return int(digits)
    return 0


def _unescape(text: str) -> str:
    return html.unescape((text or "").replace("&#39;", "'")).strip()


def _date_from_url(url: str) -> str:
    m = re.search(r"/a/(\d{4})(\d{2})/(\d{2})/", url)
    if not m:
        return ""
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def _parse_topnews_js(text: str) -> list[dict]:
    m = CD_JSON_RE.search((text or "").strip())
    if not m:
        return []
    try:
        payload = json.loads(m.group(1))
    except json.JSONDecodeError:
        return []
    items: list[dict] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        url = _normalize_url(row.get("url") or row.get("contentid") or "")
        title = _unescape(str(row.get("title") or ""))
        if not url or not title:
            continue
        items.append(
            {
                "title": title,
                "url": url,
                "score": _parse_pv(row.get("pv")),
                "published": row.get("day") or _date_from_url(url),
                "rank": _parse_pv(row.get("topnum")) or None,
                "source": "most-viewed",
            }
        )
    return items


def fetch_most_viewed() -> list[dict]:
    merged: dict[str, dict] = {}
    for feed_url in TOPNEWS_URLS:
        try:
            text = _http_get_text(feed_url)
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"China Daily topnews error ({feed_url}): {exc}", file=sys.stderr)
            continue
        for item in _parse_topnews_js(text):
            key = item["url"]
            prev = merged.get(key)
            if not prev or item["score"] > prev.get("score", 0):
                merged[key] = item
    return sorted(merged.values(), key=lambda x: x.get("score", 0), reverse=True)


def fetch_homepage_hot(limit: int = 20) -> list[dict]:
    try:
        page = _http_get_text(HOME_URL)
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"China Daily homepage error: {exc}", file=sys.stderr)
        return []

    items: list[dict] = []
    seen: set[str] = set()
    for match in HOME_ARTICLE_RE.finditer(page):
        url = _normalize_url(match.group(1))
        yymm, day = match.group(2), match.group(3)
        title = _unescape(match.group(4))
        if not title or url in seen:
            continue
        # Keep recent homepage stories (current decade)
        if not yymm.startswith("202"):
            continue
        seen.add(url)
        items.append(
            {
                "title": title,
                "url": url,
                "score": 0,
                "published": f"{yymm[:4]}-{yymm[4:]}-{day}",
                "source": "homepage",
            }
        )
        if len(items) >= limit:
            break
    return items


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript"}:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript"} and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._skip:
            return
        text = data.strip()
        if text:
            self._chunks.append(text)

    def text(self) -> str:
        return " ".join(self._chunks)


def _enrich_article(item: dict) -> dict:
    url = item.get("url") or ""
    if not url:
        return item
    try:
        page = _http_get_text(url, timeout=20)
    except (urllib.error.URLError, TimeoutError):
        return item

    desc = ""
    m = META_DESC_RE.search(page) or META_DESC_RE_ALT.search(page)
    if m:
        desc = _unescape(m.group(1))
    if not desc:
        # Fallback: first meaningful paragraph-ish text
        extractor = _TextExtractor()
        try:
            extractor.feed(page)
            blob = extractor.text()
            for chunk in re.split(r"(?<=[.!?])\s+", blob):
                if 40 <= len(chunk) <= 320 and "China Daily" not in chunk[:20]:
                    desc = chunk
                    break
        except Exception:
            pass

    owner = ""
    am = AUTHOR_RE.search(page)
    if am:
        owner = am.group(1).strip()

    image = ""
    im = IMG_RE.search(page)
    if im:
        image = _normalize_url(im.group(1))

    title_m = TITLE_RE.search(page)
    if title_m and not item.get("title"):
        item["title"] = _unescape(title_m.group(1)).replace(" - Chinadaily.com.cn", "")

    if desc:
        item["description"] = desc
    if owner:
        item["owner"] = owner
    if image:
        item["image"] = image
    if not item.get("published"):
        item["published"] = _date_from_url(url)
    return item


def fetch_china_daily(limit: int = 20, enrich: bool = True) -> list[dict]:
    """Build a hot list: Most Viewed by PV, topped up with homepage stories."""
    viewed = fetch_most_viewed()
    home = fetch_homepage_hot(limit=max(limit, 24))

    merged: dict[str, dict] = {}
    for item in viewed:
        merged[item["url"]] = dict(item)
    for item in home:
        if item["url"] in merged:
            # Keep PV, prefer homepage title if cleaner
            if item.get("title") and len(item["title"]) > len(merged[item["url"]].get("title") or ""):
                merged[item["url"]]["title"] = item["title"]
            continue
        merged[item["url"]] = dict(item)

    # Rank: PV first, then homepage order (score 0)
    ranked = sorted(
        merged.values(),
        key=lambda x: (x.get("score", 0), x.get("published") or ""),
        reverse=True,
    )[:limit]

    # Assign display ranks
    for idx, item in enumerate(ranked, start=1):
        item["rank"] = idx
        item.setdefault("description", "")
        item.setdefault("owner", "China Daily")
        item["label"] = "Most Viewed" if item.get("score") else "Top News"

    if enrich:
        for item in ranked:
            _enrich_article(item)

    return ranked


def china_daily_source_meta(fetched_date: str, items: list[dict]) -> dict:
    return {
        "label": "China Daily 热门",
        "description": (
            f"China Daily Most Viewed / 首页热门（{fetched_date}，共 {len(items)} 条，每天更新）"
        ),
        "updateFrequency": "daily",
        "fetchedDate": fetched_date,
        "items": items,
    }


def china_daily_catalog_entry() -> dict:
    return {
        "id": "chinaDaily",
        "label": "China Daily",
        "children": [{"id": "chinaDaily", "sourceKey": "chinaDaily"}],
    }


if __name__ == "__main__":
    rows = fetch_china_daily(limit=8, enrich=False)
    print(json.dumps(rows, ensure_ascii=False, indent=2))
