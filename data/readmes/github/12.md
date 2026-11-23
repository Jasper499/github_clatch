# homeport

**一句话：让 Claude、Google、Stripe 这些网站，在你所有设备上都看到同一个“住宅 IP”。**

很多人用机场节点访问 Claude / Google，节点一会儿日本一会儿美国，IP 来回跳，再加上机场 IP 是机房 IP，很容易触发风控：注册要验证、付款失败、身份认证不过、甚至封号。

homeport 做的事情很简单：把这些“敏感网站”单独挑出来，统一走一条固定的**住宅代理**；其他网站照旧走你的机场，速度不受影响。

> 🛒 **还没有住宅 IP？** 看这篇 👉 [便宜静态住宅 IP 购买教程](https://x.com/0xjackkk/status/2117862295397335283)

---

## ⚡ 懒人一键版（推荐小白）

打开 👉 **https://0xkaka.github.io/homeport/**

1. 照着服务商后台，填上住宅代理的地址、端口、用户名、密码；
2. 选你的设备和软件，点「复制」，到软件里粘贴（iPhone 可以直接扫码加节点）；
3. 打开 `ipv4.webshare.io` 看 IP 对不对。

账号密码只在你自己浏览器里处理，不会上传。下面是详细的手动教程，一键版搞不定再看。

---

## 目录

1. [原理（看不懂可以跳过）](#1-原理看不懂可以跳过)
2. [开始前要准备什么](#2-开始前要准备什么)
3. [Clash Party（Mac / Windows）](#3-clash-partymac--windows)
4. [Clash Verge Rev（Windows / Mac）](#4-clash-verge-revwindows--mac)
5. [安卓：FlClash](#5-安卓flclash)
6. [小火箭 Shadowrocket（iPhone / iPad / Mac）](#6-小火箭-shadowrocketiphone--ipad--mac)
7. [检查是否成功](#7-检查是否成功)
8. [Claude Code、终端、Chrome 的额外设置](#8-claude-code终端chrome-的额外设置)
9. [常见问题](#9-常见问题)
10. [哪些网站会走住宅出口](#10-哪些网站会走住宅出口)
11. [给维护者：修改规则](#11-给维护者修改规则)

---

## 1. 原理（看不懂可以跳过）

```
            ┌──────────────── 敏感网站（Claude / Google / Stripe …）────────────────┐
你的设备 ──►│  跳板（你在机场里选的那个节点）──► 🏠住宅出口-勿选（住宅代理）──► 网站 │
            └───────────────────────────────────────────────────────────────────────┘
            其他网站 ──► 照常走你的机场
```

- **🏠住宅出口-勿选**：你买的住宅代理。网站最终看到的就是它的 IP。所有设备填同一个，IP 就一致了。
- **跳板**：国内直连住宅代理，握手内容是明文，容易被干扰断线；先经过一个机场节点再连过去就稳了。跳板就是**你平时在机场里选的那个节点**，你切到哪个，住宅代理就经过哪个；跳板换来换去**不影响**最终 IP。
- 另外，Claude 的 IPv6 地址走住宅代理会报错（502），这套规则直接把它拦掉，让设备自动改用 IPv4，你不用管。

---

## 2. 开始前要准备什么

### ① 一个机场订阅（你现在翻墙用的那个）

已经能正常翻墙就行。**任何机场、任何地区的节点都行**，节点叫什么名字都没关系：住宅代理会经过你在机场里选的那个节点。

### ② 一条静态住宅代理（HTTP 或 SOCKS5）

去住宅代理服务商购买，选的时候注意三点：
（不会买的话先看 👉 [便宜静态住宅 IP 购买教程](https://x.com/0xjackkk/status/2117862295397335283)）

| 要求 | 说明 |
| --- | --- |
| **静态（Static）** | IP 固定不变。别买“动态/轮换（Rotating）”的。 |
| **住宅（Residential / ISP）** | 不要买“机房（Datacenter）”的。 |
| **HTTP 或 SOCKS5，带用户名密码** | 两种都支持。后台写的是哪个就用哪个，不确定先试 HTTP，不通换 SOCKS5。 |

买好后，后台能看到这样四项信息，**抄下来**，后面每台设备都要填同样的：

| 项目 | 举例（假的，别照抄） |
| --- | --- |
| 地址 / Host（Proxy Address，不是 Assigned IP） | `p.webshare.io` |
| 端口 / Port | `80` |
| 用户名 / Username | `abcd1234-1` |
| 密码 / Password | `xyz789` |

> ⚠️ **地址怎么填：**
> - 后台只给了一个 `IP:端口`（比如 `50.2.71.50:443`）：地址就填这个 IP。
> - 后台同时有代理地址和 Assigned IP（比如 Webshare）：**填代理地址，不是 Assigned IP / 出口 IP。** 比如 Webshare 后台一行里同时有 `p.webshare.io`（代理地址）和 `9.x.x.x`（Assigned IP），要填的是 `p.webshare.io`；那个 IP 是最后网站看到的出口，用来核对结果。

> ⭐ **Webshare 用户**：后台代理列表上方的 **Connection Method** 选 **Backbone Connection**，最稳定。别选 **Rotating Proxy Endpoint**，那个 IP 如果有问题，官方会自动换，换了你要去后台手动获取重新配置才行。切好后列表里的 Proxy Address 就是 `p.webshare.io`，用户名带 `-1` 这类后缀，照着填就行。

> 💡 有的服务商给的是一整串，比如 `p.webshare.io:80:abcd1234-1:xyz789`，按冒号拆开就是 地址:端口:用户名:密码。还有一种是 `用户名:密码@地址:端口`。拆开后分别填到一键配置页的四个格子里。

> 💡 **用 SOCKS5 的**：Mac / Windows / 安卓配置里把 `type: http`（或 `type: "http"`）改成 `socks5`；小火箭节点类型选 **Socks5**。一键页上直接选 SOCKS5 就行。

### ③ 对应的客户端

| 设备 | 客户端 | 怎么装 |
| --- | --- | --- |
| Mac | Clash Party 或 Clash Verge Rev；M 芯片 Mac 也可以用小火箭 | Clash 类去官方 GitHub Releases 下载 `.dmg`；小火箭在美区 App Store |
| Windows | Clash Verge Rev（推荐）或 Clash Party | 去官方 GitHub Releases 下载 `.exe` 安装包 |
| 安卓 | FlClash（版本 ≥ 0.8.85） | 去官方 GitHub Releases 下载 `.apk` |
| iPhone / iPad | Shadowrocket（小火箭） | 美区 App Store 购买 |

先确认客户端里**机场订阅已经导入、能正常翻墙**，再继续下面的步骤。

> 💡 **用 v2rayN 的**：v2rayN 的分流只能选「代理 / 直连 / 拦截」，做不到“Claude 单独走住宅、住宅再经机场跳板”。请改用 Clash Verge Rev，见 [第 4 节](#4-clash-verge-revwindows--mac) 末尾。

---

## 3. Clash Party（Mac / Windows）

> Mac 版和 Windows 版界面一样。最省事的是用[一键配置页](https://0xkaka.github.io/homeport/)，软件选「Clash Party」，复制生成好的脚本直接粘贴，跳过第 1 步。

Clash Party 用 **JavaScript 覆写**，和 Clash Verge Rev、FlClash 是同一份脚本。

### 第 1 步：准备脚本（用一键页可跳过）

1. 打开 [`flclash/homeport.js`](flclash/homeport.js)，复制全部内容。
2. 把 `const main = (config) => {` 改成 `function main(config, profileName) {`，最后一行 `};` 改成 `}`。
3. 按 [安卓第 2 步](#第-2-步填住宅代理) 把 `HOME` 里的四项改成你自己的住宅代理。

### 第 2 步：新建覆写

1. 打开 Clash Party，点左侧菜单 **「覆写」**。
2. 点右上角 **＋** → **新建 JavaScript**。
3. 把编辑框里原有内容**全部删掉**，粘贴脚本，保存。

### 第 3 步：启用并重启

1. 左侧点 **「订阅管理」**，在你的机场订阅卡片上点 **⋯ → 编辑信息**，找到 **覆写** 一栏，勾选刚才那份覆写，保存。（这一步最容易漏，不勾等于没装。）
2. 左侧点 **「内核设置」**，点那个 **旋转箭头（重启内核）** 按钮。
3. 确认首页的代理模式是 **规则（Rule）**，不是「全局」或「直连」。
4. **系统代理** 保持打开（浏览器靠它走代理）。想让 Claude 桌面版、Claude Code 这类不认系统代理的软件也走，再打开 **虚拟网卡（TUN）**，第一次会要求授权。

> 🪜 **跳板 = 你在机场里选的节点**：平时怎么选节点照旧，选哪个，住宅代理就经过哪个。只是别选 `🏠住宅出口-勿选`。

---

## 4. Clash Verge Rev（Windows / Mac）

> 最省事：打开[一键配置页](https://0xkaka.github.io/homeport/)，选好设备，软件选「Clash Verge Rev」，复制生成好的脚本直接粘贴。

Clash Verge Rev 用「扩展脚本」，内容和安卓 FlClash 的脚本几乎一样，只是开头那行要写成 `function main(config, profileName) {`。

1. 打开 Clash Verge Rev → 左侧 **「订阅」**，确认机场订阅已导入，并且现在能正常翻墙。
2. 在机场订阅卡片上 **右键 → 「扩展脚本」**（没有这个菜单的话，用订阅页里的「全局扩展脚本」卡片 → 右键 → 编辑文件）。
3. 把编辑框里原有内容**全部删掉**（Ctrl+A / ⌘A 全选），粘贴脚本：
   - 用一键页：直接粘贴生成好的；
   - 手动：复制 [`flclash/homeport.js`](flclash/homeport.js) 的全部内容，把 `const main = (config) => {` 改成 `function main(config, profileName) {`，最后一行 `};` 改成 `}`，再按 [安卓第 2 步](#第-2-步填住宅代理) 填好 `HOME` 里的四项。
4. **保存**。回到「订阅」页，在机场订阅卡片上**点一下**（重新选中一次），让配置重新加载。
5. 左侧 **「代理」**，顶部模式选 **规则**。
6. 左侧 **「设置」** → 打开 **系统代理**。想让 Claude 桌面版、Claude Code 也走，再打开 **虚拟网卡模式（TUN）**，第一次会提示安装服务，点安装（Windows 需要管理员权限）。

> ⚠️ Clash Verge Rev 的默认端口是 **7897**（不是 7890），下文检查和终端设置里的 `7890` 都换成 `7897`（以「设置 → 端口设置」里显示的为准）。

### 我用的是 v2rayN

v2rayN 做不到这种分流（它的路由只能选「代理 / 直连 / 拦截」），换成 Clash Verge Rev：

1. 去 GitHub 搜 `clash-verge-rev`，在 Releases 里下载 Windows 安装包（文件名带 `x64-setup.exe`），安装。
2. 把同一个机场订阅导进去：机场后台一般能直接复制「Clash 订阅」链接；或者在 v2rayN 的「订阅分组 → 订阅分组设置」里复制订阅地址。到 Clash Verge Rev 的「订阅」页粘贴 → 导入。
3. **退出 v2rayN**（两个软件同时开会抢系统代理）。
4. 按上面 1～6 步做。

> 🪜 **跳板 = 你在机场里选的节点**：平时怎么选节点照旧，选哪个，住宅代理就经过哪个。只是别选 `🏠住宅出口-勿选`。

---

## 5. 安卓：FlClash

> FlClash、Clash Party、Clash Verge Rev 用的是同一份 **JavaScript 脚本**；FlClash 直接用，另外两个要改一下开头那行（见第 3、4 节）。

### 第 1 步：导入脚本

1. 打开 FlClash，底部点 **「工具」** → **「进阶配置」** → **「脚本」**。
2. 点 **＋（添加）**，选 **通过 URL 导入**，粘贴：

   ```
   https://raw.githubusercontent.com/0xkaka/homeport/main/flclash/homeport.js
   ```

### 第 2 步：填住宅代理

1. 点开刚导入的脚本进入编辑。
2. 文件开头有这一段：

   ```js
   const HOME = {
     server: "<HOST>",
     port: 0,
     username: "<USERNAME>",
     password: "<PASSWORD>",
   };
   ```

3. 改成你自己的，例如：

   ```js
   const HOME = {
     server: "p.webshare.io",
     port: 80,
     username: "abcd1234-1",
     password: "xyz789",
   };
   ```

   ⚠️ 引号和逗号都要保留，尖括号删掉；`port` 写数字，不加引号，不能是 0。
4. 保存。**以后不要再“从 URL 重新导入”**，否则会被冲回占位符。

### 第 3 步：让脚本生效（这一步最容易漏）

1. 底部点 **「配置」**，在你的机场订阅上点右侧的 **⋮ / 配置按钮**。
2. 进入 **「覆写」** → **「脚本」** → 选中刚才那份脚本。
3. 回到 **「仪表盘」**，关掉再打开连接（或点重启）。

> 只导入脚本、没在订阅里选中，等于没装。

---

## 6. 小火箭 Shadowrocket（iPhone / iPad / Mac）

小火箭分两部分：**节点**里填账号密码，**模块**里放规则。

> 💻 **Mac 上用小火箭**（只有 M 芯片 Mac 能装）：步骤和 iPhone 一样。区别只有加节点那步——Mac 上没法扫自己屏幕上的码，用一键页的「复制节点链接」，再切到小火箭，一般会自动弹出「添加节点」；没弹就按第 2 步手动填。

> ⚠️ **顺序很重要：先装模块，再加节点。** 整个过程中，首页**选中的节点**一直保持你平时用的机场节点，**不要点选 `🏠住宅出口-勿选`**。
> `🏠住宅出口-勿选` 只给规则用；选中它会让所有流量都走住宅代理，GitHub 等网站可能打不开，模块就下载失败了。

### 第 1 步：添加模块（趁网络正常先装）

1. 底部点 **「配置」** → **「模块」**。
2. 右上角 **＋**，粘贴：

   ```
   https://raw.githubusercontent.com/0xkaka/homeport/main/shadowrocket/homeport.module
   ```

3. 点 **下载**，确认模块列表里出现 `homeport` 且开关是打开的。

### 第 2 步：添加住宅节点

1. 首页右上角点 **＋**。
2. **类型** 选 **HTTP**（你的住宅代理是 SOCKS5 的话选 **Socks5**）。
3. 按下面填：

   | 栏位 | 填什么 |
   | --- | --- |
   | 地址 | 代理地址（Proxy Address），如 `p.webshare.io`，**不是出口 IP** |
   | 端口 | 如 `80` |
   | 用户 | 如 `abcd1234-1` |
   | 密码 | 如 `xyz789` |
   | **备注** | **`🏠住宅出口-勿选`**（必须一字不差，带房子图标；名字故意写成“勿选”，提醒大家别在首页点它） |

4. 右上角 **完成**。

> 备注填错，规则就找不到这个节点，所有敏感网站都会连不上。

> 添加完如果小火箭自动选中了 `🏠住宅出口-勿选`，**马上点回你的机场节点**。

### 第 3 步：设置跳板（代理通过）

1. 在首页节点列表里找到 `🏠住宅出口-勿选`，点它右边的 **ⓘ**。
2. 找到 **「代理通过」**，选一个你机场里**稳定的节点**（哪个地区都行）。
3. 保存。

> 不设也能用，但就是手机直连住宅代理，容易断。跳板节点挂了，回来这里换一个就行。

### 第 4 步：切到“配置”模式

1. 回到首页，**全局路由** 选 **「配置」**，并确认选中的是**机场节点**（不是 🏠住宅出口-勿选）。
   - 选「代理」= 所有流量走当前选中节点，规则不生效。
   - 选「直连」= 全部不翻墙。
2. 首页顶部开关打开，连接。

> 模块优先级比订阅配置高，以后更新机场订阅不会把规则冲掉；小火箭的模块也可以放心点更新，因为账号密码在节点里，不在模块里。

---

## 7. 检查是否成功

**目标：所有设备看到的 IP 一模一样，而且就是你住宅代理的 IP。**

### 手机 / 平板

打开浏览器访问：

```
https://ipv4.webshare.io/
```

页面上只有一行 IP。和住宅代理后台显示的 IP 对一下。

### 电脑

先用浏览器打开 `https://ipv4.webshare.io/` 看一眼（用 Chrome 的先按 [第 8 节](#8-claude-code终端chrome-的额外设置) 关掉 QUIC）。再用终端确认：

**Mac（Clash Party / Clash Verge Rev）**：打开「终端」，粘贴回车：

```bash
curl -x http://127.0.0.1:7890 https://ipv4.webshare.io/
```

**Windows**：打开 PowerShell，粘贴回车（注意是 `curl.exe`，PowerShell 里直接写 `curl` 会报错）：

```powershell
curl.exe -x http://127.0.0.1:7897 https://ipv4.webshare.io/
```

**Mac 上用小火箭**：小火箭是 VPN 模式，终端一般也会走，直接运行 `curl https://ipv4.webshare.io/`。

输出的 IP 应该和手机上一样。

> 端口：Clash Party 默认 `7890`，Clash Verge Rev 默认 `7897`。改过的话，到软件设置里看“混合端口（Mixed Port）”是多少，替换掉。

### 不一样怎么办？

看 [9. 常见问题](#9-常见问题)。

---

## 8. Claude Code、终端、Chrome 的额外设置

### Chrome：关闭 QUIC

Chrome 会用 QUIC（基于 UDP）偷偷绕过代理，导致 IP 不一致。Mac 和 Windows 上的 Chrome 都要关。

1. 地址栏输入 `chrome://flags/#enable-quic`，回车。
2. 把 **Experimental QUIC protocol** 改成 **Disabled**。
3. 点右下角 **Relaunch** 重启 Chrome。

### 终端 / Claude Code：手动指定代理

终端里的程序（包括 Claude Code、git、npm）**不会自动走系统代理**。最简单的办法是在代理软件里打开 **TUN / 虚拟网卡**，所有程序都会走；不想开 TUN，就按下面设环境变量。

**Mac：**

1. 终端里运行 `open ~/.zshrc`（没有这个文件就先运行 `touch ~/.zshrc`）。
2. 在文件末尾加上这三行，保存：

   ```zsh
   export http_proxy=http://127.0.0.1:7890
   export https_proxy=http://127.0.0.1:7890
   export all_proxy=socks5://127.0.0.1:7890
   ```

3. 关掉终端重新打开（或运行 `source ~/.zshrc`）。
4. 验证：运行 `curl https://ipv4.webshare.io/`，应显示住宅 IP。

**Windows（PowerShell）**：Clash Verge Rev 端口 7897，Clash Party 为 7890。当前窗口临时生效：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"
```

长期生效：运行 `setx HTTP_PROXY http://127.0.0.1:7897` 和 `setx HTTPS_PROXY http://127.0.0.1:7897`，然后重开终端。验证用 `curl.exe https://ipv4.webshare.io/`。

---

## 9. 常见问题

**Q：Claude / Google 全打不开了。**
A：基本是住宅代理没填对。逐项检查：
- 地址、端口、用户名、密码有没有抄错，尖括号删了没；
- `port` 是不是还是 0；
- 小火箭的节点备注是不是正好 `🏠住宅出口-勿选`；
- 住宅代理有没有到期 / 流量用完（去服务商后台看）。

**Q：Clash Party / Clash Verge Rev / FlClash 报错，配置加载失败。**
A：
- 手动改脚本时把引号、逗号弄丢了。最稳的办法：回[一键配置页](https://0xkaka.github.io/homeport/)重新生成一份，整份覆盖粘贴。
- Clash Party / Clash Verge Rev 忘了把开头改成 `function main(config, profileName) {`（一键页生成的已经改好）。

**Q：跳板是哪个节点？对名字、地区有要求吗？**
A：跳板就是你在机场里选的那个节点（脚本会自动找到机场的主选择组，比如「🚀 节点选择」）。你切到哪个，住宅代理就经过哪个。没有地区要求，香港、日本、美国、欧洲都行；网站最终看到的永远是住宅 IP。
- 主选择组里**别选 `🏠住宅出口-勿选`**，也别选「DIRECT / 直连」（那样住宅代理会变成国内直连，容易断）。
- 少数订阅找不到主选择组，脚本会自动建一个隐藏的 `HP_Relay`，从机场全部节点里测速选最快的。

**Q：页面能打开，但时不时断线 / 很慢。**
A：多半是跳板节点质量差。
- 电脑 / 安卓：在机场里换一个更稳的节点就行，住宅代理会跟着换跳板。
- 小火箭：回到 `🏠住宅出口-勿选` 的 ⓘ →「代理通过」换一个节点。

**Q：所有跳板都挂了，想先凑合用。**
A：
- Clash Party / Clash Verge Rev / 安卓：脚本里把 `const FORCE_RELAY = "";` 改成 `const FORCE_RELAY = "DIRECT";`。
- 小火箭：「代理通过」改成不选。

代价是直连住宅代理，可能会被干扰断线。

**Q：手机和电脑的 IP 不一样。**
A：
- 每台设备填的是不是同一条住宅代理；
- 小火箭全局路由是不是「配置」，Clash 是不是「规则」模式；
- 电脑上 Chrome 的 QUIC 关了没；
- 电脑上的 Clash 系统代理开了没。

**Q：规则更新了，我要怎么更新？**
A：
- 小火箭：「配置」→「模块」→ 左滑 homeport → 更新。账号在节点里，不受影响。
- 其他：最省事是回[一键配置页](https://0xkaka.github.io/homeport/)重新生成一份，覆盖粘贴。手动改的话先把四个值记好，更新（或重新导入）后再填一遍。

---

## 10. 哪些网站会走住宅出口

| 类别 | 域名 / 规则 |
| --- | --- |
| Claude / Anthropic | `claude.ai` `claude.com` `clau.de` `anthropic.com` `claudeusercontent.com` `claudemcpcontent.com` `modelcontextprotocol.io`，含关键词 `anthropic` `claude`，以及 Anthropic 的 IP 段和 ASN |
| 监控 / 风控 | `sentry.io` `datadoghq.com`（含 `browser-intake`）`growthbook.io` `usefathom.com` `segment.io` `siftscience.com` `intercom.io` `intercomcdn.com` |
| 人机验证 | `hcaptcha.com` `challenges.cloudflare.com` `recaptcha.net` |
| 支付 / 身份认证 | `stripe.com` `stripe.network` `stripecdn.com` `withpersona.com` |
| Google | `google.com` `googleapis.com` `gstatic.com` `googleusercontent.com` `gmail.com` |
| 安卓 App（仅 FlClash） | Claude App、Google Play、Google Wallet |
| IP 检测 | `webshare.io` `ipinfo.io` |
| 拦截 | Anthropic IPv6 `2607:6bc0::/48` `2607:6bc0:11::/48` |

不在表里的网站，照常走你的机场。

---

## 11. 给维护者：修改规则

两份文件要**同步修改**（Clash Party / Clash Verge Rev / FlClash 共用第一份；一键页的规则在 `index.html` 的 `GROUPS` 里，也要一起改）：

| 文件 | 改哪里 |
| --- | --- |
| `flclash/homeport.js` | `SUFFIX` 数组里加 `"example.com",` |
| `shadowrocket/homeport.module` | `[Rule]` 下面加一行 `DOMAIN-SUFFIX,example.com,🏠住宅出口-勿选` |

改完运行自检（会用几种订阅样例实际跑脚本，检查跳板选得对不对、两份规则是否一致）：

```bash
python3 scripts/check.py
```

推送到 GitHub 后，Actions 也会自动跑一遍。
