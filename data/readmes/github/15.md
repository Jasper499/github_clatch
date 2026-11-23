# sprite-stacking

An agent skill that turns four pixel art views into fake-3D sprites you can spin. By Daniel White.

![MIT](https://img.shields.io/badge/licence-MIT-111?style=flat-square)
![Agent skill](https://img.shields.io/badge/agent-skill-111?style=flat-square)
![Python 3 + Pillow + NumPy](https://img.shields.io/badge/Python%203-Pillow%20%2B%20NumPy-111?style=flat-square)
![Works with](https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Cursor%20%C2%B7%20OpenCode%20%C2%B7%20Gemini%20CLI%20%C2%B7%20Pi-111?style=flat-square)

![Six sprite-stacked assets spinning](media/showcase.gif)

## Install

```bash
npx skills add danielwh2/sprite-stacking
```

Installs to the current project. Add `-g` for every project, `-a claude-code` (or `codex`, `cursor`, ...) to pick an agent. Uses the [skills CLI](https://github.com/vercel-labs/skills), Node 22.20 or later.

Or copy `skills/sprite-stacking` into your agent's skills folder:

| Agent | Folder |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| Codex, Cursor, OpenCode, Gemini CLI, Pi | `~/.agents/skills/` |

## Use

Ask your agent:

- "Make a rotatable pixel art car."
- "Sprite stack this 4-view sheet and give me a turntable."
- "Add a fake 3D pixel art tree to my Godot game."

No image generator? The agent draws the views itself in a short Python script.

## How it works

![Sheet to slices to render](media/pipeline.png)

1. **Views:** top, side, front and back, orthographic, one row.
2. **Carve:** a voxel survives only where all four views cover it.
3. **Slices:** the volume is cut into a strip of flat layers, ground first.
4. **Render:** each layer is rotated, squashed for pitch and lifted 1 px.

## Slicer CLI

```bash
python3 skills/sprite-stacking/scripts/views_to_slices.py views.png slices.png \
  --slices 36 --preview check.png --html viewer.html
```

- `--slices N`: layer count. 15-20 chunky, 32-48 detailed.
- `--order reading`: force TOP, SIDE, FRONT, BACK. Default matches views by proportion.
- `--round`: towers, balloons, pots carve round, not square.
- `--side-nose right`: the side view faces right.
- `--colours N`: shared palette size, `0` keeps every colour.
- `--normals path.png`: save a matching 3D normal-map slice strip.
- `--emissive path.png`: save an auto-detected emissive mask strip (headlights, windows, neon).

## Viewer

`--html` writes a standalone page:
- **Modes:** Turntable, **Scene** (Living Diorama with **Neon Street** and **Meadow Island** procedural stacked props, unified Y-sorting, and multi-PNG drop / `+ Add Prop`), Slice scan, Exploded view, and **Play** mode (**Drive** with WASD/arrows + drift across infinite Street/Meadow/Grid worlds, **Wind** sway, **Shatter** & rebuild).
- **Lighting & Weather:** Live **Time of Day** (Day → Sunset → Night with auto-emissive glow and ground light pools), draggable sun (`Shift+drag`) with projected 3D shadows, and **Weather** (**Rain** with pixel streaks, ground ripples, and wavy upside-down wet reflections; **Snow** with real-time snow cap accumulation on upward-facing voxels via `normZ`).
- **Performance:** Vectorized NumPy carving, zero-allocation typed-array software rasterizer, and angle/lighting-keyed prop sprite caching (~0.2–1.5 ms/frame in Chrome).
- **Export:** 16-direction baked PNG sprite sheet export. `skills/sprite-stacking/scripts/viewer.html` also opens on its own and accepts dropped slice strips.

## Requirements

Python 3 with Pillow and NumPy (`pip install pillow numpy`).

## Contributing

```bash
python3 tests/check.py
```

Prints `ok`.

## Prior art

Sprite stacking is a long-standing indie game technique, not invented here. This skill adds the four-view carving and the agent workflow.

## Licence

MIT
