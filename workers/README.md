# Weibo live proxy (Cloudflare Worker)

为站点「微博 → 实时」提供点击即时拉取。浏览器不能直连微博（CORS），由本 Worker 服务端请求 `hot_band` 并返回与 `data/sources/weiboRealtime.json` 相同结构的 JSON。

## 部署

1. 安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 并登录：

```bash
npm i -g wrangler
wrangler login
```

2. 在本目录部署：

```bash
cd workers
wrangler deploy
```

3. 记下输出的 URL（形如 `https://hjl-clatch-weibo-live.<subdomain>.workers.dev`），写入仓库根目录 [`data/live-endpoints.json`](../data/live-endpoints.json)：

```json
{
  "weiboRealtime": "https://hjl-clatch-weibo-live.<subdomain>.workers.dev"
}
```

4. 提交并推送后，GitHub Pages 会加载该配置；进入「实时」时优先请求 Worker，失败则回退静态 JSON。

当前已部署示例：`https://hjl-clatch-weibo-live.jasper499.workers.dev`

> 若浏览器无法访问 `*.workers.dev`（部分网络环境会超时），即时拉取会自动回退静态快照。可在 Cloudflare Dashboard 为该 Worker 绑定自定义域名后再改 `live-endpoints.json`。

## 接口

- `GET /`、`GET /realtime`、`GET /weibo/realtime`
- 成功：`200` + `{ label, description, items, fetchedAt, live: true, ... }`
- 上游失败：`502` + `{ error, message }`
- 边缘短缓存约 45 秒，避免连点打爆微博

## 外部定时更新监控

独立 Worker `hjl-clatch-update-scheduler` 每 10 分钟核对网站各子板块的时间戳，过期时触发 GitHub 的 `Monitor Content Updates`。该监控串行补跑，不公开 HTTP 触发入口，也不依赖电脑开机。

配置步骤（在 `workers` 目录运行）：

1. `npx wrangler login`，授权你的 Cloudflare 账号，并完成账号邮箱验证。首次使用 Workers 时需要在 Dashboard 初始化账号的 workers.dev 子域名；此 Worker 只使用 Cron，关闭公开网址。
2. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens，创建仅限 `Jasper499/github_clatch` 的令牌，授予 **Actions: Read and write**（Metadata 只读自动包含），设置到期日。
3. `npx wrangler secret put GITHUB_TOKEN --config wrangler.scheduler.toml`，在终端隐藏输入上述令牌；不要写入仓库或聊天。
4. `npx wrangler deploy --config wrangler.scheduler.toml`。
5. 在 Cloudflare Dashboard 检查 Cron Triggers 和日志；GitHub Actions 检查监控与补跑结果。Cron 配置生效可能需要约 15 分钟。

令牌到期后需重新执行 secret put。暂停外部触发：将 `wrangler.scheduler.toml` 的 `crons` 改成 `[]` 后重新部署。

本地检查：`node ../scripts/check_monitor.cjs`；打包检查：`npx wrangler deploy --config wrangler.scheduler.toml --dry-run`。

## 加密阅读同步

`hjl-clatch-reading-sync` 使用 SQLite Durable Object 保存每个同步密钥对应的一份加密备份。浏览器生成随机 256 位密钥，AES-GCM 加密后上传；服务只收到独立派生的访问凭证和密文。同步为手动上传/下载，使用 ETag 避免并发覆盖；删除备份保留递增版本号，避免旧客户端覆盖新备份。

部署：`npx wrangler deploy --config wrangler.sync.toml`。接口 `GET/PUT/DELETE /vault`，需要 Bearer 凭证；仅允许本站浏览器跨域访问，单份上传限制 1 MB，每个 IP 每分钟限制 30 次。同步密钥不进入仓库或日志。Cloudflare 用量受账号计划配额限制。

## 本地调试

原微博实时代理：

```bash
cd workers
wrangler dev
```

然后临时把 `data/live-endpoints.json` 设为 `http://127.0.0.1:8787`（仅本地预览用）。
