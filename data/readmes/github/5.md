# sheeridVerify · 教学与研究验证流程工作台

[![Tests](https://github.com/JenkinWoo/sheeridVerify/actions/workflows/ci.yml/badge.svg)](https://github.com/JenkinWoo/sheeridVerify/actions/workflows/ci.yml) [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.15-43853d)](https://nodejs.org/) [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**[sheeridVerify](https://github.com/JenkinWoo/sheeridVerify)** 是一个基于 Node.js 的验证流程学习项目，提供本地 Web 工作台、任务队列、浏览器表单交互及 HTTP 状态查询，供学校教学、学术研究和获得授权的流程测试使用。

> **用途说明：** 本项目仅以教学与研究为目的提供。使用真实平台前应取得必要授权，遵守适用法律和平台条款；不得伪造身份、学籍或材料，不得冒用信息、骗取权益或绕过资格审核。本项目与 SheerID 及任何学校均无官方隶属或认可关系，也不保证验证成功。详情见 [用途说明与免责声明](DISCLAIMER.md)，代码许可见 [ISC 协议](LICENSE)。

## 文档导航

- [快速开始](#快速开始)
- [工作台与接口说明](#使用)
- [Linux / Instabox 部署、更新与排错](docs/DEPLOYMENT.md)
- [浏览器流程说明](docs/browser-workflow.md)
- [贡献指南](CONTRIBUTING.md) · [安全说明](SECURITY.md) · [免责声明](DISCLAIMER.md)

## 功能

- 通过 fetch 读取验证状态，按当前步骤选择浏览器或材料处理流程。
- 在 Web 页面创建、排队、停止、恢复和删除任务；失败任务删除后可重新提交。
- 按配置限制并发，记录任务进度，提交后默认每 5 秒查询结果。
- 上传原始 PNG、JPEG、PDF 文件，不生成或修改证明材料；交互式真人验证由用户完成。
- 使用访问密码、会话 Cookie、来源检查及写请求令牌保护工作台接口。

## 快速开始

需要 **Node.js >= 22.15** 与 npm。从 GitHub 获取源码：

```bash
git clone https://github.com/JenkinWoo/sheeridVerify.git
cd sheeridVerify
```

使用下载的 ZIP 时，解压后进入其中包含 `package.json` 的目录。在项目根目录安装依赖与浏览器：

```bash
npm ci
npm run browser:install
```

首次使用时复制配置，已有个人配置请直接编辑原文件。

Windows PowerShell：

```powershell
Copy-Item config/sheerid.example.json config/sheerid.local.json
```

Linux / macOS：

```bash
cp -n config/sheerid.example.json config/sheerid.local.json
```

编辑 `config/sheerid.local.json`，设置获授权的国家、学校、`data.organization.emailDomain` 和材料来源。该文件必须是标准 JSON，**不支持 `//` 注释或尾随逗号**。网页会按姓名和配置后缀生成邮箱，仅应使用自己有权使用的真实地址与资料。`document.path` 与 `document.url` 只能填写其中一个；示例配置不包含可直接提交的真实资料。

```bash
npm run web
```

打开 **http://127.0.0.1:8787**。本地默认访问密码为 `JenkinWoo`；对外开放前必须通过 `ONE_WEB_PASSWORD` 更换密码，并配置 HTTPS 入口。Linux 有界面浏览器需要可用桌面；完整部署步骤和环境变量模板见 [部署指南](docs/DEPLOYMENT.md)。

## 测试与贡献

```bash
npm test
```

测试使用模拟接口及本地页面，不向真实验证接口提交数据。未安装 Camoufox 时会跳过浏览器相关用例；网页和浏览器改动应在安装浏览器后验证。GitHub Actions 在 Node.js 22、24 上运行不含已安装浏览器的测试。欢迎按 [贡献指南](CONTRIBUTING.md) 提交问题和改进，报告前请删除个人资料、凭据及真实验证链接。

## 协议与责任说明

项目采用 [ISC License](LICENSE)，与 `package.json` 的协议声明一致。教学与研究是项目的预期用途，不额外收窄 ISC 的开源授权范围。软件按原样提供；第三方依赖和平台分别适用自己的许可和条款。请在使用前阅读完整的 [用途说明与免责声明](DISCLAIMER.md)。

## 社区认可与致谢

本项目认可并支持 [LINUX DO 社区](https://linux.do/) 的开源分享精神，感谢社区为开发者提供技术交流、经验分享与开源项目展示的平台。欢迎在遵守社区规则的前提下交流使用体验与改进建议。

社区推广材料见 [LINUX DO 发帖草稿](docs/LINUX_DO_POST.md)，其中包含推广声明模板与 AI 辅助生成的项目介绍图片。

## 工作原理

当前命令行先用 Node.js 内置 `fetch` 查询状态，再选择执行流程：需要填写学生资料时使用 Camoufox，需要材料验证时使用纯 `fetch` 接口。材料上传保持文件原始内容，不生成或修改证明文件。

## 使用

### 本机 Web 工作台

```powershell
npm run web
```

打开 **http://127.0.0.1:8787**。页面填写验证链接、名、姓、出生日期、代理和访问密码。`url`、`firstName`、`lastName`、`birthDate` 必须由创建任务接口传入，缺少时拒绝入队。邮箱不再由前端传入，而是每次根据配置文件中的 `emailDomain` 域名后缀按 `First name + 点 + Last name @xxx.edu`（如 `first.last@xxxx.edu`）格式自动拼接生成。国家、学校、材料来源、浏览器、超时、邮箱后缀等设置，每次启动任务时从 `config/sheerid.local.json` 读取；提交值不会写回配置文件。当前配置及示例配置不再保存验证链接和个人信息。

`POST /api/jobs` 的 JSON 请求体示例（认证仍使用会话 Cookie 或 `X-Web-Password`，写请求携带 `X-Local-Token`）：

```json
{
  "url": "https://services.sheerid.com/verify/项目ID/?verificationId=验证ID",
  "firstName": "Test",
  "lastName": "Student",
  "birthDate": "2000-01-02",
  "proxy": ""
}
```

当前配置用于 Web/API 模式。若单独使用 CLI，需通过 `--config` 指定含验证链接及所需资料的独立配置；`document.url` 仍是材料下载地址，继续保留在配置中。

代理填写时使用输入的代理，留空或只有空格时强制直连，**不使用配置中的代理、系统代理或代理环境变量**。支持 HTTP/SOCKS5 URL 及 `host:port:username:password`。`AUTOMATION_URL` 也不会覆盖网页输入的链接。

点击“加入队列”后，按入队顺序自动填写、提交，并按配置继续材料流程；`browser.autoFill: false` 时遵循原有手动填写模式。材料来源沿用配置中的 `document.path` 或 `document.url`，下载查询中的姓名使用本次网页输入。点击提交后保留浏览器，只有接口确认进入 `docUpload` 且没有终止错误时，才关闭浏览器并继续上传文件。

并发上限由 `config/sheerid.local.json` 的 `web.concurrency` 控制，默认 1。例如同时执行 3 个任务：

```json
"web": { "concurrency": 3 }
```

并发数必须是正整数，服务启动和新任务入队时读取；调低上限不会中断正在运行的任务，后续等到名额足够再启动。排队任务保存入队时的配置快照。任务使用链接中的 `verificationId` 作为唯一 ID；服务本次运行期间重复提交同一 ID 只返回已有任务，不会重复执行。已停止的任务可以通过“恢复任务”明确重新加入队尾，沿用原资料、代理及配置，重复点击不会重复入队；成功或失败的任务不能通过该按钮重跑。

右侧列出队列，点击任务可查看对应进度和日志；刷新保留选中的任务。表单可连续添加不同任务。停止排队任务会立即取消；停止运行任务会终止后续操作，并在对应浏览器和连接清理完成后释放并发名额，随后才可恢复。恢复时先检查远端验证状态；尚未确认的提交继续只读查询。保留浏览器等待手动操作的任务仍占用名额。停止 Web 服务会取消所有排队和运行任务；队列与历史仅保存在服务内存中，重启后不自动恢复或重试。

Web 默认仅监听本机，不把完整配置返回前端，也不持久保存输入的个人资料和代理密码。提交后的审核等待会继续占用任务名额，直到成功、失败或手动停止。

页面选中失败、已结束或已停止的任务后，可点击“删除当前任务”，再用相同链接重新加入队列。删除最后一个任务会清空进度和活动记录，表单内容继续保留；运行中的任务需先停止并等待资源清理完成。

删除历史任务接口：`DELETE /api/jobs/:verificationId`。请求携带已验证的会话 Cookie 或 `X-Web-Password`，以及 `X-Local-Token`（先通过 `GET /api/session` 获取 `token`），无需请求体。已完成、失败或已停止且清理完资源的任务可删除，成功返回 HTTP 200 和 `{ "id": "verificationId", "deleted": true }`；排队、运行或正在停止的任务返回 HTTP 409 / `JOB_ACTIVE`，请先调用 `POST /api/jobs/:verificationId/cancel` 并等待停止完成；不存在的任务返回 HTTP 404 / `JOB_NOT_FOUND`。删除只移除本服务内存中的任务及活动记录，不撤销验证平台上的提交，也不删除磁盘运行日志。删除后相同 ID 可通过正常创建任务接口重新入队，仍先检查远端状态。

网页只在有排队、运行或正在停止的任务时自动刷新进度；全部任务结束并读取最终日志后停止轮询。加入、恢复或切换任务会重新读取状态；已停止任务不会被反复查询。空闲页面要查看其他页面新建的任务时，刷新网页即可。

首次状态分流和浏览器启动前的检查遇到网络错误、超时或 HTTP 5xx 时最多尝试 3 次，重试间隔按 `polling.intervalMs` 递增（默认 5 秒、10 秒），等待可随任务停止而取消。HTTP 4xx（含 429）及无效响应在初始检查中直接停止。网页将状态查询失败、网络/代理异常、请求限流与真正的验证拒绝分别显示，避免把连接失败误报为“验证失败”；这些重试只用于只读状态查询。

### 提交后的状态跟踪

自动提交资料或材料后，程序继续通过 fetch 查询状态，默认每 5 秒一次。`pending`、`emailLoop` 都是中间状态，不结束任务；邮件步骤仍需用户完成邮件操作。正常提交流程最终返回 `verified`（成功）或 `failed`（失败），手动停止仍显示“已停止”。若只是查询现状，`npm run status` 仍只请求一次。

服务端重新返回 `docUpload` 且没有终止错误时，重新请求 `document.url` 获取当前原始文件（仍携带本次姓名），重新申请上传地址并提交；本地文件则重新读取。不会复用上次文件字节或上传地址。`rejectionReasons` 是退回材料的原因，`currentStep: error` 或非空 `errorIds`（包括 `docReviewLimitExceeded`）会终止失败。

可设置 `"polling": { "intervalMs": 5000 }`，范围 1000–300000 毫秒。审核没有人为设置的总等待超时，可通过停止按钮或 Ctrl+C 取消。查询暂时断网、超时或 HTTP 5xx 时退避重试；HTTP 429 仅在带 `Retry-After` 且没有终止错误时按指示等待。上传/提交响应丢失时先持续只读查询，不直接重放写请求；确认已进入审核后，才允许处理后续新的补交材料要求。不可恢复的接口/材料错误会标记任务失败；`submissionUncertain` 表示服务端结果尚未确认。

端口占用时使用 `npm run web -- --port 8788`。关闭服务按 Ctrl+C；不要关闭服务终端后继续操作 Web 页面。

### instabox 部署

程序目录为 `/data/workspace/one`，使用 Node.js 22+，运行 `npm ci` 和 `npm run browser:install` 安装依赖及对应平台的 Camoufox。Linux 有界面浏览器使用 `DISPLAY=:1`，可在 instabox 的 Computer 标签中查看和操作；个人配置仍使用 `config/sheerid.local.json`。

公网部署设置 `ONE_WEB_HOST=0.0.0.0`、`ONE_WEB_PUBLIC_ORIGIN=https://你的域名`，可用 `ONE_WEB_PASSWORD` 覆盖默认访问密码 `JenkinWoo`。不再使用 `ONE_WEB_USER` 或 HTTP Basic 登录；网页可直接打开，在表单的“访问密码”中输入密码即可。API 校验密码或会话 Cookie，并继续检查来源和写请求令牌。公网必须使用 HTTPS 入口；未配置监听环境变量时仍只监听本机。密码校验成功后设置 HttpOnly、SameSite=Strict 的会话 Cookie（公网额外设置 Secure），刷新页面无需重复输入；服务重启后需重新验证。

直接调用接口时，向 `GET /api/session` 发送 `X-Web-Password: JenkinWoo`（自定义密码时替换），保存返回的 `token`。后续 API 请求携带该密码头或返回的会话 Cookie；创建、停止、恢复、删除任务还需携带 `X-Local-Token: token`。默认密码仅存在于后端，页面不会预填密码。

`deploy/one-web.service` 可安装到 `~/.config/systemd/user/one-web.service`，凭据环境文件使用 `/data/workspace/one/.env.web`（权限 600）。使用 `systemctl --user enable --now one-web` 启动；修改代码后执行 `systemctl --user restart one-web`，日志使用 `journalctl --user -u one-web`。停止服务会结束任务；服务重启后队列为空。服务器重启后需保持用户服务运行，并在启动浏览器任务前确保 Computer 桌面可用。

### 命令行

要求 Node.js >= 22.15。默认读取 `config/sheerid.local.json` 的验证链接和材料来源；下载网络材料时可使用配置中的姓名查询原始文件。

```powershell
# 按状态分流：需要资料时打开浏览器并填写，但不提交；其他状态只报告
npm start
# 始终只查询状态，不开浏览器、不上传
npm run status

# 按当前状态提交：资料步骤走浏览器，材料步骤上传指定文件
npm run submit -- --file "C:\Documents\student-proof.png"

# 网络材料地址：保留引号，避免查询参数中的 & 被 shell 解析
npm run submit -- --url "https://school.example.edu/proof?id=123"

# 使用独立配置文件
npm run submit -- --config config/documents.local.json --file "C:\Documents\student-proof.pdf"
```

`--file` 和 `--url` 二选一，均覆盖配置中的材料来源。配置中可填写 `document.path`（本地路径）或 `document.url`（HTTP/HTTPS 地址），不能同时填写两个非空值；配置好后可直接使用 `npm run submit`，无需每次指定路径。旧的 `document.path` 配置继续有效。所有相对路径以启动命令时的工作目录为基准，Windows JSON 路径需写成双反斜杠或使用正斜杠。只有状态允许材料提交且指定了提交模式时才读取或下载材料，完整读取并通过检查后才发起任何验证状态写操作。

最小配置参考 `config/documents.example.json`：

```json
{
  "app": "sheerid",
  "url": "https://my.sheerid.com/rest/v2/verification/REPLACE_WITH_YOUR_VERIFICATION_ID",
  "document": { "path": "C:/Documents/student-proof.png" },
  "timeouts": { "apiMs": 20000, "downloadMs": 120000, "uploadMs": 120000 },
  "artifactsDir": ".runs"
}
```

使用网络材料时，将上面的 `document` 替换为：

```json
"document": { "url": "https://school.example.edu/proof?id=123" }
```

地址须直接返回原始 PNG、JPEG 或 PDF 内容。支持查询参数和内网 HTTP/HTTPS 地址；运行脚本的电脑必须能访问它。下载不携带浏览器 Cookie 或登录凭据，返回登录页、HTML 或 JSON 时会停止，不会继续上传。不会生成或修改材料内容。

配置了 `data.firstName` 和 `data.lastName` 时，下载 `document.url` 或 `--url` 会将去除首尾空格的姓名用一个空格连接，以 URL 编码写入 `name` 查询参数；例如 `?page=2` 变为 `?page=2&name=First+Last`。原有其他参数保留，已有 `name` 会替换为当前配置的姓名，用于查询对应的原始材料。独立材料配置未提供姓名时保留原地址；只提供部分姓名则停止下载并提示补全。本地文件不受影响，日志不记录姓名或完整下载地址。

URL 也可使用原来的 `https://services.sheerid.com/verify/<programId>/?verificationId=...` 页面链接。`AUTOMATION_URL` 环境变量可以覆盖 URL。每次从 URL 读取验证 ID，不在代码中写死。

支持 HTTP、HTTPS 和 SOCKS5 代理，包括账号密码认证。在本地配置增加顶层 `proxy`：

```json
"proxy": {
  "server": "http://proxy.example.com:8080",
  "username": "YOUR_USERNAME",
  "password": "YOUR_PASSWORD"
}
```

SOCKS5 使用 `"server": "socks5://proxy.example.com:1080"`，账号密码字段保持同样格式；无认证代理可省略这两个字段。也可将 `proxy` 写为字符串：`"http://user:password@host:port"`、`"socks5://user:password@host:port"`，或服务商提供的 `"host:port:username:password"`（未指定协议时默认 HTTP）。URL 中的特殊凭据字符需百分号编码；推荐使用分开的字段，避免手动编码。`sock5://` 兼容为 `socks5://`。

`AUTOMATION_PROXY` 环境变量可覆盖配置，格式与代理字符串相同；为空时使用配置。

未配置代理时（省略 `proxy`、`null`、空字符串，或 `server`/`username`/`password` 全为空的对象）默认使用当前系统代理：依次读取 `HTTPS_PROXY`、`ALL_PROXY`、`HTTP_PROXY` 环境变量（大小写均可），再读取 Windows“设置 → 网络 → 代理”中已启用的手动代理（注册表 `ProxyEnable`/`ProxyServer`，分协议设置时优先 https，其次 http、socks）。系统代理关闭或未设置时直连。不支持 PAC 自动配置脚本和系统代理的排除列表。需要强制直连时设置 `"proxy": "direct"`（或 `false`）。仅填写账号密码而不填 `server` 仍会报 `INVALID_PROXY`；系统代理地址无法解析时报 `INVALID_SYSTEM_PROXY`。示例配置不包含真实凭据。

浏览器页面的 HTTP/HTTPS 请求、状态预检查、远程材料下载（含重定向）、上传及提交接口共用该代理配置；本机回环材料地址直接访问本机服务。带认证的 SOCKS5 经仅监听 `127.0.0.1` 随机端口的本机转接服务供浏览器使用，远程 `fetch` 使用同一转接服务；代理不可用时请求失败，不自动改为直连。任务结束时释放连接和转接端口，保持浏览器窗口期间也保持代理服务。这个设置不是系统级 VPN；开启代理后，非回环内网材料地址也经上游代理访问，需要上游能访问该地址。不会自动更换账号中的会话参数或探测出口 IP。

需要自动打开表单时，必须提供完整验证页面链接和所需个人资料；只有状态接口 URL 无法确定对应的页面地址，会报告 `FORM_URL_REQUIRED`。Web/API 模式的页面链接、姓名、邮箱、出生日期来自创建任务请求；当前 `config/sheerid.local.json` 只保留其余设置。独立 CLI 材料配置用于只查状态或处理材料步骤。

默认入口先查询一次状态选择分支，各执行器获得任务锁后再查询一次。`npm run submit` 点击提交后保留浏览器，通过 fetch 跟踪状态；接口尚未离开资料步骤或暂时不可用时继续等待，不重复点击提交。只有接口明确返回无终止错误的 `docUpload` 才关闭浏览器并转交文件上传；SSO 转入材料步骤时也等待该接口确认。尚未出现上传步骤的待审核、邮件状态继续保留浏览器。提交模式成功、终止失败或手动停止时仍清理浏览器，不因 `keepOpen: true` 保留窗口。上传交接时日志记录 `browser_closed` / `DOCUMENT_HANDOFF`，任务锁和代理保留到最终结果。结果中的 `documentRunId` 关联材料流程记录。`npm start` 仍只填写，按 `keepOpen` 保留窗口；`npm run status` 只查询一次。

如果表单已经提交并进入材料步骤，可直接运行 `npm run submit -- --file ...` 或 `--url ...`，程序按最新状态上传，不重复填写表单。材料地址中的 `localhost`、`127.0.0.1` 和 `[::1]` 直连运行脚本的电脑；其他地址按配置使用代理，重定向后重新判断连接方式。

有界面模式使用跟随窗口尺寸的视口，调整或最大化窗口时不会继续固定使用生成的视口尺寸。下拉框按实际就绪状态操作：字段可用后，等待唯一匹配的选项出现、稳定且可点击，点击后确认菜单关闭和选中值，再填写下一项。国家选择会清空搜索过滤，并兼容国家代码、英文及中文页面标签，避免将 `United States` 当作中文选项的搜索词；月份也按页面语言匹配。学校搜索仍使用配置中的学校名称，不自动选择第一条结果。

慢网络下，每次候选项选择最多等待 `timeouts.readyMs`（默认 120000 毫秒），等待期间每 10 秒输出 `waiting_for_options`。需要更长等待可将该值设为 `180000`，最大 `300000`。等待超时或未确认选中会停止后续填写，并按原 `browser.keepOpen` 配置保留窗口；随机输入延迟不替代数据加载等待。

学校选项在异步刷新期间消失、替换或暂时不可点击时，会在同一等待期限内重新定位。每次点击检查和点击各最多等待 1.5 秒，短暂超时不会立即结束整个流程。点击尝试后先检查是否已选中；仅在菜单仍明确展开且目标选项重新就绪时重试选择，不重新输入搜索词或重开已关闭的菜单。等待日志中的 `code` 区分 `OPTIONS_LOADING` / `OPTIONS_RELOADING`（加载或刷新）、`OPTION_STABILIZING`（等待稳定）、`OPTION_CLICK_PENDING` / `OPTION_CLICK_RETRY`（点击阶段）、`OPTION_COMMIT_PENDING`（等待选中确认）。确认超时单独报告 `OPTION_NOT_COMMITTED`，不再误报成点击失败。这些重试仅用于选择表单选项，不用于表单提交或材料上传。

学校搜索输入完成后，若候选列表连续 5 秒保持不变、没有加载提示且没有匹配校名，会移到输入末尾删除一个字符，重新触发搜索，并记录 `SEARCH_RETRIGGERED`。同一次学校选择最多执行一次，仍使用原有的总等待期限及完整校名/校区匹配规则。正在加载、已尝试点击选项、输入内容被用户修改或输入框不可编辑时，不删除字符。

填写不再无限等待全部外部图片和 iframe 触发 `load`：打开页面后最多等待 15 秒 `load` 事件（超时记录 `page_load_slow` 并继续），然后要求国家、姓名、邮箱控件真正渲染完成——不透明（未处于淡入阶段）、未被加载遮罩覆盖、可用，且位置连续 1 秒不变——才开始填写；每个字段填写前也需稳定 300 毫秒。`waiting_for_fields` 日志中的 `NOT_PAINTED`、`COVERED`、`<settling>` 分别表示控件尚透明/隐藏、被遮挡、正在等待布局稳定。选中确认只检查该控件及其关联菜单，避免页面其他组件的加载标记造成无关等待；日志中的 `OPTION_MENU_OPEN`、`OPTION_VALUE_MISMATCH`、`OPTION_VALIDATION_PENDING` 分别表示菜单尚未关闭、显示值不匹配、控件校验尚未完成。

SheerID 选择学校后会将搜索输入框替换为只读学校文本框，原搜索框 ID 不再保留。学校分支优先识别这个已选控件，核对只读状态、完整学校/校区名称及校验状态；确认稳定后继续填写姓名等字段，不再等待已被移除的搜索框。仅输入了搜索文字仍不算选中。

浏览器启动时排除 Camoufox 自带的 uBlock Origin，减少验证资源被扩展拦截的可能性。填写完成后统一等待提交按钮：按钮禁用、被遮挡或页面显示“正在确认您是真人”时等待；出现“无法确认您是真人”和可用的“重试”按钮时点击重试，同一次运行最多 3 次。每次重试先等待加载结果，不连续点击；若错误提示始终未变化，至少间隔 5 秒才再尝试。第 3 次后再次失败，返回 `failed` / `HUMAN_VERIFICATION_RETRY_EXHAUSTED`，不提交表单。错误提示消失本身不算成功，必须等提交按钮可点击且没有验证加载/错误提示。

等待总预算由 `timeouts.humanMs` 控制，默认累计 180000 毫秒，最多可配置为 300000 毫秒；填写结束和提交前共用预算及重试计数，不会各自重试 3 次。持续加载或按钮始终不可点击时，达到预算即失败，即使尚未用完 3 次重试。日志每 10 秒报告等待原因，每次重试记录 `PAGE_RETRY_1_OF_3` 等计数。交互式真人验证由用户在浏览器中完成，脚本不会操作挑战内容。`npm start` 填写并等待按钮就绪后结束自动操作，仍不点击提交；只有提交模式会在就绪后提交一次。失败后按原 `keepOpen` 配置保留窗口。

## 状态与接口顺序

浏览器出现 “We couldn't continue your verification”（或对应中文标题 / `#sid-step-error` 错误页）时，立即按终止失败处理：`status: failed`、`code: VERIFICATION_UNAVAILABLE`，退出码 1。页面检测覆盖表单等待、填写、真人验证重试及提交后的结果等待；即使已经点击过提交，明确的错误页也不会被记成结果未知。不会点击该错误页上的 “Try again”，也不会新建验证会话；它与可重试三次的内联真人验证错误是两种状态。窗口仍按原 `keepOpen` 配置保留。

每次运行先请求 `GET https://my.sheerid.com/rest/v2/verification/{id}`，核对返回 ID、步骤和错误码。

| 当前状态 | 提交模式的行为 |
| --- | --- |
| `sso` 且无错误 | 先读取本地材料或下载网络材料并检查，再 `DELETE /step/sso`；仅当返回 `docUpload` 且无错误时继续 |
| `docUpload` 且无错误 | 读取本地材料或下载网络材料并检查，进入上传流程 |
| `collectStudentPersonalInfo` 且无错误 | 打开浏览器填写；`npm run submit` 还会点击提交，`npm start` 仅填写；不在这个步骤调用取消 SSO 或上传接口 |
| `success` | 返回 `verified`，不重复提交 |
| `pending` / `emailLoop` | 持续查询；邮件步骤等待用户完成邮件操作 |
| `error` 或非空 `errorIds` | 提交模式返回 `failed` 并停止，包括 `fraudRulesReject` |
| 未知步骤 | 提交模式返回 `failed` / `UNSUPPORTED_VERIFICATION_STEP`；只查状态仍报告 `not_actionable` |

上传流程为：

1. `POST /step/docUpload`：发送文件名、MIME 类型和实际字节数。本地来源使用原文件名；网络来源按内容命名为 `document.png`、`document.jpg` 或 `document.pdf`，不把查询参数带入文件名。
2. 从响应中的唯一文档记录获取 `uploadUrl`，验证它是 HTTPS S3/SheerID 地址。
3. `PUT uploadUrl`：发送原始文件字节及对应 `Content-Type`，不用 multipart，不附带 SheerID Cookie 或认证头。
4. PUT 成功后，`POST /step/completeDocUpload`，按接口返回的最终步骤记录结果。

支持本地和网络 PNG、JPEG、PDF，按文件头识别格式。本地来源还检查扩展名、普通文件类型及读取前后大小一致性；网络来源不依赖 URL 扩展名或响应文件名，下载时按实际接收字节累计检查大小，因此没有 `Content-Length` 也受限制。材料必须非空且不超过项目的 20 MiB 上限；这不是对服务端文件大小限制的保证，也不判断材料的真实性。网络读取仅在内存中缓冲，不另存到磁盘。

官方接口依据：[SheerID OpenAPI](https://services.sheerid.com/rest/v2/swagger.yaml)。其中 `DELETE /verification/{id}/step/sso` 的说明是取消 SSO 并转入 `docUpload`；并非跳过最终学籍审核，也不适用于尚在填写资料的步骤。

## 运行与结果

需要手动填写时，在本地配置的 `browser` 中设置 `"autoFill": false`，然后运行 `npm start`。默认值为 `true`，改回即可恢复自动填写。手动模式仍按当前验证状态决定是否打开表单；表单打开后跳过资料校验、字段等待、自动填写、真人验证重试及自动提交，保持窗口供你操作，关闭窗口或 Ctrl+C 后清理任务。需要 `headless: false` 且不能设置 `keepOpen: false`；此模式仅在资料填写步骤拒绝 `--submit`。手动提交进入材料步骤并关闭旧任务窗口后，可用 `--submit` 上传材料，无需重新开启自动填写；`--status` 仍只查询状态。

手动模式结果为 `status: manual` / `code: MANUAL_MODE`，只表示已打开页面交给用户，不表示填写完成或验证通过。后续手动填写、提交及验证结果以浏览器页面为准，`submissionAttempted` 只记录脚本是否提交。该开关不关闭网页自身的 JavaScript。

启动预检查或写请求遇到 HTTP 429 时仍报告 `API_RATE_LIMITED` 并停止。提交后的只读轮询仅在有 `Retry-After` 且响应未包含终止错误时等待并重试；没有恢复时间或已达到业务限制则失败，不连续重试。

状态和材料接口均通过 `fetch`。写请求不直接自动重试；只读轮询和服务端新要求的补交材料按上述规则处理。状态和上传接口不跟随重定向。网络材料下载最多跟随 3 次 HTTP/HTTPS 重定向，禁止 HTTPS 降级到 HTTP，不接受 URL 内嵌账号密码；超时覆盖整个下载和重定向过程。API 默认超时 20 秒，下载和上传各默认 120 秒，可分别配置 `timeouts.apiMs`、`timeouts.downloadMs` 和 `timeouts.uploadMs`。Ctrl+C 取消当前任务并释放任务锁。

标准错误输出阶段日志；标准输出返回最终 JSON。`.runs/<runId>.json` 保存状态、阶段和错误码，不保存材料字节、文件路径、材料源 URL、预签名上传 URL 或完整接口响应。每次远端写入前仍保存 `submission_unknown` 作为崩溃恢复记录；正常运行时响应丢失会继续只读查询，最终记录成功或失败。服务退出后不会自动重放未确认的提交。

材料分支结果中的 `remoteWriteAttempted` 记录是否已进入远端写入流程，`submissionAttempted` 记录是否进入完成上传请求；`browserOpened` 为 `false`。浏览器分支的 `submissionAttempted` 表示是否尝试点击提交，`browserOpened` 表示是否已创建浏览器会话。`pending` 表示等待审核，只有接口返回 `success` 才记录 `verified`。

| 结果 | 退出码 |
| --- | --- |
| `filled` / `verified` / `manual` | 0 |
| `failed` / `rejected` | 1 |
| `document_required` / `sso_required` / `personal_info_required` / `email_required` / `human_verification_required` / `pending` / `not_actionable` | 2 |
| `submission_unknown` | 3 |
| 用户中断 | 130 |

同一验证 ID 使用同一任务锁，包含与历史浏览器流程之间的互斥。旧浏览器任务仍运行时，应先正常关闭该任务。配置 `*.local.json`、`.runs/`、`documents/` 均被 Git 忽略。

## 模块与扩展

```text
src/cli.js                              按状态分流的命令行
src/core/workflow.js                    浏览器/材料接口分流
src/core/http.js                        fetch、超时、取消及错误处理
src/core/proxy.js                       代理配置解析，不在错误中暴露凭据
src/core/network.js                     任务级代理转接及 fetch 路由
src/apps/sheerid/client.js               状态和材料接口客户端
src/apps/sheerid/document.js             本地读取、网络下载与统一格式检查
src/apps/sheerid/document-workflow.js    状态机、任务锁及结果记录
src/core/config.js                      统一配置
src/core/storage.js                     锁及原子结果保存
```

```javascript
import { loadConfig, runDocumentWorkflow } from './src/index.js';
const config = await loadConfig('config/sheerid.local.json');
const status = await runDocumentWorkflow(config); // 只查询
// 有文件且确认需要提交时：
const result = await runDocumentWorkflow(config, {
  submit: true,
  file: 'C:/Documents/student-proof.png',
});
```

网络来源在上面的调用中用 `url: 'https://school.example.edu/proof?id=123'` 替换 `file`。统一分流库入口为 `runWorkflow(config, { submit, statusOnly, file, url, signal })`；这里的 `url` 是材料地址，验证地址仍由 `config.url` 提供。直接调用 `runDocumentWorkflow` 则始终只使用材料接口，遇到资料填写步骤返回 `personal_info_required`。浏览器分支调用 `runAutomation`，只有需要表单时才由 CLI 延迟加载 Camoufox；原随机输入、保持窗口和指纹配置仅作用于浏览器分支。更多浏览器设置见 [docs/browser-workflow.md](docs/browser-workflow.md)，历史命令说明以本 README 为准。

运行 `npm test` 可执行离线回归测试，覆盖浏览器到材料流程的衔接、任务锁、上传响应丢失、下载姓名参数及本机材料下载。有已安装的 Camoufox 时还会运行学校搜索的本地测试页；没有时跳过这些浏览器用例。测试不访问真实验证接口。
