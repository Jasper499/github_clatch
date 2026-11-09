<p align="center"><img src="docs/images/s2arm-wordmark.png" width="420" alt="S2Arm"></p>

**Your own Switch games, running natively on iPhone, iPad and Mac.** Game code is rewritten to native ARM64 and runs directly on the device's processor, with graphics going straight to Metal. Your whole library lives in one app, and a few clicks in the Mac or Windows launcher take a game from import to play.

Platforms: iPhone / iPad (iOS / iPadOS 18 and later) · Mac (Apple silicon, macOS 15 and later) · Build on Mac or Windows · Android / HarmonyOS coming soon · License: Apache-2.0 · **Bring your own games**

[简体中文](README.zh-CN.md) · [Download the launcher](https://jhaizhou-ops.github.io/S2Arm/) · [All releases](https://github.com/jhaizhou-ops/S2Arm/releases) · [Evidence](docs/validation/EVIDENCE.md)

<p align="center"><img src="docs/images/launcher-welcome-en.png" width="760" alt="S2Arm launcher welcome page"></p>

## A native port, not an emulator

The game's own ARM64 code is rewritten at build time and then runs directly on the processor in your iPhone, iPad or Mac. There is no CPU emulator in between. Graphics calls are translated straight to Metal, and system services come from a native host. That is where the speed, the low heat and the battery life come from. [Evidence](docs/validation/EVIDENCE.md#native-port)

## One app, your whole library

Every game you import goes into the same S2Arm app; open it and pick what to play. The whole library takes a single App slot on your developer account, so adding a game never means installing another app or spending another signing slot. [Evidence](docs/validation/EVIDENCE.md#one-app-whole-library)

## Graphical launchers, next to zero setup

There is a graphical launcher for Mac and one for Windows. On first launch the welcome page boils everything down to three steps: get this computer ready, add your keys, add your games, with a single primary button at any moment. Everything else is either bundled or fetched in one click, and you never touch a command line.

After you click Build, every stage shows its progress, elapsed and remaining time, and disk use. Several games can queue up and build one after another. [Evidence](docs/validation/EVIDENCE.md#graphical-launchers)

<p align="center">
  <img src="docs/images/launcher-oneclick-en.png" width="400" alt="One-click build">
  <img src="docs/images/launcher-export-en.png" width="400" alt="Build progress">
</p>

<p align="center">
  <img src="docs/images/launcher-success-en.png" width="400" alt="Build finished">
  <img src="docs/images/launcher-library-en.png" width="400" alt="Game library">
</p>

## Let an AI drive

Both the Mac and Windows launchers expose a control interface, `s2armctl`. An AI assistant can import games, build, install, follow progress and read errors, and every step shows up in the launcher window. A companion self-check, self-fix and feedback toolkit lets the AI find a problem, apply the documented fix, and, when it cannot, package a diagnostic bundle for you to file. Watch an AI diagnose and fix a real problem end to end: [Evidence](docs/validation/EVIDENCE.md#ai-at-the-wheel)

### Have an AI do it for you

Send this to your AI assistant (it needs to be able to run commands on your computer):

> Please read https://github.com/jhaizhou-ops/S2Arm/blob/main/launchers/macos/skill/s2arm-operator/SKILL.md and then help me install my Switch game on my iPhone.

It moves forward with a few commands, and you can watch every step in the launcher window:

```bash
/Applications/S2Arm.app/Contents/Resources/s2armctl start        # open and connect to the launcher
/Applications/S2Arm.app/Contents/Resources/s2armctl next         # what to do now, who does it, and why
/Applications/S2Arm.app/Contents/Resources/s2armctl diag export ~/Desktop/S2Arm-diagnostics.zip   # export a diagnostic bundle if it cannot fix a problem
```

Anything only you can do (system permission prompts, signing in with your Apple ID, tapping Trust on your phone), the AI stops and asks you to do. On Windows, use `s2armctl.cmd` in the launcher folder with the same commands; exporting a diagnostic bundle is currently Mac-only.

## Tested at scale

**211** games surveyed with a **95%** first-try build success rate. **4,700+** test runs on real iOS devices and **1,000+** on macOS. [Evidence](docs/validation/EVIDENCE.md#tested-at-scale)

## Fast, smooth, and easy on the battery

On a 16 GB MacBook Air (M3), from importing a game to a finished iPhone build, completely cold:

| Game | Game files | Shaders | Build time |
|---|---|---|---|
| Diablo III | 23.5 GB | 1,222 | **6.4 min** |
| Animal Crossing: New Horizons | 12.0 GB | 9,315 | **8.6 min** |
| The Legend of Zelda: Tears of the Kingdom | 17.5 GB | 26,999 | **34 min** |

The Nintendo Switch 2 edition of *The Legend of Zelda: Ocarina of Time*, measured on an iPhone 17 Pro Max: a **full 60 fps** while the phone is cool, **37–43 fps** once sustained load has heated it up, at about **0.15 J per frame**. [Evidence](docs/validation/EVIDENCE.md#speed-and-efficiency)

## Platforms

| Platform | Support |
|---|---|
| iPhone / iPad | iOS / iPadOS 18 and later; every game is chosen inside one app |
| Mac | Apple silicon, macOS 15 and later; builds locally and plays games right on the Mac |
| Windows | Graphical launcher that builds and installs games for iPhone / iPad |
| Android / HarmonyOS | Coming soon |

[Evidence](docs/validation/EVIDENCE.md#platforms)

## Getting started

1. Download the Mac or Windows launcher from the [download page](https://jhaizhou-ops.github.io/S2Arm/) and open it. Building for iPhone on a Mac needs the free Xcode from the App Store, signed in with your Apple ID; the launcher walks you through it.
2. Import your own keys and games. Put the base game, updates and DLC in one folder and import them together.
3. Choose iPhone / iPad or this Mac, then click Build.
4. Follow the launcher to sign and install with your own Apple ID (the Windows launcher ships with the Impactor signing tool), open S2Arm, and pick a game from the library.

Back up your saves before updating the app. The release uses the new app identifier `io.s2arm.*`, which the system treats as a new app: saves from the beta builds do not carry over automatically.

## Honest boundaries

S2Arm runs 64-bit (AArch64) games. Apple silicon cannot execute 32-bit ARM code, so 32-bit games are outside what S2Arm supports. Confirmed so far: Ni no Kuni: Wrath of the White Witch, Goat Simulator, New Super Mario Bros. U Deluxe and Monster Hunter XX. Minecraft: Story Mode, which needs a 36-bit address space, is outside it as well. The full list with versions is on the [evidence page](docs/validation/EVIDENCE.md#unsupported-games).

## Development

[Contributing](CONTRIBUTING.md) · [AI collaboration policy](LLM_POLICY.md) · [Diagnosis and root-fix skills for AI](skills/) · [Report a problem](https://github.com/jhaizhou-ops/S2Arm/issues) · [Third-party licenses](THIRD_PARTY_LICENSES.md)

## Thanks

S2Arm stands on the shoulders of its community.

- **Co-developers**: thank you to everyone who has opened a pull request or issue in this project. Your code, device testing and bug reports shaped S2Arm (in order of first contribution): [@biglawine](https://github.com/biglawine), [@yyan160](https://github.com/yyan160), [@DanielZhangyc](https://github.com/DanielZhangyc), [@vickwv](https://github.com/vickwv), [@Xc1Ym](https://github.com/Xc1Ym), [@fjack](https://github.com/fjack), [@ha7rock](https://github.com/ha7rock), [@yourmoonlight](https://github.com/yourmoonlight), [@qidian99](https://github.com/qidian99), [@n06ody](https://github.com/n06ody), [@YTwsy](https://github.com/YTwsy), [@wdjwxh](https://github.com/wdjwxh), [@realskyrin](https://github.com/realskyrin), [@wwmogu](https://github.com/wwmogu), [@quancunlau](https://github.com/quancunlau), [@moongrant](https://github.com/moongrant), [@imyinyx](https://github.com/imyinyx), [@s-leeq](https://github.com/s-leeq), [@Zhangbu](https://github.com/Zhangbu), [@retX0](https://github.com/retX0), [@zh0ngtian](https://github.com/zh0ngtian), [@fengbird](https://github.com/fengbird), [@zsakvo](https://github.com/zsakvo), [@1500256797](https://github.com/1500256797), [@BossaMelon](https://github.com/BossaMelon), [@GayoZhao](https://github.com/GayoZhao), [@sovaly](https://github.com/sovaly), [@ruterfu](https://github.com/ruterfu), [@fyn1320068837-source](https://github.com/fyn1320068837-source), [@InTheManXG](https://github.com/InTheManXG).
- **Ryujinx** (Ryujinx Team and Contributors, MIT): upstream for system services and shader translation; S2Arm's compatibility layer is built on it.
- **[NX2Apple](https://github.com/LNPANDY/NX2Apple)** (LNPANDY, MIT): upstream of the launcher interface.
- **[nxnative](https://github.com/seedds/nxnative)** (seedds, MIT, Copyright (c) 2026 seedds): the original work behind the direct graphics layer that connects game graphics straight to Metal. That generous release is what made the direct path possible.
- **[d2r-mobile](https://github.com/jhaizhou-ops/d2r-mobile)** (MIT): pioneered this technical path, bringing your own Switch game natively to iPhone, iPad, Mac, Android and HarmonyOS for the first time.
- **Impactor** (Samara M, MIT) and **apple-codesign** (MPL-2.0): signing and installing from Windows.
- **LNPANDY** and the original authors and contributors of the iOS library shell: the shell and its RomFS archive subsystem.
- **ns2pro-bridge** (DanielZhangyc, MIT), **MacNativeGames** (MIT), **LumaDock** (MIT), **deko3d** (fincs, zlib), **nvn.h** (h1k421, MIT), **bcdec** (Sergii Kudlai, MIT / Unlicense), **LibHac** (Alex Barney, MIT) and **hactool** (SciresM, ISC), **SPIRV-Cross** and **Vulkan-Headers** (The Khronos Group), **SMAA** (Jorge Jimenez et al., MIT), the **Mesa** tessellator (Microsoft, MIT), **Capstone**, **LZ4**, **.NET**, **libvpx**, **libopus**, **dav1d**, and the **Noto** fonts.

Versions, full license texts and what each component does are in [NOTICE](NOTICE) and the [third-party license list](THIRD_PARTY_LICENSES.md).

## Star History

<a href="https://star-history.com/#jhaizhou-ops/S2Arm&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=jhaizhou-ops/S2Arm&type=Date&theme=dark" /><img alt="Star History" src="https://api.star-history.com/svg?repos=jhaizhou-ops/S2Arm&type=Date" /></picture></a>

## License and legal

S2Arm is open source under the [Apache License 2.0](LICENSE). The project ships no games and no keys; obtain your own game files legally. S2Arm is not affiliated with or endorsed by Nintendo, and game titles and trademarks belong to their respective owners.
