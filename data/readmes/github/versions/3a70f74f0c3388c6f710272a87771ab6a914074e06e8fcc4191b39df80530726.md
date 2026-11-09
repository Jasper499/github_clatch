<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-header-dark.png">
  <img alt="vork by Voyager" src="docs/images/readme-header-light.png" width="800">
</picture>

<p>
  <a href="https://discord.com/invite/voyagerai"><img alt="Discord" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Fv10%2Finvites%2Fvoyagerai%3Fwith_counts%3Dtrue&query=%24.approximate_presence_count&suffix=%20online&label=Discord&logo=discord&logoColor=white&color=5865F2"></a>
  <a href="https://www.npmjs.com/package/@voyager-so/vork"><img alt="npm" src="https://img.shields.io/npm/v/@voyager-so/vork?label=npm&color=black"></a>
  <a href="https://pypi.org/project/vork/"><img alt="PyPI" src="https://img.shields.io/pypi/v/vork?label=PyPI&color=black"></a>
  <a href="https://x.com/ravisparikh"><img alt="Follow @ravisparikh on X" src="https://img.shields.io/badge/X-@ravisparikh-black?logo=x&logoColor=white"></a>
</p>

**vork is a 3D and VFX engine built for AI agents.**

Agents write the whole scene as code, including their own shaders, materials,
cameras and physics, and vork renders it on the GPU. The core API fits in about
2,500 tokens.

https://github.com/user-attachments/assets/03cfa020-be40-483a-89af-1ef77467b7a0

**One million birds, each on its own path.** 192 frames at 1080p rendered in
97 seconds on a single NVIDIA L4. Blender EEVEE at the same sample count is
projected at 13–18 minutes. [How we measured](#million-birds-measured-movies-projected-blender-times) ·
[how it's made](examples/murmuration/) · [credits](examples/murmuration/CREDITS)

- **Built for agents:** a small API that agents can extend with their own GPU programs.
- **Fast:** 1.1–2.3× faster than EEVEE on default stills and movies, and about 8–11× on the bird flock.
  [Speed, with the qualifications](#speed-with-the-qualifications).
- **Native GPU engine:** written in Rust and Slang, runs on Vulkan and Metal (Linux, Windows, macOS).

## Paste this to your agent

[Install vork](#install), then paste:

> Run `vork init my-shot`, read `vork help`, render a preview and inspect the image.
> Refine the camera and lighting before rendering at final quality. Read the
> relevant help topic when you need a feature the first page doesn't explain.

vork is written in Rust and Slang, with GPU rendering through Vulkan and Metal.
An agent writes a scene,
renders it, looks at the result and revises the code. There is no editor to drive.

Most creative tools expose controls that a person can operate. An agent can also
write a shader in the middle of a shot. vork gives it geometry, ray queries and
GPU execution, then lets scene programs define materials, cameras, light
propagation, simulation and compositing. Ordinary shots need only scene data;
the programming hooks are there when the shot needs something unusual.

Source-available and free during the research preview.

## Start here

After [installing vork](#install), create a working project:

```sh
vork init my-shot
cd my-shot
vork render scene.json --out render.png
vork help
```

Open `render.png`, change a colour or camera position in `scene.json`, and render
again. The starter uses only bundled sphere, box and grid primitives: no downloads,
no GPU needed to initialize. Use `vork init my-shot --language typescript` or
`--language python` for editable `scene.ts` or `scene.py` alongside the ready-to-render
JSON. The generated README explains regeneration and SDK requirements. Existing
files are never overwritten. The default `std/final` profile is warmed by setup; use `--profile std/draft` for quicker previews.

## What you can make

The examples include code, preparation commands and credits. Large downloaded
assets and footage stay outside Git; the recipes fetch them or accept a local path.
The images here are stills from these shots. Keep each credit with its image.

### [Million birds](examples/murmuration/)

![A ribbon of starlings crossing the low sun above a lagoon](docs/images/birds-sun-ribbon.jpg)

| | |
|---|---|
| ![A foreground bird above the flock at dusk](docs/images/birds-skim.jpg) | ![The flock curving over still water, seen from above](docs/images/birds-lagoon.jpg) |

A million simulated agents steered by Slang compute programs, with a camera skimming
through the flock. The camera and nine foreground birds are authored; the simulated
million do not flap. The bird stills above come from the measured four-sample,
denoised skim and reveal movies.

Credit: based on ["Crow"](https://sketchfab.com/3d-models/crow-d5a9b0df4da3493688b63ce42c8a83e2)
by Alexei Ostapenko, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Changes: sampled flight pose, reduced distant mesh, rescaled, articulated flight
wings, extracted wings for the starling body, resized textures.
[All bird and environment credits](examples/murmuration/CREDITS).

### [Cyber car](https://voyager.so/vork)

[![A cyber car on a mountain road at sunset — watch the film](https://cdn.moda.app/voyager/blog/vork/cyber-car-poster-2f939652f3e77c3c.webp)](https://voyager.so/vork)

[Watch the film](https://voyager.so/vork): a car drives into the night as the forest
turns into glowing cyan wireframe, drawn from real triangle edges by a scene shader.

Credit: [“Car Concept”](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)
by Unity Fan, glTF adaptation by Eric Chadwick / Darmstadt Graphics Group,
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes: scaled, animated,
brighter head and tail lights, wheel pose. Trees, ground and asphalt from Poly Haven
(CC0). The far mountains and sky are an image-model painting on a curved 3D card;
everything else that moves is rendered.

### [VFX on real footage](examples/vfx-artifact/)

| Original footage | Tracked camera and proxy geometry | Final look |
|---|---|---|
| ![The photographed take: a woman asleep at a laptop](docs/images/seed-1-original.jpg) | ![Proxy geometry over the same take](docs/images/seed-2-tracked.jpg) | ![A glowing seed on the desk, with the room relit to night](docs/images/seed-3-final.jpg) |

A procedural ceramic-and-bronze seed, a tracked camera, occlusion mattes and proxy
geometry for relighting. The example teaches the base composite; the final look
adds later relighting and wipes. Real footage + rendered 3D; no generative video.

Credit: footage by **Ron Lach / Pexels**, modified under the Pexels Licence. Original
performer; no endorsement implied. [Source and preparation](examples/vfx-artifact/).

### [After Rain](examples/vfx-neon/)

![A glowing cyan sculpture and an AFTER RAIN sign in a wet night alley, reflected in a puddle](docs/images/after-rain.jpg)

A suspended neon seed and blade sign added to a moving shot of an empty alley at
night, with spill on the wall and reflections in the wet street. Real footage + rendered
3D; no generative video.

Credit: footage is ["Ally"](https://www.pexels.com/video/ally-18972999/) by
**Rafael Fernanz / Pexels**, modified under the [Pexels Licence](https://www.pexels.com/license/).
[Source and preparation](examples/vfx-neon/).

### [Black hole](examples/black-hole/)

![A cargo ship beside a black hole, with a moon lensed into a ring around it](docs/images/black-hole.jpg)

The scene supplies a Schwarzschild light-propagation program through vork's public
hook. Curved paths, capture and the disk's appearance live in the example. It is a
numerical approximation, not an exact relativistic solver.

Credit: based on ["Corinth Cargo Transporter"](https://sketchfab.com/3d-models/corinth-cargo-transporter-7614d85856f6477ba2a603970dcbb0dd)
by [Yvo Pors](https://sketchfab.com/yvopors14), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Changes: decimated geometry, resized, compressed and exposure-adjusted textures,
adjusted material roughness and metallic weight, placement and scale.
[Ship credit](examples/black-hole/README.md#ship-credit).

### [Cake](examples/cake/)

![A carrot cake on a carved plate, with a kettle out of focus behind it](docs/images/cake.jpg)

A moving camera, depth of field and daylight on detailed scanned assets. This shot is
rendered 3D, using Poly Haven assets; it isn't a photographed take.

Credit: Poly Haven CC0 assets; carrot cake photography by Greg Zaal, processing by
James Ray Cock. [Full cake credits](examples/cake/CREDITS.md).

### [Cozy Kitchen](examples/kitchen/)

![A miniature kitchen diorama with pumpkins on the roof](docs/images/kitchen.jpg)

Nicole Morena's Blender 3.5 splash scene, imported into vork. The recipe uses a
shared material adaptation and a camera orbit; the pictured render has additional
staging and animated lighting.

Credit: **Cozy Kitchen** by [Nicole Morena](https://www.artstation.com/nickyblender),
[source .blend](https://download.blender.org/demo/splash/blender-3.5-splash.blend),
[CC BY-SA](https://creativecommons.org/licenses/by-sa/) (version unspecified by source).
Adapted and rendered in vork: camera orbit, animated lighting, widescreen framing,
material translation and staging changes. This still and the adapted animation
are shared under CC BY-SA. No artist endorsement implied.
[Changes and share-alike notice](examples/kitchen/CREDITS.md).

### [Water](examples/water/)

![Water splashing up in a crown from a white basin on a wooden deck](docs/images/water.jpg)

A GPU liquid simulation implemented as Slang compute programs in vork's fluid library.
It uses published APIC/FLIP and surface-reconstruction methods, with an authored
initial impulse and limited secondary spray.

## No suitable GPU?

Rendering requires Apple Silicon or an NVIDIA GPU with Vulkan ray queries.
Scene authoring and `vork help` work without a GPU. On your own NVIDIA Linux
machine, you can use the [Docker runtime](docs/REMOTE-GPU.md).

## Give it to an agent

Start with `vork init`, then `vork help`. Scene JSON uses the stable
[editor schema](https://raw.githubusercontent.com/voyager-so/vork/v0.3.0/packages/ts/scene.schema.json).
Use `vork help` for the starting scene and concepts, `vork help TOPIC --all`
for topic fields, and `vork help field PATH` for an exact field reference.

Use the [prompt above](#paste-this-to-your-agent) to start.

Python and TypeScript can author ordinary scene JSON through the SDKs. You can
also write JSON directly. For example, save this as `scene.json` (also available as
[examples/first-scene.json](examples/first-scene.json)):

```json
{"version":2,"nodes":[
  {"type":"mesh","geometry":{"std":"sphere","radius":1},
   "materials":[{"inputs":{"base_color":[0.12,0.35,0.65],"specular_roughness":0.3}}]},
  {"type":"mesh","translation":[0,-1,0],"geometry":{"std":"grid","size":[10,10]},
   "materials":[{"inputs":{"base_color":[0.35,0.35,0.35]}}]},
  {"type":"light","shape":"rectangle","translation":[-3,5,4],"target":[0,0,0],
   "energy":700,"size":4,"color":[1,0.92,0.8]},
  {"type":"camera","translation":[3,2,5],"target":[0,0,0]}
],"render":{"resolution":[640,480]}}
```

```sh
vork render scene.json --profile std/previs --out preview.png
vork render scene.json --profile std/final --out final.png
vork help sdk
vork help programs --all
```

Scene content and render quality are separate. Use `std/previs` to iterate,
`std/draft` for scene-ray lighting at 4 samples,
`std/final` for the default delivery profile, and `std/path` for path transport.
Final approximates indirect lighting and can darken interiors, including glossy
bounces. More samples do not restore omitted transport; try path and inspect.
Draft and final use 4 and 8 samples with bundled OIDN denoising by default; use `--set denoise=false` to turn it
off. `--set samples=N` overrides the profile budget (1..4096); more samples means cleaner and slower.
Without a fast GPU denoiser (NVIDIA or Apple GPU), draft and final say so and use 16 and 32 samples undenoised;
`--set denoise=true` runs the slow CPU denoiser anyway.
For a particular field, ask `vork help field node.target`. Help topics include
exact fields with `--all`. Images, video and control passes come from the same
scene; see `vork help outputs`.

## Under the hood

Default rendering combines raster visibility with hardware ray-traced lighting;
a path tracer is also available. The scene and render plan stay installed.
Frames use retained GPU resources, with GPU-to-hardware-video encoding on
supported native paths. A portable encoding fallback reads pixels back to the CPU.

Slang programs run on the GPU. Host parsing, planning, animation-track evaluation
and IO still use the CPU. The public program hooks let a scene author change
camera rays, material response, light propagation and film response without
editing the renderer. `vork help programs --all` describes their scope.

Validation includes furnace tests and analytic oracles, alongside render tests.
That is a way to catch errors, not a guarantee that every scene is physically
exact.

## Speed, with the qualifications

These are timings, **not equal-quality speedups**. The draft/final results
come from the build identified by SHA-256 in the results report on an NVIDIA L4: final uses eight samples
and OIDN, draft four and OIDN. All 152 planned jobs were accounted for. The broader
sweep delivered 583 of 585 images; the million-stars stress scene ran out of GPU
memory in both profiles. Visual review found softer edges, grainier defocus,
wall mottling and changed sparse or spectral highlights at these budgets.
Nineteen earlier quality comparisons failed their declared no-worse FLIP
condition; that experiment was not repeated for this build.

vork times below are complete command wall times, including startup, scene
loading, output writes and encoding. Setup, shader warmup, provisioning and
transfers are excluded. Stills use five warm repetitions, movies three. Driver
caches and clocks were not controlled. Blender 5.2.1 times are retained measured
baselines, not fresh runs: EEVEE uses different settings, and its movie times
exclude startup/loading after a still prime. Both movie timings include encoding.
The car is a proxy. [Benchmark method and recorded results](benchmarks/RESULTS.md)
explain the boundaries and carried-forward numbers.

### Default final: stills

1080p PNG, seconds. EEVEE uses 64 samples without denoising; vork uses eight with
OIDN. Missing Blender results are unmeasured, not wins.

| Scene input | EEVEE (s) | vork final (s) | Comparison |
|---|---:|---:|---|
| [B-push-in.json](benchmarks/B-push-in.json) | 2.912 | 1.993 | 1.46× faster |
| [B-turntable.json](benchmarks/B-turntable.json) | 3.148 | 2.247 | 1.40× faster |
| [B-walking.json](benchmarks/B-walking.json) | 2.612 | 1.890 | 1.38× faster |
| [B-interior.json](benchmarks/B-interior.json) | 2.892 | 1.738 | 1.66× faster |
| [B-street.json](benchmarks/B-street.json) | unmeasured | 2.043 | unmeasured |
| [B-rack-focus.json](benchmarks/B-rack-focus.json) | unmeasured | 1.787 | unmeasured |
| [B-car-pan.json](benchmarks/B-car-pan.json) | 2.458 | 1.691 | 1.45× faster |
| [B-crowd.json](benchmarks/B-crowd.json) | unmeasured | 2.046 | unmeasured |
| [B-night.json](benchmarks/B-night.json) | 2.963 | 1.937 | 1.53× faster |

### Default final: complete movies

240 frames, 1920×1080, 24 fps. These four public B-scene clips are part of the
seven-scene comparison; the full seven measured 1.14–2.32× against EEVEE.
Different quality and timing boundaries still apply.

| Scene input | EEVEE (s) | vork final (s) | Comparison |
|---|---:|---:|---|
| [B-blocking.json](benchmarks/B-blocking.json) | 88.072 | 47.082 | 1.87× faster |
| [B-interior.json](benchmarks/B-interior.json) | 107.026 | 59.231 | 1.81× faster |
| [B-car-pan.json](benchmarks/B-car-pan.json) | 93.489 | 81.740 | 1.14× faster |
| [B-night.json](benchmarks/B-night.json) | 213.477 | 92.201 | 2.32× faster |

### Path tracing: carried-forward measurements

These 1080p still timings were measured in an earlier build, rather than the
measured final build. Adaptive sampling up to 4,096, threshold 0.01, minimum 64;
stopping implementations differ. vork is slower in both cases below.

| Scene input | Cycles (s) | vork path (s) | Comparison |
|---|---:|---:|---|
| [B-car-pan.json](benchmarks/B-car-pan.json) | 4.632 | 26.901 | 5.81× slower |
| [B-night.json](benchmarks/B-night.json) | 16.041 | 31.860 | 1.99× slower |

### Setup and first use

On [B-blocking.json](benchmarks/B-blocking.json), the final-profile setup took
250.792 s, the first still after setup 2.298 s, and the warm median 2.094 s.
The retained EEVEE cold still was 20.633 s and warm median 2.405 s. Other scenes
can still spend substantial time compiling new programs after setup: rack-focus's
first final still took 82.057 s, versus its 1.787 s warm median.

### Previews: carried-forward measurements

These are earlier-build `std/previs` results, not measured on the final build identified in [RESULTS.md](benchmarks/RESULTS.md). Previews
use different lighting and shadows; these are not final-quality comparisons.
Complete 240-frame, 1080p24 movies, median of three warm commands:

| Scene input | Preview movie (s) |
|---|---:|
| [B-blocking.json](benchmarks/B-blocking.json) | 3.496 |
| [B-interior.json](benchmarks/B-interior.json) | 4.565 |
| [B-car-pan.json](benchmarks/B-car-pan.json) | 6.391 |
| [B-night.json](benchmarks/B-night.json) | 5.864 |
| [B-crowd.json](benchmarks/B-crowd.json) | 4.097 |
| [B-push-in.json](benchmarks/B-push-in.json) | 3.705 |
| [B-rack-focus.json](benchmarks/B-rack-focus.json) | 3.902 |
| [B-street.json](benchmarks/B-street.json) | 3.964 |
| [B-turntable.json](benchmarks/B-turntable.json) | 4.612 |
| [B-walking.json](benchmarks/B-walking.json) | 2.190 |

Across the seven simple preview clips on that earlier build, EEVEE/vork was
14.63–36.40× and Workbench/vork 3.99–11.24×. Those ranges use retained Blender
baselines and different rendering settings and timing boundaries. They do not
describe default final rendering.

### Million birds: measured movies, projected Blender times

The [bird inputs](benchmarks/birds/README.md) include the compute programs and
all three cameras. These `std/draft` movies use four samples and OIDN at
1080p24; each number is the median of three full commands. The first full movie
is included in that three-command median, after a separate 320×180 still warmup.
Setup and warmup are excluded from the movie times below. For skim, setup +
warmup + the movie median total 506.781 seconds (8.45 minutes); asset preparation
and transfers are additional.

| Camera input | Frames | vork movie (s) | Setup (s) | Warmup (s) | EEVEE 16-sample projection (s), both retained runs |
|---|---:|---:|---:|---:|---:|
| [skim.json.in](benchmarks/birds/skim.json.in) | 192 | 96.942 | 243.809 | 166.030 | 1511.108 / 1817.625 |
| [dive.json.in](benchmarks/birds/dive.json.in) | 240 | 124.718 | 167.376 | 112.994 | 2517.891 / 2417.831 |
| [reveal.json.in](benchmarks/birds/reveal.json.in) | 288 | 153.411 | 163.218 | 113.910 | 2916.237 / 2889.758 |

The EEVEE values extrapolate eight warm frames; they are **projections, not
measured movies**. They omit simulation, startup and video encoding, and receive
the finished flock as geometry. They use **16 samples** against vork's four, so this
table is not a like-for-like speed comparison.

The matching four-sample EEVEE projection exists only for skim: 773.7–1,082.5 s
across the retained runs, with ray tracing on or off, about 8–11× the 96.9 s vork
movie. Dive and reveal have no four-sample EEVEE projection. Quality, material
translation and motion differ.

### Rerun

```sh
python3 benchmarks/fetch.py
python3 benchmarks/run.py --vork vork --out /tmp/vork-benchmark
python3 integrations/blender/benchmark.py --blender blender --out /tmp/blender-benchmark
```

The vork runner measures undenoised B-scene variants, not the denoised final8
tables above. It omits draft and does not set the recorded seed 11. The bird
runner uses previs/final with a full-resolution warmup, not the recorded draft4
workflow. The final8/draft4 tables use build `81ae2b075`; preview and path results
come from earlier freezes, as noted beside those tables.

The Blender helper has been checked for preparation of all ten scenes on Blender
5.2.1. The historical GPU timing comparisons have not been rerun with this repair;
see [the method](benchmarks/README.md).

## Research-preview limits

Participating media (fog, haze, smoke and volumes) are unsupported in 0.3.
Used medium bindings and volume topology are refused; removed programs such as
`std/fog` fail lookup even in unused definitions. Bake an image plate and composite
it, or render the medium externally. For a deliberately dry alternative, remove
medium-only nodes, bindings and definitions while preserving shared surfaces.
See `vork help upgrade` and `vork help limits`.

Large scenes
and dense transparency can fail, including on Mac; reducing image resolution
alone does not necessarily fix them. Some heavy interiors work with `std/path`
when the default hybrid profile fails. First use of a new program can involve
substantial compilation, even after `vork setup`.

At four/eight samples, fine facades and hair can lose detail, defocus can show
stepped or grainy edges, and sparse sparks or spectral highlights can change
brightness and colour. Try `--set samples=32` for these shots; more samples cost
more time. The frozen sweep retained a million-stars allocation failure in both
profiles. Mac reliability was not revalidated in that Linux run.

The water quickstart is a closed-shutter diagnostic. The full motion-blurred
scene is much more expensive. It is a uniform-grid experiment with finite particle budgets,
unresolved thin features and no two-way rigid-body coupling. It is not a general
replacement for a mature simulation package. The VFX camera solve and single-view
relief are estimates, with limitations documented beside the example.

Fog returns in 0.4 with a design independent of pause/resume. Broader simulation,
reliability and performance on demanding scenes remain future directions, without
promised release dates. Read `vork help limits` before committing to a shot.

## Install

Upgrading scenes or scripts? Run `vork help upgrade` ([upgrade guide](docs/help/upgrade.md)).

Binary packages are available from [GitHub Releases](https://github.com/voyager-so/vork/releases)
for Linux, Windows and Mac. Keep the entire install folder together: Slang, OIDN,
libraries, examples, SDKs and licence texts are runtime companions to the binary.

- **Linux:** x64, glibc 2.35+ and libstdc++ with `GLIBCXX_3.4.30` (Ubuntu 22.04+), a recent NVIDIA GPU and its hardware-ray-tracing Vulkan driver.
- **Windows:** x64 Windows 10/11, a recent NVIDIA GPU and its hardware-ray-tracing Vulkan driver.
- **Mac:** Apple Silicon with Metal, macOS 26 for the bundled Slang toolchain. Older macOS versions are unqualified. Intel Macs are unsupported. H.264 uses system VideoToolbox.

For TypeScript authoring, install **Node 22.18+** (with npm) from
[nodejs.org](https://nodejs.org/en/download). For Python authoring, install
**Python 3.11+** from [python.org](https://www.python.org/downloads/) or your
platform's package manager. These runtimes are not bundled and are not needed
for JSON scenes. Ubuntu 22.04's default Python 3.10 and Node packages are too old.
On Ubuntu, install `python3-venv` for the distribution's Python, or the matching
versioned venv package for your chosen Python (for example `python3.12-venv`).
Use that Python 3.11+ executable in the commands below. Minimal Linux images
also need `xz-utils` to unpack Node's `.tar.xz` download.

### Linux

Install the NVIDIA driver for your GPU first. On Ubuntu 22.04+:

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl tar libvulkan1 libgomp1 ffmpeg
curl -fL https://github.com/voyager-so/vork/releases/latest/download/install.sh -o /tmp/vork-install.sh
sh /tmp/vork-install.sh
export PATH="$HOME/.local/bin:$PATH"
vork --version
vork help
```

These dependency commands are for Ubuntu with sudo. In a root container, omit
`sudo`; without administrator access, arrange for the dependencies to be installed.
The installer itself runs in your user account without root.

The installer verifies SHA256SUMS, installs under `$HOME/.local/lib/vork`, links
`$HOME/.local/bin/vork`, runs `vork setup`, and adds the PATH line to your shell's
startup files, including the one login shells read. The `export` above covers the
current shell, and any shell that reads no startup file, such as plain `bash -c`.
`VORK_NO_MODIFY_PATH=1` or a custom `PREFIX` leaves startup files alone. Linux MP4 needs ffmpeg even when NVENC encodes frames, because ffmpeg
muxes the stream. Native NVENC is attempted on NVIDIA; otherwise encoding uses a
readback fallback. Older GPUs and software Vulkan adapters are unsupported.
A100, H100, H200, B200 and B300 lack the required hardware ray tracing; recency
alone does not make an NVIDIA GPU suitable. Containers also need working NVIDIA
Vulkan driver discovery; passing through a GPU alone may not be sufficient.
If `nvidia-smi` works but Vulkan sees only llvmpipe, check the NVIDIA ICD JSON
in `/etc/vulkan/icd.d` or `/usr/share/vulkan/icd.d`: its library may fail to load
in a headless container. See [Vulkan driver discovery](docs/REMOTE-GPU.md#vulkan-driver-discovery).

### Mac

The bundled Slang compiler requires macOS 26. Older macOS versions have not been
qualified; a successful `vork --version` alone does not test Slang.

In Terminal:

```sh
curl -fL https://github.com/voyager-so/vork/releases/latest/download/install.sh -o /tmp/vork-install.sh
sh /tmp/vork-install.sh
export PATH="$HOME/.local/bin:$PATH"
vork --version
vork help
```

The same installer verifies and installs the complete Apple Silicon archive under
`$HOME/.local/lib/vork`, runs setup, and adds the PATH line to your shell's startup
files (`.zshenv` for zsh). Mac packages are signed with Apple Developer ID and notarised.

MP4 uses VideoToolbox without ffmpeg. Install ffmpeg only for video decoding or
encoding fallbacks, including MOV/ProRes fallback (`brew install ffmpeg`).

### Windows

Install the NVIDIA driver for your GPU and ffmpeg (`winget install Gyan.FFmpeg`).
Without winget (including Windows Server 2022), download `ffmpeg-release-essentials.zip` from
[Gyan](https://www.gyan.dev/ffmpeg/builds/), extract it, and add its `bin` folder
to your user PATH.
Open a new PowerShell window so ffmpeg is on PATH, then:

```powershell
$installer = Join-Path $env:TEMP 'vork-install.ps1'
Invoke-WebRequest -UseBasicParsing https://github.com/voyager-so/vork/releases/latest/download/install.ps1 -OutFile $installer
powershell -NoProfile -ExecutionPolicy Bypass -File $installer
$env:Path = "$env:LOCALAPPDATA\Programs\vork;$env:Path"
vork --version
vork help
```

The installer itself runs in your user account without administrator rights.

The installer verifies SHA256SUMS, installs under `%LOCALAPPDATA%\Programs\vork`,
runs `vork setup`, and adds that folder to your user PATH so new windows find `vork`;
the `$env:Path` line above covers the current one. `VORK_NO_MODIFY_PATH=1` or a custom
`PREFIX` leaves it alone.
Windows MP4/MOV needs ffmpeg; MP4 uses its NVENC encoder when compatible, otherwise
libx264. FFmpeg 9.0.2 requires NVENC API 13.1 (NVIDIA driver 610+) for
hardware encoding; older drivers fall back to libx264. The cache is under `%LOCALAPPDATA%\vork`.

### Manual archive install (Windows)

Download the Windows `.zip` and `SHA256SUMS` from the release page. Compare
`Get-FileHash .\vork-*-windows-x64.zip -Algorithm SHA256` with its entry in
`SHA256SUMS`, then unzip the entire contents into `%LOCALAPPDATA%\Programs\vork`.
Add that folder to your user PATH, open a new PowerShell window, and run
`vork setup`. It prints the tools/GPU report and current phase; completion is marked
by `Shader setup completed`. Time depends on the GPU, driver and cache. Keep all bundled
runtime companions beside the executable.

### Manual archive install (Linux or Mac)

The separately downloadable `install.sh` downloads the release from GitHub; to install an archive you already
have without downloading again, use the manual steps below.

Download your platform's `.tar.gz` and `SHA256SUMS` from the release page into a
new empty folder. In that folder, verify and install the entire archive:

```sh
set -- vork-*.tar.gz
test "$#" -eq 1 || exit 1
archive=$1
awk -v name="$archive" '$2 == name || $2 == "*" name' SHA256SUMS > selected.sha256
test "$(wc -l < selected.sha256 | tr -d ' ')" = 1 || exit 1
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c selected.sha256 || exit 1
else
  shasum -a 256 -c selected.sha256 || exit 1
fi
PREFIX="$HOME/.local"
mkdir tree
tar -xzf "$archive" -C tree
mkdir -p "$PREFIX/bin" "$PREFIX/lib/vork"
cp -R tree/. "$PREFIX/lib/vork/"
ln -sf "$PREFIX/lib/vork/vork" "$PREFIX/bin/vork"
export PATH="$PREFIX/bin:$PATH"
vork --version
vork setup
```

`vork setup` prints the tools/GPU report and current phase. `Shader setup completed`
marks success; time depends on the GPU, driver and cache.

### npm

Requires Node.js 22.18+ and a supported GPU and driver (above). Linux and Windows video
output also needs ffmpeg.

```sh
npm create vork@latest my-shot
cd my-shot
npx vork setup
npx vork render scene.json --out render.png
```

This installs the engine and TypeScript SDK into the project; no global install is needed.
In an existing project, `npm install @voyager-so/vork` and use `npx vork` the same way.
Keep npm's optional dependencies enabled: they carry the platform runtime.

### pip

Coming soon. Use the installers above for the Python SDK in the meantime.

### First render and SDKs

Start with `vork init my-shot` and enter `my-shot`, then:

```sh
vork render scene.json --profile std/previs --out preview.png
vork render scene.json --profile std/final --out final.png
vork render scene.json --profile std/final --frame-start 0 --frame-end 23 --out clip.mp4
vork help animation
vork help outputs
```

The first render of a scene with new programs can compile for several minutes.
Progress reports show shader and driver pipeline preparation; allow time for it to
finish. Later renders reuse compiled programs and driver caches. Compilation time
depends on the scene, GPU and cache state.

Frame ranges include both endpoints: `0` through `23` writes 24 frames. The simple scene
is static; animation tracks make a moving clip. To try glTF import, save a model
as `model.glb` beside this scene as `model.json`:

```json
{"version":2,"nodes":[
  {"type":"asset","file":"model.glb"},
  {"type":"light","shape":"rectangle","translation":[-3,5,4],"target":[0,0,0],"energy":700,"size":4},
  {"type":"camera","translation":[3,2,5],"target":[0,0,0]}
],"render":{"resolution":[640,480]}}
```

```sh
vork render model.json --profile std/final --out model.png
```

Adjust the camera and light for your model's scale. glTF files can refer to
textures and buffers beside them; keep those files together.

Setup warms the `vork init` starter at the default `std/final` profile on your GPU, with a
ten-minute limit. Use `vork setup --skip-warmup` to check tools only. You can
interrupt setup safely: completed cache entries survive and remaining pipelines
compile when needed. Run setup again to continue, or use `vork setup --all` for
the exhaustive catalogue without the time limit. Device cache blobs are never
included in the download.

Run `vork setup` again after upgrading or changing GPU drivers. It prints the
tools/GPU report and current phase until `Shader setup completed`; time depends on
the GPU, driver and cache. Vulkan persists
its pipeline cache when supported; Metal warms the system driver cache. New scene
programs can still require compilation on their first render. `VORK_CACHE_DIR`
overrides the cache location.

The archive includes Python and TypeScript SDK source/packages, but not their runtimes. Install the
Python SDK into your authoring virtual environment, and the TypeScript SDK into
your project. TypeScript requires Node 22.18+ and npm. On older Node, upgrade
(recommended), or run `node --experimental-strip-types scene.ts` instead of `node scene.ts`:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install "$HOME/.local/lib/vork/python"
npm install "$HOME/.local/lib/vork/sdk"
```

The SDKs install from your vork folder, not from npm or PyPI. The npm package named
`vork` is unrelated, and the PyPI package only points back here.

On Windows (PowerShell):

```powershell
py -m venv .venv
.venv\Scripts\python -m pip install "$env:LOCALAPPDATA\Programs\vork\python"
npm install "$env:LOCALAPPDATA\Programs\vork\sdk"
```

Use `.venv\Scripts\python scene.py` to run Python source on Windows.
For a custom install, replace the default SDK paths above with your install folder.
Import as `vork` in Python or
`@voyager-so/vork` in TypeScript; keep the native executable on PATH.
For source builds, see [`vork help build`](docs/help/build.md).

## Licence

See [LICENSE](LICENSE) for the terms. Third-party notices are in [NOTICE](NOTICE).
Assets and the stills in `docs/images/` retain their own licences; keep the example
credits with their renders.
The optional [Blender bridge](integrations/blender/) has its own GPL licence and
is not part of the renderer or SDK packages.
