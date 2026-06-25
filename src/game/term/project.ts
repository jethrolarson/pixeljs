import { CellBuffer } from './cellbuffer'
import { FULL, MARK, WRONG, H, chrome } from './glyphs'
import { Level, SolvedArt } from '../../level'
import { hexToRGB, rgbToCSS } from '../../color'
import { GameMode, GridPos } from '../types'
import { Layout } from '../layout'
import { Hints, ClueSat } from '../score'

/** Faint puzzle-solution tracing guide drawn behind solved-art editing. */
export interface Underlay {
  level: Level
  scale: number
}

/** The `pp·wf` brand, per-character colors sampled from PixelPuzMock.xp. */
const BRAND: ReadonlyArray<readonly [string, string]> = [
  ['p', '#00FFFF'],
  ['p', chrome.purple],
  ['·', chrome.solved],
  ['w', chrome.green],
  ['f', '#FF8000'],
]

/** Hotkey footer slots (columns) on `layout.menuRow`, styled like the dialog
 * footers. Each slot is `key␠label` (6 chars); slots are 7 apart so they never
 * touch. Positions are shared with the loop's click hit-testing. */
export const MENU_HELP_COL = 0
export const MENU_BACK_COL = 7
export const MENU_PREV_COL = 14
export const MENU_NEXT_COL = 21

/** CSS color for a 1-based palette index (0 → dim fallback). */
function paletteColor(palette: string[], index: number): string {
  const c = palette[index - 1]
  return c ? rgbToCSS(hexToRGB(c)) : chrome.dim
}

export interface ProjectOpts {
  level: Level
  palette: string[]
  mode: GameMode
  layout: Layout
  hints: Hints
  sat?: ClueSat | null
  hover?: GridPos | null
  /** Keyboard-selected cell (play): crosshair + active-color preview. */
  cursor?: GridPos | null
  solved: boolean
  /** Show the full solution (edit mode, or a won puzzle). */
  reveal: boolean
  /** Faults mode: render wrong paint as a red X. Zen mode (false) shows the
   *  painted color regardless, so errors are never revealed. */
  revealErrors?: boolean
  golf?: string | null
  /** Currently selected paint color (1-based), for the play-mode palette strip. */
  activeColorIndex?: number
  /** Most-recently painted cell + its pop progress (1 = fresh, 0 = settled). */
  pop?: { x: number; y: number; t: number } | null
  /** Show the `>` next-puzzle hotkey (only when a next level exists). */
  hasNext?: boolean
  /** Show the `<` previous-puzzle hotkey (only when a previous level exists). */
  hasPrev?: boolean
  /** `~` opens the pack picker (label `pack`) vs. plain back-out (label `back`). */
  hasPack?: boolean
  /** Faint puzzle guide behind the art grid (solved-art editing). */
  underlay?: Underlay | null
}

/**
 * Pure: build the terminal character buffer for a puzzle. Layout in char coords
 * comes from `layout`; no canvas/pixel knowledge here. Animation lives only in
 * the cell fields (e.g. the paint `pop` scale).
 */
export function projectPuzzle(o: ProjectOpts): CellBuffer {
  const { level, palette, mode, layout, hints } = o
  const buf = new CellBuffer(layout.cols, layout.rows)

  // Outer double-line frame around the whole game.
  buf.doubleBox(0, 0, layout.cols, layout.rows, o.solved ? chrome.solved : chrome.dim)

  // Chrome quadrant (upper-left): brand + dimensions.
  BRAND.forEach(([ch, color], i) => buf.set(layout.chromeCol + i, layout.chromeRow, { glyph: ch, fg: color }))
  buf.text(layout.chromeCol, layout.chromeRow + 2, `${level.x}x${level.y}`, chrome.dim)

  // Hotkey footer along the bottom (play only): `key label` pairs, key in cyan,
  // label dim — same vocabulary as the dialog footers.
  if (mode === 'play') {
    // Divider rule on the blank row above the footer, inside the frame.
    for (let c = layout.chromeCol; c < layout.cols - layout.chromeCol; c++)
      buf.set(c, layout.menuRow - 1, { glyph: H, fg: chrome.dim })
    const slot = (offset: number, key: string, label: string): void => {
      const col = layout.menuCol + offset
      buf.set(col, layout.menuRow, { glyph: key, fg: chrome.name })
      buf.text(col + 2, layout.menuRow, label, chrome.dim)
    }
    slot(MENU_HELP_COL, '?', 'help')
    slot(MENU_BACK_COL, '~', o.hasPack ? 'pack' : 'back')
    if (o.hasPrev) slot(MENU_PREV_COL, '<', 'prev')
    if (o.hasNext) slot(MENU_NEXT_COL, '>', 'next')
  }

  // Palette selector (play mode): a swatch strip with a caret under the active.
  if (mode === 'play') {
    for (let i = 0; i < palette.length; i++) {
      const color = paletteColor(palette, i + 1)
      const col = layout.paletteCol + i
      buf.set(col, layout.paletteRow, { glyph: FULL, fg: color, bg: color })
      if (i + 1 === o.activeColorIndex) buf.set(col, layout.paletteRow + 1, { glyph: '^', fg: chrome.text })
    }
  }
  // Puzzle title under the grid; golf result replaces it once solved.
  buf.text(layout.boxLeft, layout.nameRow, o.solved && o.golf ? o.golf : level.title, o.solved ? chrome.solved : chrome.name)

  // Grid box; border color signals solved state.
  buf.box(layout.boxLeft, layout.boxTop, level.x + 2, level.y + 2, o.solved ? chrome.solved : chrome.dim)

  // Clues (play mode only): per-column above, per-row to the left. Hidden once
  // solved — the picture speaks for itself.
  if (mode === 'play' && !o.solved) {
    const clueCell = (count: number, colorIndex: number, satisfied: boolean) => {
      // Empty line: a plain grey 0.
      if (count === 0) return { glyph: '0', fg: chrome.dim }
      const color = colorIndex > 0 ? paletteColor(palette, colorIndex) : chrome.dim
      const glyph = String(count)
      // Unsatisfied: color fills the cell (digit reads dark on it). Satisfied:
      // the cell empties out and the digit is drawn in the color.
      return satisfied ? { glyph, fg: color } : { glyph, fg: chrome.bg, bg: color }
    }
    for (let gx = 0; gx < level.x; gx++) {
      const groups = hints.col[gx]
      const k = groups.length
      for (let j = 0; j < k; j++) {
        buf.set(
          layout.gridCol + gx,
          layout.boxTop - k + j,
          clueCell(groups[j].count, groups[j].colorIndex, o.sat?.col[gx]?.[j] ?? false),
        )
      }
    }
    for (let gy = 0; gy < level.y; gy++) {
      const groups = hints.row[gy]
      const k = groups.length
      for (let j = 0; j < k; j++) {
        buf.set(
          layout.boxLeft - k + j,
          layout.gridRow + gy,
          clueCell(groups[j].count, groups[j].colorIndex, o.sat?.row[gy]?.[j] ?? false),
        )
      }
    }
  }

  // Interior puzzle cells. When solved with reward art, leave the interior empty
  // — the loop draws the art (possibly 2×) over it.
  const showArt = mode === 'play' && o.solved && !!level.art
  const popScale = o.pop ? 1 + 0.45 * o.pop.t : 1
  for (let gx = 0; gx < level.x && !showArt; gx++) {
    for (let gy = 0; gy < level.y; gy++) {
      const col = layout.gridCol + gx
      const row = layout.gridRow + gy
      const solVal = level.grid.getAt(gx, gy)
      const fresh = o.pop && o.pop.x === gx && o.pop.y === gy ? popScale : undefined

      if (mode === 'edit' || o.reveal) {
        if (solVal !== '0') {
          const c = paletteColor(palette, parseInt(solVal))
          buf.set(col, row, { glyph: FULL, fg: c, bg: c, scale: fresh })
        } else if (o.underlay) {
          // Faint puzzle solution behind the (empty) art cell, for tracing.
          const u = o.underlay
          const pv = u.level.grid.getAt(Math.floor(gx / u.scale), Math.floor(gy / u.scale))
          if (pv !== '0') buf.set(col, row, { glyph: FULL, fg: paletteColor(u.level.palette, parseInt(pv)), alpha: 0.22 })
        }
        continue
      }

      const paintVal = level.paint.getAt(gx, gy)
      const markVal = level.mark.getAt(gx, gy)
      if (paintVal !== '0') {
        if (paintVal === solVal || !o.revealErrors) {
          // Correct, or zen mode (errors hidden): show the painted color.
          const c = paletteColor(palette, parseInt(paintVal))
          buf.set(col, row, { glyph: FULL, fg: c, bg: c, scale: fresh })
        } else {
          buf.set(col, row, { glyph: WRONG, fg: chrome.red, scale: fresh })
        }
      } else if (markVal !== '0') {
        buf.set(col, row, { glyph: MARK, fg: chrome.dim })
      }
    }
  }

  // Row/column crosshair for hover and the keyboard cursor (the cursor cell
  // itself is a see-through stipple drawn by the loop).
  if (mode === 'play' && !o.solved) {
    if (o.hover && inBounds(level, o.hover)) crosshair(buf, layout, level, o.hover)
    if (o.cursor && inBounds(level, o.cursor)) crosshair(buf, layout, level, o.cursor)
  }

  return buf
}

/**
 * Build the reward-art buffer (its own palette, possibly 2× the puzzle). Each
 * non-blank cell is a FULL block; '0' stays empty so the bg shows. The loop
 * draws this at `cellW / scale` over the solved grid interior.
 */
export function projectSolvedArt(art: SolvedArt, artX: number, artY: number): CellBuffer {
  const buf = new CellBuffer(artX, artY)
  const cells = art.data.split('')
  for (let cx = 0; cx < artX; cx++) {
    for (let cy = 0; cy < artY; cy++) {
      const v = cells[cx * artY + cy]
      if (v && v !== '0') {
        const c = paletteColor(art.palette, parseInt(v))
        buf.set(cx, cy, { glyph: FULL, fg: c, bg: c })
      }
    }
  }
  return buf
}

/** Faint wash over empty cells in the row + column, plus border markers at the
 * ends so the selection stays visible even when the interior is filled in. */
function crosshair(buf: CellBuffer, layout: Layout, level: Level, pos: GridPos): void {
  const wash = 'rgba(80,140,255,0.18)'
  for (let gx = 0; gx < level.x; gx++) washEmpty(buf, layout.gridCol + gx, layout.gridRow + pos.y, wash)
  for (let gy = 0; gy < level.y; gy++) washEmpty(buf, layout.gridCol + pos.x, layout.gridRow + gy, wash)
  const right = layout.gridCol + level.x
  const bottom = layout.gridRow + level.y
  markBorder(buf, layout.boxLeft, layout.gridRow + pos.y, wash)
  markBorder(buf, right, layout.gridRow + pos.y, wash)
  markBorder(buf, layout.gridCol + pos.x, layout.boxTop, wash)
  markBorder(buf, layout.gridCol + pos.x, bottom, wash)
}

/** Light up a box-border cell (keeps its glyph) to mark a row/column end. */
function markBorder(buf: CellBuffer, col: number, row: number, bg: string): void {
  const c = buf.get(col, row)
  if (c) buf.set(col, row, { ...c, fg: chrome.text, bg })
}

function inBounds(level: Level, pos: GridPos): boolean {
  return pos.x >= 0 && pos.x < level.x && pos.y >= 0 && pos.y < level.y
}

function washEmpty(buf: CellBuffer, col: number, row: number, wash: string): void {
  if (!buf.get(col, row)) buf.set(col, row, { glyph: ' ', fg: chrome.text, bg: wash })
}
