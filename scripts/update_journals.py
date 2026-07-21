#!/usr/bin/env python3
"""Biweekly MRI journal updater — writes sources/meta/history (no content.json)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_journals import (
    JOURNALS,
    fetch_all_journals,
    journal_source_meta,
    journals_catalog_entry,
)
from history import publish_source_update, utc_now_iso

ROOT = Path(__file__).resolve().parent.parent
PAPERS_ROOT = ROOT / "papers"


def main() -> int:
    print("正在抓取 MRI 顶刊论文（近半个月）…")
    journal_items, period = fetch_all_journals(PAPERS_ROOT)

    if not any(journal_items.values()):
        print("未抓取到任何论文，未写入文件。", file=sys.stderr)
        return 1

    sources = {
        journal["id"]: journal_source_meta(journal, journal_items.get(journal["id"], []), period)
        for journal in JOURNALS
    }
    now = utc_now_iso()
    publish_source_update(
        sources,
        meta_fields={
            "journalsUpdatedAt": now,
            "journalsPeriod": period,
            "updatedAt": now,
        },
        catalog_nodes=[journals_catalog_entry()],
    )

    print("已发布 sources/meta/history（未写 content.json）")
    for journal in JOURNALS:
        items = journal_items.get(journal["id"], [])
        with_pdf = sum(1 for item in items if item.get("pdfUrl") or item.get("pdfAvailable"))
        print(f"  {journal['short']}: {len(items)} 篇，含 PDF 链接 {with_pdf} 篇")
    print(f"  统计周期: {period}")
    print(f"  更新时间: {now}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
