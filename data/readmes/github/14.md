# florilegium

[![build](https://github.com/kevinraymond/florilegium/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/kevinraymond/florilegium/actions/workflows/build.yml)
[![playground](https://github.com/kevinraymond/florilegium/actions/workflows/pages.yml/badge.svg?branch=main)](https://kevinraymond.github.io/florilegium/)
[![release](https://img.shields.io/github/v/release/kevinraymond/florilegium?color=2456c4)](https://github.com/kevinraymond/florilegium/releases/latest)
[![license](https://img.shields.io/github/license/kevinraymond/florilegium?color=2456c4)](LICENSE)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/kevinraymond/florilegium/badge)](https://scorecard.dev/viewer/?uri=github.com/kevinraymond/florilegium)

## Origin

The [Reddit post](https://www.reddit.com/r/LaTeX/comments/1xixznw/how_do_you_make_these_flowers_in_latex/)
asked how to make flowers like these in LaTeX. I don't know how the original was made. This
project is one possible way, and the way I did it uses hand-authored primitives with
randomized parameters, painted in Lua and placed by a procedural layout whose "fill the
unused space" part borrows a 1998 idea from the ornament literature.
It gets a similar look, but I explicitly tried to not replicate the original.

This project was made with the assistance of AI (Claude), and I'm sharing the
[process I used](PROCESS.md) to bring it to life.

## What it is

Procedurally generated Delft-blue floral page margins for LaTeX. No images, no imported
paths, no external assets: every petal, leaf and stem is a parametric curve computed in Lua
while the page is being written, painted like a watercolor, and written straight into the
PDF. Every page gets its own garden.

[Try it in your browser](https://kevinraymond.github.io/florilegium/). The playground sets a page
as a printer's proof, grows its margin with the same Lua, and hands it back as an SVG, a LaTeX
preamble or a Typst page setup.

![six seeds](gallery/seeds.gif)

*Six seeds of the grown composition. Same code, different seed — and the garden fills
whatever space the text leaves free.*

Two documents share one package, and two more (`showcase.tex`, `spread.tex`) show what
else it does:

| | `florilegium.tex` | `florilegium-grow.tex` |
|---|---|---|
| composition | **authored**: stems, leaves and flowers placed by hand, every parameter sampled | **grown**: a plant grown to fit the page by a greedy space-filling loop |
| adapts to | nothing (tuned for A4, 68 mm margin) | the page layout, and the free space below the text on the last page |
| preview | <img src="gallery/preview-authored.png" alt="authored" width="300"> | <img src="gallery/preview-grown.png" alt="grown" width="300"> |
| PDF | [florilegium.pdf](https://github.com/kevinraymond/florilegium/releases/latest/download/florilegium.pdf) | [florilegium-grow.pdf](https://github.com/kevinraymond/florilegium/releases/latest/download/florilegium-grow.pdf) |

Both PDFs are self-describing: the body text is the write-up of how the margin is drawn.

![last page of the grown document](gallery/preview-grown-lastpage.png)

*Last page of the grown document: the text ends early, so branches arch into the space below.*

![detail](gallery/detail.png)

*300 dpi crop. Mottled washes with white streaks lifted out, lobed leaves with white veins,
forget-me-not cymes, a pale ghost flower behind the stems.*

## Watch it grow

| as it grows | with the free space it fills |
|---|---|
| <img src="gallery/growth.gif" alt="seed 6 growing" width="400"> | <img src="gallery/growth-explain.gif" alt="seed 6 growing, with the free discs marked" width="400"> |

*Seed 6, from an empty margin to the finished page. The stems rise first, leaves open as
the tips pass their nodes, and each stem ends in a flower. Then the greedy loop takes over:
on the right, each dashed circle is the largest free disc it found, just before a branch
grows to it. Big holes come first and slowly, small ones last and fast. The butterflies and
bees fly in, the bird glides onto its twig, and the snail crawls up its stem until the last
frame, which is exactly the page this seed always gives.*

The growth is recorded once, while the page is laid out: each stem is also drawn as
prefixes of increasing length and each motif at a few smaller scales, replaying the same
random draws. A frame then writes the pieces whose time has come, in their original
painting order. `make grow-6` renders one seed this way (`build/grow-6.gif` and `.mp4`, about
45 seconds); add `EXPLAIN=1` for the dashed circles.

## The margin reads the text

![the three pages of showcase.tex](gallery/preview-showcase.png)

*`showcase.tex`, "A year in the margin": spring on the first page, summer, autumn on the
last. Each section describes the feature it shows. Download
[showcase.pdf](https://github.com/kevinraymond/florilegium/releases/latest/download/showcase.pdf).*

The grown margin can respond to the document around it:

- **Initials.** `\florilegiuminitial[5]{E}` sets the first letter of a paragraph in a tile
  five lines tall. The outline of the letter is read from an OpenType font (Latin Modern
  Bold by default) and painted like a petal; a vine passes over and under its strokes in
  turn, with leaves where they fit and flowers in the gaps, often in the letter's counters.
  The letter is also typeset invisibly, so the paragraph still copies as "Every".
- **Flowers at the headings.** With the option `sections`, every numbered section and
  subsection gets a flower in the margin beside its heading, painted in the copper of the
  accents, the way headings were once picked out in red.
- **A flower where the text asks.** `\florilegiumbloom` puts a flower beside the line it
  stands in; `\florilegiumbloom[lily]` asks for any motif of the garden. The marks are found
  in the page box when the page is shipped out, so this works in one run.
- **Seasons.** With the option `aging`, the garden ages from spring on the first page
  (mostly in bud, small pale leaves) to autumn on the last (seed heads, falling petals, a
  few copper leaves). It needs two runs, for the page count; `\florilegiumage{0.8}` sets an
  age by hand instead.

![four initials](gallery/initials.png)

![one seed through the seasons](gallery/seasons.png)

*One seed in spring, early summer, late summer and autumn. The seasons change what grows,
not where.*

## Visitors

![detail with a bird and a snail](gallery/detail-visitors.png)

Most pages have visitors: a butterfly or two and bees in the open spaces, a snail crawling
up one of the main stems, and on about one page in five a bird perched on a twig of its own.
They come from a random stream of their own, so a page without them is exactly the page it
would have been; the option `novisitors` leaves them out.

## Any ink

![one seed in six inks](gallery/inks.png)

*The whole palette comes from one color, `ink`: Delft blue, sepia, green, crimson, violet,
teal. The ramp from the darkest stroke to the palest wash is computed from that hue in
OKLCH, so the light end never turns gray.*

## Themes

![seed 6 as flora, geometric and math](gallery/themes.png)

*Seed 6 three times: as it always grew, with `theme=geometric`, and with `theme=math`.*

The growth loop never knew what it was drawing. It reads a table of motifs (the size of
the disc each one takes, a weight, a function that draws it) and calls every primitive by
name. A theme is one Lua file, `florilegium-theme-<name>.lua`, that replaces some of those primitives
and may add rows to the table, or brings a composition of its own.

**`theme=geometric`** is the same plant cut from flat shapes (`florilegium-theme-geometric.lua`). It
grows exactly as the flowers do, and only the drawing changes: the stems run straight
between their nodes, the leaves are kites and toothed polygons folded into a light and a
dark facet with straight white veins, the flowers are rosettes of rhombi or layered star
polygons, the tendrils square spirals, the bird and the butterfly low-poly. The colors are
flat tones of the ink, with no wash; crystals (Platonic solids, flat-shaded like cut
stones) grow among the flowers. A page is about a tenth of the size of a flora page.

<img src="gallery/geometric.png" alt="a page with the geometric theme" width="500">

![the primitives of the geometric theme](gallery/specimen-geometric.png)

**`theme=math`** is no plant at all (`florilegium-theme-math.lua`, drawing from `florilegium-figures.lua`):
mathematics cascading down the margin and across the bottom of the page, overlapping a
little so it blends. A large figure sits in the corner where the column meets the bottom
(an Apollonian gasket, a deep Koch snowflake, Vogel's disc, a polyhedron). Down the column
run one or two *families*, figures that change as they go, joined by small copper arrows:
the Koch snowflake gaining a level, a polygon gaining sides on its way to the circle, the
cube truncating into the octahedron, chords k → mk mod n turning from a cardioid into a
nephroid, Vogel's disc packing evenly only at the golden angle. Equations that hold
(e^{iπ} + 1 = 0, V − E + F = 2, ...) run along the bottom and under the text on the last
page, and everything else, largest hole first, is figures (Platonic solids, knots, Hilbert
curves, Lissajous curves, hypotrochoids, Maurer roses, the Petersen graph, ...), letters,
numerals and symbols set by TeX at many sizes and a slight tilt, and dots. It fills
whatever space the page leaves, like the garden; `density` sets how much there is.

<img src="gallery/math.png" alt="a page with the math theme" width="500">

```latex
\usepackage[grown,theme=geometric]{florilegium}   % or theme=math; the whole document
\florilegiumtheme{math}                            % or from the page this stands on
```

A document without a theme comes out byte for byte as it did before themes existed.

## Less in the margin

![seed 6 at density 1, 0.5, 0.2 and 0.05, and at intensity 0.5](gallery/dials.png)

*Seed 6 at `density=1`, `0.5`, `0.2` and `0.05`, and at `intensity=0.5`.*

A full garden is a lot to have beside an equation. Two options turn it down, with any
theme:

- **`density=0.4`** grows less: the loop stops at larger holes, keeps more paper around
  each motif, and hangs fewer leaves and fillers. Low on the dial the plant itself thins
  out: two main stems, then one, no footer; at `0.05` it is a single vine with its flower,
  a couple of leaves and one or two sprays. With the math theme it means fewer things.
- **`intensity=0.5`** paints the whole margin paler, the same way the ghost flowers behind
  the garden are painted. It changes only the color, not the detail.

```latex
\usepackage[grown,density=0.4,intensity=0.6]{florilegium}
```

At the defaults (`1` and `1`) every page is exactly the page it was before.

## One ornament in the text

![\florilegiumornament](gallery/ornaments.png)

Or no margin at all: `\florilegiumornament{leaf}` sets one primitive in the line, in a box
the size of a letter, for example to open a paragraph. Each ornament in a document gets a
shape of its own and keeps it from one build to the next; `seed=random` draws a new one
every time the PDF is built, and `seed=7` a fixed one.

```latex
\usepackage[nomargin]{florilegium}       % ornaments only, no garden in the margin
\florilegiumornament{leaf} A paragraph that opens with a leaf.
\florilegiumornament[size=2.4em, ink=5B2A1F, angle=30, seed=random]{flower}
```

Any primitive works (`leaf`, `leaflet`, `flower`, `blossom`, `bud`, `bell`, `lily`, `cyme`,
`umbel`, `butterfly`, `bee`, `bird`, `hedera`, `sparkle`, ...), and so do the current
theme's (`crystal` with `geometric`; `knot`, `polyhedron`, `koch`, ... with `math`).

## Both sides of the page

![pages 2 and 3 of spread.tex](gallery/spread.png)

*`spread.tex`, pages 2 and 3: a two-sided document with a wide outer margin. The garden
grows on the left of the left-hand page and, mirrored, on the right of the right-hand page.
The last page also switches to the geometric theme. Download
[spread.pdf](https://github.com/kevinraymond/florilegium/releases/latest/download/spread.pdf).*

The garden grows in whichever side margin is wider, so there is nothing to set. In a
two-sided document (`twoside` with a wide `outer` margin) it changes sides with the page. A
one-sided document with a wide right margin gets it on the right of every page. A mirrored
page is laid out as if seen in a mirror, then drawn through a reflection: the last
transform that every point already passes through. It is exactly the reflection of the
garden the same seed would grow on the left.

## SVG, Typst and the browser

![the playground: a proof of the page on the left, its colophon on the right](gallery/playground.png)

*The [playground](https://kevinraymond.github.io/florilegium/), seed 12 in autumn on a last
page. The page is a proof, and its colophon, the note a book keeps about its paper, ink and
printing, is the set of controls: every copper word in it can be changed.*

The same Lua can draw a page without TeX. `florilegium-svg.lua` runs the package's own code with a small
stand-in for the few parts of TeX it touches (the page's lengths, the page number, and the node
a drawing goes into), takes the PDF drawing commands that `florilegium-ink.lua` writes as it always does,
and rewrites them as SVG. Nothing in the drawing code changes, so the garden is the one
LuaLaTeX would draw, not an imitation of it.

```sh
texlua florilegium-svg.lua --seed 7 > margin.svg   # page 1 of a document with \def\florilegiumseed{7}
lua florilegium-svg.lua --seed 7 --season autumn --ink 5B2A1F --left 25mm --right 65mm > margin.svg
texlua florilegium-svg.lua --help                  # paper, margins, two-sided pages, the last page, themes...
make svg SEED=7                        # -> build/svg-7.svg
```

Any Lua 5.3 or 5.4 runs it. Lengths are read the way TeX reads them and colors are converted
the way xcolor converts them, so `--seed 7` with the default margins gives, byte for byte, the
drawing on page 1 of `florilegium-grow.tex` built with seed 7. The SVG is a whole page with a
transparent background, which makes it a page background anywhere. In Typst:

```typst
#set page(paper: "a4", margin: (left: 68mm, right: 22mm, top: 32mm, bottom: 30mm),
  background: image("margin.svg", width: 100%, height: 100%))
```

The playground runs the same files in the browser with [wasmoon](https://github.com/ceifa/wasmoon),
Lua 5.4 compiled to WebAssembly, in a background worker, and a page grows in about a second.
Seed 7 there is seed 7 here. The proof is the control surface as much as the colophon is: the
measure above it sets the margin, and dragging the foot of the text up makes a last page. The
text on the proof describes the garden that just grew, from the counts the growth loop keeps.
Under it, the page can be seen as readers with protanopia, deuteranopia or tritanopia see it,
with the distance between the ink and the accent measured for each (Machado, Oliveira and
Fernandes's model, distances in Oklab); a pairing that is hard to tell apart is flagged when you
choose it. Next to the download are the LaTeX preamble, the Typst setup and the command line that
make the same garden, and the address bar keeps every setting, so a garden can be shared as a link.

To run it from a clone, serve the repository with `make playground` and open
<http://localhost:8000/web/>. The math theme works too. Its figures come from the same Lua; its
equations and symbols, which TeX sets in a PDF, are set in the playground by MathJax in the same
Computer Modern, and the command line leaves them out. The fonts are served with the page (IM FELL
DW Pica, and Latin Modern renamed as its license asks), so nothing is fetched from a font service.

## In PostScript

![the two pages of postscript/florilegium.ps, seed 7](gallery/preview-postscript.png)

*`postscript/florilegium.ps`: the grown margin in pure PostScript, one self-contained file.
Ghostscript, or a printer, computes every petal while it interprets the page, and the
two pages of text explain how.*

The drawing core, every primitive and the growth loop are ported from `florilegium-ink.lua`, `florilegium-flora.lua`
and `florilegium-grow.lua`, procedure for procedure. It needs no TeX and no other file:

```sh
gs -dALLOWPSTRANSPARENCY -sDEVICE=pdfwrite -dSeed=7 -o garden.pdf postscript/florilegium.ps
make postscript             # the same -> build/postscript-7.pdf; SEED=12 for another garden
```

`-dSeed=N` picks the garden; without it the interpreter's calendar picks one, so every print
is new.
`-dAge=0` to `1` sets the season, and `-dNoVisitors` leaves out the butterflies, bees, snail
and bird. Two pages take about 2.5 seconds. Much of the Lua maps directly: PostScript's own
transformation matrix places each primitive (translate, rotate, scale), paths and Bézier
curves are native, and procedures built at run time stand in for Lua's closures (a petal's
half-width is a procedure handed to the outline builder). Four things don't map:

- **Layers.** The garden grows in one order but is painted back to front, so every fill and
  stroke is captured with `pathforall` into a list per layer, and the lists are played back
  at the end.
- **Transparency.** PostScript has none. Ghostscript provides it with `-dALLOWPSTRANSPARENCY`.
  Without that flag, or on a printer, each translucent fill is mixed with the color it is
  likely to land on and painted opaque. The result is flatter, but it's the same garden.
- **Randomness.** The generator is Park-Miller in 32-bit integer arithmetic, and PostScript
  reals are single precision, so seed 7 here is a different garden from seed 7 in LaTeX.
- **Text.** The file typesets its own two pages in Times. It knows where its headings are and
  where its text ends, so the copper flowers at the headings and the garden under the last
  line work as they do in LaTeX. It has no initials, animation, themes, mirrored pages,
  density or intensity, ornaments in the text, or authored composition.

[`postscript/README.md`](postscript/README.md) describes every option, how a seed is chosen
when none is given, what to know before porting the file further, and the tests that
`postscript/check.sh` runs on it.

<img src="gallery/printed.jpg" alt="two prints of florilegium.ps, two different gardens" width="500">

*The file sent twice to an Epson inkjet with `lp postscript/florilegium.ps`, with no seed
given. The computer's print system runs the program again for each job, so each print takes
its seed from the clock and grows a different garden. A printer gets the opaque version, as
it has no transparency.*

## Build

LuaLaTeX, one pass, about a second a page (two passes for `showcase.tex`, whose seasons need
the page count).

```sh
make                        # the four PDFs
make seed-7                 # one page from seed 7 -> build/seed-7.pdf
make gallery                # gallery/seeds.png + seeds.gif, inks.png, seasons.png, themes.png, dials.png (python3, Pillow, pdftoppm)
make grow-6                 # growth animation of seed 6 -> build/grow-6.gif + .mp4 (ffmpeg)
make grow-6 EXPLAIN=1       # the same with the free discs marked -> build/grow-6-explain.*
make svg SEED=7             # the same page as SVG, without TeX -> build/svg-7.svg
make playground             # the browser playground at http://localhost:8000/web/
```

No TeX installed? Build the image once and run everything in it:

```sh
docker build -t florilegium-tex tools
make RUN=tools/in-docker
```

Or paste `florilegium.sty`, the `.lua` files and one of the `.tex` files into an
[Overleaf](https://www.overleaf.com) project and set the compiler to LuaLaTeX.

Use it in your own document:

```latex
\usepackage[grown]{florilegium}      % or plain \usepackage{florilegium} for the authored one
% options for the grown one: sections (flowers at the headings), aging (two runs),
% novisitors (no butterflies, bees, snails or birds); for both: theme=geometric or theme=math,
% density=0.4 (grown only), intensity=0.6
% two-sided? nothing to set: the garden grows in the wider side margin
\definecolor{ink}{HTML}{5B2A1F}      % optional: the hue of the whole palette (this is sepia)
\definecolor{accent}{HTML}{B4662F}   % optional: the copper of the hairlines
...
\florilegiuminitial[4]{T}his paragraph starts with a decorated T.
... a flower in the margin beside this line\florilegiumbloom ...
\florilegiumage{0.8}                 % grown only: autumn from here on
\florilegiumtheme{geometric}         % another theme, from the page this stands on
\florilegiumornament{leaf}           % one leaf in the text, the size of a letter
\florilegiumtextend                  % grown only: at the very end of the text
```

A fixed seed instead of the page number: `lualatex "\def\florilegiumseed{7}\input{florilegium-grow.tex}"`.

Any primitive can be drawn on its own inside a TikZ picture, under the current scope's
shift, rotation and scale:

```latex
\begin{tikzpicture}
  \begin{scope}[shift={(2,2)},rotate=20]\florilegiumdraw{flower}{1.3}\end{scope}
  \begin{scope}[shift={(5,0)}]\florilegiumdraw{leaf}{3.0, {depth=0.6}}\end{scope}
  \begin{scope}[shift={(8,1)}]\florilegiumdraw{ghost}{"lily", {s=1.4}}\end{scope}
  \begin{scope}[shift={(11,1)}]\florilegiumdraw{butterfly}{1.5}\end{scope}
\end{tikzpicture}
```

With a theme, its primitives can be drawn by name too: `\florilegiumdraw{crystal}{1.0}` under
`theme=geometric` (see `specimen-geometric.tex`), `\florilegiumdraw{knot}{1.2}` under `theme=math`.

## How it works

**Drawing** (`florilegium-ink.lua`). All geometry is computed in Lua and written as PDF path operators
into one literal node per page; TeX does no arithmetic. Primitives are drawn in a local
frame under an affine transform, which is read from TikZ when a primitive is called inside
a scope. Colors come from a tone ramp derived from the one document color `ink`: navy to
mist at the hue of `ink`, interpolated in OKLCH so the light end stays blue instead of
turning gray. Tapered strokes are two offset Béziers, not sampled ribbons.

**Primitives** (`florilegium-flora.lua`). Painted in the order a watercolorist would: a flat wash,
darker blotches multiplied over it, pigment pooling at the edges, streaks lifted out in
white, a few fine veins, and almost no outlines. Broad petals and flowers, star lilies seen
at a tilt, blossoms and florets, buds and bellflowers; lobed and entire leaves; forget-me-not
cymes that curl like a scorpion's tail, branching sprigs, umbels, tendrils, seed heads;
butterflies, bees, snails and a bird; copper sparkles, rosettes and the ivy-leaf fleuron
whose stem becomes the head rule. Any of them can be painted as a pale ghost.

**Authored composition** (`florilegium-authored.lua`). A plant grows from a root in the bottom-left
corner: three stems through hand-picked control points, a fourth along the bottom of the
page as the footer, leaves at chosen fractions of the stems, and every other motif on a
branch that leaves its stem tangentially and arrives along the motif's axis — so every
flower can be traced back to the root.

**Grown composition** (`florilegium-grow.lua`), in the spirit of Wong, Zongker & Salesin,
[*Computer-Generated Floral Ornament*](https://dl.acm.org/doi/10.1145/280814.280948)
(SIGGRAPH 1998). The stems sway up the column as smooth noise of their height; leaves are
hung at their nodes where there is room. Then, repeatedly: take the largest free disc within
reach of a stem, choose a motif that fits it, and grow a branch to it from the nearest stem
point; the branch becomes a stem in turn. Big holes are taken first, so flowers and lilies
land early, sprays and leaves fill the middle, and the loop ends by tucking leaflets, buds
and florets onto the stems. The end of the text is measured with `\pagetotal` in the same
pass, so a short last page grows branches into the space below it with one compilation.

**Reading the page** (`florilegium.lua`). A heading or `\florilegiumbloom` leaves an
invisible marker node in the text. When the page is shipped out, its box is walked node by
node, adding up heights, depths and the glue as it was set, to find each marker's height on
the page; the garden then gives those lines their flowers before any leaf is hung. An age
reweights the motifs: buds and sprays of buds in spring, seed heads in autumn, when some
leaves are painted with a ramp built from the accent instead of the ink.

**Initials** (`florilegium-initial.lua`). The letter's outline comes from luaotfload's OpenType reader as
Bézier segments. Flattened into polygons, it gives an even-odd inside test, and a grid of
distances to the letter and the frame finds the largest gaps for the flowers. The vine is a
Catmull-Rom curve across the tile; where it crosses the letter it goes over and under in
turn, and the strands that go over are drawn again, clipped to the letter, with a thin halo
of paper.

**Procedural ≠ random.** The seed is derived from the page number, so page *n* always
gets garden *n*. Reproducibility is what makes the document stable enough to typeset.

See [CLAUDE.md](CLAUDE.md) for a handoff-style map of the code, the tunables, and ideas not
yet done.

## Credits

- The [Reddit post](https://www.reddit.com/r/LaTeX/comments/1xixznw/how_do_you_make_these_flowers_in_latex/)
  that asked the question (see [Origin](#origin)).
- The growth loop follows Wong, Zongker & Salesin,
  [*Computer-Generated Floral Ornament*](https://dl.acm.org/doi/10.1145/280814.280948) (SIGGRAPH 1998).
- The tone ramp is computed in [Oklab](https://bottosson.github.io/posts/oklab/), Björn Ottosson's
  perceptual color space; the conversion matrices in `florilegium-ink.lua` are his, released into the public domain.
- The random numbers come from [mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c),
  Tommy Ettinger's public-domain generator. The PostScript port uses the "minimal standard"
  generator of Park and Miller (Communications of the ACM, 1988) by Schrage's method (ACM
  Transactions on Mathematical Software, 1979).
- `\florilegiumornament`, its `ink` and `seed=random` keys, and the `density` option answer
  [issue #4](https://github.com/kevinraymond/florilegium/issues/4) from rubyFeedback.
- The playground runs the Lua in the browser with [wasmoon](https://github.com/ceifa/wasmoon)
  (MIT) and typesets the math theme's equations with [MathJax](https://www.mathjax.org) (Apache 2.0),
  both loaded from jsDelivr. It is set in Igino Marini's IM FELL DW Pica (SIL OFL) and Latin Modern
  (GUST e-foundry, GUST Font License); see `web/fonts/README.md`. Its color-blindness views use
  the model of Machado, Oliveira & Fernandes, *A Physiologically-based Model for Simulation of
  Color Vision Deficiency* (IEEE TVCG, 2009).
- The math theme's figures keep the names of the people they come from: Maurer's roses, Vogel's
  model of the sunflower, Temple Fay's butterfly curve, the Petersen graph, Koch's snowflake,
  Hilbert's curve, Lissajous figures, the gasket of Apollonius.

## License

MIT, see [LICENSE](LICENSE). Copyright (c) 2026 Kevin Raymond.
