# HJL Clatch

自动聚合 GitHub Trending、Hacker News、微博热搜、MRI 顶刊、Nature Skills、Scientific Skills，支持历史回看与今日摘要。

站点：https://jasper499.github.io/github_clatch/

## 项目结构

```
github_clatch/
├── index.html                 # 前端入口
├── css/style.css              # 样式（含各平台 chrome）
├── js/app.js                  # 渲染与路由
├── vendor/                    # 本地 marked / DOMPurify（带 SRI）
├── data/
│   ├── meta.json              # 轻量元数据（权威目录与更新时间）
│   ├── manifest.json          # 历史快照索引
│   ├── sources/*.json         # 各源最新全文
│   ├── sources/*.lite.json    # 列表摘要（无 README）
│   ├── history/<source>/      # 按日快照（已去 README）
│   ├── live-endpoints.json    # 可选 live 代理 URL（微博实时）
│   └── feeds/all.{json,xml}   # JSON Feed / Atom
├── workers/                   # Cloudflare Worker（微博实时即时拉取）
├── scripts/                   # 抓取与发布脚本
└── .github/workflows/         # 定时更新 + 失败开 Issue
```

## 数据架构

- 写入权威路径：`meta.json` + `sources/` + `history/` + `feeds/`（**不再维护** 巨型 `content.json`）
- 前端优先读 `meta.json` 与 `sources/*.lite.json` / `sources/*.json`
- 各源 updater 通过 `scripts/history.py` 的 `publish_source_update()` 统一发布
- 微博「实时」在 `latest` 下优先请求 `live-endpoints.json` 中的 Cloudflare Worker；失败则回退 `sources/weiboRealtime.json`（部署见 [`workers/README.md`](workers/README.md)）

## 自动更新

| 板块 | 频率 | 工作流 |
|------|------|--------|
| GitHub 热门 / 活跃 | 每周一 | `weekly-update.yml` |
| Hacker News | 每天约 10/22 点 | `twice-daily-hackernews.yml` |
| 微博热搜 / 实时 / 同城（静态回退） | 每 6 小时 | `twice-daily-weibo.yml` |
| MRI 顶刊 | 每月 1/15 日 | `biweekly-journals.yml` |
| Nature Skills | 每天约 10/22 点 | `daily-nature-skills.yml` |
| Scientific Skills | 每天约 10/22 点 | `daily-scientific-agent-skills.yml` |
| 更新失败告警 | workflow 失败时开 Issue | `report-failed-updates.yml` |

## 本地脚本

```bash
python scripts/update_content.py
python scripts/update_hackernews.py
python scripts/update_weibo.py
python scripts/update_journals.py
python scripts/prune_history.py   # 瘦身旧 history + 重写 feeds
```

推送重试：`scripts/git_push_with_retry.sh`（workflow 已接入）。

## Feed

- Atom：`data/feeds/all.xml`
- JSON Feed：`data/feeds/all.json`
