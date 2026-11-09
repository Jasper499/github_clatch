<h1 align="center">
  <br>
  <a>
  <img src="assets/hookshot.png" alt="Hookshot" width="200">
</a>

  <br>
  <b>Hookshot</b>
  <br>
</h1>

<h4 align="center">The Legend of Zelda: Ocarina of Time (Nintendo Switch 2) running natively on Windows & Linux, with no emulator.
</h4>


<p align="center">
  <a href="#project-status">Status</a> |
  <a href="#install-and-play">Install and play</a> |
  <a href="#in-game-menu">In-game menu</a> |
  <a href="#if-something-goes-wrong">Problems</a> |
  <a href="#build-from-source">Build from source</a> |
  <a href="#how-it-works">How it works</a> |
  <a href="#want-to-help">Want to help?</a> |
  <a href="#credits">Credits</a> |
  <a href="#license">License</a>
</p>

Hookshot is a static recompilation. The game's code is translated to C and compiled into a Windows or Linux program,
the console's system software is reimplemented, and the Switch 2 graphics are rebuilt on Vulkan. All of this happens
**on your PC, from your own copy of the game**.
<br>

> [!WARNING]
> Some users report the file in releases to be a Trojan - it is not. Feel free to run it through any antivirus software


Discord: https://discord.gg/DVQQJphbBf
<br>

> [!IMPORTANT]
> This repository **does not contain the game, keys or an executable**, and it does not explain how to get them. You
> need your own copy. Everything the build creates (`hookshot.exe`, the generated code, the shader caches and your
> saves) comes from your game and stays on your PC. Never share those files.

## Project status

Experimental. Most testing so far has been around the start of the game. Players have reported on many PCs since:
the table says what works and what does not yet.

| What | Status |
|---|---|
| Kokiri Forest: reaching gameplay and walking around | ✅ Works |
| Sound, controller, keyboard and saves | ✅ Works |
| In-game menu, frame generation and upscaling | ✅ Works |
| Flicker (the picture flashing too bright while moving) | ✅ Fixed in v2.0.2 ([#645](https://github.com/NotRexed/Hookshot/pull/645)) |
| Ground fog vanishing when looking down | ✅ Fixed in v2.0.2 ([#638](https://github.com/NotRexed/Hookshot/pull/638)) |
| Models with missing pieces (doors, fences, parts of trees) | ✅ Fixed where tested, more play needed |
| Stutter when entering new areas | ⚠️ Still happens the first time you visit a place. The next visits are smooth |
| Performance | ⚠️ Depends on the PC: some reach a steady 60 fps, others stay below it, more so in Hyrule Field |
| Hyrule Field, Castle Town, Kakariko and the dungeons | ⚠️ Players got there, with open bugs: striped shadows in Hyrule Field ([#468](https://github.com/NotRexed/Hookshot/issues/468)), some crashes ([#317](https://github.com/NotRexed/Hookshot/issues/317), [#648](https://github.com/NotRexed/Hookshot/issues/648)) |
| Ultrawide | ⚠️ The 3D keeps its shape, but the HUD is stretched and the picture is softer |
| NVIDIA cards | ✅ Works. The most tested |
| AMD cards | ⚠️ Some tested: reports from the RX 6600, RX 7800 XT and RX 7900 XTX. Known issue: the game loses the GPU in the Deku Tree on the RX 6600 ([#708](https://github.com/NotRexed/Hookshot/issues/708), [#614](https://github.com/NotRexed/Hookshot/issues/614)) |
| Intel cards | ❓ Few reports, many of them black screens or crashes ([#17](https://github.com/NotRexed/Hookshot/issues/17)) |
| Cards without mesh shaders (such as AMD RX 5000 and older) | ❌ Not supported: parts of the picture are missing. A fallback was tried and taken out again for now ([#640](https://github.com/NotRexed/Hookshot/issues/640)) |
| Linux | ✅ Works with the AppImage. Tested on several distributions (CachyOS, Fedora, Bazzite, SteamOS) and cards, with open problems on some AMD cards ([#604](https://github.com/NotRexed/Hookshot/issues/604), [#528](https://github.com/NotRexed/Hookshot/issues/528)) |

## Install and play

The game does not come ready-made: Hookshot Builder builds it on your PC from your copy. You do this once. After that
you start the game from its launcher, which also updates it.

### What you need

- **Your copy of the game at the supported version:** program `0400486024DEC000`, update v131072, build `e0f3ccfa`.
  Other versions do not work. A `.nup` file, or the `romfs` and `exefs` folders.
- 64-bit Windows 10 or 11, or 64-bit Linux with glibc 2.35 or newer (Ubuntu 22.04, Debian 12, Fedora, Arch,
  SteamOS ...) and a CPU with AVX2.
- A graphics card with Vulkan 1.3 and mesh shaders, with an up-to-date driver: NVIDIA GeForce RTX 20 series or newer,
  AMD Radeon RX 6000 series or newer, or Intel Arc. On Linux, Mesa or NVIDIA's driver. Cards without mesh shaders are
  not supported.
- 8 GB of video memory (VRAM) or more is recommended. Cards with less can use the in-game menu's lower Quality presets.
- 16 GB of RAM or more. A run uses about 10 GB.
- About 60 GB free while building.
- An internet connection for the download. Nothing else to install: the builder brings its own compiler and tools.

### On Windows

1. Open the [latest release](https://github.com/NotRexed/Hookshot/releases/latest) and download `HookshotBuilder.exe`.
2. Run it. It downloads the rest of Hookshot Builder (about 500 MB), checks it, and opens it.
3. Pick your game. The builder looks for `.nup` files in your Downloads, Desktop and Documents folders and lists them
   under **Found on this PC**. Not listed? Press **Browse…**, drop the file on the window, or choose
   **romfs and exefs folders**. The builder checks that it is the right version.
4. Under **Install the game to**, keep the folder (`Games\Hookshot` in your user folder) or press **Change**. Choose
   the **Game language**.
5. Press **Build the game**. It takes about 10 to 45 minutes, depending on your CPU and memory. You can use your PC in
   the meantime.
6. When it says **Your game is ready**, press **Play**. The **Desktop shortcut** and **Start menu entry** boxes are
   ticked: untick them if you don't want them.

Next time, start the game from the Hookshot shortcut, or `hookshot.exe` in the game folder. That is the launcher: it
has **Play**, and **Update** when a newer release is out.

The first start prepares the game's shaders, which takes a while. Later starts are faster.

### On Linux

1. Open the [latest release](https://github.com/NotRexed/Hookshot/releases/latest) and download
   `Hookshot-<version>-x86_64.AppImage`. It is Hookshot Builder with everything it needs inside.
2. Allow it to run as a program. In most file managers: right-click it, open **Properties**, and turn on
   "Allow executing file as program" (the words differ between desktops). Or in a terminal:
   `chmod +x Hookshot-*-x86_64.AppImage`.
3. Double-click it. The Hookshot Builder window opens.
4. Under **Game files**, choose **.nup file** or **romfs and exefs**, then press **Browse** to pick them. The builder
   checks the version.
5. Under **Save the game to**, keep `~/Games/Hookshot` or choose another folder. Choose a **Language**.
6. Press **Build**. It takes about 10 to 45 minutes, depending on your CPU and memory.
7. When it says "Your game is ready", press **Play**.

The game is also added to your applications menu as "Hookshot". That entry, and `hookshot` in the game folder, open the
launcher: **Play**, and **Update** when a newer release is out. Keep the AppImage where it is: the launcher uses it to
update.

### Updating

When a new release is out, the launcher says "Update available". Press **Update**: in `hookshot.exe` on Windows, or in
`hookshot` (or the AppImage) on Linux. It downloads only the parts that changed and builds the game again in the same
folder, compiling only what changed. Your saves and settings are kept. What changed is on the
[Releases page](https://github.com/NotRexed/Hookshot/releases).

<details>
<summary>What an update keeps and replaces, and updating from the command line</summary>

To be safe, copy your saves somewhere first: the `user` folder in the game folder on Windows, or
`~/.local/share/hookshot` on Linux.

| Kept | Replaced |
|---|---|
| Your saves (`user`, or `~/.local/share/hookshot` on Linux) | The game in `bin` and its files |
| `hookshot_options.ini`, the in-game menu's choices and your controls | `image.bin` and the shader list |
| `hookshot_env.txt` | `language.txt`, written again with the game's language |
| `mods` | |

The game files the first build read are kept in the game folder, so an update does not need your `.nup` again.

From a clone: `git pull`, then `python -I nx2/make_game.py --update <game folder>`. The Linux AppImage does the same
with `--update <game folder>`.

</details>

### Where the files go

- The build reads your game and never changes it. It writes to the folder you choose and to the builder's own folder:
  `%LOCALAPPDATA%\HookshotBuilder` on Windows, `~/.cache/hookshot-builder` on Linux.
- The romfs is hard-linked instead of copied where the disk allows it.
- The builder keeps its build files (about 4 GB) so that updates are quick. None of them are needed to play: on
  Windows, **Free up space** on the "Your game is ready" page deletes them, and the build files folder can be moved
  before a build (**Change**, **Default**).
- Saves: the `user` folder in the game folder on Windows, `~/.local/share/hookshot` on Linux (a `user` folder from an
  earlier Linux build is moved there once). `--user <folder>` puts them somewhere else ([command line
  arguments](#running-the-game-from-the-command-line)).
- To uninstall, delete the game folder, the builder's folder and the shortcuts.

### If something goes wrong

| Problem | What to do |
|---|---|
| Where is the log? | `hookshot_log.txt` in the game folder holds the last run. The four runs before are `hookshot_log.1.txt` (the last) to `.4.txt`. Started from a terminal, the game prints there instead |
| "Hookshot supports build e0f3ccfa" or "This version isn't supported" | Check that you chose the right game with its update installed |
| The game opens and closes, or the log says "device lost" | Update your graphics driver. On AMD cards there are known crashes ([#708](https://github.com/NotRexed/Hookshot/issues/708), [#614](https://github.com/NotRexed/Hookshot/issues/614)) |
| Parts of the picture are missing, or a message says your card has no mesh shader support | The card or its driver has no mesh shaders. Update the driver; older cards are not supported ([#640](https://github.com/NotRexed/Hookshot/issues/640)) |
| Linux: the game does not start or the picture is broken | The game needs a Vulkan 1.3 driver with mesh shaders. Check with `vulkaninfo \| grep mesh`: it should list `VK_EXT_mesh_shader`. Update Mesa or the NVIDIA driver |
| "Your antivirus removed part of the build tools" | A false alarm on unsigned programs. Restore the files from Windows Security's Protection history, or add `%LOCALAPPDATA%\HookshotBuilder` to its exclusions, then press **Repair** |
| Stutter the first time you see something | Normal for now: shaders are being prepared. It gets better when you pass through the same place again |
| The game is in the wrong language | Change the code in `language.txt` in the game folder. The file lists them all |

If the problem continues, [report it](https://github.com/NotRexed/Hookshot/issues/new/choose) with the version, where
you were in the game, your graphics card, `hookshot_log.txt` and a screenshot or video. Never send game files.

## In-game menu

Press <kbd>Insert</kbd> (or <kbd>F1</kbd>) in game, or on a controller the Home button (or Select and Start together).
The same keys close it, and so does <kbd>Esc</kbd>. The menu has three tabs, Graphics, Gameplay and Controls:
<kbd>Q</kbd> and <kbd>E</kbd> (or <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd>) switch between them, LB and RB on
a controller. <kbd>Up</kbd> and <kbd>Down</kbd> choose a row, <kbd>Left</kbd> and <kbd>Right</kbd> change it
(<kbd>Enter</kbd> changes it too). On a controller the D-pad chooses and changes, the bottom face button changes too,
and the right one closes the menu. Your choices are saved in `hookshot_options.ini` in the game folder.

| Tab | Option | Choices | Default |
|---|---|---|---|
| Graphics | Quality preset | Custom, Minimum (4GB), Low (6GB), Balanced (8GB), High (12GB), Ultra (16GB+) | Custom |
| | Fullscreen | Off, On (the same as <kbd>F11</kbd>) | Off |
| | GPU device | Auto, or each graphics card by name (after a restart) | Auto |
| | Frame generation | Off, 2x to 8x | Off |
| | Frame pacing | Off, On | Off |
| | Resolution | Auto (the game's own dynamic resolution), 100%, 75%, 67%, 50% (each with its size) | Auto |
| | Output resolution | 2048x1152, 2560x1440, 3840x2160 (after a restart) | 2048x1152 |
| | Upscaling | Off, Catmull-Rom, Lanczos | Off |
| | Sharpness | 0 to 100%, in steps of 10 | 0% |
| | Handheld profile | Off, On (after a restart) | Off |
| | Ultrawide | 16:9, Monitor's shape (after a restart) | 16:9 |
| | Robust buffers | Auto, Off, On (after a restart) | Auto |
| Gameplay | FPS counter | Off, On | Off |
| | Game speed | Per frame, Real time | Real time |
| | Text speed | Normal, 2x, 4x, Instant | Normal |
| Controls | Controller in background | Off, On | Off |
| | Mouse camera | As the stick, Native | As the stick |
| | Mouse sensitivity | 0.10 to 5.00 | 1.00 |
| | Invert mouse vertical | Off, On | Off |
| | Invert camera X | Off, On | Off |
| | Invert camera Y | Off, On | Off |
| | Layout preset | Nintendo (Def), Xbox / PC, Swap Face, Custom | Nintendo (Def) |
| | Controls | Opens the Controls page | |

- **Quality preset** sets Resolution, Upscaling, Sharpness, Frame generation, Frame pacing, Game speed, Handheld
  profile and the video memory limits for a card with that much memory. Changing most other rows yourself sets it back
  to Custom.
- **GPU device** matters on a PC with more than one graphics card (a laptop's integrated and dedicated GPUs, or a
  second card for Lossless Scaling). Auto prefers a dedicated one, and only cards with Vulkan 1.3 are listed.
  `hookshot_log.txt` lists every card as `vk: device <n>`; `RX_VK_DEVICE=<n>` chooses one for a single run and wins
  over the menu.
- **Frame generation** makes extra frames between the game's own. It adds a little input delay, and fast motion can
  show artifacts. **Frame pacing** shows frames at an even interval: less stutter, up to one frame of delay.
- **Output resolution** is the size of the game's whole frame, HUD included, before it is scaled to your window.
  Resolution is a share of it, and its row shows the size for the output you chose. Docked only. At 3840x2160 the game's
  render targets get a bigger GPU pool, so a full-size 3D fits. `HOS_OUTPUT_RES=0/1/2` sets it for one run.
- **Upscaling** and **Sharpness** also work when Frame generation is Off.
- **Handheld profile** runs the game as if the console were undocked: lower resolution, lighter on the GPU.
- **Robust buffers:** a read past a buffer's end is dropped instead of stopping the GPU. Auto is on, on every card; Off
  can be faster on some NVIDIA cards.
- **Game speed:** with Per frame, the game runs slower whenever it is below 60 fps. Real time keeps it at normal speed
  down to 15 fps.
- **FPS counter** shows in the top right corner. With frame generation on, it also shows the game's own rate.
- **Controller in background:** On keeps the controller working while another window has the focus. The keyboard and
  mouse still need the game's window.
- **Mouse camera:** Native turns the camera with the mouse one to one, as in a PC game. As the stick uses the mouse in
  place of the right stick. The <kbd>-</kbd> and <kbd>=</kbd> keys change the sensitivity in game too.
- **Layout preset:** Nintendo has A on the right face button, Xbox / PC and Swap Face put A on the bottom one. Changing
  a button yourself sets it to Custom.

### Controls

Use a controller, or the keyboard and mouse. On the keyboard, <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> move
and the arrow keys (or <kbd>I</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd>) turn the camera.

To change which gamepad button or key presses a Switch button, or which keys move and turn the camera, open the
Controls tab's Controls page. Choose a row and a column (Gamepad or Keyboard), press <kbd>Enter</kbd> (or the bottom
face button), then the new button or key. <kbd>Esc</kbd> cancels, <kbd>Delete</kbd> clears it, and Reset to defaults
puts them all back. A gamepad button taken from another Switch button swaps with it. The page saves them in
`hookshot_options.ini`.

<details>
<summary>Writing the controls in hookshot_options.ini yourself</summary>

```ini
pad_a=0
key_a=69,13
```

`pad_<button>` is a gamepad input by position: 0 bottom face button, 1 right, 2 left, 3 top, 4 Select or Back, 5 Home,
6 Start, 7 and 8 the stick presses, 9 and 10 the shoulder buttons, 11 to 14 the D-pad (up, down, left, right), 15 and
16 the triggers, -1 none. `key_<button>` is one or two
[Windows key codes](https://learn.microsoft.com/windows/win32/inputdev/virtual-key-codes) in decimal (69 is
<kbd>E</kbd>, 13 <kbd>Enter</kbd>), 0 none; the mouse's buttons are 1 (left), 2 (right), 4 (middle), 5 and 6 (side
buttons), and count while the mouse is captured. The buttons are `a` `b` `x` `y` `l` `r` `zl` `zr` `plus` `minus` `ls`
`rs` `left` `up` `right` `down`, and for keys only the left stick's and the camera's directions: `move_up`
`move_down` `move_left` `move_right` `cam_up` `cam_down` `cam_left` `cam_right`. A button the file leaves out keeps
its default.

</details>

## Mods

Put mods in a `mods` folder in the game folder, beside `hookshot.exe` (or point `HOS_MODS` at another folder), in the
layout emulators use: `mods/<name>/romfs/...` holds files that replace or add to the game's own. Deeper layouts such as
`mods/contents/<title id>/<name>/romfs` work too. A folder whose name starts with `-` or `_` is off. When two mods
have the same file, the one whose folder name sorts last wins, so name them `01-...`, `02-...` to set the order.

Only RomFS mods are loaded. `exefs` patches (`.pchtxt`, `.ips`) are left out: Hookshot compiles the game's code ahead
of time, so patching its instructions would need a rebuild. The log (`hookshot_log.txt`) names each mod and the files
read from it.

## Build from source

For developers, and for players who prefer the command line. The builder windows run the same script,
`nx2/make_game.py`. [CONTRIBUTING.md](CONTRIBUTING.md) has more.

<details>
<summary>Windows, from the command line</summary>

```powershell
python -I nx2/make_game.py --nup "C:\path\your-game.nup" --out "C:\Games\Hookshot" --language en-US
python -I nx2/make_game.py --romfs "C:\path\romfs" --exefs "C:\path\exefs" --out "C:\Games\Hookshot" --language en-US
```

Add `--check` with your `.nup` or `--exefs` to only check the game's version. It builds nothing.
Add `--log "C:\path\build.log"` to also save the build's output to a file (UTF-8, replaced if it exists); it works
with `--check` and `--update` too, and on Linux.
`HOOKSHOT_JOBS=<n>` (or `--jobs <n>`) limits how many files compile at once.

You need:

- Python 3 from python.org (the Microsoft Store's Python installs packages where `python -I` does not look), with
  `pip install lz4 numpy capstone "unicorn>=2.1,<2.2" zstandard`.
- [llvm-mingw](https://github.com/mstorsjo/llvm-mingw) (the `ucrt-x86_64` build), unpacked as `llvm-mingw` in the
  clone or with `HOOKSHOT_MINGW` set to its folder. Without it the build uses the clang from
  [emsdk](https://github.com/emscripten-core/emsdk) at `C:\emsdk` with Visual Studio's C++ tools and the Windows SDK
  (`HOOKSHOT_MSVC=1` forces that route).
- What the builder's `tools` folder carries and a clone does not. Run `HookshotBuilder.exe` once: the folder is
  `%LOCALAPPDATA%\HookshotBuilder\versions\<version>\HookshotBuilder\tools`. The builder sets the variables itself;
  from the command line, set them before you run `make_game.py`:
  - `tools\cpm`: the Vulkan headers and FFmpeg. Set `RX_CPM` to this folder. Without it the build leaves out
    `hookshot_vk.dll`, the Vulkan renderer, and says nothing.
  - `tools\wgpu-native`: set `WGPU_NATIVE` to this folder.
  - `tools\third_party`: the prebuilt files a clone lacks (`a64emit`, `lld-link`, `zbic` and SDL2). Copy its `.dll`,
    `.exe`, `.lib` and `.sha1` files to the same places under `third_party\`.
  - `tools\work`: copy it to `work\`. It holds the hot-function list, the link order, the profile and the icon;
    without them the game builds but runs slower.
- Visual Studio 2022 with .NET 8, only if you want to change the builder itself.

</details>

<details>
<summary>Linux, the AppImage from the command line</summary>

```sh
./Hookshot-<version>-x86_64.AppImage --cli --nup ~/your-game.nup --out ~/Games/Hookshot   # make_game.py's options
./Hookshot-<version>-x86_64.AppImage --play                    # the game the builder built last, without the window
./Hookshot-<version>-x86_64.AppImage --play ~/Games/Hookshot   # the game in that folder
./Hookshot-<version>-x86_64.AppImage --update ~/Games/Hookshot # the new release, and that folder built again
```

`HOOKSHOT_JOBS=<n>` (or `--jobs <n>` with `--cli`) limits how many files compile at once.

In a game folder, `hookshot` is the launcher and the game itself is `bin/hookshot`. The builder's settings are in
`~/.config/hookshot/builder.ini`.

</details>

<details>
<summary>Linux, without the AppImage</summary>

You need `clang` and `lld` (LLVM 23 or newer reads the play profile; an older one builds without it), Python 3 with
`lz4`, `numpy`, `capstone`, `unicorn` and `zstandard`, FFmpeg's development files (with dav1d, for the movies) and
SDL3 (SDL2 works too). Then run `python -I nx2/make_game.py ...` as on Windows, with `RX_CPM` pointing at a folder with Vulkan-Headers,
SPIRV-Headers and VulkanMemoryAllocator in CPM's layout.

`scripts/linux/deps.sh` fetches and builds all of these into `build-linux/deps`, and `scripts/linux/appimage.sh` makes
the AppImage from them. A folder built from a source checkout has no launcher: `hookshot` there is the game.

</details>

<details>
<summary>The Windows game, built on Linux</summary>

Unpack llvm-mingw's Linux build (`ucrt-ubuntu-22.04-x86_64`), then run `make_game.py` with `RX_TARGET=windows` and
`HOOKSHOT_MINGW` set to its folder. The objects go to `~/.cache/hookshot-builder-windows`, apart from the Linux game's.
The game folder runs under Proton or on Windows.

</details>

### Running the game from the command line

The built game is `bin\hookshot.exe` on Windows and `bin/hookshot` in a packaged Linux game folder. A build from a
source checkout has `hookshot.exe` or `hookshot` in its build folder, with no launcher beside it. The `hookshot.exe`
or `hookshot` launcher in the game folder does not pass these arguments to the game, so start the game directly to
use them.

| Argument | What it does |
|---|---|
| `image.bin` | The game image to run. Without it the game uses the `image.bin`, `romfs` and `user` in its folder |
| `--romfs <folder>` | The extracted RomFS folder |
| `--user <folder>` | Where the game keeps per-user data: saves, caches, temp files and `mouse_sens.txt`. Default: `user` in the game folder on Windows, `~/.local/share/hookshot` on Linux; with an explicit image path, `user` in the current folder |
| `--trace` | Log every Horizon OS call (the same as `HOS_TRACE=1`) |
| `--prepare-shaders` | Prepare the shaders and exit without starting the game (the build's last step) |

For example, keep saves somewhere else:

```powershell
cd "C:\Games\Hookshot"
.\bin\hookshot.exe --user "D:\Hookshot data"
```

```sh
cd ~/Games/Hookshot
./bin/hookshot --user "$HOME/hookshot-data"
```

`hookshot_env.txt` and the other test switches are documented below.

<details>
<summary>Switches for testing (hookshot_env.txt)</summary>

Switches to test (`RX_VK_NOOPT=1` and the others) go in `hookshot_env.txt` in the game folder, one `NAME=VALUE` a
line, on Windows and Linux. The running game reads it, not the builder. A test run can name another file with
`HOS_ENV_FILE=<path>`; the game then reads that one instead and leaves `hookshot_env.txt` alone.

For a first run on a 4 GB card such as a GTX 1650, `RX_VK_LOW_SPEC=1` starts with the Minimum (4GB) preset, with
frame generation and upscaling off. It applies only when there is no `hookshot_options.ini` yet; after that, change
the settings in the in-game menu.

`RX_VK_MOVIE_UPSCALE=linear` replaces the movies' neural upscale with the plain linear one. The default, `auto`, keeps
the networks and falls back only when a movie frame takes the GPU more than 40 ms. It does not change the gameplay
upscaler, and movies can look softer. `RX_VK_NETWORK_KEEP=all` takes precedence and keeps the movie networks.

</details>

## How it works

1. `nx2/lift.py` translates the game's ARM64 code to C.
2. `nx2/build.py` compiles that C together with `host/`, which plays the part of the console's system.
3. `host/nvn_native.c` records the game's NVN2 graphics calls, and `gpu/vk/` replays them on Vulkan.
4. Switch 2 Ampere shaders are lowered to Maxwell (`lower_to_maxwell.h`) and translated to SPIR-V by Eden's shader
   recompiler.

More detail is in the [development guide](docs/development.md) and the [design notes](docs/design.md).

## Want to help?

Testing on other graphics cards and reporting the result already helps a lot, and so does playing further into the
game than anyone has yet.

Bigger ways to help:

- **Linux testing.** The Linux build (`host/posix`) has been tested on several distributions and cards: reports from
  others still help.
- **Fixes in your own fork.** Fork the project, fix what you find and send the change back. Keep game files, keys and
  anything generated from your game out of it.

[CONTRIBUTING.md](CONTRIBUTING.md) has the setup, the test commands, the code conventions and what a good pull request
looks like.

## Credits

Hookshot exists thanks to the work of many people:

- **NotRexed**: Hookshot, BlueShell (Mario Kart World), Skybound (Tears of the Kingdom) and the a64-kit tools.
- **[Eden](https://git.eden-emu.dev/eden-emu/eden)** and **Eglantine**: the shader recompiler and Switch 2 shader work.
- **suyu**: the graphics decoders and the AArch64 translator.
- **[seedds/nxnative](https://github.com/seedds/nxnative)**: reference for how task and mesh shaders work.
- **[EvilBoyce / evilmfkr](https://github.com/evilmfkr/Hookshot)** (EvilOOT): the GPU culling that brings back Kokiri's foliage
  (trees, ferns, grass, falling leaves, fireflies), the ambient light probes, the pond's water, the game's own fog, the freeze
  after Load (Horizon's mutex handoff) and the exposure flicker fix.
- **[zortos293/Lichii](https://github.com/zortos293/Lichii)**: reference for Ampere shader lowering, and its compare-exchange retry fix.
- **[mstorsjo/llvm-mingw](https://github.com/mstorsjo/llvm-mingw)**: the bundled Windows compiler (no Visual Studio needed).
- **[kinnay/zbic](https://github.com/kinnay/zbic)**, **Opus** and **SDL**: decompression, audio and controllers.
- **[sostenesfreitas/ocarina-recomp](https://github.com/sostenesfreitas/ocarina-recomp)**: this README's layout, and its notes
  confirmed the mesh stage's control section.
- **[MythosOfs/Orchid](https://github.com/MythosOfs/Orchid)**: the fog and exposure workaround for Ocarina of Time.
- **Mesa (NAK)**: the reference for Ampere's instruction encoding.
- Everyone who sent fixes: SkippySteve (Linux and the AppImage, and many more), monsterlag, klimovich008, hckrman101 (the
  exposure flicker and fog fixes, build speed, CI), shayderrr, gab9281, Wpaif, nicholasgower, ZurielAtr, Joey-Magnus, Zorkats,
  d3zessete, chrispository, vzeol, leonidasmark, Segmentree, ShyVortex, hiKareeem and i900gaming, among others.

## License

Hookshot is free software under the [GNU General Public License, version 3 or later](LICENSE) (GPL-3.0-or-later).
It includes code from Eden, suyu and Orchid, which are under the GPL too. Third-party parts under other licenses that
work with the GPL (Sirit, the Vulkan Memory Allocator, SDL, Opus, stb, zbic and the a64-kit tools) keep their own notices
in their folders.

Hookshot is an unofficial fan project, not affiliated with or endorsed by Nintendo. The Legend of Zelda and Ocarina of
Time are trademarks of Nintendo.
