<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-light.svg" />
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-dark.svg" />
  <img src="assets/logo.svg" alt="agy-fast logo" width="80" />
</picture>

# agy-fast

**Latency, Token-Quota & Tool-Call Accelerator Plugin for Google Antigravity**

[![Version](https://img.shields.io/github/v/tag/INK-Q/agy-fast?label=version&sort=semver&style=flat-square&color=38BDF8&labelColor=0F172A)](CHANGELOG.md)
[![GitHub Stars](https://img.shields.io/github/stars/INK-Q/agy-fast?style=flat-square&color=FACC15&labelColor=0F172A)](https://github.com/INK-Q/agy-fast/stargazers)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-22C55E?style=flat-square&logo=node.js&logoColor=white&labelColor=0F172A)](#quick-start)
[![Runtime Dependencies: 0](https://img.shields.io/badge/runtime%20deps-0-38BDF8?style=flat-square&labelColor=0F172A)](#how-it-works)
[![Platforms](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-64748B?style=flat-square&labelColor=0F172A)](#quick-start)
[![MIT License](https://img.shields.io/badge/license-MIT-22C55E?style=flat-square&labelColor=0F172A)](LICENSE)
[![Glama MCP Server](https://glama.ai/mcp/servers/INK-Q/agy-fast/badges/score.svg)](https://glama.ai/mcp/servers/INK-Q/agy-fast)
[![HOL Guard Verified](https://img.shields.io/endpoint?url=https%3A%2F%2Fhol.org%2Fapi%2Fregistry%2Fbadges%2Fplugin%3Fslug%3Dink-q%252Fagy-fast%26metric%3Dscore&style=flat-square&labelColor=0F172A)](https://hol.org/registry/plugins/ink-q%2Fagy-fast?utm_source=hol_marketplace&utm_medium=plugins_badge&utm_campaign=plugins&utm_content=ink-q%2Fagy-fast&ref=plugin-author-5dc88d78)

English · [简体中文](README.zh-CN.md) · [Quick Start](#quick-start) · [Benchmarks](#real-world-benchmarks) · [MCP Tools](#the-5-mcp-tools) · [Analysis Report](docs/ANALYSIS_REPORT.md) · [Changelog](CHANGELOG.md)

</div>

<br />

**`agy-fast`** is a zero-dependency, policy-compliant local [MCP](https://modelcontextprotocol.io/) plugin for **Google Antigravity** (CLI `agy`, Desktop 2.0, and IDE). It cuts agent wall-clock latency, billable token quota, and upload traffic by consolidating high-frequency searches, multi-language symbol outlines, atomic multi-file edits, and build/test checks into batched local calls—and injecting a sub-50 ms workspace snapshot once per session—without altering Antigravity's native UI, diff viewer, modified-files list, checkpoints, or safety checks.

| LLM Turns / 10 Actions | Est. Billable Quota | Tool-Return Upload | Spills & Native UI Impact |
| :---: | :---: | :---: | :---: |
| **-33.7%**<br><sub>`-38.2%` ≥150k ctx · `-58.8%` subagents</sub> | **-31.5%**<br><sub>`-36.5%` ≥150k ctx · `-54.0%` subagents</sub> | **-39.7%**<br><sub>`-53.7%` uncached fresh input</sub> | **0**<br><sub>`≤8.8 KB` inline cap · Native diff & UI untouched</sub> |

<p align="center">
  <img src="assets/demo-before-after.gif" alt="agy-fast Before vs. After multi-file workflow comparison: 6 turns (48.2s) reduced to 2 turns (14.1s) with 0 disk spills" width="100%" />
</p>

## Quick Start

**Requirements:** **Node.js >= 20** (no `npm install` needed — pre-built, unminified zero-dependency ESM bundles are included in `dist/`). Optional: [`ripgrep` (`rg`)](https://github.com/BurntSushi/ripgrep) for faster code search (automatically falls back to pure Node.js when absent).

### One-Command Install (Recommended)

Installs runtime files to `~/.gemini/config/plugins/agy-fast`, runs `agy plugin validate --strict` and `agy plugin enable agy-fast` when `agy` is installed, and verifies both the MCP server and `SessionStart` hook live:

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/INK-Q/agy-fast/main/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/INK-Q/agy-fast/main/install.ps1 | iex
```

> [!TIP]
> **Activating in Desktop 2.0 / IDE:** Open **Customizations → Installed** in Antigravity, confirm `agy-fast` is enabled, and start a **new session** to load the `SessionStart` hook and MCP tools.
>
> **Launching `agy` CLI without approval prompts (optional):** To auto-approve `agy-fast` MCP calls and tool permissions without prompting on every step, start the CLI with:
>
> ```bash
> agy --dangerously-skip-permissions
> ```
>
> *(Official `agy` flag that auto-approves all tool permission requests without prompting — use only in trusted repositories, or pair with `--sandbox`.)*

<details>
<summary>More installation options (local clone, direct git clone, <code>agy</code> CLI, per-repo team install, or ask Antigravity)</summary>

#### Local Clone (Any OS)
```bash
git clone https://github.com/INK-Q/agy-fast.git
cd agy-fast
node scripts/install.mjs install
```

#### Direct Clone into Antigravity Plugins Directory (No Script Needed)
Antigravity automatically discovers plugins placed in `~/.gemini/config/plugins/`:

```bash
# macOS / Linux
git clone https://github.com/INK-Q/agy-fast.git ~/.gemini/config/plugins/agy-fast
```

```powershell
# Windows (PowerShell)
git clone https://github.com/INK-Q/agy-fast.git "$env:USERPROFILE\.gemini\config\plugins\agy-fast"
```

#### Native Antigravity CLI (`agy`)
```bash
agy plugin install /path/to/agy-fast
agy plugin enable agy-fast
```

#### Per-Repository Installation (Team Sharing)
Install only for a single repository (writes to `<repo>/.agents/plugins/agy-fast`):
```bash
node scripts/install.mjs install --project /path/to/your-repo
```

#### Ask Antigravity Directly
Paste this prompt into Antigravity:
```text
Clone https://github.com/INK-Q/agy-fast.git to ~/.gemini/config/plugins/agy-fast, run `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs doctor`, and enable the agy-fast plugin.
```

</details>

## How It Works

Empirical analysis of **55 real Antigravity sessions** (**8,446 LLM turns**, **17,302 tool calls**, **55.25 hours** of single-agent active time; see [docs/ANALYSIS_REPORT.md](docs/ANALYSIS_REPORT.md)) revealed that slow tasks are rarely limited by token generation speed. Instead, four structural bottlenecks dominate wall-clock time:

| Measured Bottleneck | Empirical Cost | How `agy-fast` Eliminates It |
| :--- | :--- | :--- |
| **Per-turn TTFT floor** | `~6.1 s` median TTFT (`79%` of a median turn; `68.1%` of turns emit `<700` tokens) | Batches an average of **4.89** logical actions per MCP call (`5.95×` in subagents), cutting unnecessary round-trip turns (`~6–8 s` each) |
| **Serial checks & fragmented ops** | `52.5%` of `edit_file` calls are same-file splits; `46.3%` of `run_command` calls are read-only searches (`~2.0 s` median vs `2.1 ms` local `rg`) | Consolidates up to 20 searches, 50 file edits + `verify`, or 12 build/test commands inside one persistent local Stdio MCP server |
| **Cold-start exploration** | First 3 turns average **49.2 seconds** inspecting directory layout, git state, and scripts | `SessionStart` hook injects a `≤1.5 KB` snapshot (git state, 2-level tree, multi-module scripts) once in `~35–50 ms` |
| **Context bloat & cache decay** | `read_file` accounts for **81.9%** of tool-returned bytes; `>60 s` gaps spike cache misses from `1.4%` to `15.9%–93.8%` | Symbol outlines first + parallel targeted `read_file`, hard `≤8.8 KB` UTF-8 inline cap (zero `output.txt` disk spills), and multimodal isolation rules |

### Hybrid Execution Architecture

`agy-fast` never replaces fast native reads. It combines batched local MCP tools with Antigravity's locally allowlisted `read_file` (`~7 ms`, `46 KB/call` inline, zero remote check):

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/architecture-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="assets/architecture-light.svg" />
    <img alt="agy-fast Hybrid Execution Architecture" src="assets/architecture-light.svg" width="100%" />
  </picture>
</p>

### Plugin Components

| Component | Path | Role |
| :--- | :--- | :--- |
| **Plugin Manifest** | [`plugin.json`](plugin.json) | Standard Antigravity manifest; passes `agy plugin validate --strict` |
| **Local Stdio MCP Server** | [`mcp_config.json`](mcp_config.json) → [`dist/mcp-server.mjs`](dist/mcp-server.mjs) | Persistent local process exposing 5 eagerly loaded composite tools (`"eager": true`) under `agy-fast_fast` |
| **Startup Snapshot Hook** | [`hooks.json`](hooks.json) → [`dist/session-start.mjs`](dist/session-start.mjs) | Runs once on `SessionStart` (`~35–50 ms`, `250 ms` scan circuit-breaker + OS/home-dir skip list), emitting a `≤1.5 KB` workspace snapshot |
| **Routing & Hygiene Rules** | [`rules/AGENTS.md`](rules/AGENTS.md) | Compact (`~6.5 KB`) routing guide with inlined schemas (supports user-owned `rules/AGENTS.local.md` with `trigger: always_on` frontmatter, preserved across updates) |
| **Background Auto-Updater** | [`dist/updater.mjs`](dist/updater.mjs) | Detached 4 h release checker with staged MCP smoke verification |
| **Offline Benchmark CLI** | [`dist/benchmark.mjs`](dist/benchmark.mjs) | Local `transcript.jsonl` analyzer and before/after A/B comparator |

## Real-World Benchmarks

Across **10 days of sanitized real coding transcripts** (**14 baseline main sessions / 5,771 turns** vs. **7 `agy-fast` main sessions / 901 turns**, plus **104 baseline vs. 4 `agy-fast` subagent sessions**; all repository names, paths, and identifiers stripped), each `agy-fast` call batched an average of **4.89 logical operations** (`5.95×` in subagents):

| Metric *(normalized per logical action)* | Main Sessions (Baseline) | Main Sessions (`agy-fast`) | Delta | `≥150k` Long Context | Subagents |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **LLM turns / 10 actions** | 5.23 | **3.47** | **-33.7%** | **-38.2%** | **-58.8%** |
| **Upstream requests / 10 actions** *(LLM + remote checks)* | 9.82 | **6.05** | **-38.4%** | **-42.6%** | **-62.0%** |
| **Prompt Cache hit rate** *(miss spikes)* | 89.6% *(7.5%)* | **94.0%** *(4.8%)* | **+4.4 pp** | **95.0%** *(3.3%)* | 92.4% *(2.8%)* |
| **Uncached fresh input / action** | 10,413 tok | **4,822 tok** | **-53.7%** | **-61.5%** | **-51.3%** |
| **Est. billable quota / action** *(1 : 0.1 : 5)* | 22,458 eq | **15,387 eq** | **-31.5%** | **-36.5%** | **-54.0%** |
| **Tool-return upload / action** *(actual local bytes)* | 5.06 KB | **3.05 KB** | **-39.7%** | **-42.6%** | **-13.3%** |
| **Incremental text upload / action** *(fresh input est.)* | 35.6 KB | **16.5 KB** | **-53.7%** | **-61.6%** | **-51.3%** |
| **Full-context text upload / action** *(stateless resend est.)* | 342.2 KB | **276.2 KB** | **-19.3%** | **-21.9%** | **-58.9%** |

**Production hardening highlights (`v0.2.x`):**
- **0 disk spills** across 134 consecutive `v0.2.x` MCP calls — strict `≤8.8 KB` UTF-8 inline cap prevents Antigravity's `output.txt` spill-to-disk extra turns.
- **+75% effective throughput (`35.1 → 61.5 tok/s`)** and **`>60s` stall turns reduced from `31.2% → 7.4%`** in a same-session before/after `v0.2.1` comparison (99 vs. 374 turns) once multimodal screenshots were isolated out of `>180k`-token main sessions (`0` screenshots loaded in main coding sessions post-upgrade).
- **0 lazy-load schema-read turns** — compact schemas are inlined directly in [`rules/AGENTS.md`](rules/AGENTS.md).

<details>
<summary>Methodology, quota sensitivity &amp; fixed prompt overhead</summary>

- **Logical action normalization:** One `batch_search` with 5 queries counts as 5 actions, one `apply_edits` touching 6 hunks + `verify` counts as 7 actions, and one built-in `read_file`/`edit_file`/`run_command` counts as 1 action—ensuring apples-to-apples comparison per unit of work rather than raw tool-call counts.
- **Quota weighting sensitivity:** Standard weighting (`1.0×` uncached input, `0.1×` cache read, `5.0×` output) yields **-31.5%** on main sessions (**-36.5%** on `≥150k` sessions). Results hold under conservative cache discounts (`1 : 0.25 : 4` → **-25.8%**) and high-output weighting (`1 : 0.1 : 8` → **-29.4%**).
- **Fixed prompt overhead:** `rules/AGENTS.md` + `SessionStart` snapshot add **~1.7k tokens** once per session (cached from turn 2 onward, `~170` eq tokens/turn). Avoiding a single redundant turn (`~44k` eq tokens) or blind full-file read pays back this overhead **>20×**.

</details>

### Verify on Your Own Transcripts (100% Offline)

Measure your own Antigravity sessions locally — nothing ever leaves your machine:

```bash
# Summarize all local Antigravity transcripts
node dist/benchmark.mjs analyze --local

# Analyze only the 10 most recently modified local transcripts
node dist/benchmark.mjs analyze --local --recent 10

# Slice sessions since install time and compare With vs. Without agy-fast
node dist/benchmark.mjs analyze --local --since 2026-11-19T12:51:00+08:00 --split-usage

# Compare two task runs (before vs. after)
node dist/benchmark.mjs compare --before ./run-before/transcript.jsonl --after ./run-after/transcript.jsonl
```

## The 5 MCP Tools

| Scenario | Preferred Tool | Why |
| :--- | :--- | :--- |
| Run ≥2 text, regex, glob, fuzzy, or read-only git queries | **`batch_search`** | 1 call for up to 20 concurrent queries (`<70 ms` local) |
| Map unknown large files (`>300` lines) | **`quick_outline`** *(or **`read_slices`**)* | Flat `paths`-only symbol outlines across up to 40 files without full-file dumps |
| Read small files (`<300` lines) or known line ranges | Built-in `read_file` | Locally allowlisted (`~7 ms`, `46 KB/call`, 0 remote check) |
| Edit ≥2 hunks/files in one turn, or edit + verify | **`apply_edits`** | Atomic or `bestEffort` multi-file edits + optional inline `verify` |
| Run ≥2 independent build, lint, test, or diagnostic commands | **`run_checks`** | Concurrent execution with head-tail folded error-focused output |

### 1. `batch_search` — Concurrent Code, Path & Read-Only Git Search
- **Up to 20 mixed queries per call:** `text`, `regex`, `glob`, `fuzzy`, and read-only `git` (`status`, `diff`, `log`, `show`, `branch`, `rev-parse`, `ls-files`, `blame`, `shortlog`, `describe`, `tag --list`, `remote -v`), including cross-repo lookups via per-query `path`.
- **Precision controls:** Filter by `fileType` (e.g., `typescript`, `python`, `gdscript`) or `glob`, switch `outputMode` (`content` | `files_with_matches` | `count`), enable cross-line `multiline: true` (where `count` reports occurrences per file), use `type: "fuzzy"` for case-insensitive path matching, or pass `sortBy: "mtime"` on `glob` queries for newest-first results.
- **Resilient & inline-safe:** Uses `rg` when installed with automatic Node.js fallback, auto-recovers common LLM `glob` mistakes (`|` alternation and bare keywords), and enforces the `≤8.8 KB` UTF-8 cap.

### 2. `apply_edits` — Atomic Multi-Hunk & Multi-File Edits + Verify
- **Up to 50 files per call:** Validates every hunk and overlap in memory before touching disk (`0` files modified on error), or pass `bestEffort: true` on larger batches so valid files commit atomically per file while failed files return closest-line / drifted-line snippets for targeted retry.
- **Faithful file handling:** Preserves CRLF line endings, file permissions, and symlinks; supports `startLine`/`endLine`, `replaceAll`, `create`/`overwrite`, and `dryRun`.
- **Inline `verify`:** Optionally runs a build/typecheck/test command right after writing, stripping noisy logs (e.g., Pino/Bunyan info JSON, Maven footers) so root causes stay within budget.

### 3. `quick_outline` — Flat Multi-Language Symbol Outlines
- **Up to 40 files per call** *(10–20 recommended per batch)*: Takes a flat `paths: string[]` array to extract exact `[startLine, endLine]` symbol/section maps for **TypeScript / JavaScript** *(incl. Fastify/Express routes & test blocks)*, **HTML / Vue / Svelte**, **CSS / SCSS / Less**, **Python**, **Godot GDScript (`.gd`)**, **Go**, **Rust**, **Java / Kotlin / C# / Swift / C / C++**, **Shell**, **Markdown**, and **JSON / YAML**—making outline-first exploration effortless before parallel built-in `read_file`.

### 4. `read_slices` — Symbol Outlines + Targeted Line Slices
- **Outlines + piggybacked slices:** Supports the same 15-format outlines (with breadth-first water-filling per file) plus optional tiny `[startLine, endLine]` slices in one call under the `≤8.8 KB` UTF-8 budget, while steering bulk range reads (`>150` lines) to parallel built-in `read_file`.

### 5. `run_checks` — Concurrent Build, Lint, Test & Diagnostic Runner
- **Up to 12 commands per call:** Executes independent non-interactive shell commands in a bounded worker pool (`concurrency: 1..8`) with per-command timeouts (`1..170 s`, sharing a `170 s` call budget under Antigravity's `180 s` MCP limit), ANSI escape stripping, and transparent Windows unwrapping of trivial `powershell -Command "..."` wrappers around allowlisted binaries (`git`, `npm`, `node`, `rg`, `pytest`, `cargo`, etc.) to skip PowerShell cold-start overhead while leaving PowerShell cmdlets/aliases untouched.
- **Head-Tail adaptive output modes:** `compact` (default) collapses passing commands to 1-line summaries and uses **Head-Tail folding** on large failures so both initial root-cause errors and final summary/stack tails survive the `≤8.8 KB` inline cap; `full` preserves stdout for diagnostic or audit scripts with Head-Tail folding when capped.

<details>
<summary>Example batched MCP calls (JSON payloads)</summary>

**`batch_search` — 3 heterogeneous queries in one call:**
```json
{
  "queries": [
    { "type": "regex", "pattern": "export (async )?function", "fileType": "typescript", "outputMode": "files_with_matches" },
    { "type": "fuzzy", "pattern": "mcp server" },
    { "type": "git", "pattern": "status --short" }
  ]
}
```

**`apply_edits` — Multi-file edit + inline typecheck in one call:**
```json
{
  "edits": [
    { "path": "src/a.ts", "hunks": [{ "target": "oldCall()", "replacement": "newCall()" }] },
    { "path": "src/b.ts", "hunks": [{ "target": "v1", "replacement": "v2", "startLine": 10, "endLine": 25 }] }
  ],
  "bestEffort": true,
  "verify": "npm run typecheck"
}
```

</details>

## Updates, Diagnostics, and Uninstall

### Day-to-Day CLI Reference

| Task | Command |
| :--- | :--- |
| **Health check** *(Node, `rg`, live MCP handshake, `SessionStart` latency, manifest validation)* | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs doctor` |
| **Check for updates** *(read-only)* | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs update --check` |
| **Update now** *(stages & runs MCP smoke test before swapping)* | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs update` |
| **Configure auto-update** *(`auto` \| `notify` \| `off`)* | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs config --auto-update notify --interval 24` |
| **Switch MCP tool loading** *(`eager` \| `lazy`, preserved across updates)* | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs config --tool-loading lazy` |
| **Uninstall cleanly** | `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs uninstall` |

> From a local repository clone, `./install.sh <command>` (macOS/Linux) and `.\install.ps1 <command>` (Windows) accept the same subcommands (`doctor`, `update`, `config`, `uninstall`).

### Zero-Latency Background Auto-Updater

- **0 ms session startup cost:** Every **4 hours**, `SessionStart` spawns a detached background process (`dist/updater.mjs`) *after* emitting the workspace snapshot.
- **Verified before swap:** Checks GitHub release tags (`git ls-remote --tags` with GitHub Releases API fallback), clones into an isolated staging directory, runs a **live MCP smoke test**, and atomically replaces runtime files—automatically rejecting broken releases while preserving any user-created `rules/AGENTS.local.md` (add `---\ntrigger: always_on\n---` YAML frontmatter so Antigravity loads it; gitignored for `git clone` installs).
- **Safe by design:** Standard copied installs and clean direct `git clone` installs auto-update automatically; `--link` dev symlinks and dirty git repos are **never overwritten** (notify-only). A one-time notice appears in the next new session when an update is applied or available.

<details>
<summary>Environment variable overrides &amp; applying updates</summary>

| Environment Variable | Values / Default | Purpose |
| :--- | :--- | :--- |
| `AGY_FAST_AUTO_UPDATE` | `auto` *(default)* \| `notify` \| `off` | Overrides saved auto-update mode |
| `AGY_FAST_UPDATE_INTERVAL_HOURS` | `12` *(default; `1..720`)* | Background check interval in hours |
| `AGY_FAST_UPDATE_CHANNEL` | `release` *(default)* \| `main` | Track stable semver release tags or `main` |
| `AGY_FAST_REPO` | Git URL | Use a custom mirror or fork |
| `AGY_FAST_EDITS_FORMAT` | `auto` *(default)* \| `array` \| `string` | Controls `apply_edits.edits` schema (`auto` uses token-saving native arrays on eager-capable CLI ≥1.5.8, Desktop 2.0, IDE, and third-party hosts, and switches to JSON array strings on pre-eager CLI 1.5.0–1.5.7; server always accepts both) |
| `AGY_FAST_HOST` | e.g. `cli@1.5.14`, `ide@2.7.0`, `desktop@2.34.0` | Overrides auto-detected Antigravity host surface & version |

**Applying updates:** Updated `rules/AGENTS.md` and `dist/session-start.mjs` take effect automatically on the next new session. In Antigravity Desktop 2.0 / IDE, reload or restart the window once to refresh the resident MCP server process.

</details>

## Policy Compliance and Safety

- **Official interfaces only:** Built exclusively on documented Antigravity extension APIs (`plugin.json`, `mcp_config.json`, `hooks.json`, `rules/AGENTS.md`).
- **Non-invasive by design:** Never alters or interferes with Antigravity's native UI, **diff viewer/window**, **modified-files list**, checkpoints, or built-in tools.
- **No safety or binary tampering:** Does not patch client binaries, alter authentication, or bypass Antigravity's built-in safety evaluations.
- **Zero per-step blocking hooks:** Registers no `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, or `Stop` hooks.
- **Fail-open startup hook:** On unreadable directories or malformed stdin, `SessionStart` returns `{}` and exits cleanly—never blocking a session.
- **Local-first & auditable:** All 5 MCP tools and the benchmark CLI run 100% locally with zero code or transcript uploads; shipped `dist/*.mjs` bundles are unminified ESM so every executed line is directly auditable.

## FAQ

### Does `agy-fast` affect Antigravity's native UI, diff viewer, or modified-files list?
No. `agy-fast` runs strictly as a standard local Stdio MCP plugin with a `SessionStart` hook. It never patches the Antigravity client or interferes with the native diff viewer/window, modified-files list, checkpoints, built-in tools, or safety checks.

### Does `agy-fast` save token quota and upload bandwidth in addition to reducing latency?
Yes. Across 10 days of sanitized real coding transcripts, batching ~4.9 operations per MCP call reduced LLM turns by **33.7%**, estimated billable token quota by **31.5%** (**36.5%** in `≥150k`-token sessions; **54.0%** in subagents), tool-return upload bytes by **39.7%**, and `>60s` stall turns from **31.2% → 7.4%**.

### Does `agy-fast` replace Antigravity's built-in `read_file` or `edit_file` tools?
No — it complements them in a hybrid workflow. Built-in `read_file` is locally allowlisted (`~7 ms`, `46 KB/call`, zero remote check), so `agy-fast` routes small files and known line ranges straight to parallel built-in `read_file`, while handling multi-query searches, symbol outlines, multi-hunk/multi-file edits with inline `verify`, and concurrent checks via MCP.

### Which Antigravity editions and operating systems are supported?
`agy-fast` supports **Antigravity CLI (`agy`)**, **Antigravity Desktop 2.0**, and **Antigravity IDE** across **macOS, Linux, and Windows**. It requires **Node.js >= 20** with zero runtime dependencies (optional `ripgrep`/`rg` with automatic pure-Node.js fallback).

### Does `agy-fast` send any code or transcript data to external servers?
No. All MCP tools, the `SessionStart` snapshot hook, and the transcript benchmark CLI operate 100% locally. The only optional network request is the background update checker checking public GitHub release tags once every 4 hours, which can be switched to `notify` or disabled completely via `config --auto-update off` or `AGY_FAST_AUTO_UPDATE=off`.

### How do I verify the speedup or uninstall `agy-fast` cleanly?
Run `node dist/benchmark.mjs analyze --local --split-usage` to benchmark your own local transcripts completely offline. To remove `agy-fast` at any time, run `node ~/.gemini/config/plugins/agy-fast/scripts/install.mjs uninstall`.

## Development

```bash
npm install
npm run typecheck   # Strict TypeScript check
npm run build       # Bundle src/*.ts -> dist/*.mjs with esbuild
npm test            # Run unit, MCP protocol, hook, benchmark, and installer tests
npm run bench:stress # Run 12-scenario end-to-end stress & performance benchmark
npm run validate    # Run `agy plugin validate --strict .`
```

## MCP Directory

<a href="https://glama.ai/mcp/servers/INK-Q/agy-fast">
  <img width="380" src="https://glama.ai/mcp/servers/INK-Q/agy-fast/badge" alt="agy-fast MCP server on Glama" />
</a>

## Star History

<a href="https://www.star-history.com/#INK-Q/agy-fast&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=INK-Q/agy-fast&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=INK-Q/agy-fast&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=INK-Q/agy-fast&type=Date" />
  </picture>
</a>

## License

[MIT](LICENSE)
