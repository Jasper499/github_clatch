#!/usr/bin/env python3
"""Backfill README.md for existing GitHub items in content.json."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_github import fetch_repo_readme
from history import save_sources_from_content

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "content.json"
GITHUB_KEYS = ("github", "githubActive")


def backfill_items(items: list[dict], has_token: bool) -> tuple[int, int]:
    updated = 0
    failed = 0

    for item in items:
        full_name = item.get("title") or ""
        if "/" not in full_name:
            failed += 1
            continue

        readme = fetch_repo_readme(full_name)
        if readme:
            item.update(readme)
            updated += 1
            print(f"  [ok] {full_name} ({readme.get('readmeFile', 'README.md')})")
        else:
            item.pop("readme", None)
            item.pop("readmeTruncated", None)
            item.pop("readmeFile", None)
            failed += 1
            print(f"  [skip] {full_name}", file=sys.stderr)

        if not has_token:
            time.sleep(0.35)

    return updated, failed


def main() -> int:
    if not OUTPUT.exists():
        print(f"未找到 {OUTPUT}", file=sys.stderr)
        return 1

    with OUTPUT.open(encoding="utf-8") as f:
        content = json.load(f)

    sources = content.setdefault("sources", {})
    has_token = bool(__import__("os").environ.get("GITHUB_TOKEN") or __import__("os").environ.get("GH_TOKEN"))

    total_updated = 0
    total_failed = 0

    for key in GITHUB_KEYS:
        source = sources.get(key)
        if not source or not source.get("items"):
            print(f"跳过 {key}：无条目")
            continue

        print(f"正在补抓 {key}（{len(source['items'])} 个项目）…")
        updated, failed = backfill_items(source["items"], has_token)
        total_updated += updated
        total_failed += failed

        desc = source.get("description") or ""
        if "README" not in desc:
            source["description"] = f"{desc}（含 README）"

    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")

    save_sources_from_content(content, list(GITHUB_KEYS))

    print(f"\n已写入 {OUTPUT}")
    print(f"  README 成功: {total_updated} 篇")
    print(f"  未获取:      {total_failed} 篇")
    if not has_token:
        print("提示：设置 GITHUB_TOKEN 可提高抓取成功率与速度。", file=sys.stderr)
    return 0 if total_updated > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
