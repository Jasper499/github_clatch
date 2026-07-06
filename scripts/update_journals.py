#!/usr/bin/env python3
"""Biweekly MRI journal updater — merges into content.json and downloads OA PDFs."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_journals import (
    JOURNALS,
    fetch_all_journals,
    journal_source_meta,
    journals_catalog_entry,
)

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"
PAPERS_ROOT = ROOT / "papers"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_content() -> dict:
    if OUTPUT.exists():
        with OUTPUT.open(encoding="utf-8") as f:
            return json.load(f)
    return {
        "updatedAt": _utc_now_iso(),
        "periodDays": 7,
        "weekLabel": "",
        "catalog": [],
        "sources": {},
    }


def _ensure_catalog(content: dict) -> None:
    catalog = content.setdefault("catalog", [])
    if not any(node.get("id") == "journals" for node in catalog):
        catalog.append(journals_catalog_entry())


def main() -> int:
    print("正在抓取 MRI 顶刊论文（近半个月）…")
    journal_items, period = fetch_all_journals(PAPERS_ROOT)

    if not any(journal_items.values()):
        print("未抓取到任何论文，未写入文件。", file=sys.stderr)
        return 1

    content = _load_content()
    sources = content.setdefault("sources", {})

    for journal in JOURNALS:
        items = journal_items.get(journal["id"], [])
        sources[journal["id"]] = journal_source_meta(journal, items, period)

    content["journalsUpdatedAt"] = _utc_now_iso()
    content["journalsPeriod"] = period
    _ensure_catalog(content)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"已写入 {OUTPUT}")
    for journal in JOURNALS:
        items = journal_items.get(journal["id"], [])
        pdfs = sum(1 for item in items if item.get("pdfAvailable"))
        print(f"  {journal['short']}: {len(items)} 篇，PDF {pdfs} 篇")
    print(f"  统计周期: {period}")
    print(f"  更新时间: {content['journalsUpdatedAt']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
