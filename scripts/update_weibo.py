#!/usr/bin/env python3
"""Daily Weibo hot search updater — writes sources/meta/history (no content.json)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_weibo import fetch_weibo, iso_date_today, weibo_catalog_entry, weibo_source_meta
from history import publish_source_update, utc_now_iso


def main() -> int:
    print("正在抓取微博热搜…")
    items = fetch_weibo()
    if not items:
        print("微博热搜抓取失败，未写入文件。", file=sys.stderr)
        return 1

    today = iso_date_today()
    now = utc_now_iso()
    sources = {"weibo": weibo_source_meta(today, items)}
    publish_source_update(
        sources,
        meta_fields={"weiboUpdatedAt": now, "updatedAt": now},
        catalog_nodes=[weibo_catalog_entry()],
    )

    print("已发布 sources/meta/history（未写 content.json）")
    print(f"  微博热搜: {len(items)} 条")
    print(f"  抓取日期: {today}")
    print(f"  更新时间: {now}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
