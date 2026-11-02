<p align="center">
  <a href="https://github.com/modelflare-ai/AnyModelBot/releases">
    <img src="docs/assets/brand/logo-eyes.webp" width="120" height="120" alt="AnyModelBot 的 Eyes 标志：两只竖向胶囊形的眼睛，会左右张望">
  </a>
</p>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/wordmark-dark.svg">
    <img src="docs/assets/brand/wordmark-light.svg" height="40" alt="AnyModelBot">
  </picture>
</h1>

<p align="center"><b>跑在你自己电脑上的 AI 机器人。任意模型，按量付费。</b></p>

<p align="center">
  <a href="https://anymodel.bot/">官网</a> |
  <a href="https://github.com/modelflare-ai/AnyModelBot/releases">下载</a> |
  简体中文 |
  <a href="./README_en.md">English</a> |
  <a href="https://modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme">Modelflare</a> |
  <a href="https://modelflare.dev/pricing?utm_source=anymodelbot&utm_campaign=amb_readme">价格</a> |
  <a href="./docs/development.md">开发文档</a> |
  <a href="https://github.com/modelflare-ai/AnyModelBot/issues">问题反馈</a>
</p>

<div align="center">

[![Release][release-shield]][releases-link]
[![Downloads][downloads-shield]][releases-link]
[![Stars][stars-shield]][stars-link]
[![License][license-shield]][license-link]
[![CI][ci-shield]][ci-link]

[![Platform][platform-shield]][releases-link]
[![Pricing][pricing-shield]][pricing-link]
[![Modelflare][modelflare-shield]][modelflare-link]
[![X][x-shield]][x-link]

</div>

<p align="center">
  <img src="docs/assets/hero/hero-demo.gif" alt="AnyModelBot 演示：登录 Modelflare、选择模型、让机器人整理一个文件夹，并批准一次文件移动" width="100%">
</p>

# 🤖 AnyModelBot

AnyModelBot 是一个本地优先的 AI 智能体应用，支持 Windows、macOS 和 Linux。一个机器人就是一个人设，带着自己的默认模型、工作区和记忆。你可以在应用里和它聊天，也可以在微信、飞书、Telegram、Slack、Discord 里找它。它能读写文件、执行命令、操作你的桌面，一旦要越出自己的工作区，就会先问你。

对话、记忆、文件和 API Key 都留在你的设备上。模型来自 [Modelflare](https://modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme)：一个账户，任意模型，按 token 计费。AnyModelBot 本身没有订阅。

和 xAI 的 Grok Bot、OpenAI 的 dots、Anthropic 的 Claude Duet 一样，它是一个常驻的个人 AI 智能体：在后台替你干活，需要你拍板时再来问你。不同的是，AnyModelBot 开源（MIT），跑在你自己的电脑或服务器上，GPT、Claude、Gemini、Grok 等任意模型都能用，按量付费，不绑定某一家的订阅（[详细对比](#-对比-grok-bot--openai-dots--claude-duet)）。

装好就是一个开箱即用的 Super Agent：后台任务、定时规则和「需要你」都不用另外配置。它的设计参考了 DeepSeek 的 [Super Agent 原型](https://github.com/deepseek-ai/dsh-superagent-prototype)，智能体运行在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 上（[详细介绍](./docs/blog/superagent.md)）。

📥 [下载](#-下载) · 🌠 [截图](#-截图) · 🌟 [核心功能](#-核心功能) · 🆚 [对比](#-对比-grok-bot--openai-dots--claude-duet) · 🔐 [工作原理与隐私](#-工作原理与隐私)

⭐ 喜欢 AnyModelBot？点个 Star，第一时间收到新版本。

---

<a href="https://modelflare.dev/sign-up?utm_source=anymodelbot&utm_campaign=amb_readme">
  <img src="docs/assets/modelflare/modelflare-banner-zh.webp" width="100%" alt="Modelflare 横幅：满血、稳定不掺水，低成本享受全球 SOTA 模型；GPT 特惠分组 0.015 倍、Claude 特惠分组 0.03 倍；OpenAI 分组缓存命中率保障 65% · 75% · 85%，未达标补偿差额">
</a>

AnyModelBot 的模型全部来自 **[Modelflare](https://modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme)**：满血、稳定不掺水，低成本享受全球 SOTA 模型。Modelflare 由美国公司 Havenbyte LLC 运营，已有 20 万+ 注册开发者。一个 API Key 就能调用 13 家供应商的 70+ 个文本、图片和视频模型，GPT、Claude、Gemini、Grok、DeepSeek、Kimi、GLM 都在里面，兼容 OpenAI、Anthropic、Gemini 等常用接口协议。请求会在多个供应商之间路由并自动回退，每一次请求都记录用量和费用，价格表公开，按 token 计费。

**缓存补偿**是一大亮点：OpenAI 的价格优先、稳定、高级三个分组，分别保证每天 65%、75%、85% 的缓存命中率；符合条件的请求没达到目标，Modelflare 会补偿差额。

**特惠活动**：单笔充值达到指定金额，就能解锁 0.015 倍价格倍率的 GPT 特惠分组和 0.03 倍的 Claude 特惠分组，适合个人开发、功能验证和轻量使用。这是限时活动，门槛和规则以 Modelflare 页面为准，通过[专属链接](https://modelflare.dev/sign-up?utm_source=anymodelbot&utm_campaign=amb_readme)注册即可参与。

**[注册 Modelflare →](https://modelflare.dev/sign-up?utm_source=anymodelbot&utm_campaign=amb_readme)** ·
[价格表](https://modelflare.dev/pricing?utm_source=anymodelbot&utm_campaign=amb_readme) ·
[API 文档](https://docs.modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme) ·
[信任中心](https://modelflare.dev/trust?utm_source=anymodelbot&utm_campaign=amb_readme) ·
[X](https://x.com/modelflare_dev)

**AnyModelBot 怎么用 Modelflare**

- **登录一次就行。** 首次启动会打开浏览器，登录（或注册）Modelflare。之后应用自己把这台设备连上，不用复制 Key。在 Docker 或服务器上运行？改为粘贴一个 API Key。
- **所有模型，一个选择器。** 你的 Modelflare 模型会自动列出，每个模型旁边都有上下文长度、能力标记和参考价。
- **用多少付多少。** 余额、低余额提醒和每日用量都在应用里看。选模型之前，先看公开价格表，和官方价格对比一下。
- **一条诚实的边界。** 模型请求会经过 Modelflare 转发给你选定的供应商，Modelflare 会保留请求日志；保留什么、保留多久，见[信任中心](https://modelflare.dev/trust?utm_source=anymodelbot&utm_campaign=amb_readme)。除此之外的内容都留在你的设备上（[详情](#-工作原理与隐私)）。

---

# 📥 下载

选择你的平台。每个 Release 页面都列出全部安装包和 `SHA256SUMS` 校验文件。

| 平台 | 架构 | 安装包 | |
| :--- | :--- | :--- | :--- |
| ![Windows][win-badge] | x64 | `anymodel-bot-<version>-win-x64.exe` | [下载][releases-link] |
| ![Windows][win-badge] | arm64 | `anymodel-bot-<version>-win-arm64.exe` | [下载][releases-link] |
| ![macOS][mac-badge] | Apple 芯片 | `anymodel-bot-<version>-mac-arm64.dmg` | [下载][releases-link] |
| ![macOS][mac-badge] | Intel | `anymodel-bot-<version>-mac-x64.dmg` | [下载][releases-link] |
| ![Linux][linux-badge] | x64 | `anymodel-bot-<version>-linux-x86_64.AppImage` | [下载][releases-link] |
| ![Linux][linux-badge] | arm64 | `anymodel-bot-<version>-linux-arm64.AppImage` | [下载][releases-link] |

<p align="center">
  <img src="docs/assets/download/install-windows.gif" alt="在 Windows 上安装 AnyModelBot：运行安装程序、打开应用，来到 Modelflare 登录页" width="100%">
</p>

**首次打开。** 如果系统提示这是从网上下载的应用：Windows 点「更多信息 → 仍要运行」，macOS 在「系统设置 → 隐私与安全性」里点「仍要打开」。Linux 先给 AppImage 加可执行权限（`chmod +x`）再运行。关闭窗口会把 AnyModelBot 收到托盘，要退出请用托盘菜单或设置里的选项。

**校验下载文件。**

```bash
sha256sum -c SHA256SUMS --ignore-missing
```

macOS 用 `shasum -a 256 <文件名>`，Windows PowerShell 用 `Get-FileHash <文件名>`，再和 `SHA256SUMS` 里的值对照。

**用 Docker 部署到 NAS 或服务器**（镜像同时支持 x64 和 arm64）

```bash
docker run -d --name amb -p 3600:3600 -v amb-data:/data ghcr.io/modelflare-ai/anymodel-bot
docker exec amb cat /data/ui-token   # 然后打开 http://<主机>:3600/?token=<令牌>
```

不要把 3600 端口直接暴露到公网。

**从源码运行**

```bash
git clone https://github.com/modelflare-ai/AnyModelBot.git
cd AnyModelBot
npm install
npm run setup      # 拉取并编译内置网关
npm start          # 本地管理界面：http://127.0.0.1:3600/
```

从源码构建需要 Node.js 22.13+ 和 Go 1.26.8+。想自己构建 Docker 镜像，见[开发文档](./docs/development.md)。

# 🌠 截图

截图是简体中文界面；应用也有英文界面，在设置里切换。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/chat-dark.webp">
  <img src="docs/assets/screenshots/chat-light.webp" alt="聊天界面：一条带 Markdown 列表和代码块的回复，输入框旁有模型按钮，左侧是机器人列表" width="100%">
</picture>

<p align="center"><i>和机器人聊天。回复支持 Markdown 和代码块，输入框会显示当前用的模型。</i></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/agent-dark.webp">
  <img src="docs/assets/screenshots/agent-light.webp" alt="智能体界面：文件任务的逐步活动列表，以及一张请求写入工作区之外的审批卡片" width="100%">
</picture>

<p align="center"><i>智能体做了什么，一步一步看得见。工作区之外的操作要等你批准。</i></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/models-dark.webp">
  <img src="docs/assets/screenshots/models-light.webp" alt="模型选择器：可搜索的 Modelflare 模型列表，带上下文长度、能力标记和参考价" width="100%">
</picture>

<p align="center"><i>每个对话都能选任意 Modelflare 模型，上下文长度、能力和参考价就在旁边。</i></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/memory-dark.webp">
  <img src="docs/assets/screenshots/memory-light.webp" alt="信息面板：一个机器人的记忆条目、已连接的渠道和最近的会话" width="100%">
</picture>

<p align="center"><i>每个机器人的记忆、渠道和会话，集中在一个面板里。</i></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/modelflare-dark.webp">
  <img src="docs/assets/screenshots/modelflare-light.webp" alt="设置的 Modelflare 页打开了用量弹窗：近 7 天的每日用量，下面是默认模型，余额显示在左下角的账户按钮上" width="100%">
</picture>

<p align="center"><i>应用里的 Modelflare 账户：余额、用量和默认设置。</i></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/screenshots/bots-dark.webp">
  <img src="docs/assets/screenshots/bots-light.webp" alt="六个 AnyModelBot 角色排成一排，每个有自己的颜色" width="100%">
</picture>

<p align="center"><i>六个角色，帮你分清不同的机器人。它们的眼睛会跟着你的鼠标转。</i></p>

# 🌟 核心功能

## 🤖 真能干活的机器人

机器人不只是一个聊天窗口：它有自己的人设、默认模型、工作区和记忆。

- **想建几个就建几个**，每个都有自己的人设、模型、工作区和头像。
- **它是谁由你写。** 人设就是一段话，模板只是起点，每个字都能改；六个头像只管长相，不决定它能做什么。
- **真正的文件操作。** 机器人能读写文件、在沙箱里执行命令，并把结果作为文件发回聊天。
- **每个机器人三档权限。** *只读*、*工作区*（默认：只能写自己的文件夹，越界先问你）、*完全权限*（不进沙箱；递归删除仍会先问）。
- **审批卡片，没有意外。** 越界的操作会停下来，等你回答。
- **重启了也会告诉你。** 应用退出或崩溃时还没处理完的消息，下次启动会在原对话里说一声，请你重新发送，不会自动重做。
- **群聊。** 建一个群，拉几个机器人进来。@ 谁谁回答，没 @ 时上一个回答的接着答；机器人也能 @ 别的成员请它接手。每个机器人用自己的模型、工作区和记忆，花费分开算。
- **斜杠命令**，如 `/model`、`/reset`，在应用和各个聊天渠道里都能用；在聊天渠道里发 `/bot` 可以换机器人。

<p align="center">
  <img src="docs/assets/features/agent-files.gif" alt="机器人整理一个杂乱的文件夹：先列出文件、给出方案，移动工作区之外的文件前弹出审批卡片" width="100%">
</p>

## ⏳ 在后台干活，需要你时才来找你

- **后台任务。** 要跑一阵子的事（调研、做报告、整理文件），或者你说一句「后台做」，机器人会开一个后台任务，你可以接着聊别的。做完把结果发回原来的对话。
- **接着问。** 在微信里引用结果、在飞书里回复那条消息，就是继续问这个任务。
- **规则。** 「每天早上 8 点看看 X 的价格，低于 200 告诉我」会建成一条规则，到点就去查，有值得说的才告诉你。想先看看它会怎么做，就说「先观察」：只记下本会说什么，不发消息、不改文件，看过几次再改成执行。
- **「需要你」。** 所有机器人在等你回答、批准或重试的事都在侧栏这一行里；没事时这一行不出现。信息面板的「任务」组列着这个机器人的任务和规则，每一步都看得到。
- **不吵你。** 只推结果、要你决定的事和失败，进展不推。默认 22:00 到 08:00 免打扰；主动消息每天有上限（微信 3 条，其他渠道 5 条），多了合成一条。
- **有预算。** 每个任务、每条规则都有预算（任务默认 1 美元，规则每次 0.1 美元、每月 3 美元），快用完时停下问你，可以在任务详情和规则编辑器里改。
- **随时暂停。** 机器人设置 › 主动消息里一个开关暂停后台工作，聊天照常。
- **用完会清理。** 任务和运行记录留 30 天；任务文件夹 30 天没动过会自动删除，不来问你，任务详情里写着哪天删，想留就点保留。运行记录能导出成 Markdown。

完整介绍见[《AnyModelBot 超级智能体》](./docs/blog/superagent.md)。

## 🖥️ 操作你的电脑，生成图片和视频

- **电脑操作**由内置的 [Cua Driver](https://github.com/trycua/cua) 提供。默认自动执行；把某个机器人切到「改变界面前先问我」，每一次点击和输入都要等你点头。读取屏幕内容永远不需要审批。macOS 上的电脑操作是 Beta 功能。
- **图片和视频生成**直接生成，要求没说清的按最合理的理解来；预计花费超过 0.5 美元时才先问你，让你看到模型和提示词，也可以当场换模型。想每次都确认，在机器人设置里打开即可。

<p align="center">
  <img src="docs/assets/features/computer-use.gif" alt="机器人打开记事本、输入一段备忘并保存，每次点击和输入前都有审批卡片" width="100%">
</p>

<p align="center">
  <img src="docs/assets/features/media-generation.gif" alt="机器人生图前先问用哪个模型，用户确认后，成图作为文件交付到聊天里，并在看图窗口中打开" width="100%">
</p>

## 🌐 任意模型，通过 Modelflare

- **登录一次**，你的 Modelflare 模型就会自动出现。更想用 Key？直接粘贴也行。
- **一个选择器，覆盖所有模型。** GPT、Claude、Gemini、Grok、DeepSeek、Kimi、GLM 等，每个都标出上下文长度、能力和参考价。
- **按对话切换**，也可以给每个机器人设默认模型；记忆整理、上下文交接这类后台小任务，还能单独指定一个模型。
- **两条线路。** 国际线路和中国大陆优化线路，由你自己选，AnyModelBot 不会自动来回切换。
- **按量付费。** 钱包余额、低余额提醒、每日用量、每个机器人的预算 Key 都内置。AnyModelBot 没有订阅。

<p align="center">
  <img src="docs/assets/features/first-run.gif" alt="首次启动：点「登录 Modelflare」，在浏览器里授权，回到应用后模型已列出，发出第一条消息" width="100%">
</p>

<p align="center">
  <img src="docs/assets/features/model-switch.gif" alt="打开模型选择器、搜索一个模型、查看它的上下文长度和参考价，并把当前对话切换过去" width="100%">
</p>

## 🧠 有记忆，随处可达

- **记忆会延续。** 机器人用 Markdown 保存三层记忆（团队、机器人、群），会过滤看起来像密钥的内容。
- **长对话也能用下去。** 上下文快满之前，上下文管家会压缩，或开一个新段并带上交接摘要。
- **账号全局共用。** 微信、飞书、Telegram、Slack、Discord、Notion 的账号在设置里加一次，所有机器人共用，每个服务可以加多个、起别名。在聊天软件里发一次 `/bot 名字` 就换一个机器人聊，也可以让机器人读你的 Notion 和飞书消息。
- **微信和飞书。** 微信扫码连接，飞书机器人支持流式回复卡片；微信还能收发图片和文件。
- **Telegram、Slack、Discord。** 在 设置 › 连接 里填 token 连接，不需要公网地址；回复边写边显示，能收发图片和文件。目前只处理单聊，审批和提问回复文字。
- **四种运行方式。** 桌面版、命令行、Docker，以及 `127.0.0.1:3600` 的本地网页控制台。

<p align="center">
  <img src="docs/assets/features/memory.gif" alt="让机器人记住一个偏好，打开信息面板看到新增的记忆条目，再开一个新对话，机器人用上了这条记忆" width="100%">
</p>

<p align="center">
  <img src="docs/assets/features/channels-wechat.gif" alt="扫码连接微信，在手机上发出一个问题，机器人在手机上回答，同一段对话出现在桌面应用的「最近会话」里" width="100%">
</p>

## 🔒 本地优先，也好看

- **数据留在你手里。** 对话、记忆、文件和 API Key 都存放在你的设备上。本地控制台只监听 `127.0.0.1`，桌面版每次启动都会生成新的访问令牌。
- **只听主人的。** 机器人默认只回应主人（扫码登录的微信；飞书、Telegram、Slack、Discord 连上后第一个给它发消息的人，也就是你）和你允许的人。其他人发消息只会收到一句提示，不会调用模型；你在信息面板里，或在聊天里回复「同意 编号」放行。
- **回复不会丢。** 回复先存到本地再发；网络断了会自动重试，应用重启后接着发；你在微信里超过 24 小时没说话时，回复先留着，等你下次发消息时一起送到。
- **遥测保持关闭。** 内置电脑操作驱动的遥测已关闭，内置网关以关闭自动更新的方式运行。
- **浅色、深色或跟随系统。** 六个机器人角色，眼睛会跟着你的鼠标转。
- **托盘与开机自启。** 关闭窗口会收到托盘；macOS 和 Windows 支持开机自启。

<p align="center">
  <img src="docs/assets/features/characters-eyes.gif" alt="六个 AnyModelBot 角色排成一排，鼠标从它们上方移过时，眼睛会跟着转" width="100%">
</p>

> [!NOTE]
> 功能是否可用取决于你选择的模型、操作系统和授予的权限。电脑操作需要桌面会话，macOS 上的电脑操作为 Beta。模型请求会经过 Modelflare 转发给你选定的供应商，详见[工作原理与隐私](#-工作原理与隐私)。

# 🆚 对比 Grok Bot / OpenAI dots / Claude Duet

2026 年下半年，xAI 的 [Grok Bot](https://x.ai/bot)、OpenAI 的 [dots](https://openai.com/index/introducing-dots/) 和 Anthropic 的 Claude Duet 接连发布，"常驻的个人 AI 智能体"成了热门：它替你盯着事情、在后台干活，需要你决定时再来找你。AnyModelBot 做的是同一类事，换了一种做法：开源、跑在你自己的设备上、任意模型都能用。

| | AnyModelBot | Grok Bot | OpenAI dots | Claude Duet |
| :--- | :--- | :--- | :--- | :--- |
| 开源 | ✅ MIT | — | — | — |
| 智能体跑在哪 | 你自己的电脑或服务器 | xAI 的云端电脑 | OpenAI 的云端电脑 | Anthropic 的云端 |
| 能用的模型 | GPT、Claude、Gemini、Grok、DeepSeek、Kimi、GLM 等 70+ 个（经 Modelflare） | 以 xAI 的 Grok 模型为主 | OpenAI 的模型 | Claude（Opus 5.5） |
| 费用 | 应用免费，模型按 token 计费 | 订阅 | ChatGPT Pro / Business Premium 订阅 | Claude Pro / Max 订阅 |
| 在哪找它 | 桌面应用（Windows、macOS、Linux）、Docker、微信、飞书、Telegram、Slack、Discord | 桌面应用、iPhone | ChatGPT、Slack、Teams | iOS、Android、claude.ai |
| 现在能用吗 | 直接下载 | 测试版 | 部分地区开放 | 研究预览，美国候补名单 |

AnyModelBot 同样能在后台干活：交代的任务可以在后台跑完，再把结果发到你用的聊天渠道；需要你批准或回答时，它会出现在侧栏的「需要你」里。机器人做的每一步都看得见，越出工作区的操作先问你。

> [!NOTE]
> 其他产品的信息来自 2026 年 10 月的公开报道，可能已有变化，以各家官方说明为准。Grok Bot、dots、Claude Duet 分别是 xAI、OpenAI、Anthropic 的产品和商标，AnyModelBot 与它们没有关联。

# 🔐 工作原理与隐私

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/diagrams/data-flow-dark.svg">
  <img src="docs/assets/diagrams/data-flow-light.svg" alt="数据流向：对话、记忆、文件和密钥留在你的设备上；模型请求经 Modelflare 转发给模型供应商；聊天渠道的消息会经过对应的平台，机器人也会读写你授权的 Notion、飞书账号" width="100%">
</picture>

| 留在你的设备上 | 会离开你的设备 |
| :--- | :--- |
| 对话与会话（本地 SQLite 数据库） | 模型回答所需的提示词、文件内容和工具结果，经 Modelflare 发给你选定的供应商 |
| 记忆（Markdown 文件） | 你让机器人用电脑操作看屏幕时的屏幕截图 |
| 每个机器人工作区里的文件 | 你通过聊天渠道收发的消息，会经过对应的平台 |
| 你的 API Key 和登录令牌 | 你登录 Modelflare 的过程，发生在 modelflare.dev |
| 设置 | 你添加 Notion 或飞书账号后，机器人会读写这些账号的内容，读到的内容也会进入模型请求 |

Modelflare 会保留请求日志；保留什么、保留多久，见它的[信任中心](https://modelflare.dev/trust?utm_source=anymodelbot&utm_campaign=amb_readme)。我们不声称能做到万无一失：凡是你发给模型的内容，都会离开你的设备。完整清单见 [docs/privacy.md](./docs/privacy.md)。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/diagrams/architecture-dark.svg">
  <img src="docs/assets/diagrams/architecture-light.svg" alt="架构：Electron 外壳、命令行或 Docker 启动 Node.js + TypeScript 后端，后端包含 Preact 界面、SQLite、DSH 智能体运行时和渠道适配，再调用内置的 magpie 网关，由它连到 Modelflare" width="100%">
</picture>

| 层 | 技术 |
| :--- | :--- |
| 界面 | Preact + htm，无构建步骤 |
| 后端 | Node.js 22.13+、TypeScript、`node:sqlite` |
| 桌面外壳 | Electron，带托盘 |
| 模型网关 | [magpie](https://github.com/yetone/magpie)（Go，MIT），随应用打包并由应用启动 |
| 智能体运行时 | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT），作为独立进程运行 |
| 电脑操作 | [Cua Driver](https://github.com/trycua/cua)，随应用打包 |
| 渠道 | 飞书（长连接 + 流式卡片）、微信（iLink）、Telegram（长轮询）、Slack（Socket Mode）、Discord（Gateway） |
| 数据账号 | Notion（REST API、官方远程 MCP）、飞书消息（用户身份，只读） |
| 测试与 CI | Vitest、GitHub Actions |

# 📝 路线图

我们正在探索的方向。它们不是承诺，顺序也不是排期。每个版本实际改了什么，见[更新日志](./CHANGELOG.md)。

- [x] **定时任务**：让机器人按时间表自己干活（已上线，就是上面的规则）。
- [x] **应用内群聊**：在应用里建群，拉多个机器人一起聊。
- [ ] **聊天渠道里的群聊**：目前各聊天渠道只处理一对一对话。
- [x] **英文界面**：已支持中英双语，在设置里切换。
- [ ] **macOS 电脑操作**：在更多真机上验证 direct 模式，让它脱离 Beta。
- [ ] **邮箱、日历和事件触发**：接入邮箱和日历账号，规则除了按时间跑，也能在事情发生时马上跑（比如收到某人的邮件、快开会时）。由外部内容触发的运行权限更低，防止别人写的内容给机器人下指令。
- [ ] **常驻运行、备份和迁移**：电脑关机时规则不会跑。让普通用户也能一键部署到自己的服务器，把对话、记忆和账号搬过去，也能备份和恢复。
- [ ] **自己添加 MCP**：目前只能用内置的工具和账号。开放后，可以自己接入 GitHub、Linear 等服务。
- [ ] **机器人之间协作**：让一个机器人把活交给另一个，比如用不同的模型写稿和审稿，花费分开算。
- [ ] **语音消息转写**：Telegram 的语音消息目前听不到内容，微信靠平台自带的转写。
- [ ] **独立的手机应用**：目前可以从微信、飞书、Telegram、Slack、Discord 找到你的机器人。

有别的想法？欢迎提 [issue](https://github.com/modelflare-ai/AnyModelBot/issues) 或发起[讨论](https://github.com/modelflare-ai/AnyModelBot/discussions)。我们决定要做的事项，会用 [`roadmap`](https://github.com/modelflare-ai/AnyModelBot/labels/roadmap) 标签跟踪。

# 🤝 参与贡献

欢迎提交 bug 报告、修复、文档和想法。

1. 先看看已有的 [issue](https://github.com/modelflare-ai/AnyModelBot/issues) 和[讨论](https://github.com/modelflare-ai/AnyModelBot/discussions)。带 [`good first issue`](https://github.com/modelflare-ai/AnyModelBot/labels/good%20first%20issue) 标签的 issue 适合入门。
2. Fork 仓库，从 `master` 新建分支。
3. 本地运行并修改：

   ```bash
   npm install
   npm run setup          # 拉取并编译内置网关
   npm run electron:dev   # 开发模式运行桌面版
   npm run typecheck && npm test
   ```

4. 向 `master` 提交 Pull Request，写清楚改了什么、为什么改。比小修复大的改动，请先开 issue，我们先对齐方案。

完整说明见[贡献指南](./CONTRIBUTING.md)。如果要报告安全问题，请按 [SECURITY.md](./SECURITY.md) 处理，不要公开提 issue。

# 🔗 相关项目

- [Modelflare](https://modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme)：AnyModelBot 模型背后的 AI API 网关。
- [magpie](https://github.com/yetone/magpie)：随应用打包的 Go 网关（MIT）。
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：智能体运行时（MIT）。
- [Cua](https://github.com/trycua/cua)：电脑操作驱动。
- [kimi-computer-use](https://github.com/songkeys/kimi-computer-use)：macOS 的电脑操作桥接。
- [openclaw-weixin](https://github.com/Tencent/openclaw-weixin)：我们移植的微信渠道实现（MIT）。
- [DS Bot](https://github.com/Fei2411/DS-Bot)：记忆与上下文管家的设计来源（Apache-2.0）。

完整的许可证与声明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

# 💬 社区

- **提问与想法：** [GitHub Discussions](https://github.com/modelflare-ai/AnyModelBot/discussions)
- **Bug 与功能建议：** [GitHub Issues](https://github.com/modelflare-ai/AnyModelBot/issues)
- **邮件联系：** [support@anymodel.bot](mailto:support@anymodel.bot)
- **Modelflare 动态：** [X 上的 @modelflare_dev](https://x.com/modelflare_dev)

# 🚀 贡献者

<a href="https://github.com/modelflare-ai/AnyModelBot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=modelflare-ai/AnyModelBot" alt="AnyModelBot 的贡献者" />
</a>

# ⭐️ Star 趋势

<a href="https://www.star-history.com/#modelflare-ai/AnyModelBot&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=modelflare-ai/AnyModelBot&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=modelflare-ai/AnyModelBot&type=Date" />
    <img alt="AnyModelBot 的 Star 趋势图" src="https://api.star-history.com/svg?repos=modelflare-ai/AnyModelBot&type=Date" width="100%" />
  </picture>
</a>

# 📜 许可证

AnyModelBot 以 [MIT 许可证](./LICENSE)发布。随附的第三方软件保留各自的许可证，见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) 和 [`LICENSES/`](./LICENSES) 目录。

<!-- link & badge references -->
[release-shield]: https://img.shields.io/github/v/release/modelflare-ai/AnyModelBot?include_prereleases&label=release&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSIzIiB5PSI5IiB3aWR0aD0iOTQiIGhlaWdodD0iODIiIHJ4PSIzNiIgZmlsbD0iI2Q3ZmYwMCIvPjxyZWN0IHg9IjI5IiB5PSIzNiIgd2lkdGg9IjEzIiBoZWlnaHQ9IjI4IiByeD0iNi41IiBmaWxsPSIjMTYxYTAwIi8+PHJlY3QgeD0iNTgiIHk9IjM2IiB3aWR0aD0iMTMiIGhlaWdodD0iMjgiIHJ4PSI2LjUiIGZpbGw9IiMxNjFhMDAiLz48L3N2Zz4=&style=flat-square&labelColor=161a00&color=d7ff00
[downloads-shield]: https://img.shields.io/github/downloads/modelflare-ai/AnyModelBot/total?logo=github&logoColor=d7ff00&style=flat-square&labelColor=161a00&color=d7ff00
[stars-shield]: https://img.shields.io/github/stars/modelflare-ai/AnyModelBot?logo=github&logoColor=d7ff00&style=flat-square&labelColor=161a00&color=d7ff00
[license-shield]: https://img.shields.io/github/license/modelflare-ai/AnyModelBot?logo=opensourceinitiative&logoColor=d7ff00&style=flat-square&labelColor=161a00&color=d7ff00
[ci-shield]: https://img.shields.io/github/actions/workflow/status/modelflare-ai/AnyModelBot/ci.yml?branch=master&label=CI&logo=githubactions&logoColor=d7ff00&style=flat-square&labelColor=161a00&color=d7ff00
[platform-shield]: https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Docker-d7ff00?style=flat-square&labelColor=161a00
[pricing-shield]: https://img.shields.io/badge/pricing-pay--as--you--go-d7ff00?style=flat-square&labelColor=161a00
[modelflare-shield]: https://img.shields.io/badge/Modelflare-modelflare.dev-d7ff00?style=flat-square&labelColor=161a00
[x-shield]: https://img.shields.io/badge/X-@modelflare__dev-d7ff00?style=flat-square&labelColor=161a00&logo=x&logoColor=d7ff00
[win-badge]: https://img.shields.io/badge/Windows-161a00?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2Q3ZmYwMCI+PHJlY3QgeD0iMiIgeT0iMyIgd2lkdGg9IjkuNSIgaGVpZ2h0PSI4LjUiLz48cmVjdCB4PSIxMi41IiB5PSIzIiB3aWR0aD0iOS41IiBoZWlnaHQ9IjguNSIvPjxyZWN0IHg9IjIiIHk9IjEyLjUiIHdpZHRoPSI5LjUiIGhlaWdodD0iOC41Ii8+PHJlY3QgeD0iMTIuNSIgeT0iMTIuNSIgd2lkdGg9IjkuNSIgaGVpZ2h0PSI4LjUiLz48L3N2Zz4=
[mac-badge]: https://img.shields.io/badge/macOS-161a00?style=for-the-badge&logo=apple&logoColor=d7ff00
[linux-badge]: https://img.shields.io/badge/Linux-161a00?style=for-the-badge&logo=linux&logoColor=d7ff00

[releases-link]: https://github.com/modelflare-ai/AnyModelBot/releases
[stars-link]: https://github.com/modelflare-ai/AnyModelBot/stargazers
[license-link]: https://github.com/modelflare-ai/AnyModelBot/blob/master/LICENSE
[ci-link]: https://github.com/modelflare-ai/AnyModelBot/actions/workflows/ci.yml
[pricing-link]: https://modelflare.dev/pricing?utm_source=anymodelbot&utm_campaign=amb_readme
[modelflare-link]: https://modelflare.dev/?utm_source=anymodelbot&utm_campaign=amb_readme
[x-link]: https://x.com/modelflare_dev
