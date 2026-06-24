# Pixel Puzzle with Friends (pp·wf) — Implementation Brief

A handoff for the agent building this out. Context and design decisions are settled below; specifics of the renderer and data structures are yours to figure out.

## What it is

A **color nonogram** (picross) game with a terminal/ANSI aesthetic. Originally written in CoffeeScript a decade ago, now being rewritten in **TypeScript**. Rendering is **canvas-based** (not tied to it, but canvas is the current and preferred approach). The goal is the _look_ of a terminal — colored glyph grid, box-drawing chrome — **not** an actual terminal interface. No xterm.js, no escape codes; draw a character grid directly to canvas with a bitmap/CP437 font.

A playable prototype already exists with placeholder art. The remaining work is dressing it in the ANSI aesthetic and wiring the visual feedback.

## Core mechanic — what makes it a _color_ nonogram

- Each cell resolves to one of several colors (or blank).
- Row and column clues are **per-color**, and clue numbers are drawn in the color they refer to.
- **All color layers are solved together in one grid.** This is deliberate and important: because a cell can only be one color, asserting a cell's color simultaneously constrains every other color. The puzzle stays unambiguous and the player never context-switches between color modes.
- These started life as newspaper puzzles, so the puzzle is **self-verifying by nature** — you either reproduce the picture or you don't. Feedback features are quality-of-life, not load-bearing.

## Input model (desktop + mobile, unified)

- A **palette** sits top-left of each puzzle, showing **all** colors in that puzzle plus a **blank tile**.
- Interaction: **tap a color to select it, tap a cell to apply it.** Same model on desktop and mobile — no mode toggles, no right-click dependency, no gestures to learn.
- The blank marker is treated as just another paintable "color" in the palette. In the mockup it renders as glyph `O` (capital O, 0x4F).
- **Errors are unpunished.** There's no failure state. A misplaced tap is one tap from being fixed, so no confirm dialogs, previews, or guard rails are needed. Keep interaction immediate; undo / re-tap handles mistakes.

## Solve feedback (the one nuance worth getting right)

Chosen approach (contemplative, not Nintendo-style immediate-fail):

- Feedback is **per individual clue number**, not per whole row/column. As the player fills runs, each clue number that is independently satisfied by the current grid state **flips its coloring (swap fg/bg)** to show it's done.
- Example: clue `2 1 3` against a partial row — the leading `2` can flip satisfied even if cells further along are wrong.
- **Optimistic / ambiguous satisfaction is acceptable on purpose.** A run can satisfy a clue number while still being ultimately wrong; that's fine. Perpendicular clues cross-validate and surface real errors eventually, and the looseness keeps the player thinking rather than following a guide. No need to engineer "locked-in" certainty.
- Satisfaction must be **re-evaluated live** as the player edits — removing a cell from a satisfied run should un-flip its number.

## The REXPaint → spec workflow

- UI is being mocked in **REXPaint**. The `.xp` files are a **visual specification**, not runtime assets. The game draws its display procedurally from puzzle data (grid state, clues, palette); it does not load `.xp` at runtime.
- The mockup's job is to pin down concrete choices: which glyphs, which exact colors, what layout. Translate those into the renderer.
- **An agent can read `.xp` directly** (gzip-wrapped; 4-byte version, 4-byte layer count, then per layer: width, height, and `w*h` cells in **column-major** order, each cell = 4-byte glyph + 3-byte fg RGB + 3-byte bg RGB; transparent bg marker is `(255,0,255)`). Parse it for ground-truth values rather than eyeballing a flattened PNG.

## Extracted ground truth from `PixelPuzMock.xp`

3 layers, 60×60, holding the three UI states (unstarted / solved / in-progress).

**Puzzle cell palette:**

| Hex       | RGB           | Note                          |
| --------- | ------------- | ----------------------------- |
| `#FF8000` | (255,128,0)   | primary orange, dominant fill |
| `#FF9933` | (255,153,51)  | light orange                  |
| `#FFFF00` | (255,255,0)   | yellow                        |
| `#FFFF33` | (255,255,51)  | light yellow                  |
| `#FFFFFF` | (255,255,255) | white                         |
| `#FF0000` | (255,0,0)     | red                           |

**UI / chrome colors:**

| Hex                   | RGB         | Role                                                 |
| --------------------- | ----------- | ---------------------------------------------------- |
| `#00D9D9` / `#00FFFF` | cyan        | puzzle name text (e.g. `bst_face_fwd_`)              |
| `#4D4D4D`             | (77,77,77)  | gray — dimension label (`6x6`), inactive grid border |
| `#BF00FF`             | (191,0,255) | purple — palette label accent                        |
| `#59B200`             | (89,178,0)  | green — title accent                                 |
| `#DC1818`             | (220,24,24) | darker red, distinct from pure red                   |

## Layout (per puzzle instance, from the mockup)

- Title `pp·wf` and color palette: top-left
- Color thumbnail/preview of the solution: near top-left
- Column clues: above the grid (currently right-justified as a block — see open questions)
- Row clues: left of the grid
- The grid itself, with a border whose color signals state (bright white = solved, gray = in-progress)
- Puzzle name in cyan along the bottom (`bst_face_fwd_`)

## Open questions to resolve with the builder

1. **Two reds** — `#FF0000` and `#DC1818`. Confirm whether the darker red is a real state (e.g. satisfied-clue or error variant) or sketch inconsistency.
2. **Column-clue alignment** — in the mockup, column clues are right-justified as a block rather than aligned per-column. For playability, players need to map a clue stack to its grid column at a glance; per-column alignment is likely the right call.
3. **Box-drawing treatment** — the mockup currently uses plain fills/borders. Decide how far to push CP437 box-drawing chars (╔═╗║) and glyph-based cells (e.g. `█` filled, `·` empty) to deepen the terminal feel vs. keeping solid color cells.
4. **Blank marker glyph** — confirm `O` (0x4F) is intended, vs. a zero or a dedicated symbol.

## Suggested first steps for the builder

1. Stand up a canvas character-grid renderer with a CP437 bitmap font: each cell = glyph + fg + bg.
2. Drive the grid, clues, and palette from existing prototype puzzle data.
3. Implement palette-select → cell-paint input, unified across pointer/touch.
4. Add per-clue-number satisfaction with live fg/bg flip.
5. Use the `.xp` mockup as the styling target for chrome, colors, and layout.
