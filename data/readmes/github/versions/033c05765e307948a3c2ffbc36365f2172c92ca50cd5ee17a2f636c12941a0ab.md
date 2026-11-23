<p align="center"><img src="assets/logo.svg" alt="WinRust" width="160"></p>

# WinRust

**A Windows shell written in Rust: faster and lighter than the stock one.** Small native programs (no .NET, no Electron) that replace parts of Windows: the taskbar, File Explorer, file search, Task Manager, plus a disk cleaner, a disk map and a photo viewer. One installer puts them in, one button takes them all out.

English | [Русский](README.ru.md) | [日本語](README.ja.md) | [Português (Brasil)](README.pt-BR.md)

<p align="center"><img src="assets/th.jpg" alt="WinRust" width="480"></p>

> **Read this first.** WinRust turns off Windows Search, hides the taskbar and can turn off Explorer as the shell. The exe is not code-signed, so SmartScreen will warn you. A restore point is created before install, but try it on a spare machine or a VM first.

## Install

1. Download `WinRust.exe` from the [latest release](https://github.com/Lemxy/WinRust/releases/latest) (Windows 10/11, x64).
2. Run it as administrator.
3. Tick the components you want and press the install button. On a fresh install, `rust-explorer` is unchecked. Tick it to replace the Windows Explorer shell (or use the gear on the topbar row: the **Shell: rust-explorer** switch). They are installed in the right order; one that fails or is skipped does not stop the others, the window lists what went wrong.

Windows Search is optional: on a stripped Windows (for example a debloated LTSC image without the Windows Search service) that step is skipped with a warning instead of failing the install.

If UAC asks for **another administrator's** password, the per-user settings (startup entries, scheduled tasks, PowerShell profile, search permissions) still go to the user who is signed in, not to the administrator you typed. If the installer cannot tell who that is, it stops before changing anything.

**Automatic updates:** after the first install, a `WinRust-update` scheduled task (runs as SYSTEM, no UAC prompt) checks the latest release at boot and once a day. It downloads only the programs that changed, checks each file against a manifest signed with the project's key (a tampered or unsigned release is refused) and replaces only files that are already installed. A running program switches to the new version the next time it starts (sign-in or reboot). Log: `%ProgramData%\plugin-launcher\install.log` (`autoupdate:` lines). To turn it off, disable the `WinRust-update` task in Task Scheduler; **Remove all** deletes it.

**Manual update:** download the new `WinRust.exe` from the releases page, run it as administrator and select the components you want to update or install. An existing `rust-explorer` stays selected by default for updates. Your settings and the saved original Windows values stay.

The installer is in English. The language button in its corner (or the gear on the bar → **Bar settings → Language**) switches every WinRust program to the chosen language: English, Русский, 日本語 or Português (Brasil). The choice is stored in `%ProgramData%\WinRust\lang.txt` (`en`, `ru`, `ja`, `pt`).

## Remove

- **Remove all** in the installer window undoes everything: Windows Search, the taskbar, Explorer and the services come back.
- One plugin at a time: `plugin-launcher uninstall <plugin>` (see [Command line](#command-line)).
- **If the screen is left without a taskbar or desktop:** press Ctrl+Alt+Del → Task Manager → Run new task → `explorer.exe`, then run the installer and press Remove all.

On uninstall, `rust-explorer` restores the service startup values and the svchost grouping threshold saved before installation. Older installs without those backups keep their current values and report a warning.

## What gets installed

| Plugin | What you get | What it changes in Windows |
|---|---|---|
| **rust-search** | File search over all NTFS drives, Alt+Space. With topbar, Win+R opens its Run mode: history, folder completion (Tab), Ctrl+Shift+Enter runs as administrator | Disables the Windows Search service, blocks SearchHost.exe, hides the taskbar search box |
| **rtaskmgr-win32** | Task Manager (Ctrl+Shift+Esc opens it) | `taskmgr.exe` is redirected to it (the system file is untouched). Also installs the **rs-du** disk cleaner. The **Speed** page has opt-in, reversible switches: Game / Work profiles (stop background services, close launchers or sync apps, start them again), clear the memory standby cache (now, or automatically while topbar runs), block the Windows Start menu, widgets and Phone Link processes, one weekly `winget upgrade` instead of third-party updaters, Defender exclusions for build caches and game libraries, faster NTFS (no last-access times, no 8.3 names), an ad-blocking hosts file. **Startup** also lists logon/boot tasks and third-party auto-start services, with how much each slowed the last boots (Windows' own boot log). **What's slow** shows driver time (DPC/interrupts), hung windows, slow disk and boot times. Uninstall turns all of it back |
| **topbar** | A Windows 11-style bottom bar: windows, clock, volume, menus | Hides the stock taskbar. Also installs **reshell** (hotkeys: Win+Ctrl+1/2/3 and Win+\` switch desktops (Win+1..9 open the bar's app buttons), Win+D shows the desktop, Win+I opens Settings, Win+E the file manager; brings the taskbar back if the bar dies), **rs-du**, and a block in your PowerShell profile (`zoxide`, `grep`=rg, `ll`=eza, `cat`=bat; does nothing if they are missing). The gear menu has short pages: Theme, Colors and transparency (any colour of the bar and the WinRust windows, the bar's opacity), Templates (save your own looks and switch between them), the bar (bottom / left / right edge, size, auto-hide, buttons at the left end like Windows 10) and Reset everything to defaults |
| **rust-explorer** | A file manager with tabs, and the desktop | Folders and drives open in it; **Explorer stops being the shell** (comes back by itself if topbar fails). On fresh installs, adjusts the startup settings of InventorySvc, lfsvc and DoSvc, and the svchost grouping threshold, when their values can be backed up. Its own copier (several files at once on SSDs, unbuffered for big files, progress in the status line) and right-click **Compress to ZIP** (all cores) / **Extract here** (ZIP and 7z), our own ZIP engine; a `.zip` opens like a folder (browse, copy out, open files from it). "Show in folder" from other programs selects the file (for the common folders: Downloads, Documents, Desktop, Pictures, Music, Videos and pinned ones, also when no window is open); the mouse back / forward buttons work; right click the desktop to hide its icons. Requires topbar |
| **wiztree** | A disk-usage map ("WinRust Disk" in Start) | Nothing, apart from the file and a shortcut |
| **photoview** | A fast photo viewer | Adds it to "Open with" (it does not become the default) |
| **rust-settings** | Settings in Rust: display (resolution, refresh rate), sound (volume), power plan and drive space, per-app volume and device choice, night light, display arrangement by dragging, network adapters, Wi-Fi on every adapter (password or 802.1X), VPN and proxy, Bluetooth, apps, Windows Update, disk cleanup, theme, about | Nothing, apart from the file and a shortcut. Win+I and the bar menus open this window instead of Windows Settings (only a few rare pages still open the system ones) |
| **debloat** | Off: telemetry, diagnostics, Copilot, Recall, Start ads, Edge in the background | Services and registry policies; old values are saved and restored on uninstall. **Command line only:** `install debloat --yes` |
| **purge** | Removes the bundled junk like Tiny11 does: Clipchamp, News, Weather, Xbox overlays, Teams, Cortana, Widgets, Skype and more, plus telemetry tasks | **IRREVERSIBLE, no undo.** Apps are removed for all users and from the image; the Store, Settings, Start and runtimes stay. Run `purge.exe` first: it only lists. **Command line only:** `install purge --yes` (OneDrive and Edge: `purge.exe --apply --onedrive --edge`) |
| chrome-rs | A browser | Not installable yet |

Every change is reversible: uninstall puts back the values that were there before.

## Styles

The gear at the left end of the bar opens **Bar settings**; a style picked on its **Theme** page applies at once to the bar, the file manager (rust-explorer) and the search window (Alt+Space):

| Style | Look |
|---|---|
| **Normal** | Windows 11 blue, the bar at the bottom |
| **Terminal** | Green on black, Consolas, square corners |
| **Floating dock** | A pill-shaped bar in the middle; maximized windows get the whole screen, the dock slides away over them and comes back at the bottom edge |
| **Tiling** | A thin bar at the top, amber accent, rounded like Normal; "Tile the windows" puts the open windows side by side |
| **White road** | Light ivory with gold: faint low-poly triangles, some traced in gold, behind the bar, its panels and rust-settings |
| **Ruby** | Deep garnet with a bright ruby accent: a smooth top-to-bottom gradient with a soft gloss, behind the bar and its panels |
| **Windows 98** (BETA) | Classic grey with a navy accent, square corners, Tahoma. Colours, corners and font only: no 3D bevels yet |
| **Windows 7** (BETA) | Aero-like glass blue with white text |

The gear menu also sets the bar position (bottom, left or right: a side bar shows icons only and the panels open next to it) and auto-hide.

The choice is stored in `%ProgramData%\WinRust\style.txt`.

## Benchmark

One-off measurements on one machine (Windows 11 IoT Enterprise 10.0.26300, RTX 4060 Laptop, NTFS). Treat them as orders of magnitude, not lab numbers.

| What | Windows | WinRust | Difference |
|---|---|---|---|
| File search (rust-search over all of C: vs `dir /s` over one folder) | 8,340 ms | 45 ms | **99.5%** faster |
| Same vs `Get-ChildItem -Recurse` | 16,200 – 28,600 ms | 45 ms | **99.7–99.8%** faster |
| Open a folder window (rust-explorer, median of 5 runs) | 420 ms | 60 ms | **86%** faster |
| Shell memory (topbar + rust-explorer + rs-shell + reshell vs explorer.exe) | 366 MB | 46 MB | **87%** less |
| Same, plus the search index (53 MB) | 366 MB | 99 MB | **73%** less |
| File manager binary size (now with ZIP and 7z inside) | 3,280 KB | 1,179 KB | **64%** smaller |
| Task manager binary size | 5,791 KB | 954 KB | **84%** smaller |
| Idle CPU of the bar (topbar after optimization, % of one core) | 0.00–0.10% (explorer) | 0.05–0.10% | on par with Explorer |
| Copy 5,000 small files, ~160 MB (rust-explorer: IFileOperation, Explorer's engine, vs its own copier) | 16.3 s | 2.3 s | **86%** faster (7x) |
| Copy one 1 GB file (same) | 0.58 s | 0.60 s | equal |
| Pack the same 5,000 files into ZIP (`Compress-Archive` vs rust-explorer's Compress to ZIP) | 48.4 s | 0.75 s | **98%** faster (64x) |

In short: **64–99% faster or smaller in the size/speed tests, equal on idle CPU and on copying one big file.** Caveats: rs searches a ready-made MFT index (it pays 53 MB of memory for that), while `dir` and PowerShell walk the disk from scratch; explorer.exe was still running with its windows during the test, so the memory gain is slightly overstated; Windows Search and the stock Task Manager were not compared. The copy and ZIP runs (`cargo test -p rust-explorer --release bench -- --ignored`) were single runs on data that was just written, so both sides read from the memory cache; our ZIP was slightly bigger (0.9 MB vs 0.7 MB) because each file is compressed on its own core.

## Screenshots

**Taskbar**

![Taskbar on the desktop](docs/screenshots/taskbar.webp)
![Taskbar menu](docs/screenshots/taskbar-menu.png)
![Bar menu, new look](docs/screenshots/topbar-menu-new.png)

**Task Manager** (Russian UI)

![Task Manager](docs/screenshots/task-manager.webp)

**File manager**

![File manager](docs/screenshots/explorer.png)

---

## For developers

### Layout
```
src/            the installer (plugin-launcher.exe)
  main.rs         the plugin table PLUGINS: name, texts, install/uninstall pair, icon
  install/        what each plugin changes and how it is undone (one file per plugin)
  cli.rs, ui.rs   the command line and the window; both call the same install functions
common/         winrust-common: language switch (t!/tf!: English, Russian, Japanese, Brazilian Portuguese), UI styles and palettes, reg.exe output parser, NTFS MFT reader
plugins/        sources of every plugin, each its own crate
ReShell/        reshell (desktop hotkeys, topbar safety net), ships with topbar
payload.txt     the exes embedded into the installer, and where the build puts them
payload/        those exes once built (not in git)
scripts/        build, update, release
```
Everything is one cargo workspace (one `Cargo.lock`, every exe in `target\release`). `plugins/rust-search` and `plugins/chrome-rs` build separately because they need `panic = "unwind"` (see `Cargo.toml`).

### Build
Needs Windows x64, Rust stable (1.85+) with the MSVC toolchain.
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-all.ps1
```
Result: `target\release\plugin-launcher.exe`, with every plugin inside. Close a running installer first. Tests: `cargo test --workspace` (and `cargo test` in `plugins\rust-search`). CI runs the same on every push (`.github/workflows/build.yml`).

| Script | What it does |
|---|---|
| `build-all.ps1` | everything: plugins → `payload\` → installer |
| `build-plugins.ps1` | plugins only → `payload\` (no installer rebuild) |
| `update-plugin.ps1 <plugin>` | rebuild and reinstall one installed plugin without rebuilding the installer (asks for admin via UAC) |
| `user-mode.ps1`, `dev-update.ps1` | developer mode: run topbar, rust-explorer, rs-shell and reshell from `%LOCALAPPDATA%` on top of Explorer, swap them without admin |
| `bench.ps1` | the search and Task Manager benchmark |
| `publish.ps1`, `release.ps1` | commit and push; GitHub release with `WinRust.exe` |

### Command line
From a terminal **with administrator rights**:
```
plugin-launcher list
plugin-launcher install <plugin>... --yes (one or more names, or `all` for the default components; without --yes it only prints warnings)
plugin-launcher update <plugin>|all        (reinstall from payload\ next to the exe)
plugin-launcher uninstall <plugin>
plugin-launcher rollback --yes           (remove everything)
plugin-launcher autoupdate               (one update check now: what the WinRust-update task runs)
```

To include `rust-explorer` in a fresh bulk install, run `plugin-launcher install all rust-explorer --yes`. If `topbar` is already installed, you can install `rust-explorer` on its own.
Several plugins in one command are installed in the table's order (topbar before rust-explorer); one that fails does not stop the rest. Exit codes: 0 success, 1 error (at least one plugin failed), 2 bad arguments or no `--yes`. With no arguments the window opens. Install log: `%ProgramData%\plugin-launcher\install.log`.

### Adding a plugin
1. A crate in `plugins/<name>`, added to `members` in the root `Cargo.toml`.
2. A line in `payload.txt`.
3. `src/install/<name>.rs` with an install/uninstall pair (and a `mod` line in `src/install/mod.rs`). Save the original values before changing anything, so uninstall can put them back.
4. An entry in `PLUGINS` (`src/main.rs`). The window, its height and the command line pick it up on their own.

## License

Licensed under either of [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE) at your option.
