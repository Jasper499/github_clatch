<h1 align="center">reanimate</h1>

<p align="center"><b>Reverse-engineer animations you like. Build your own on top.</b><br>A Claude Code skill that works from a live site, a screen recording, an mp4, a gif or a Lottie file.</p>

<p align="center">
  <a href="https://code.claude.com/docs/en/skills"><img src="https://img.shields.io/badge/Claude_Code-skill-171717?style=flat-square&logo=claude&logoColor=white" alt="Claude Code skill"></a>
  <a href="https://agentskills.io"><img src="https://img.shields.io/badge/Agent_Skills-compatible-171717?style=flat-square" alt="Agent Skills compatible"></a>
  <a href="#install"><img src="https://img.shields.io/badge/runs_on-Bun-171717?style=flat-square&logo=bun&logoColor=white" alt="Runs on Bun"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-171717?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://reanimate.niazmorshed.dev/demo.mp4"><img src=".github/assets/demo.webp" width="760" alt="Moments from the demo video: /reanimate slides in; three browsers record widgets on stripe.com, resend.com and clerk.com; the copies are measured against them until the difference is gone; the 18 examples turn on a helix; the install command types itself in."></a>
</p>
<p align="center"><sub>A short demo. <a href="https://reanimate.niazmorshed.dev/demo.mp4">Watch the full video</a>.</sub></p>

A lot of good ideas start on someone else's site. Ask an agent to rebuild one from a link or a screenshot and it makes one pass, calls it done, and misses. It can't see the motion or tell how far off it is.

reanimate records the original, rebuilds it in your code, then records the copy the same way and compares the two. Each round shows what's still off, so the agent keeps going until the numbers match. You end up with a close starting point to make your own.

<p align="center">
  <img src=".github/assets/entrance.webp" width="760" alt="Two recordings of the same three cards fading in: stripe.com on top, the copy reanimate built below. The chat bubbles, the particle ring, the Visa card and the dotted globe appear at the same moments in both.">
</p>
<p align="center"><sub>Three cards from stripe.com. Top: the original. Bottom: the copy, filmed the same way.</sub></p>

## Install

```sh
npx skills add NiazMorshed2007/reanimate -g
```

The [skills CLI](https://skills.sh) asks which agents to set up; add `-a claude-code` to skip the question. Then, in Claude Code, say what you want, where it is and where it should go:

```text
/reanimate the hero entrance on https://example.com, into components/Hero.tsx
/reanimate this loader, 0:03 to 0:05 of ~/Downloads/loader.mov
/reanimate the card hover in this gif, match it exactly
/reanimate the logo marquee from https://example.com, with our logos and pause on hover
```

Needs [Bun](https://bun.sh) 1.1 or later, on macOS or Linux (Windows is untested). The first run installs a static ffmpeg into the skill's folder and Playwright's Chromium into Playwright's usual cache, about 250 MB together. No API keys. Other agents that read `SKILL.md` can install it too, but it has only been tested with Claude Code.

## How it works

1. **Record.** It films the reference in a headless browser at a fixed viewport and frame rate: a video, numbered frames, every CSS and Web Animations API animation it finds, and the position of chosen elements on every frame. For canvas and WebGL it also traces the GPU calls (shaders, uniforms, draw calls, the three.js scene) on a virtual clock that makes every capture identical.
2. **Spec.** One row per element per property: start, duration, from → to, easing, stagger. A row with a "?" means the frames haven't been read yet.
3. **Build.** It writes the animation with what your project already uses: CSS, Framer Motion, GSAP, three.js.
4. **Verify.** It films the copy the same way, compares timing, easing and pixels, and makes side-by-side sheets.
5. **Repeat.** It fixes the biggest difference and films again, usually 2 to 5 rounds. Whatever still doesn't match after 5 is listed in its report, with the reason.

<p align="center">
  <img src=".github/assets/hover.webp" width="520" alt="The card issuing card hovered on stripe.com and in the copy, side by side: the same pointer path makes the Visa card tilt the same way in both.">
</p>
<p align="center"><sub>The same pointer path on stripe.com and on the copy. The tilt settles within 0.4 px.</sub></p>

By default it matches the motion and leaves the look to you. Ask for more or less:

| Say | Level | Must match |
|---|---|---|
| "clone this animation" | Moves the same (default) | trigger, order, stagger, timing within 80 ms, easing family, distance |
| "match it exactly", "pixel-perfect" | Looks the same | all of the above, plus fonts, sizes, colours, spacing and assets; ≤ 2 % mean pixel mismatch |
| "clone X and add Y" | Yours on top | the cloned parts at one of the levels above; your additions kept separate |

## Examples

Six animations from vercel.com, nextjs.org and turborepo.com, three cards from the stripe.com homepage, the integrations visual from workos.com/atlas, the feature cards from clerk.com, the demo under the liveblocks.io/comments hero, the cube in the resend.com hero and React Bits Pro's Fading Stars, each cloned by its own agent running this skill, most in 30 to 90 minutes. The [site](site/) runs the ones you can hover or drag live in the page, and shows the others next to a recording of the original.

| Clone | Built with | Measured against the original |
|---|---|---|
| **Vercel Toolbar** (vercel.com/products/previews): a toolbar among seven tags; hover a button and its tag takes its colour while the others blur | HTML, SVG, CSS | 417 of 417 frames identical; every change on the same frame |
| **Drop to deploy** (vercel.com): the hero triangle, lit by the pointer; drag a file over the page and it turns into a prism | WebGL2, Web Workers | 785 of 803 frames byte-identical, the rest within 1 level |
| **Fluid ocean** (vercel.com/fluid): 262,144 dots rolling like a sea behind the hero | WebGPU, Web Workers | 0 px differ over 12 s, light and dark |
| **Inspect every run** (vercel.com/workflow): a dashboard playing one run of a workflow | HTML, SVG | all six bars 0 px off; every step on time (0 ms) |
| **Speedometer** (turborepo.com): a needle that revs into the red under the pointer, and a counter rolling up | SVG, springs | 0 px differ while hovering, light and dark |
| **Feature cards** (nextjs.org): image frames lit by the pointer, streaks streaming into a page, a component tree | canvas, SVG | every animated value identical on every frame |
| **Agentic commerce**: a chat over a 10,000-point particle ring | three.js, CSS | chat timing within 43 ms, layout within 0.05 px |
| **Card issuing**: a Visa card that tilts toward the pointer | three.js, Web Workers | 0.03 % of pixels differ at rest; tilt within 0.4 px |
| **Stablecoins and crypto**: a dotted globe with flying payments | three.js, Web Workers | globe pose exact; arcs and labels within stripe.com's own spread |
| **Connected to all your tools** (workos.com): a robot reaching out to a dome of app icons | HTML, SVG, WebGPU | 0.05 % of pixels differ; each link within 10 ms |
| **Feature cards** (clerk.com): passcodes, magic links, a radar, a laptop opening and more, each playing on hover | HTML, SVG, canvas, WebGL2 | each card's motion within 40 ms; under 0.6 % of pixels differ |
| **Comments in any app** (liveblocks.io): an app window switching between five apps, its comment panel gliding to each | HTML, SVG, springs | every change on time (0 ms); panel within 0.7 px; 0.55 % of pixels differ |
| **Hero cube** (resend.com): a dark Rubik's cube turning, its slices making half-turns | three.js | every rotation exact over 25 s; 0.11 % of pixels differ |
| **Fading stars** (pro.reactbits.dev): violet stars rising in a fan, surging with the pointer | WebGL2 | 0 px differ at rest; 0.014 % during a click burst |

## Canvas, WebGL and 3D

A canvas only shows pixels, so reanimate records the calls that drew them. With `--gl` it traces WebGL, WebGPU and canvas 2D. It hooks the three.js, Pixi, PlayCanvas, Babylon and OGL scene graphs through their own devtools entry points, and reaches into workers. Out come the shader sources, every constant uniform, the render passes, the textures and models, and each animated uniform or object property as a curve that can be fitted and compared. `--clock virtual` runs the page on a clock that is advanced frame by frame, with `Math.random` seeded in the page and its workers. Every frame is then exact however slow the GPU is, and two captures of a WebGL globe with random arcs and worker-generated dots come out byte-identical.

On live stripe.com this recovers the issuing card's four-pass composite, its shaders and constants such as `u_twistFrequencyX = 0.059`. It also records the card's tilt as a curve: −0.174 → 0.262 rad between 33 and 1800 ms on the pointer path. `gl.ts compare` then checks the clone against it channel by channel; the tilt matched within 33 ms and 0.5 % of its range. See [`references/webgl.md`](skills/reanimate/references/webgl.md).

## Limits

- Pages behind a login, YouTube and Loom can't be recorded directly; hand it a screen recording.
- Physics springs are fitted from their overshoot and settle time, not read from the source.
- Workers are seeded and traced, but their own clocks run in real time. Canvases inside iframes need the iframe's own URL.
- When a clone can't reproduce the reference's random generator, particles are compared with a blurred mismatch (density, colour, motion) instead of dot by dot.
- `--gpu hardware` uses the real GPU (macOS: Metal; Linux: Vulkan, untested). The default, SwiftShader, is slower but gives the same pixels on every machine.
- It clones what you point it at. Fonts, images and code from another site still belong to their owners; make sure you may use what you copy.

## Repository

Only `skills/reanimate/` is installed by the skills CLI; `site/` is the website with the examples running live ([`site/README.md`](site/README.md)).

<details>
<summary>What's in the skill</summary>

| Path | What it is |
|---|---|
| `SKILL.md` | The workflow Claude follows: scope, capture, spec, build, verify, report. |
| `references/` | Capture recipes per source type, reading frames into a spec, implementation patterns per stack, WebGL, pass criteria and fixes. |
| `scripts/capture.ts` | Records a page: video, frames, declared animations, computed styles, fonts, libraries, per-frame element tracks. Triggers: load, scroll, hover, leave, pointer path, drag, click, none. `--clock virtual` steps a virtual clock frame by frame (exact frames, identical captures, seeded `Math.random`); `--gl` traces the GPU; `--assets` saves models, textures and scripts. |
| `scripts/gl.ts` | Reads a GPU trace: canvases, three.js / Pixi / PlayCanvas / Babylon / OGL scene graphs, shaders, passes, textures, animated uniforms as channels, and a reference-vs-clone comparison. |
| `scripts/inpage/` | What runs inside the page: the virtual clock and the WebGL / WebGPU / canvas 2D tracer. |
| `scripts/frames.ts` | Extracts and crops frames from a video or gif. |
| `scripts/compare.ts` | Frame-by-frame comparison: alignment, timing error, mismatch, activity curves, diff images, and a blurred mismatch for particles and noise. |
| `scripts/easing.ts` | Fits a tracked property or GPU channel to named easings, detects overshoot and springs, diffs two tracks. |
| `scripts/sheet.ts` | Labelled contact sheets and reference / clone / diff comparison sheets. |

</details>

## License

[MIT](LICENSE). The examples recreate parts of vercel.com, nextjs.org, turborepo.com, stripe.com, workos.com, clerk.com, liveblocks.io, resend.com and pro.reactbits.dev as a study of the technique; it is not affiliated with or endorsed by Vercel, Stripe, WorkOS, Clerk, Liveblocks, Resend or React Bits. All trademarks belong to their owners.
