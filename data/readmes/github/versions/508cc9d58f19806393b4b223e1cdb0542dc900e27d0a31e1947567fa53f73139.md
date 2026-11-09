<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/sandflow-symbol-white.svg">
    <img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/sandflow-symbol-black.svg" alt="Sandflow" height="26">
  </picture>
  &nbsp;sand3d
</h1>

**3D modeling in Python, built for LLMs.**

sand3d is a Python library for writing 3D objects as short programs: profiles, solids,
edits, frames, joints and assemblies, over Blender's `bpy`. A program says *how* a shape
is made, part by part and in its own words, so a model writes it in a few hundred tokens
and a person can read it.

<p align="center"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/hero.png" alt="Objects written in sand3d" width="830"></p>

<p align="center">
  <a href="https://sandflow.ai/sand3d/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/sandflow-symbol-white.svg"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/sandflow-symbol-black.svg" alt="" height="16" align="absmiddle"></picture>&nbsp;Website</a> ·
  <a href="https://sand3d.sandflow.ai/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/lucide-book-open-white.svg"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/lucide-book-open.svg" alt="" height="16" align="absmiddle"></picture>&nbsp;Docs</a> ·
  <a href="https://huggingface.co/collections/Sandflow/sand3d-6aec268fbdcd3bc174236168"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/hf-logo.svg" alt="" height="16" align="absmiddle">&nbsp;Datasets</a> ·
  <a href="https://huggingface.co/spaces/Sandflow/sand3d-explorer"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/lucide-box-white.svg"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/lucide-box.svg" alt="" height="16" align="absmiddle"></picture>&nbsp;Explorer</a>
</p>

<p align="center">
  <a href="https://github.com/Sandflow-ai/sand3d/blob/main/LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-793CFF"></a>
  <img alt="Python 3.11 and 3.13" src="https://img.shields.io/badge/python-3.11%20%7C%203.13-121117">
  <img alt="bpy 4.5 and 5.2" src="https://img.shields.io/badge/bpy-4.5%20%7C%205.2-121117">
  <a href="https://github.com/Sandflow-ai/sand3d/actions/workflows/tests.yml"><img alt="tests" src="https://github.com/Sandflow-ai/sand3d/actions/workflows/tests.yml/badge.svg"></a>
</p>

## Why sand3d

<p align="center"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/tokens.png" alt="Tokens per part, median: the same part takes 4.0 times sand3d's tokens in Blender Python, 2.3 in CadQuery, 6.0 in FeatureScript, 2.0 in the Articraft SDK" width="830"><br>
<a href="https://sand3d.sandflow.ai/tokens.html">How it is measured, part by part</a></p>

- **Short.** A part takes 2 to 6× fewer tokens than the same part in Blender Python, CadQuery or FeatureScript ([details](https://sand3d.sandflow.ai/tokens.html)).
- **The whole API fits in a prompt**, about 3,600 tokens ([the API](https://sand3d.sandflow.ai/api.html)).
- **Named, not computed.** Parts, edges and faces are reached by name, never by hand-computed coordinates.
- **Deterministic.** The same program builds the same mesh, bit for bit.

## A whole object, part by part

<p align="center"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/washer.png" alt="A washing machine written in sand3d: its part tree, its four joints, and the three files it exports" width="830"></p>

A front-loading washing machine in 38 lines of code ([play it and read it](https://sand3d.sandflow.ai/gallery.html)):
the cabinet, the drum, the door with its glass and handle, the detergent drawer and the dial,
each a named part, and four joints that say how they move.

```python
door = s3d.group("door", ring, glass, handle)                      # the handle and the glass move with it
s3d.joint("door_hinge", door, hinge, axis="-Z", range=(0, 143))
s3d.joint("drum_spin", drum, front.move(0, 400), kind="continuous")
s3d.joint("drawer_slide", drawer, top_band.move(150), kind="prismatic", axis="+X", range=(0, 200))
s3d.joint("dial_turn", dial, top_band.move(-150), kind="continuous")
return s3d.assembly("washing_machine", cab, drum, door, drawer, dial, front=front)
```

## Export: GLB, URDF, USD, OBJ, STL

One call; the file's extension names the format; lengths in metres.

```python
s3d.export(machine, "washer.glb")    # or .urdf, .usda, .obj, .stl
```

| format | what it carries | for |
|---|---|---|
| **GLB** | meshes, materials, the joints in each node's extras, at the current pose | the web, viewers, game engines |
| **URDF** | a link per moving part, its joints and their limits, at rest; OBJ meshes beside it | ROS, PyBullet, MuJoCo, Isaac |
| **USDA** | the same tree in OpenUSD (UsdGeom, UsdPhysics), with the materials | Omniverse, Isaac Sim, USD pipelines |
| **OBJ**, **STL** | the meshes alone, at the current pose: OBJ Y up, binary STL Z up | any 3D tool, slicers |

`.usd`, `.usdc` and `.usdz` come from the `.usda` through USD's own tools (`usdcat`,
`usdzip`). The scene is also an ordinary Blender scene, for anything else Blender writes.

## Install

Python 3.13 (recommended) or 3.11. Blender comes with it, as the `bpy` module: 5.2 LTS on
Python 3.13, 4.5 LTS on Python 3.11; CI runs bpy 5.2.

```bash
pip install sand3d        # or, in a uv project: uv add sand3d
```

`bpy` has no wheel for Python 3.12, nor for Intel Macs from 5.2 on: there, use Python 3.11.

## A first program

<img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/bracket.png" alt="The bracket" width="300" align="right">

```python
import sand3d as s3d

def bracket(w=80, d=40, t=6, hole_d=6.6, pitch=50):
    plate = s3d.extrude("plate", s3d.rect(w, d, r=4), t)
    s3d.hole(plate, hole_d, on=s3d.grid(2, 1, pitch, 0))
    s3d.fillet(plate, 1, edges="top")
    return plate

s3d.export(bracket(), "bracket.glb")
```

Millimetres by default. Every verb with code that runs and its render: [the quickstart](https://sand3d.sandflow.ai/quickstart.html);
objects to play joint by joint: [the gallery](https://sand3d.sandflow.ai/gallery.html); every signature: [the API](https://sand3d.sandflow.ai/api.html).
The programs themselves: [docs/examples/](https://github.com/Sandflow-ai/sand3d/tree/main/docs/examples/) and [programs/](https://github.com/Sandflow-ai/sand3d/tree/main/programs/).

## Give it to your LLM

Put [docs/api.md](https://github.com/Sandflow-ai/sand3d/blob/main/docs/api.md) in the system prompt: the rules of the vocabulary, every
signature, and worked examples, in about 3 600 tokens; [llms.txt](https://github.com/Sandflow-ai/sand3d/blob/main/llms.txt) points a
model at it. For objects of several parts, [the guidelines](https://sand3d.sandflow.ai/guidelines.html) give
the eight rules of an assembly program: the plan first, then the details, then the parts.

## What is in it

Everything on one flat `s3d.<verb>` surface:

| family | verbs |
|---|---|
| profiles | `rect` `circle` `slot` `polygon` `poly` `arc` `spline` `superellipse` `text` `offset` `stroke` … (16) |
| solids and paths | `extrude` `revolve` `sweep` `loft` `wire` `helix` `box` `cylinder` `tube` `sphere` `torus` `dome` … (15) |
| edits | `cut` `join` `intersect` `split` `hole` `pocket` `fillet` `chamfer` `shell` `dent` … (15) |
| frames and placement | `Frame` `face` `edge` `bbox` `local` `at` `transform` `grid` `ring` `along` `snap` |
| articulation | `joint` `pose` `seat` |
| assembly | `group` `assembly` `attach` `export` `units` `fingerprint` … (8) |
| parts and materials | `gear` `knurl` `thread` `material` |

No category verbs (`chair()`, `table()`): a category is a program written *in* sand3d.

## Datasets

sand3d programs for five sources of 3D objects, on Hugging Face under CC BY 4.0.

<table>
  <tr>
    <td width="33%" valign="top"><a href="https://huggingface.co/datasets/Sandflow/sand3d-objaverse"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/datasets/sand3d-objaverse.jpg" alt="sand3d-objaverse" width="240"></a><br>
      <a href="https://huggingface.co/datasets/Sandflow/sand3d-objaverse"><b>sand3d-objaverse</b></a> · Objaverse<br><sub>Everyday objects from Objaverse, each rebuilt as a program.</sub></td>
    <td width="33%" valign="top"><a href="https://huggingface.co/datasets/Sandflow/sand3d-cad"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/datasets/sand3d-cad.jpg" alt="sand3d-cad" width="240"></a><br>
      <a href="https://huggingface.co/datasets/Sandflow/sand3d-cad"><b>sand3d-cad</b></a> · CAD<br><sub>Mechanical parts from public CAD models.</sub></td>
    <td width="33%" valign="top"><a href="https://huggingface.co/datasets/Sandflow/sand3d-articraft"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/datasets/sand3d-articraft.jpg" alt="sand3d-articraft" width="240"></a><br>
      <a href="https://huggingface.co/datasets/Sandflow/sand3d-articraft"><b>sand3d-articraft</b></a> · Articraft<br><sub>Articulated objects from Articraft, their joints declared.</sub></td>
  </tr>
</table>
<table>
  <tr>
    <td width="50%" valign="top"><a href="https://huggingface.co/datasets/Sandflow/sand3d-simready"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/datasets/sand3d-simready.jpg" alt="sand3d-simready" width="380"></a><br>
      <a href="https://huggingface.co/datasets/Sandflow/sand3d-simready"><b>sand3d-simready</b></a> · SimReady<br><sub>Simulation-ready assets from NVIDIA SimReady.</sub></td>
    <td width="50%" valign="top"><a href="https://huggingface.co/datasets/Sandflow/sand3d-automate"><img src="https://raw.githubusercontent.com/Sandflow-ai/sand3d/main/docs/readme/datasets/sand3d-automate.jpg" alt="sand3d-automate" width="380"></a><br>
      <a href="https://huggingface.co/datasets/Sandflow/sand3d-automate"><b>sand3d-automate</b></a> · AutoMate<br><sub>Mechanical assemblies from AutoMate, each part a function of its program.</sub></td>
  </tr>
</table>

Browse them in [the explorer](https://huggingface.co/spaces/Sandflow/sand3d-explorer), or all five in [the collection](https://huggingface.co/collections/Sandflow/sand3d-6aec268fbdcd3bc174236168).

## Citation

If you use sand3d in your work, please cite it. `CITATION.cff` holds the same, and GitHub
shows it as "Cite this repository".

```bibtex
@misc{sand3d2026,
  author = {Neveu, Thibault and Loy, Andr{\'e}a},
  title  = {sand3d},
  year   = {2026},
  note   = {Version 1.6.3},
  url    = {https://github.com/Sandflow-ai/sand3d}
}
```

## Contributing and license

How the library is built, tested and versioned: [CONTRIBUTING.md](https://github.com/Sandflow-ai/sand3d/blob/main/CONTRIBUTING.md).
Apache License 2.0: see [LICENSE](https://github.com/Sandflow-ai/sand3d/blob/main/LICENSE).
