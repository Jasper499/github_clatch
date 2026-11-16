# Relax

> [!WARNING]
> **Experimental, and not affiliated with Rust.** Relax, its compiler and its JIT included, is not affiliated with or endorsed by the Rust project or the Rust Foundation. It is an AI-generated reimplementation of the Rust language, designed to minimise latency for LLMs working with Rust code, and should be viewed only as an experimental developer tool. Rust is a trademark of the Rust Foundation.
>
> **It does not inherit Rust's safety guarantees automatically.** rustc's checks, and the memory safety they give safe code, hold under Relax only as far as Relax reimplements them correctly. Relax can contain any number of bugs at runtime, and a bug in Relax can make a correct program, safe code included, misbehave or crash.
>
> Relax is for development iteration: running, testing and live-editing your program while you work on it. Build anything you release with Rust itself: `cargo build --release` with rustc. So far it has been tested mostly in Makepad's own edit-run loop and only lightly on other projects, so expect rough edges elsewhere and please report them.

### Rust without the wait.

**rustc builds your program, then you run it. Relax runs your program while it builds it.**

Relax is a live compiler and JIT runtime for Rust, written in Rust. It runs a Cargo package straight
from source, with no rustc, LLVM or linker in the loop: it compiles each function when it is first
called, optimises the hot ones while the program runs, and patches your edits into the running process.

## Relax vs cargo and rustc

| | cargo + rustc | **Relax** |
| --- | --- | --- |
| **Large 3D game, clean checkout → first frame** | ~3 min build, then start | **11 s** on an M4 MacBook, straight from source |
| **Same game, second run → first frame** | start the built binary | **1.15 s** on an M4 MacBook, nothing recompiled |
| **Small app → first frame** | build it first | **3.7 s** cold, **0.41 s** warm (M4 MacBook) |
| **Change one function in a running program** | rebuild, relink, restart: state lost | **patched in**: state kept |
| **Save a file → 92 tests re-run** | rebuild the test binary first | **2.2 s** after the save |
| **Type and borrow check** | `cargo check`; a build checks everything first | `relax check`; a run type-checks each function before it runs and borrow-checks in the background |
| **Speed of optimised code** | 1.00× (`--release`) | **slower: 1.12× the time on x64, 1.24× on arm64** (geomean of 21 workloads) |
| **Needs** | rustc, LLVM, a linker | **one Rust library**: 438k lines, 0 crates.io dependencies |

Code generation for x86-64 and AArch64; from a fresh clone the repository
builds and its tests pass on Linux x86-64 and macOS arm64. Windows isn't tested.

## The tradeoffs

- **Slower optimised code.** Overall the code Relax runs is slower than rustc's `--release`: 1.12× the time on x64
  and 1.24× on arm64 (geomean of 21 workloads), 1.22× and 1.25× against a native-CPU build. It is faster on only
  a few workloads: see [where LLVM still wins](#where-llvm-still-wins).
- **More memory.** The compiler, its caches and every code version it publishes share your program's
  process, and JIT code is append-only. `relax inspect <pid> memory` shows the split, `code` the growth.
  The code cache in a package's `target/relax` takes 120 to 190 MB for `hello`.
- **`relax check` isn't faster than `cargo check` yet.** On a large package a cold check takes longer
  and uses more memory than `cargo check`, and an edit can re-check more than it needs to. We're
  working on it.
- **Not every crate runs yet.** [libs/relax/KNOWN_GAPS.md](libs/relax/KNOWN_GAPS.md) lists the open
  gaps, each with a repro.
- **Not every edit patches live.** Function bodies do. A changed struct layout, import, trait or impl
  header, or macro waits for a restart, which Relax offers: `relax inspect <pid> session relaunch`.
- **The borrow checker runs beside the program.** A run type-checks each function before it runs and
  borrow-checks in the background; `relax run --check-first` waits for the borrow checker instead.
- **Not Rust's guarantees.** Relax is an AI-generated reimplementation, not rustc, and is not affiliated with the Rust project. Safe Rust is only as safe under Relax as Relax's own checks and code generation are correct, and a bug there can break a correct program at runtime.
- **Not a release build.** Relax is for the edit-run loop. Ship what `cargo build --release` builds.
  So far it has been tested mostly in Makepad's own edit-run loop and only lightly on other projects, so expect rough edges elsewhere and please report them.

## What you get from a JIT

`relax run` prints a `relax-remote: pid <pid>` line. Every command below except `run` and `test` is
`relax inspect <pid> <command>`, a question the running program answers while it runs.

| | What it does | Command |
| --- | --- | --- |
| **Hot patching, state kept** | Save a file: the changed functions are rechecked, recompiled and swapped into the running program. A call into code that doesn't compile waits until an edit fixes it. | `relax run <package>` |
| **Tests on save** | Keeps the tests warm and re-runs the ones that entered the functions you changed. | `relax test --live <package>` |
| **Pause on panic** | A panic parks its thread with the stack intact: up to 10 minutes at a terminal, 2 s when nothing is attached. Read its locals, evaluate Rust in its frame, then let it unwind, or rerun a `restartable` function from its entry. | `panics`, `locals panic=P1`, `eval <expr>`, `resume P1 panic` |
| **Breakpoints, no debugger** | A hit parks the thread at the call with its stack intact. | `break <file>:<line>`, `locals break=K1`, `continue` |
| **Hangs explained** | Deadlock, blocked, busy or idle: the verdict, the wait chain and the stacks of the threads in it. | `why-hung` |
| **Profiling** | Samples JIT and native frames: CPU per thread, the top functions with their hottest line, a call tree with each frame's tier, folded stacks for flame graphs. | `prof s=3`, `prof view=tree`, `why-slow` |
| **Flight recorder** | Always on, in bounded memory: the last minutes of threads, waits, compiles and events, saved by itself on a panic, a fault or a hitch over 1 s. | `rec save` |
| **Memory and leaks** | Where the memory is (RSS by kind, malloc in use and held free, Relax's own share), and the program's heap by allocation stack, with leak candidates between snapshots. Heap tracking runs on Linux x86-64 and macOS arm64 only. | `memory`, `heap start`, `heap snap a`, `heap diff a now` |

`relax inspect <pid> help` lists the rest, among them `asm <fn> vs=rustc` (the JIT's machine code
beside rustc's), `count <fn>` (exact call counts) and `counters` (hardware counters).

## Try it

From a fresh clone, build `relax` and run a new package through the JIT:

```sh
git clone https://github.com/makepad/relax
cargo build --release --manifest-path relax/Cargo.toml -p relax-runner --bin relax

cargo new hello
cd hello
../relax/target/release/relax run --quiet hello    # run main under the JIT
../relax/target/release/relax test hello           # run its #[test] fns
../relax/target/release/relax check hello          # type- and borrow-check only
```

Run `relax` in the package's folder and give it the package's name, not a path. It reads Relax's std
from the checkout it was built in, so keep the `relax` folder where it is.

`relax test` runs no rustc, so the target holds no rustc-format `.rlib` or `.rmeta` of the crate: a test
that hands the crate's `.rlib` to an external rustc needs `cargo build --lib` first.

Measured from a fresh clone: building `relax` took 53 s on a 16-core x86-64 Linux box and 78 s on a
10-core arm64 Mac with cargo held to 4 jobs. The first `relax run` of `hello` took 0.24 s and 0.97 s,
the next ones 0.01 to 0.07 s. Relax keeps what it compiles in the package's `target/relax`
(`relax clean` removes it), so each new package starts cold.

**Network.** A package with no dependencies, like `hello`, needs none. For a crates.io dependency Relax
takes the package from `~/.cargo`'s registry when it is there, and otherwise downloads it from
crates.io itself, checked against the index's SHA-256. With `RELAX_OFFLINE=1` or cargo's
`CARGO_NET_OFFLINE` it never downloads. `relax fetch <git-url>` (`tools/run/runner/src/fetch.rs`)
stores a git repository as one file under `~/.relax`.

---

## What it took: a new Rust toolchain

Relax isn't a wrapper around rustc or a plugin for LLVM. It replaces both, and the parts of Cargo and
the linker in between, with one Rust library.

| The job | In the usual toolchain | **In Relax** |
| --- | --- | --- |
| Lex, parse and expand macros, `macro_rules!` and procedural | rustc | **relax-lex, relax-front** |
| Resolve names, solve traits, infer types, check borrows, evaluate constants | rustc | **relax-types** |
| Optimise: inlining, folding, loops, ranges | rustc's MIR passes + LLVM | **relax-codegen** (O1 and O3) |
| Allocate registers, emit x86-64 and AArch64 machine code | LLVM | **relax-backend** |
| Link and load | the system linker and loader | **relax-compiler**, straight into executable memory |
| Read manifests and resolve the crate graph | Cargo | **relax-base** |
| Build `core`, `alloc` and `std` | shipped prebuilt | **compiled from source by Relax** (134k lines) |

| | cargo + rustc | **Relax** |
| --- | --- | --- |
| **Compiling** | Whole crates, ahead of time. | **One function at a time, when it is first called.** Hot functions move up in the background: interpreter → O1 → O3. `#[relax(O2)]` / `#[relax(O3)]` ask for a level ahead of time; under rustc the attribute does nothing. |
| **Caching** | Incremental artefacts that can go stale. | **Every result keyed by the hashes of its inputs**: a hit is what a fresh compile would produce, so there's no `cargo clean`. |
| **Procedural macros** | Built as native dylibs, then loaded. | **Run natively when they match a linked build, otherwise on the JIT.** |
| **Native code** | Everything is native. | **Crates that must stay native (OS layers, GPU, audio) export an interface with `#[relax_api]`**, which JIT code calls through the C ABI. |

## How Makepad uses Relax

**Relax comes from the [Makepad](https://github.com/makepad/makepad) project. `makepad run` and its
tooling live in Makepad's repository, not in this one; this section describes how Makepad uses Relax.**

`makepad` is Relax's runner plus a Makepad host. A UI app started with `makepad run <package>` gets:

| | What the app gets | Command |
| --- | --- | --- |
| **No native build** | Its window opens at once with the build's progress; the app's first window takes it over. | `makepad run <package>` |
| **Save to patch** | Edits patch into the running app; its state and windows stay. | on by default |
| **Restart in place** | An edit that can't patch (a type's layout, an import, a trait or impl header, a macro) shows "Update ready" on the caption's JIT ring. A click restarts the app in the same process and window, with its state (`AppMain::restart_state`) and window frames; unsaved work can hold it back (`AppMain::can_restart`). | `session relaunch` |
| **Errors in the window** | Compile errors and edits the borrow checker refuses show over the app, with file and line. After a crash the window stays and offers Restart once the sources change. | `session view open` |
| **Fix a panic, then retry** | A panic pauses the app and the ring says "Paused on a panic"; a click shows the message and where. On the UI thread, fix the code, save, and `retry` reruns the event with the new code. | `panics`, `locals panic=P1`, `resume P1 retry` |
| **See the code** | Each function's code versions, O3 remarks, machine code beside rustc's, and the flight recorder. | `versions <fn>`, `remarks <fn>`, `asm <fn> vs=rustc`, `rec save` |
| **Drive the UI** | The app's remote control shares Relax's inspect socket (same user, nothing on the network). | `ui find q=<text>`, `ui act node=<id> press`, `grab` |

Commands other than `makepad run` go to `makepad inspect <app>`. Across a day of Makepad's agent lanes,
an edit was patched 3.6 s (median) after it reached the machine, 86 s at p90 on a cold JIT or cache.

## Built for AI agents

An AI agent can't feel a slow build, but it pays for every one in tokens, wall-clock and lost context.
[Makepad](https://github.com/makepad/makepad) builds its apps with many AI agents working in parallel,
and its dev hub, **devhub**, keeps each agent's app or test run alive under Relax on a warm machine.

| An agent's iteration | With cargo + rustc | **With Relax + devhub** |
| --- | --- | --- |
| **Edit reaches the program** | rebuild and relink: minutes on a large app | **shipped in 0.1 s, patched in 3.6 s** (medians) |
| **Test verdict** | rebuild the test binary, then run | **92 tests back 2.2 s after the save** |
| **See the UI** | rebuild, relaunch, navigate back | **a frame of the live app, grabbed as a PNG** |
| **New worker** | cold build | **starts warm**: every machine keeps a warm cache at the tip |

In practice nine agent lanes run side by side, devhub handles more than 300 build and test jobs an
hour, and dozens of changes land every day, each checked under Relax before it merges.

## Where LLVM still wins

Relax's steady-state code is slower than LLVM's. Time of the same workload under Relax over its time under rustc (lower is better, 1.00× = rustc):

| Workload | x64 vs stock | x64 vs native | arm64 vs stock | arm64 vs native |
| --- | --: | --: | --: | --: |
| Text shaping and glyph rasterisation | 1.36× | 1.38× | 1.33× | 1.31× |
| Signed-distance-field glyph generation | 1.31× | 1.45× | 1.26× | 1.26× |
| DEFLATE decode | 1.20× | 1.19× | 1.26× | 1.25× |
| ZIP archive read | 1.22× | 1.26× | 1.11× | 1.10× |
| PNG decode | 1.21× | 1.25× | 1.32× | 1.32× |
| Brotli decode | 1.29× | 1.26× | 1.27× | 1.28× |
| Vector map tile decode | 1.06× | 1.06× | 1.01× | 0.99× |
| Widget tree layout | 1.54× | 1.49× | 1.75× | 1.74× |
| LLM decode host path | 1.12× | 0.91× | 0.87× | 1.05× |
| Rust source tokenizer | 1.06× | 1.06× | 1.20× | 1.21× |
| Markdown parse | 1.39× | 1.31× | 1.54× | 1.56× |
| HTML parse | 1.06× | 0.89× | 1.04× | 1.11× |
| Physical piano model audio | 1.22× | 1.25× | 1.44× | 1.44× |
| Ogg Vorbis audio decode | 1.20× | 1.20× | 1.24× | 1.27× |
| Game audio mixer | 1.03× | 1.16× | 1.17× | 1.18× |
| Script VM evaluation | 1.11× | 1.09× | 1.12× | 1.13× |
| Solid geometry (CSG) booleans | 1.20× | 1.25× | 1.11× | 1.12× |
| Rigid-body physics | 0.43× | 1.38× | 1.30× | 1.32× |
| Game simulation tick | 0.60× | 1.26× | 1.25× | 1.25× |
| Level walk (navigation grid and walker tours) | 0.87× | 0.87× | 0.91× | 0.91× |
| 3D model build | 2.00× | 2.04× | 1.91× | 1.92× |
| **Geomean (21)** | **1.12×** | **1.22×** | **1.24×** | **1.25×** |

Overall, code run by Relax is slower than code built by rustc: the geomean over 21 workloads is 1.12× the time of stock `--release` on x64 and 1.24× on arm64, and 1.22× and 1.25× the time of a native-CPU build. Relax is faster on only a few workloads. Against stock it is faster on x64 for rigid-body physics (0.43×), game simulation tick (0.60×) and level walk (0.87×), and on arm64 for the LLM decode host path (0.87×) and level walk (0.91×). The two big x64 wins disappear against the native build (rigid-body physics 1.38×, game simulation tick 1.26×): those two wins are against a generic-CPU baseline. The worst workload is 3D model build, at about twice rustc's time.

Kernel micro-benchmarks (30): steady-state geomean 1.14× against stock and 1.24× against native on x64, about 1.23× on arm64. These are provisional until a warm-cache tier-up bug is fixed: with a warm JIT cache some hot functions never tier up to O3, so the kernel figures can read too slow and are upper bounds. The 21-workload table above is not affected.

x64: an 8-core desktop CPU, Linux; arm64: an Apple M4 laptop, macOS. rustc 1.99.1, LLVM 23.1.1. Each figure is the median of 3 rounds, measured 2026-11-12. Stock is `cargo build --release` for a generic CPU; native is `--release` with `-C target-cpu=native`. Relax is timed in its default mode, in steady state after tier-up. On x64 the stock and native columns come from separate runs on the same machine and binaries. On arm64 the generic CPU is already the M-series baseline, so the two columns differ only by noise.

**Which `--release`?** Both are measured: stock (`cargo build --release`, generic CPU) and native (`-C target-cpu=native`). Relax always compiles for the CPU it runs on, so native is the like-for-like column.

**Where the gap comes from**, from instruction-level comparisons of the same functions in one 3D-print slicer run: extra instructions rather than stalls (1.26× the instructions cost 1.15× the cycles).

| Cause | Extra instructions (slicer run) |
| --- | --- |
| Compares kept as bool registers and recomputed | ~25 G |
| Register copies (two-address form, coalescing misses) | ~23 G |
| Stack traffic: loop state kept in stack slots; 12 allocatable registers against rustc's 15 | ~22 G |
| Extra loop-control and check branches, invariant tests left inside loops | ~13 G |
| Loads not folded into compares, i128 arithmetic, rematerialised constants, smaller items | ~33 G |
| Runtime outside the generated code (memcpy, allocator wrappers, TLS access, stubs) | ~40 G |
| No loop vectorisation, shallow unrolling | most of the numeric-kernel gap |

Inlining isn't a cause: Relax inlines more than rustc does. Every row is a work item.

Relax is for development iteration: release builds use rustc.

## Architecture

Relax owns the whole pipeline, from source bytes to executable memory, in one process. It is a stack
of layers, each its own crate, building only on the ones below; the layers compile in parallel, and a
change in an upper layer never rebuilds the ones below.

| Crate | Path | Role | In the rustc world |
| --- | --- | --- | --- |
| `relax-lex` | `libs/relax/lex` | The lexer and token model for Rust (every edition), and the one procedural macros see. | the lexer and `proc_macro` |
| `relax-base` | `libs/relax/base` | Hashing, memory accounting and arenas, the syntax tree, `cfg`, manifests, the git read path and source mounts. | parts of Cargo and rustc's shared infrastructure |
| `relax-session` | `libs/relax/session` | The inputs of a compilation and their stable hashes: the keys every cache is built on. | the session and incremental keys |
| `relax-front` | `libs/relax/front` | Parsing, the crate graph, name resolution and macro expansion. | parser, resolver, macro expansion |
| `relax-types` | `libs/relax/types` | Types, impls, type checking, layouts, constant evaluation and the borrow checker. | type checker, borrow checker, const eval |
| `relax-codegen` | `libs/relax/codegen` | The middle end on RIR (Relax IR): the O1 and O3 optimisers and the threaded interpreter. | MIR optimisations and LLVM's optimiser |
| `relax-backend` | `libs/relax/backend` | Register allocation, x86-64 and AArch64 machine code, the C ABI planner and executable memory. | LLVM's code generator and the linker |
| `relax-compiler` | `libs/relax/compiler` | The JIT runtime and std: lazy compilation, tiering, live edits, caches, the proc-macro host, the test runner and `relax inspect`. | Cargo, the rustc driver, the test harness and the OS loader |
| `relax-native-macros` | `libs/relax/native_macros` | Natively linked procedural macros, checked against their source. | proc-macro dylibs |
| attribute | `libs/relax/attr` | `#[relax(O2)]` / `#[relax(O3)]`: the optimisation-level attribute; a no-op under rustc. | `opt-level` per profile |
| `relax_api` | `libs/relax_api` | `#[relax_api]`: the interface a native crate offers to JIT code, and per-thread heap routing. | (no equivalent: everything is native) |

**A function's life.** Before `main`, the program's own crates are type-checked. The first call of a
function compiles it (interpreter or O1); while it is hot, it is recompiled at O3 in the background and
swapped in. When you save a change to it, Relax rechecks what changed, recompiles it and publishes the
new code; the old code stays valid, and the next call runs the new function.

**Design rules.** *Never stale:* every cached result is keyed by the hashes of its inputs. *Code only
grows:* published machine code is never freed or rewritten while it can still be on a stack, so a swap
is safe where a native hot-reload hack isn't. *Lazy by default:* Relax compiles what you call, not
everything you might. *Inspectable:* every phase reports what it's doing, so a stall can be explained
from its record.

## Repository layout

```
Cargo.toml                              the workspace
libs/relax/
  lex/ base/ session/ front/ types/     front end and type system
  codegen/ backend/                     middle end and machine code
  compiler/                             runtime, std (compiler/std), 96 end-to-end test packages
  attr/ native_macros/                  #[relax(..)] and native proc macros
  KNOWN_GAPS.md                         what isn't supported yet
libs/relax_api/                         #[relax_api] and per-thread heap routing
tools/run/runner/                       relax, the command-line runner
libs/ platform/ tools/ widgets/         the small support crates Relax links: token model,
                                        serialisation, remote inspection, profiling, and the
                                        native proc macros it checks against their source
```

The compiler is the `relax_compiler` library (`cargo build --release -p relax-compiler`); `relax`
(`tools/run/runner`) is its command-line runner. Building it needs a stable Rust toolchain and nothing
from crates.io.

## License

MIT, see [LICENSE](LICENSE). The std sources Relax compiles carry their own notices; see
`libs/relax/compiler/std/CREDITS.md` and the license files beside them.
