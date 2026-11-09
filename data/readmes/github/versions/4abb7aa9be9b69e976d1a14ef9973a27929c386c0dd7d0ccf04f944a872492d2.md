<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="media/livliv-player-wordmark-white.svg">
    <img alt="LivLiv Player" src="media/livliv-player-wordmark-2000.png" width="360">
  </picture>
</p>

<p align="center">
  A lightweight 2.5D character player for the web, with lip sync and webcam face tracking. A few lines of code put a character in a page, a stream overlay or an app.<br>
  Comes with 21 featured characters in different styles, ready to use.
</p>

<p align="center"><b>English</b> · <a href="README.zh-CN.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.vi.md">Tiếng Việt</a></p>

<p align="center"><img src="media/demo.gif" alt="Featured characters breathing, blinking, turning their heads and talking" width="720"></p>

- WebGL2, no dependencies, about 30 KB gzipped for the core
- Lip sync (microphone, audio, video) and webcam face tracking (MediaPipe), both in the browser, imported only when you need them
- Plays LivLiv, VRM and PNGTuber characters through the same API
- 21 featured characters in [`characters/`](characters/), ready to use

## Try it

- **Online**: the examples run on [livliv-dev.github.io/player](https://livliv-dev.github.io/player/).
- **Here**: `npm install && npm run build`, serve this folder with any static server and open `/example/demo.html`
  (expressions, actions, microphone, camera; `?model=../characters/<id>/` picks another character).
  `/example/png.html` and `/example/vrm.html` show a PNGTuber and a VRM.
- **On livliv.ai**: each character's page there plays it with the same renderer. Start at
  [livliv.ai/discover](https://livliv.ai/discover).

## Project LivLiv

We want the art of creating characters to belong to everyone.

We're open-sourcing our AI tools for character creation, the player and its playback protocol, and a stage
where your characters can meet an audience.

Come say hello on [Discord](https://discord.gg/ac5qF36T2H) and follow us on [X (Twitter)](https://x.com/livliv_ai).

## Use it in your page

```sh
npm install @livliv-dev/player
```

```js
import { Player } from '@livliv-dev/player'

const player = new Player(document.querySelector('canvas'))
await player.load('characters/k01/')   // a folder with model.json and textures/, or a .livliv file

player.setExpression('smile')          // ids are in player.expressions
player.act('nod')
player.params.mouthOpen = 0.6          // 0..1
```

Lip sync and face tracking:

```js
import { createSpeech } from '@livliv-dev/player/voice'
import { startFaceTracking } from '@livliv-dev/player/tracking'   // needs @mediapipe/tasks-vision

const speech = createSpeech(player)
button.onclick = () => { speech.unlock(); speech.say('/reply.mp3') }

await startFaceTracking(player)
```

A VRM or a PNGTuber, on the same API:

```js
import { BodyPlayer } from '@livliv-dev/player/body'
import { VrmBody } from '@livliv-dev/player/vrm'    // needs three and @pixiv/three-vrm
import { PngBody } from '@livliv-dev/player/png'

const vrm = new BodyPlayer(canvasA, new VrmBody())
await vrm.load('/avatars/me.vrm')
const png = new BodyPlayer(canvasB, new PngBody())
await png.load({ closed: 'me-closed.png', open: 'me-open.png' })
```

The whole API is in [API.md](API.md): options, params, expressions and actions, drivers, VRM and PNGTuber characters,
the limits on untrusted files, the model package and the format version. The LivLiv package format (`.livliv`,
`model.json` v4) is in [FORMAT.md](FORMAT.md), with a JSON Schema in [`schema/`](schema/); packages exported before v4
are described in [FORMAT-v3.md](FORMAT-v3.md) and still play.

> The npm package is the player alone. The featured characters are in this repository's [`characters/`](characters/): copy
> the ones you use next to your page, with their licence.

## Featured characters

`characters/` holds 21 characters, ready to `load()`. They carry a small LivLiv mark in the bottom-right corner, which
the player draws. They are **not** covered by the Apache License. Most were made by LivLiv: use those free for personal, non-commercial projects with credit
("Characters: LivLiv (livliv.ai)"); don't sell them, use them commercially or train AI models on them. Nana is
LivLiv's mascot. The terms are in [characters/LICENSE.md](characters/LICENSE.md).

Kujira, Kujira Q and Pen come from other people's work: that licence and that credit don't cover them. Their sources,
credits and terms are in [characters/CREDITS.md](characters/CREDITS.md).

Each also has a `cover.webp` (512 x 768, about 50 KB), its first frame without the mark. `player.load(source, { poster })`
shows it on the canvas until the first frame. To have it before any script has run, put it under the canvas with
`object-fit: contain` and fade the character in over it, as [example/loading.js](example/loading.js) does.

| id | name | id | name | id | name |
|---|---|---|---|---|---|
| `k01` | Sena | `d01` | Yui | `v01` | Aster |
| `k02` | Elio | `d02` | Leo | `v03` | Mira |
| `char06` | Aoi | `d03` | Nana | `v04` | Kai |
| `char07` | Sora | `d03ft` | Nana (refined) | `v05` | Lilith |
| `s01` | Hana | `p01` | Kujira | `v06` | Usa |
| `q02` | Mochi | `p02` | Kujira Q | `v07` | Stella |
| `q03` | Kotaro | `p03` | Pen | `w01` | Max |

## Characters of your own

You can bring in a PNGTuber's pictures, or a VRM (drawn with three.js); or make a character of your own from one
picture on [livliv.ai](https://livliv.ai).

- **A PNGTuber**: two pictures (mouth closed, mouth open), and two more with the eyes closed if you have them.
- **A VRM**: from VRoid Studio or any tool that exports VRM 0.x or 1.0.
- **A LivLiv model**: make one from a picture on [livliv.ai](https://livliv.ai), then download its model package from
  the character's page (**Model package**): a `.livliv` file. Pass it to `load()` as it is (a URL, or the `File`
  someone picked), or unzipped as a folder. Packages on the free plan carry the LivLiv mark, and the player draws it.

## About the player and the characters

LivLiv Player and the `.livliv` format are LivLiv's own work. They use no Live2D software or Cubism SDK and do not
read `.moc3` or `.cmo3` files. "Live2D" is a trademark of Live2D Inc.; LivLiv is not affiliated with it.

Making a character on livliv.ai uses AI. The player itself only plays: it calls no AI service and reads only the files
you point it at. Face tracking runs Google's MediaPipe in the browser, and camera images stay on the device; API.md has
the networking details.

The featured characters in this repository were made on LivLiv too, also with AI; Kujira, Kujira Q and Pen adapt other
people's characters ([credits](characters/CREDITS.md)). Refined Nana (`d03ft`) also has
swinging parts and head-turn keyforms added with LivLiv's own tools.

A package's `meta.author` and `meta.license` record who made it and on what terms: keep them and follow them. When you
show a character made with LivLiv in public, say that AI was used to make it, and don't present it as hand-drawn or
hand-rigged.

## Embed without code

```html
<iframe src="https://livliv.ai/live/k01" width="480" height="640" allow="camera; microphone"
  style="border:0;background:transparent"></iframe>
```

The same `/live/<id>` page has a transparent background and works as an OBS Browser Source.\
(Powered by [https://livliv.ai](https://livliv.ai))

## Develop

```sh
git clone https://github.com/livliv-dev/player
cd player
npm install
npm run check          # types
npm run build          # dist/: index.js, tracking.js, voice.js, body.js, png.js, vrm.js (ES modules), chunks/ and types/
npm test               # unit and fuzz tests (Node 22.18 or newer, no browser)
npm run test:browser   # every featured character drawn in headless Chromium; once: npx playwright-core install chromium-headless-shell
npm run test:engines   # a sample on Firefox and WebKit, where WebGL2 starts (a GPU or a software GL); once: npx playwright-core install firefox webkit
```

`src/runtime/` is the renderer and motion code livliv.ai runs; this repository is published from it. See
[CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [SECURITY.md](SECURITY.md).

## Browser support

WebGL2 and ES2023: Chrome / Edge 97+, Firefox 104+, Safari 15.4+. Tested on current desktop browsers, not yet on phones.

## License

The code is under the [Apache License 2.0](LICENSE) (see also [NOTICE](NOTICE)). The featured characters have their
own licence, [characters/LICENSE.md](characters/LICENSE.md). Neither licence covers the LivLiv name and logos.

## Thanks

Thanks to 上善无形, ZipZipPipe and 贱兔死顺盖, whose characters Kujira, Kujira Q and Pen are based on: see [characters/CREDITS.md](characters/CREDITS.md).
