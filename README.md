# HJL Clatch

自动聚合 GitHub Trending、Hacker News、微博热搜、China Daily、MRI 顶刊、Nature Skills、Scientific Skills，支持历史回看与今日摘要。

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
| China Daily 热门 | 每天 | `daily-china-daily.yml` |
| MRI 顶刊 | 每月 1/15 日 | `biweekly-journals.yml` |
| Nature Skills | 每天约 10/22 点 | `daily-nature-skills.yml` |
| Scientific Skills | 每天约 10/22 点 | `daily-scientific-agent-skills.yml` |
| 更新失败告警 | workflow 失败时开 Issue | `report-failed-updates.yml` |

## 本地脚本

```bash
python scripts/update_content.py
python scripts/update_hackernews.py
python scripts/update_weibo.py
python scripts/update_china_daily.py
python scripts/update_journals.py
python scripts/prune_history.py   # 瘦身旧 history + 重写 feeds
```

推送重试：`scripts/git_push_with_retry.sh`（workflow 已接入）。

## 超时监控与补跑

- `Monitor Content Updates` 每小时第 37 分钟检查一次，也在内容工作流完成后检查；支持手动 Run workflow。
- 按各板块计划时刻检查每个子板块的 `savedAt`，允许 90 分钟延迟。漏跑、缺失或异常时间戳会创建一个 GitHub Issue。
- 相同告警不重复评论，数据恢复后自动关闭。GitHub 邮件是否送达取决于你的仓库通知设置。
- 监控每次最多补跑一个过期工作流；已有内容任务运行或排队时等待，同一工作流两小时内不重复补跑。
- Cloudflare 外部定时器每 10 分钟核对实际数据，有过期内容时触发监控即时补跑；部署见 `workers/README.md`。
- GitHub 内部监控允许 90 分钟延迟，外部触发补跑不等待宽限期。外部服务减少触发延迟，但 GitHub Runner 排队仍可能延迟执行。
- 检查监控逻辑：`node scripts/check_monitor.cjs`。

## Feed

- Atom：`data/feeds/all.xml`
- JSON Feed：`data/feeds/all.json`

## 阅读工作站

- 日期列表按月分组，也可直接选择日期；历史模式可一键返回最新。每个板块最多保留 120 份快照。
- 按已有数据筛选语言、分类、期刊、年份与全文可用性，并按热度或时间排序。
- 收藏和稍后阅读默认保存在当前浏览器，可通过手动加密同步迁移到其他设备。
- 桌面可调整分栏宽度、正文字号或展开阅读；手机默认收起筛选工具。
- 新抓取的 README 按内容版本存档，历史阅读不再误用当前版本；未保存正文的旧快照不能自动还原。
- 仓库创建/推送时间、HN 讨论链接等新字段在对应板块下次抓取后显示。
- “检查更新”读取已发布数据，不会启动 GitHub 抓取任务。
- 回归检查：`node scripts/check_site.cjs`（需要 Node.js 18+ 与 Python 3）。
- 顶栏“背景”支持预设、遮罩和本地图片：JPG/PNG/WebP，最大 20 MB，自动缩小至最长边 1920 像素。
- 图片保存在浏览器 IndexedDB，不会提交至 GitHub；可调整位置、删除图片或恢复默认。清除站点数据会删除自定义背景。

## 阅读工作站升级（v30）

- 顶栏「新增」汇总自上次访问以来的新增与正文版本变更；首次访问建立基线。热度变化不算正文变更。
- 「更多 → 更新状态」显示上次更新、下一计划时间，与后台监控共用 UTC 计划；90 分钟宽限期内显示待更新。
- 「更多 → 阅读数据与通知」导出/导入 JSON 备份。先验证全部字段，再应用；存储失败回滚。导入前建议先导出本机备份。
- 备份包含收藏、稍后阅读、已读记录、关注、显示参数；背景图片文件不包含在内，需在另一设备重新上传。
- 关注规则每行一个关键词，最多 50 条；匹配任意关键词即可。「我的关注」跨栏目汇总，阅读清单也可筛选关注或未读新增。
- 「历史搜索」支持栏目与日期范围，最多检索 120 份已保留的快照，四份并发；关闭弹窗取消检索。结果跳转到对应历史版本。
- 页面打开时每五分钟检查发布数据；不自动切换当前阅读内容。通知可选择关注新增、每日摘要、数据过期；系统通知需用户主动允许。关闭页面后不发送浏览器通知，后台异常仍由 GitHub Issue 通知处理。
- 背景提供图片优先、专注阅读和参数撤销。正文区域维持较强底色；正文图片延迟加载，代码块提供复制按钮，手机返回列表恢复位置。
- 跨设备同步为手动加密备份：生成 64 位同步密钥 → 上传本机 → 另一设备输入同一密钥 → 下载云端。下载前明确确认替换；并发写入冲突会拒绝覆盖。密钥不会上传或自动保存，遗失无法恢复云端备份。
- 同步服务为独立 Cloudflare Worker，存储仅包含 AES-GCM 密文；支持删除云端备份。与微博实时代理、更新定时器分别部署。
- 验证：`node scripts/check_workspace.cjs`、`node scripts/check_site.cjs`、`node scripts/check_monitor.cjs`。


## 个人阅读中心（v31）

- 默认进入个人首页，汇总栏目变更、关注匹配、阅读清单与更新状态；首页可选择下次继续上次阅读，直接链接仍打开对应内容。
- 「更多 → 收藏中心」跨栏目查找收藏，编辑标签与笔记、批量移出清单、导出 Markdown；论文可导出 BibTeX / RIS。未提供的作者和 DOI 不会补造。
- 新收藏保留条目元数据与历史版本路径；旧收藏从现有数据补全，找不到的记录保留。变化时间线只覆盖尚保留的快照。
- 历史搜索读取 `data/search/栏目/月份.json`，搜索全部保留历史的标题、摘要和已有作者信息，不下载全文。每次抓取会重建对应栏目的月份索引；最多展示最新 500 个匹配，请用日期和栏目缩小范围。
- 选择「保存离线正文」主动保存该版本 README 或仅标题与摘要，最多 20 MB，可查看容量并清理。站点升级和强制刷新保留这份离线资料；清除浏览器站点数据会删除它。不会自动下载新闻全文或收费 PDF。
- 阅读设置可调整宽度、行距、段距，目录随滚动标记当前章节；收藏和部分新闻/期刊支持卡片视图。
- 背景设置可保存 10 套个人主题（背景参数、明暗、密度与阅读设置），图片文件仍留在当前设备。
- 手动同步已存在备份时先展示两端独有条目、笔记与设置差异；明确确认后再覆盖。取消预览不会写入。
- 回归验证：`node scripts/check_workspace.cjs`、`node scripts/check_site.cjs`。
