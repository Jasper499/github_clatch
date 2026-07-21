#!/usr/bin/env python3
"""Weibo boards updater — 热搜 / 实时 / 同城 → sources/meta/history."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_weibo import (
    fetch_weibo,
    fetch_weibo_local,
    fetch_weibo_realtime,
    iso_date_today,
    weibo_catalog_entry,
    weibo_local_source_meta,
    weibo_realtime_source_meta,
    weibo_source_meta,
)
from history import publish_source_update, utc_now_iso


def main() -> int:
    print("正在抓取微博热搜 / 实时 / 同城…")
    hot = fetch_weibo()
    rising = fetch_weibo_realtime()
    local = fetch_weibo_local()

    if not hot and not rising and not local:
        print("微博抓取失败，未写入文件。", file=sys.stderr)
        return 1

    today = iso_date_today()
    now = utc_now_iso()
    sources: dict[str, dict] = {}
    if hot:
        sources["weibo"] = weibo_source_meta(today, hot)
    if rising:
        sources["weiboRealtime"] = weibo_realtime_source_meta(today, rising)
    if local:
        sources["weiboLocal"] = weibo_local_source_meta(today, local)

    if not sources:
        print("微博抓取结果为空，未写入文件。", file=sys.stderr)
        return 1

    publish_source_update(
        sources,
        meta_fields={"weiboUpdatedAt": now, "updatedAt": now},
        catalog_nodes=[weibo_catalog_entry()],
    )

    print("已发布 sources/meta/history（未写 content.json）")
    print(f"  热搜榜: {len(hot)} 条")
    print(f"  实时: {len(rising)} 条")
    print(f"  同城: {len(local)} 条")
    print(f"  抓取日期: {today}")
    print(f"  更新时间: {now}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
