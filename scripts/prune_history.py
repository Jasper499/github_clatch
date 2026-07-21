#!/usr/bin/env python3
"""One-shot: strip README from historical snapshots to reclaim disk."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from history import prune_history_readmes, write_feeds, load_meta


def main() -> int:
    touched, saved = prune_history_readmes()
    write_feeds(load_meta())
    print(f"已瘦身 history 文件 {touched} 个，约节省 {saved / 1024 / 1024:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
