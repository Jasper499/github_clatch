# Clatch · 每周热门精选

自动聚合 **GitHub 热门开源项目**、**Hacker News 技术讨论** 与 **微博每日热搜**，支持目录树与下拉浏览。

## 项目结构

```
github_clatch/
├── index.html              # 网站首页
├── css/style.css           # 样式
├── js/app.js               # 前端渲染逻辑
├── data/content.json       # 抓取结果（网站读取此文件）
├── scripts/update_content.py   # 每周全量抓取
├── scripts/update_weibo.py     # 微博每日热搜
├── scripts/fetch_weibo.py      # 微博抓取逻辑
├── .github/workflows/weekly-update.yml
└── .github/workflows/daily-weibo.yml
```

## 数据来源

| 板块 | 来源 | 规则 |
|------|------|------|
| GitHub 热门新项目 | GitHub Search API | 近 7 天创建、Star > 10、按 Star 排序 |
| GitHub 活跃项目 | GitHub Search API | 近 7 天有推送、Star > 10、按 Star 排序 |
| Hacker News 热门 | HN Algolia API | 近 7 天高互动 Story |
| 微博热搜 | `weibo.com/ajax/side/hotSearch` | 当日实时热搜 TOP 30 |

## 自动更新

| 任务 | 频率 | 工作流 | 命令 |
|------|------|--------|------|
| GitHub + HN + 微博 | 每周一 09:00 | `weekly-update.yml` | `python scripts/update_content.py` |
| 微博热搜 | **每天 08:00** | `daily-weibo.yml` | `python scripts/update_weibo.py` |

微博每日任务只更新 `sources.weibo`，不会覆盖 GitHub / HN 数据。

## 快速开始

### 1. 抓取最新内容

```powershell
cd G:\github_clatch
python scripts/update_content.py
```

可选：设置 `GITHUB_TOKEN` 提高 GitHub API 限额（未认证时约 60 次/小时）：

```powershell
$env:GITHUB_TOKEN = "ghp_你的token"
python scripts/update_content.py
```

### 2. 本地预览网站

浏览器不能直接打开 `index.html`（`fetch` 受 CORS 限制），需用本地 HTTP 服务：

```powershell
cd G:\github_clatch
python -m http.server 8080
```

浏览器访问：<http://localhost:8080>

### 3. 部署到 GitHub Pages

1. 在 GitHub 创建仓库（例如 `yourname/github_clatch`）
2. 推送代码：

   ```powershell
   git remote add origin https://github.com/yourname/github_clatch.git
   git add -A
   git commit -m "feat: initial trending content site"
   git push -u origin main
   ```

3. 打开仓库 **Settings → Pages**
4. **Source** 选 `Deploy from a branch`，Branch 选 `main`，文件夹选 `/ (root)`
5. 保存后访问 `https://yourname.github.io/github_clatch/`

> GitHub Actions 工作流会在每周一 UTC 01:00（北京时间 09:00）自动运行抓取并 push 更新。

### 4. Cursor 每周自动化（推荐与 Actions 二选一或同时使用）

在 Cursor Automations 中配置：

- **触发**：每周一 09:00
- **仓库**：本仓库的 `main` 分支
- **代理任务**：运行 `python scripts/update_content.py`，提交 `data/content.json` 并 push

## 扩展其他平台

编辑 `scripts/update_content.py`，在 `build_payload()` 中新增数据源，并在 `data/content.json` 的 `sources` 里添加对应 key；前端 `js/app.js` 的 `SOURCE_KEYS` 与 `index.html` 中增加对应 Tab 即可。

可扩展的平台示例：

- **Product Hunt** — 需 API Token
- **Dev.to** — 公开 REST API
- **Reddit** — 各 subreddit JSON 端点

## 故障排查

| 问题 | 解决 |
|------|------|
| 页面显示「加载失败」 | 用 `python -m http.server` 预览，不要双击 HTML |
| GitHub 抓取为空或 403 | 设置 `GITHUB_TOKEN` 环境变量 |
| 数据不更新 | 手动运行 `python scripts/update_content.py` 检查输出 |
| Pages 404 | 确认 Pages 源分支与路径正确，等待 1–2 分钟 |

## 许可

MIT
