# One Piece

自动定时更新最新的内容，支持目录树与下拉浏览。

## 项目结构

```
github_clatch/
├── index.html              # 网站首页
├── css/style.css           # 样式
├── js/app.js               # 前端渲染逻辑
├── data/content.json       # 抓取结果（网站读取此文件）
├── scripts/update_content.py       # GitHub 每周抓取
├── scripts/update_hackernews.py    # HN 每日两次更新
├── scripts/update_weibo.py         # 微博每 6 小时更新
├── scripts/fetch_hackernews.py     # HN 抓取逻辑
├── scripts/fetch_weibo.py          # 微博抓取逻辑
├── .github/workflows/weekly-update.yml
├── .github/workflows/twice-daily-hackernews.yml
└── .github/workflows/twice-daily-weibo.yml
```

## 数据来源

| 板块 | 来源 | 规则 |
|------|------|------|
| GitHub 热门新项目 | GitHub Search API | 近 7 天创建、Star > 10、按 Star 排序 |
| GitHub 活跃项目 | GitHub Search API | 近 7 天有推送、Star > 10、按 Star 排序 |
| Hacker News 热门 | HN Algolia API | 近 7 天高互动 Story |
| 微博热搜 | `weibo.com/ajax/side/hotSearch` | 当日实时热搜 TOP 30 |
| MRM / TMI / MedIA | CrossRef + Semantic Scholar + Unpaywall | 近 45 天 MRI 相关论文，自动下载开放获取 PDF |

## 自动更新

| 任务 | 频率 | 工作流 | 命令 |
|------|------|--------|------|
| GitHub 热门 | 每周一 09:00 | `weekly-update.yml` | `python scripts/update_content.py` |
| Hacker News | **每天 10:00、22:00** | `twice-daily-hackernews.yml` | `python scripts/update_hackernews.py` |
| 微博热搜 | **每 6 小时**（UTC :10，约北京 02/08/14/20 点） | `twice-daily-weibo.yml` | `python scripts/update_weibo.py` |
| **MRI 顶刊** | **每月 1/15 日 10:00** | `biweekly-journals.yml` | `python scripts/update_journals.py` |

论文 PDF 仅下载**开放获取**版本，保存至 `papers/mrm/`、`papers/tmi/`、`papers/media/`。







