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

## 接口

- `GET /`、`GET /realtime`、`GET /weibo/realtime`
- 成功：`200` + `{ label, description, items, fetchedAt, live: true, ... }`
- 上游失败：`502` + `{ error, message }`
- 边缘短缓存约 45 秒，避免连点打爆微博

## 本地调试

```bash
cd workers
wrangler dev
```

然后临时把 `data/live-endpoints.json` 设为 `http://127.0.0.1:8787`（仅本地预览用）。
