#!/usr/bin/env python3
"""Daily China Daily updater — writes sources/meta/history (no content.json)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_china_daily import (
    china_daily_catalog_entry,
    china_daily_source_meta,
    fetch_china_daily,
    iso_date_today,
)
from history import publish_source_update, utc_now_iso


def main() -> int:
    print("正在抓取 China Daily 热门…")
    items = fetch_china_daily(limit=20, enrich=True)
    if not items:
        print("China Daily 抓取失败，未写入文件。", file=sys.stderr)
        return 1

    today = iso_date_today()
    now = utc_now_iso()
    sources = {"chinaDaily": china_daily_source_meta(today, items)}
    publish_source_update(
        sources,
        meta_fields={"chinaDailyUpdatedAt": now, "updatedAt": now},
        catalog_nodes=[china_daily_catalog_entry()],
    )

    print("已发布 sources/meta/history（未写 content.json）")
    print(f"  China Daily: {len(items)} 条")
    print(f"  抓取日期: {today}")
    print(f"  更新时间: {now}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
