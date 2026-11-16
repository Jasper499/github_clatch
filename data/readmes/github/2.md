<div align="center">
  <br>
  <a href="https://github.com/Kianuni/Erosion-CN/releases/latest"><img src="./PreviewIcon.png" alt="App Icon" width="150"></a>
  <br>
  <h1>Erosion-CN</h1>
  <p>基于 <a href="https://github.com/forcequitOS/worse_query">worse_query</a> 的 iOS / iPadOS 系统配置与 MobileGestalt 研究工具箱（中英双语 · 防白苹果安全加固版）</p>
  <p>支持 iOS / iPadOS 27.0 – 27.2 / 27.3 beta 1（完整支持）以及 iOS / iPadOS 26.x（部分支持）。</p>
  <p><strong>简体中文</strong> · <a href="./README_EN.md">English Documentation</a> · <a href="https://github.com/Kianuni/AppleFlow">AppleFlow 配套分流与排雷台</a></p>
  <p>
    <a href="https://github.com/Kianuni/Erosion-CN/releases/latest"><img alt="GitHub Releases" src="https://img.shields.io/github/v/release/Kianuni/Erosion-CN?style=flat-square&color=CF7D46&label=%E6%9C%80%E6%96%B0%E7%89%88%E6%9C%AC"></a>
    <a href="https://github.com/Kianuni/Erosion-CN/releases"><img alt="IPA Downloads" src="https://img.shields.io/github/downloads/Kianuni/Erosion-CN/total?style=flat-square&color=10B981&label=IPA%20%E4%B8%8B%E8%BD%BD%E9%87%8F"></a>
    <a href="https://github.com/Kianuni/Erosion-CN/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/Kianuni/Erosion-CN?style=flat-square&color=F59E0B&label=Stars"></a>
    <a href="https://altdirect.app/?url=https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json"><img alt="Official AltSource" src="https://img.shields.io/badge/%E5%AE%98%E6%96%B9%E6%BA%90-SideStore%20%2F%20AltStore-0EA5E9?style=flat-square"></a>
    <a href="https://github.com/bebound/AltGallery"><img alt="AltGallery" src="https://img.shields.io/badge/AltGallery-%E5%B7%B2%E6%94%B6%E5%BD%95-7C3AED?style=flat-square"></a>
    <a href="https://github.com/jailbreakdotparty/Erosion"><img alt="Upstream Repo" src="https://img.shields.io/badge/%E4%B8%8A%E6%B8%B8%E4%BB%93%E5%BA%93-jailbreakdotparty%2FErosion-3868DB?style=flat-square"></a>
    <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-GPLv3-blue?style=flat-square"></a>
  </p>
  <p>
    <a href="https://trendshift.io/repositories/347713" target="_blank"><img src="https://trendshift.io/api/badge/trendshift/repositories/347713/daily?language=Swift" alt="Kianuni/Erosion-CN | #2 Swift Repository Of The Day" width="250" height="55"></a>&nbsp;&nbsp;<a href="https://trendshift.io/repositories/347713" target="_blank"><img src="https://trendshift.io/api/badge/trendshift/repositories/347713/daily" alt="Kianuni/Erosion-CN | #18 Repository Of The Day" width="250" height="55"></a>
  </p>
</div>

---

## 项目简介

**Erosion-CN** 衍生自上游 **[jailbreakdotparty/Erosion](https://github.com/jailbreakdotparty/Erosion)**，提供中英双语界面，修复了原版多项真机 Bug，并做了防白苹果安全加固：

- **修改重启不反弹**：原位覆盖写入（`pwrite` + `F_FULLFSYNC`），保留系统文件 Inode 与属主，不注入 iOS 27 非缓存键。
- **防相机黑屏**：Plist 编辑器精确保留布尔值与浮点类型，未修改项原样直通。
- **写入安全**：应用前逐项预览变更，写后全量读回校验，不一致自动回滚。
- **零硬编码偏移**：运行时解析本机 `libMobileGestalt.dylib`，动态计算 `CacheData` 槽位（`green-tea`、`wapi` 等），校验不通过即锁定写入。
- **原厂双备份 + 一键恢复**：沙盒与系统金库双重 `SHA-256` 备份，卸载重装不丢，可一键还原原机出厂参数。
- **国行 Apple 智能解锁**：完整美版 `LL + LL/A` / 仅改 `LL` 双模式，四要素体检与一键配齐修复，真机生效核验探针，`SiriHub`、`Audio Intelligence` 等坑位自动防呆。
- **国行底层限制解除**：FaceTime 音频、境外 eSIM、「无线局域网」显示为「Wi-Fi」。
- **实用工具**：应用存档备份、缓存清理、跨容器文件浏览、语音备忘录无损导出、电池与崩溃诊断，以及 Surge / Stash 分流规则一键导出。

> 📜 完整的技术改进说明与版本历史见 [CHANGELOG.md](./CHANGELOG.md)，各版本发布说明见 [Releases](https://github.com/Kianuni/Erosion-CN/releases)。  
> 📖 外部独立底层架构解析：[《从 worse_query 逃逸到 MobileGestalt 运行时重构：深入 Erosion-CN 的防白苹果原位写入、双重金库与国行底层解锁架构》](https://lijianfei.com/post/erosion-cn-ios-system-configuration-mobilegestalt-architecture/)

---

## 系统兼容性

> [!IMPORTANT]
> 操作前请务必通过电脑完整备份设备重要数据！修改系统底层配置存在潜在风险，仅供安全研究与学习交流，请仅在本人持有的设备上使用并自行承担风险。

- **iOS / iPadOS 27.0 – 27.2.1**、**27.3 beta 1**（完整支持所有功能，包括 `MobileGestalt` 读取与安全写入）
  - ⚠️ **`27.3 beta 1` 国行生成式功能限制**：写入与绝大多数功能正常，但国行（`CH/A`）硬件上**照片「高质量消除 / 扩图 / 重构」、相机 `SIRI` 等生成式云端功能会被系统本地拦截**（日志：`Eligibility returned no CN region policy on a CH region code device`），改 `MobileGestalt` 无法绕过，详见 FAQ Q6「情况 C」。需要这些功能请留在 / 降回 `27.2.x`。
- **iOS / iPadOS 26.0 – 26.7.2**（部分支持：可使用锁屏壁纸、拨号键盘美化、锁屏底部签名文字与部分容器浏览；受底层沙盒限制，iOS 26 不支持写入系统 `MobileGestalt`）

---

## 安装与签名要求

> [!WARNING]
> 本项目底层依赖至少一个有效的 `App Group` 容器权限。请使用支持保留或注入 App Group 的个人 Apple ID 自签工具（如 **SideStore / AltStore / Feather / Sideloadly / Impactor / iLoader**）或带 App Group 权限的开发者证书签名安装。

### 方式一：订阅官方自动更新源（推荐 · 支持一键升级）

在 iPhone / iPad 浏览器中点击下方按钮即可一键添加官方软件源（每次新 Release 发布自动同步，内含 `App Group` 权限声明与 `SHA-256` 校验）：

<p>
  <a href="https://altdirect.app/?url=https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json&r=sidestore"><img alt="Add to SideStore" src="https://img.shields.io/badge/%E4%B8%80%E9%94%AE%E6%B7%BB%E5%8A%A0%E8%87%B3-SideStore-7C3AED?style=for-the-badge"></a>
  <a href="https://altdirect.app/?url=https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json&r=altstore"><img alt="Add to AltStore" src="https://img.shields.io/badge/%E4%B8%80%E9%94%AE%E6%B7%BB%E5%8A%A0%E8%87%B3-AltStore-0284C7?style=for-the-badge"></a>
  <a href="https://altdirect.app/?url=https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json&r=feather"><img alt="Add to Feather" src="https://img.shields.io/badge/%E4%B8%80%E9%94%AE%E6%B7%BB%E5%8A%A0%E8%87%B3-Feather-EC4899?style=for-the-badge"></a>
  <a href="https://altdirect.app/?url=https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json"><img alt="More Clients" src="https://img.shields.io/badge/%E6%9B%B4%E5%A4%9A%E7%AD%BE%E5%90%8D%E5%B7%A5%E5%85%B7-LiveContainer%20%2F%20%E5%A4%8D%E5%88%B6-475569?style=for-the-badge"></a>
</p>

手动添加官方源地址（兼容 SideStore / AltStore / Feather / LiveContainer / ESign）：
```text
https://raw.githubusercontent.com/Kianuni/Erosion-CN/main/apps.json
```

### 方式二：手动下载 IPA 签名安装

1. 前往 [Releases 页面](https://github.com/Kianuni/Erosion-CN/releases/latest) 下载最新的 `Erosion_v0.9.1_Bilingual.ipa`。
2. 使用上述签名工具安装至设备；首次运行可在「主页」日志确认已成功识别 `App Group`。
3. 详细使用说明与原厂状态恢复教程请查阅：
   - 📘 [USAGE_GUIDE.md（安装与使用指南）](./USAGE_GUIDE.md)
   - 🔄 [RESTORE_CHA.md（无损恢复出厂状态指南）](./RESTORE_CHA.md)

---

## 常见问题与排障指南 (FAQ / Q&A)

### Q1：为什么打开了开关，eSIM 还是没生效？或者国行 18 Pro / 18 Pro Max 改完后「添加 eSIM」反而消失了？
请按以下 6 种情况逐一排查：
1. **国行 iPhone 18 Pro / 18 Pro Max（`A3715` / `A3718`）插着双实体卡（或背面副卡）触发基带卡槽冲突（18 系列最常见！）**  
   国行 18 Pro / Pro Max 为特殊的**「正反双实体 SIM 卡槽 + 内置 eSIM」三通道复用硬件**，而美版 `LL/A`（`A3472` / `A3473`）为无卡槽纯 eSIM 机型（国际版也仅正面单卡槽）。若卡托内插着两张实体卡（或插在卡托背面副卡槽）重启，基带检测到卡槽占用冲突会临时隐藏「添加 eSIM」与 `EID`（或导致背面副卡不工作）。  
   ✅ **真机实测 100% 解决与双实体卡共存步骤（「空卡写卡法」）**：
   - ① **先拔出 SIM 卡托（不插任何实体卡，保持空卡状态）**，在 Erosion-CN 开启「解除地区限制」+「解除国行底层限制」点击应用后 **空卡关机冷重启**（注：若在 `27.3 beta 1` 空卡下仍隐藏入口，可先关闭上方地区限制、**仅单开「解除国行底层限制」空卡重启**，「添加 eSIM」必出）；
   - ② 空卡开机连 Wi-Fi（挂外区节点 + 开启飞行模式），扫码把需要的海外 eSIM 全部添加完毕；
   - ③ **插回实体卡策略**：若平时只需 **1 张实体卡 + 多张海外/国内 eSIM**，将实体卡装在卡托**正面（主卡槽）**即可直接共存；若平时还需使用**卡托背面第 2 张实体卡**，写完海外 eSIM 后进 Erosion-CN **单独关闭「解除国行底层限制」（保留上方「解除地区限制」开启，且自 `v0.8.1` 起还可在下方修改模式切换为「仅改区域代码 LL（保留 CH/A 后缀与双卡兼容）」以保留原厂 `CH/A` 与监管型号）**，应用重启后再插回正反双实体卡——背面实体卡即可恢复工作，且已写入芯片的海外 eSIM 依然完整保留、可随时在设置中切换启用！
2. **只点了「注销 (Respring)」，没有「手动关机重启」**  
   「解除国行底层限制」修改的是二进制 `CacheData`（`green-tea` 槽位）。负责蜂窝基带与 eUICC 芯片的守护进程（`CommCenter`、`ctkd`）在注销桌面时**不会重载缓存**，甚至会因新旧区域参数半同步导致「添加 eSIM」入口临时隐藏。**写入后必须手动滑动关机、等待黑屏后再按电源键开机（冷重启）** 才会生效。
3. **只改了 `LL/A`，漏开了「解除国行底层限制 (eSIM / FaceTime 音频)」**  
   常规解锁必须将 **「解除地区限制（国行 AI / 美版 LL/A）」** 与下方的 **「解除国行底层限制 (eSIM / FaceTime 音频)」** **两个开关同时打开**并冷重启；若只改了上方的 `LL/A` 而未解开下方的 `green-tea` 硬件锁，系统校验区域冲突同样会屏蔽 eSIM 菜单。
4. **误开了「机型伪装 (`ProductType`)」或曾用其他改机工具盲改过缓存**  
   原生 AI 机型**严禁修改机型标识符**（如把国行主板 `iPhone19,7` 强改成美版 `iPhone19,3`），否则基带校验失配会导致整个 eSIM 菜单消失。若之前被其他工具改坏，请点击 `MobileGestalt` 右上角 **`⋯` →「清除并重建缓存」** 并重启恢复纯净原厂基线，再重新按需开启开关。
5. **在中国大陆境内扫码添加海外 eSIM 时提示“不支持 / 无法激活”**  
   若「添加 eSIM」按钮已出现，但扫码瞬间被拦截，是系统激活时通过境内基站/定位触发了位置校验。扫码写卡时请开启 **飞行模式 + 连接 Wi-Fi（挂全局海外代理）**（必要时临时关闭 `设置 → 隐私与安全性 → 定位服务 → 系统服务` 中的「蜂窝网络搜索 / 无线局域网与蓝牙」），写卡成功后再恢复正常即可长期双待使用。
6. **老款纯双实体卡槽国行机型的物理硬件限制**  
   仅自带物理 `eUICC` 安全芯片的国行机型（如 **国行 iPhone Air、内置物理 eSIM 的 iPhone 18 系列** 等）支持解锁海外 eSIM 自由扫码；早期**纯双实体 nano-SIM 卡槽且主板物理空焊 `eUICC` 芯片**的常规国行机型属于硬件缺失，开启该开关仅用于解锁 **FaceTime 音频（语音通话）** 与 AI 区域准入，无法凭空生成物理 eSIM 芯片。

### Q2：需要开启「监管模式 (Supervision)」吗？以前别的工具留下的伪监管怎么清理？
* **完全不需要，且严禁在个人零售设备上开启伪监管！** Erosion-CN 的所有解锁均直接安全作用于 `MobileGestalt` 缓存，零监管依赖。
* 许多早期改机工具注入的伪造 `CloudConfigurationDetails.plist` 缺失合法的 MDM 证书链，一旦后续 OTA 升级系统，极易在开机激活向导卡死 **403「远程管理」白屏死锁**。你可随时进入本应用 `功能修改 → 系统配置与监管` 一键体检并安全清除伪监管残留（真实企业/教育 MDM 会被自动识别保护）。

### Q3：满血使用 Apple Intelligence + ChatGPT（同时保留国行普通话「询问来电原因」）怎么设地区和代理规则？
* **系统语言与地区黄金组合**（⚠️ **切勿将系统地区设为「美国」**，否则会丢失中文普通话「询问来电原因」来电筛选！）：
  1. 在 Erosion-CN 开启 **「解除地区限制 (LL / LL/A)」+「解除国行底层限制」** 并冷重启；
  2. `设置 → 通用 → 语言与地区`：**地区改为「台湾」**，首选语言第一项保持 **「简体中文」**；
  3. `设置 → Apple 智能与 Siri`：Siri 语言设为 **「中文（普通话 - 中国大陆）」**（若 ChatGPT 扩展偶发回复繁体，在 `扩展 → ChatGPT` 登录并在自定义指令写一句“始终使用简体中文回答”即可）；
  4. `设置 → [你的名字] → 媒体与购买项目`：**App Store 登录外区账户**（iCloud 主账户可保留国区），否则 Apple 智能菜单可能不出现或无法激活。
* **代理分流规则（Surge / Stash / Loon / Shadowrocket 通用铁律）**：
  1. **Siri 核心域名必须 `DIRECT` 直连 + 真实 IP（严禁走代理或 Fake-IP）**：将 `guzzoni.apple.com`、`*.siri.apple.com`、`dejavu.apple.com`、`sequoia.apple.com`、`*.smoot.apple.com` 设为 `DIRECT`，并在 Surge `[General]` 中把 `guzzoni.apple.com, *.guzzoni.apple.com, *.siri.apple.com` 加入 `skip-proxy` 与 `always-real-ip`（否则 Siri 必报「碰到了一点问题」）；
  2. **仅将 AI 准入、盲签名签发与隐私计算中继走低并发干净美区节点**：将 `gspe1-ssl.ls.apple.com`、`*.issuer.apple.com`、`ropes.apple.com`、`mask-api.icloud.com`、`mask.icloud.com`、`mask-h2.icloud.com`、`*.app.apple.com`、`apple-relay.apple.com`、`apple-relay.cloudflare.com`、`apple-relay.fastly-edge.com`、`apple-relay.akamaized.net`、`cp4.cloudflare.com` 及 OpenAI / Google 域名分流至支持 UDP/QUIC 的低延迟**美国节点**（切勿屏蔽 UDP 443 QUIC 流量）；
  3. **关闭冲突解密模块**：改好 `LL/A` 后，请关闭针对 `gspe1-ssl.ls.apple.com`（定位）与 `*.smoot.apple.com`（Siri 搜索）的 MitM 解密重写模块，避免强证书固定校验断连；
  4. 💡 **推荐配套分流项目 [AppleFlow](https://github.com/Kianuni/AppleFlow)**：提供 Surge / Loon / Shadowrocket / Stash / Mihomo / Quantumult X / Sing-box 全客户端零 MitM 模块与规则集，并可在 **[AppleFlow 在线工作台](https://kianuni.github.io/AppleFlow/)** 一键本地脱敏体检现有配置冲突、实测分流出口区域（也可直接在 App 内打开 `功能修改 → [测试特性] 共享组分流规则与书签导出` 离线导出 `.sgmodule`）。

### Q4：Siri 聊天已经正常了，为什么「跑马灯视觉智能 (Visual Intelligence)」、「相机内嵌 SIRI 档位」或图乐园提示不可用？
首先注意 iOS 27 中两套视觉入口的底层架构完全不同：
* **一、机身按键唤起的「跑马灯视觉智能」（日常推荐，支持中文与国区主 iCloud）**：
  1. **系统地区不能停留在「中国大陆」**：前往 `设置 → 通用 → 语言与地区`，将 **「地区」改为「台湾」**（海外版视觉智能绑定 ChatGPT 与 Google 识图，在「中国大陆」地区下会被直接锁死；改「台湾」既能解锁视觉智能，又能保留普通话来电询问）。
  2. **定位准入与 Google / Relay 分流**：每次唤起都会实时请求 `gspe1-ssl.ls.apple.com` 校验所在地，并调用 `apple-relay.*` + OpenAI（左下角提问）以及 **`*.google.com`（右下角 Google 识图）**。请确认上述域名均已分流至**美国节点**，且未对定位或 Siri 搜索域名开启 MitM 解密。
  3. **端侧模型下载与唤醒方式**：连接 Wi-Fi 充电静置等待端侧视觉模型下载完成（若曾开过国行千问缓存，先关总开关重启后再开）；锁屏或亮屏时**长按**右侧「相机控制」按键（或在控制中心添加「视觉智能」按钮）唤起。
* **二、iOS 27 系统「相机」App 底部轮盘内嵌的 `SIRI` 档位**：
  - 该档位属于新一代对话式 Siri AI (Beta) 的实时多模态会话，**不走 OpenAI/Google，而是强制调用 Apple `GenerativeModels` + `Private Cloud Compute (PCC)`**：
    1. 需主 iCloud 登录**美区 Apple Account** 通过 `Try Siri AI` 候补审核，且在当前 Beta 阶段将系统与 Siri 语言设为 **美式英语 (`en-US`)** 并在 Wi-Fi 下下载完 `INTELLIGENCEFLOW` 模型资产；
    2. 若轮盘已出现 `SIRI` 但切过去 **0 秒瞬间弹窗报错**，请升级至 **`v0.9.1+`** 点击顶部 **「一键配齐 / 修复」** 还原原生 AI 机型的 `Personal Translator (#266) = true` 槽位基线，并确保 PCC 流量走干净美区节点或开启 iCloud 专用代理（Private Relay）。

### Q5：为什么解锁国行限制或开启「将“无线局域网”显示为“Wi-Fi”」后，单应用「不允许联网」不见了？
在 iOS 26/27 中，国行独有的单应用三态联网菜单（`关闭 / 无线局域网 / 无线局域网与蜂窝数据`）同时受底层 `green-tea`（国行硬件门控）与 `wapi`（无线局域网命名与 WAPI 开关）共同控制——因此无论是开启「解除国行底层限制」（解锁 Apple 智能与 FaceTime 音频必需）还是开启「将“无线局域网”显示为“Wi-Fi”」，系统网络权限都会切换为国际版逻辑（仅允许单独关闭单个 App 的「蜂窝数据」，不再提供禁止单应用使用 Wi-Fi 的入口）。如需恢复国行「不允许联网」菜单，关闭对应开关重新应用并重启即可恢复。

### Q6：为什么照片「快速消除」正常，但「高质量消除 / 扩图延伸 / 重构」报错？另外要不要升新测试版？
可根据**报错弹出的速度** 1 秒区分是本地槽位问题还是网络限流问题：
* **情况 A — 点下去「0 秒瞬间报错」（连加载转圈都没有）**：
  - **原因**：原生支持 Apple 智能的 iPhone（`iPhone 15 Pro` 至 `iPhone 18 Pro Max`）原厂 `CacheData` 要求 `Personal Translator`（槽位 `#266`）为 `true`、`Audio Intelligence`（槽位 `#178`）为 `false`。若此前使用 `v0.8.3 – v0.8.5` 误将 `#266` 写成 `false`（或强开了非原生 `#178`），系统 `GenerativeModels / ModelCatalog` 会在本地预检阶段 **0 毫秒直接熔断报错**。
  - **解决**：升级至 **`v0.9.1+`**，进入 `MobileGestalt` 点击顶部体检卡片亮起的 **「一键配齐 / 修复」→「应用」→ 手动关机冷重启** 即可自愈恢复。
* **情况 B — 提示“消除此照片时出错，请稍后再试”（`iOS 27.0 – 27.2.1` 最常见：PCC 漏分流 `Code=32033` / 节点 `QUIC-BLOCK` / `Code=1009` 限流）**：
  - **原因 1 — 通用规则集漏分流触发 `PrivateCloudComputeError Code=32033`**：市面多数通用 `AI.list` 仅包含 5 条 `apple-relay.*`，漏掉了 PCC 盲签名令牌签发与云端推理网关 **`*.issuer.apple.com`（`inference` / `waitlist`）、`ropes.apple.com`、`mask-api.icloud.com`、`mask.icloud.com`、`mask-h2.icloud.com`、`*.app.apple.com`**，导致它们掉入下方的 `Apple_All` / `GEOSITE,apple` 走了**国内直连**，泄漏大陆 IP 被苹果秒拒并在进程内存写入退避缓存。
  - **原因 2 — 美区节点未开 UDP 触发 `QUIC-BLOCK`**：PCC 的 OHTTP 通道强依赖 UDP 443 (QUIC)，若代理节点服务端防火墙未开放 UDP 端口或客户端拦截了 QUIC（请求日志出现 `↓ 0 B` / `QUIC-BLOCK`），消除请求会直接中断报错。
  - **👉 推荐一键修复（配套项目 [AppleFlow](https://github.com/Kianuni/AppleFlow)）**：
    1. 前往 **[AppleFlow 在线工作台](https://kianuni.github.io/AppleFlow/)** 一键安装覆盖上述全部 PCC 与高质量消除域名的模块 / 规则集（支持 Surge、Loon、Shadowrocket、Stash、Mihomo / OpenClash、Quantumult X、Sing-box，亦可用页面内置的「配置体检」本地离线扫描规则抢行冲突）；
    2. 确认美区节点服务端已放行 UDP 端口（无 `QUIC-BLOCK`），并在代理软件中点击一次 **「更新外部资源 (Update External Resources)」**；
    3. **将手机关机重启一次**（彻底清空 `privatecloudcomputed` 内存缓存的 `32033 / 1009` 退避状态），开机后再试一次高质量消除。
  - ⚠️ **附：若规则与 UDP 均已全通仍报 `Code=1009` 频率限流，请停止连续重试**：
    1. **本机缓存的冷却**：令牌端返回 `retry-after` 后，`privatecloudcomputed` 会缓存冷却期并在本机秒拒（日志 `Code=1009 "Rate-limited for token issuer based on retry-after header"`），**重启手机可清掉这一层**；
    2. **苹果服务器端的配额限流**：若重启后仍报 `Code=1009 "Rate limited"`（或万人共用机场节点高并发抢令牌），说明命中服务端频率配额，请停手等待数小时至约 24 小时自然恢复（期间端侧「快速」消除不受影响）。
* **情况 C — `iOS 27.3 beta` 国行设备：四要素全对、网络也正常，依然报错（转圈或瞬间均可能）**：
  - **原因**：`27.3 beta 1` 新增了国行（`CH`）设备专属的 AI 策略分支。照片 App 的本地资格检查（`GenerativeFunctionsFoundation`）只要从任一来源识别到 `CH` 硬件，就会查询「国行 AI 策略」，而苹果服务器目前尚未下发该策略，于是**在发出任何云端请求前就本地拦截**。日志特征：
    ```
    [GenerativeFunctionsFoundation:Eligibility] Eligibility returned no CN region policy on a CH region code device
    ```
    该检查读取的并非 `MobileGestalt` 缓存中的 `RegionCode`（探针显示 `LL` 也会触发），推测直读主板 `SysCfg` 非缓存信息，**改 `MobileGestalt` 无法绕过**（⚠️ 切勿尝试注入非缓存键，会触发开机缓存重置）。已有多例实锤（[#13](https://github.com/Kianuni/Erosion-CN/issues/13)、[#22](https://github.com/Kianuni/Erosion-CN/issues/22)、[#28](https://github.com/Kianuni/Erosion-CN/issues/28)）。
  - **解决**：降回 **`iOS 27.2.x`**（需苹果仍在验证该版本；`27.2.1` 无此检查，已确认高质量消除正常），降级前务必先在 Erosion 执行「一键恢复原厂」或「清除并重建缓存」并用电脑完整备份（`27.3` 的备份无法直接恢复到 `27.2.1`）；或留在 `27.3 beta` 等待苹果后续下发策略 / 调整判定。Siri 聊天、写作工具、视觉智能（跑马灯，走 OpenAI / Google）等不依赖该检查的功能不受影响。
* **如何区分三种情况**：Mac 连接 iPhone 复现一次报错后执行 `sudo log collect --device --last 5m --output ~/Desktop/pcc.logarchive`，再用 `log show ~/Desktop/pcc.logarchive --style compact --predicate 'process == "privatecloudcomputed" OR process == "modelmanagerd" OR process == "Photos"' | grep -E "1009|Rate limited|region policy|InferenceError"` 过滤：出现 `1009` 为限流（情况 B），出现 `no CN region policy` 为情况 C。
* **切勿盲目升级新测试版**：底层 `worse_query` 写入漏洞目前仅确认支持至 **`iOS 27.0 – 27.2.1` 及 `iOS 27.3 beta 1`**（若准备降级/刷机，请务必先在 Erosion 内执行「一键恢复原厂」或「清除并重建缓存」后再刷机）。请关闭系统自动更新，**切勿升级至 `27.3 beta 2` 及后续新测试版**。

### Q7：自签证书 7 天过期、卸载重装 App 会导致修改失效或丢失原厂备份吗？
* **都不会。** 所有修改均以原位覆盖方式持久化保存在系统缓存中，无需后台常驻，证书过期打不开或删除 App **完全不影响已生效的功能**。
* `v0.8.0+` 内置了**应用沙盒 + 系统安全金库 `SHA-256` 双重备份冗余**，即便因证书掉签卸载重装 App，重新打开时也会自动从系统金库无损找回你最初未修改的原厂备份。

### Q8：还有哪些特性属于纯物理硬件或非缓存 (`slot = -1`) 限制，改 `MobileGestalt` 也无法解锁？
* **纯物理硬件限制**：包括 **卫星离网通信与紧急求救**（射频/基带固件锁 + 境内无地面站授权）、**5G 毫米波 (mmWave)**（无毫米波天线模组）、**纯双实体卡槽老机型的 eSIM**（主板空焊 `eUICC` 芯片）、**三麦克风旧机型（`iPhone 15 Pro` 及更早）的空间音频录制 / 语音备忘录「录音室」档位**（物理依赖 iPhone 16 系列起的四麦克风声学阵列，`v0.8.6+` 已自动防呆锁定，仅保留纯软件的 FaceTime 空间音频）以及 **60Hz 屏幕强开 120Hz 刷新率**。
* **非缓存硬件直读键（`slot = -1`）限制 — 旗帜 Emoji 系统原生显示**：国行设备系统字体引擎（`CoreText`）检查的 `RegionalBehaviorGB18030` / `RegionalBehaviorChinaBrick` 在 `libMobileGestalt.dylib` 中均为 **`slot = -1`（非缓存键）**，运行时直接读取只读主板 `SysCfg`（`IODeviceTree:/chosen/software-behavior`）并替换为 `☒`，因此单靠修改 `MobileGestalt.plist` 无法解除系统级原生字体遮罩（⚠️ 切勿将 `slot = -1` 键强行注入 `CacheExtra`，否则会触发开机重置）。但改完 `LL/A` + 非中国大陆地区后，**自带 Emoji 键盘隐藏输入槽位（旗帜第 1 行第 6 列 / 搜索「台湾」）已解锁可打出真实编码**，且内置独立表情图集的 App（如 **X / Twitter、Discord、Telegram 自定义表情包**）可在本机直接彩色显示。

### Q9：点击应用时报 `result: -1` 写入失败，或者「关于本机」已变 `LL/A` 但 AI 菜单仍未出现怎么办？
* **点击应用提示 `worse_query` 授权失败（`result: -1`）**：
  - 说明安装时使用的签名工具（如部分电脑端一键安装器普通模式）**剥离了 `App Group` 共享容器权限**（可在主页日志看到 `Active App Group` 为空）。请改用 **SideStore / AltStore / Feather / Sideloadly / Impactor / iLoader** 等保留或自动注入 `App Group` 权限的工具重新签名安装即可。
* **「关于本机」型号末尾已变 `LL/A`，但设置里还没有海外版 Apple 智能菜单**：
  1. 打开 `MobileGestalt → 真机生效核验探针`，确认第 5 行 **`green-tea` 真机值为 `false (Bool)`**（若仍为 `true`，勾选下方「解除国行底层限制」应用后**手动滑动关机冷重启**）；
  2. 前往 `设置 → 通用 → 语言与地区`，确认 **「地区」已从「中国大陆」改为「台湾」（或「美国」）**（停留在「中国大陆」时，即便是真美版设备也会隐藏海外 AI 入口）；
  3. 连接美国代理节点（确保 `gspe1-ssl.ls.apple.com` 走美区代理），划掉「设置」后台重开（或连着代理重启一次手机）以触发 `eligibilityd` 首次准入刷新（首次激活推荐先用默认「完整美版 `LL + LL/A`」，激活成功后再按需切回「仅改区域代码 `LL`」）；
  4. **App Store（媒体与购买项目）需登录外区账户**：国行设备的 Apple 智能资格还会参考 Apple 账户的国家/地区，App Store 停留在国区账户时 AI 菜单可能不出现或无法完成激活（`设置 → [你的名字] → 媒体与购买项目` 切换为外区账户即可，iCloud 主账户可保留国区；感谢 [#20](https://github.com/Kianuni/Erosion-CN/issues/20) @Chinsin 实测反馈）。

### Q10：万一改出异常，或者之前被别的工具改出「相机黑屏 / eSIM 消失」，怎么一键救回？
* **一直使用 Erosion-CN 修改的用户**：直接点击主页或 `MobileGestalt` 页顶的 **「一键恢复原厂」**，校验 `SHA-256` 后一键还原原厂参数并清空锁屏铭牌/伪监管/拨号盘残留，手动重启即 100% 恢复出厂状态。
* **安装本工具前已被其他工具改坏缓存的用户**：点击 `MobileGestalt` 右上角 **`⋯` →「清除并重建缓存」**，随后立即**手动关机重启手机**——iOS 将在开机时直接从主板硬件熔丝重新生成 100% 纯净的原厂缓存，相机黑屏、eSIM 消失等软故障均可彻底自愈。

---

## 自行编译

在安装有 Xcode 26 / 27 的 macOS 环境中克隆本仓库并执行构建脚本即可生成未签名 `.ipa`（已自动内嵌标准 entitlements）：

```bash
git clone https://github.com/Kianuni/Erosion-CN.git
cd Erosion-CN
chmod +x ipabuild.sh
./ipabuild.sh
```

---

## 更多开源项目推荐 (Kianuni Ecosystem)

如果你喜欢 **Erosion-CN**，欢迎关注同系列其他 iOS 开源工具（全部坚持开源透明、无暗桩）：

| 项目 | 定位与核心特性 | 适用系统 / 场景 |
| :--- | :--- | :--- |
| **[AppleFlow](https://github.com/Kianuni/AppleFlow)** | 零 MitM 的 Apple 智能、PCC 隐私云计算与中文 Siri 极简分流方案，附带 **[在线配置体检与出口探针台](https://kianuni.github.io/AppleFlow/)** | Surge / Loon / Shadowrocket / Stash / Mihomo / QX / Sing-box |
| **[WQGuard](https://github.com/Kianuni/WQGuard)** | 100% 只读开源的沙盒越权检测、侧载 IPA 安全审查与固件 CVE 防护工具 | iOS / iPadOS 26.2+ – 27.x 侧载排雷与设备自检 |
| **[Camlo](https://github.com/Kianuni/Camlo)** | **Camlo · 开幕** — 免电脑一键换上滑动解锁变身、裸眼 3D 与动态锁屏壁纸，让 iPhone 锁屏活起来 | iOS / iPadOS 26 – 27 个性化锁屏美化 |
| **[Enkard](https://github.com/Kianuni/Enkard)** | 纯离线、零云同步、绑定 Apple Secure Enclave 硬件安全芯片的 iPhone 银行级加密卡包 | 个人隐私卡券 / 敏感凭据本地加密收纳 |

---

## 致谢与开源许可 (Credits & License)

本项目基于 **[GNU General Public License v3.0 (GPLv3)](./LICENSE)** 开源，谨向上游作者与社区研究者致以诚挚感谢：

- **[jailbreakdotparty / Erosion](https://github.com/jailbreakdotparty/Erosion)** & **[lunginspector](https://github.com/lunginspector)** — 上游主仓库与核心架构作者
- **[forcequitOS](https://github.com/forcequitOS)** & **[0xjohnnydev](https://github.com/0xjohnnydev)** — `worse_query` 沙盒研究作者
- **[skadz108](https://github.com/skadz108)** & **[rooootdev](https://github.com/rooootdev)** — 后端功能组件维护者
- **[neonmodder123](https://github.com/neonmodder123)** — 免越狱注销方案作者
- **[huamidev / GestaltX](https://github.com/huamidev/GestaltX)** — 借鉴并参考了本机 `libMobileGestalt.dylib` 查询描述符动态偏移解析、变更对比预览（Diff Preview）、写后磁盘读回校验、运行时重签 `App Group` 自动探测以及液态玻璃低功耗渲染键值等设计
- **[KirbySD](https://www.v2ex.com/t/1246550)** — 分享 `MobileGestalt` 二进制 `CacheData` 中 `green-tea` / `not-green-tea` 布尔槽位研究思路
- **[PoomSmart / MGKeys](https://github.com/PoomSmart/MGKeys)** — 长期维护与整理 `MobileGestalt` 混淆键值映射表
- **[kolbicz / WQFiles](https://github.com/kolbicz/WQFiles)** — 分享 LaunchServices `.csstore` (`"bdsl"`) 容器图谱解析研究思路（GPLv3）

---

## Star History

<div align="center">
  <a href="https://star-history.com/#Kianuni/Erosion-CN&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Kianuni/Erosion-CN&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Kianuni/Erosion-CN&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Kianuni/Erosion-CN&type=Date" width="680" />
    </picture>
  </a>
</div>

---

## 免责声明

本项目仅供 iOS 系统安全研究、逆向工程学习与技术交流使用。请严格遵守所在地法律法规与电信合规要求，切勿用于任何非法用途；开发者不对因使用本软件造成的任何数据丢失、功能异常或售后问题承担责任。
