#!/usr/bin/env python3
"""Twice-daily Hacker News updater — merges into existing content.json."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_hackernews import (
    fetch_hackernews,
    hackernews_catalog_entry,
    hackernews_source_meta,
    iso_date_today,
)
from history import save_source_snapshot

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_content() -> dict:
    if OUTPUT.exists():
        with OUTPUT.open(encoding="utf-8") as f:
            return json.load(f)

    today = iso_date_today()
    return {
        "updatedAt": _utc_now_iso(),
        "periodDays": 7,
        "weekLabel": today,
        "catalog": [],
        "sources": {},
    }


def _ensure_catalog(content: dict) -> None:
    catalog = content.setdefault("catalog", [])
    if not any(node.get("id") == "hackernews" for node in catalog):
        catalog.append(hackernews_catalog_entry())


def main() -> int:
    print("正在抓取 Hacker News 热门…")
    items = fetch_hackernews()
    if not items:
        print("Hacker News 抓取失败，未写入文件。", file=sys.stderr)
        return 1

    today = iso_date_today()
    content = _load_content()
    content.setdefault("sources", {})["hackernews"] = hackernews_source_meta(today, items)
    content["hackernewsUpdatedAt"] = _utc_now_iso()
    content["updatedAt"] = content["hackernewsUpdatedAt"]
    _ensure_catalog(content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    save_source_snapshot("hackernews", content["sources"]["hackernews"])

    print(f"已写入 {OUTPUT}")
    print(f"  Hacker News: {len(items)} 条")
    print(f"  抓取日期: {today}")
    print(f"  更新时间: {content['hackernewsUpdatedAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
