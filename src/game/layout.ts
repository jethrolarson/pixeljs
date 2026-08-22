import { Level, HintGroup } from '../level'
import { GameMode, GridPos } from './types'
import { Hints } from './score'
import { GLYPH_PX } from './term/font8x8'

export interface Viewport {
  w: number
  h: number
}

/**
 * Char-grid layout for the terminal renderer. Everything is measured in
 * character cells; `originX/Y` + `cellW/H` map char coords to pixels (and double
 * as `TermMetrics` for `drawBuffer`). `gridCol/gridRow` is the first puzzle cell
 * (inside the box border). The projection consumes the char fields; input uses
 * the pixel mapping via `pixelToGrid`.
 *
 * Quadrant layout: a fixed CHROME×CHROME block in the upper-left holds the brand
 * + dimensions; column clues sit above the grid (upper-right), row clues left of
 * it (lower-left), and the grid + box fill the lower-right. The puzzle title is
 * a single cyan line under the grid.
 */
export interface Layout {
  cellW: number
  cellH: number
  originX: number
  originY: number
  cols: number
  rows: number
  /** Top-left of the content, just inside the outer double frame. */
  chromeCol: number
  chromeRow: number
  /** Left column of the bottom hotkey footer. */
  menuCol: number
  /** First interior (puzzle) cell, just inside the box border. */
  gridCol: number
  gridRow: number
  /** Box border top-left. */
  boxLeft: number
  boxTop: number
  /** Reserved clue gutters (0 in edit mode). */
  rowHintCols: number
  colHintRows: number
  /** Title line under the grid. */
  nameRow: number
  /** Hotkey footer line along the bottom (play mode): help/back. */
  menuRow: number
  /** Second footer line, directly below `menuRow`, for prev/next — kept off
   * the first line so pack navigation never costs the board any width (see
   * `computeLayout`'s `hasMenuRow2`). Meaningless (but still a valid row
   * index) when neither hotkey is shown. */
  menuRow2: number
  /** Play-mode palette swatch strip, inside the chrome quadrant. */
  paletteRow: number
  paletteCol: number
}

/** Size of the reserved upper-left chrome quadrant, in cells. */
export const CHROME = 7

/** One-cell margin reserved for the outer double-line game frame. */
const FRAME = 1

/** Hotkey footer slots (columns) on `layout.menuRow`, styled like the dialog
 * footers. Each slot is `key␠label` (6 chars); slots are 7 apart so they never
 * touch. Positions are shared with the projector's rendering and the loop's
 * click hit-testing. */
const MENU_SLOT = 7
const MENU_SLOT_WIDTH = 6
export const MENU_HELP_COL = 0
export const MENU_BACK_COL = MENU_SLOT
// Prev/next live on their own footer row (`menuRow2`), not to the right of
// help/back — pack navigation is common enough that reserving 2 more slots'
// width on every play screen, even outside a pack, would be a bad trade for
// how little vertical space costs by comparison.
export const MENU_PREV_COL = 0
export const MENU_NEXT_COL = MENU_SLOT

/** Fixed clearance either side of a glyph within its cell, in the same "grid
 * pixel" unit as GLYPH_PX. One cell is always GLYPH_PX + 2*CLEARANCE grid
 * pixels — glyph and margin scale together as a single unit (see GRID_PX),
 * so the proportion between them never changes with zoom. */
export const CLEARANCE = 2

/** The base unit cells snap to: one glyph plus its clearance on both sides.
 * "Zoom" is however many device pixels represent one GRID_PX, applied
 * uniformly — so the glyph is always exactly GLYPH_PX*zoom and the clearance
 * always exactly CLEARANCE*zoom, at any cell size (termrender.ts). */
export const GRID_PX = GLYPH_PX + 2 * CLEARANCE

/** Max cell size (px), a multiple of GRID_PX. Caps zoom so small puzzles don't
 * balloon to fill the screen and cell sizes stay stable when switching puzzles
 * in a pack. Only ever shrinks the cell, so the footer always still fits. */
const MAX_CELL = GRID_PX * 4

/** Smallest cell the board will ever shrink to (zoom = 1). This must never
 * exceed what `raw` actually allows, or the canvas (sized to the viewport)
 * clips whatever doesn't fit instead of shrinking to it. */
const MIN_CELL = GRID_PX

function maxLen(groups: HintGroup[][]): number {
  let m = 0
  for (const g of groups) m = Math.max(m, g.length)
  return m
}

/** Pure: derive the char-grid structure and its pixel placement.
 * `leftInset` reserves screen space (e.g. edit mode's DOM menu overlay,
 * which the canvas itself has no notion of) so the centered board is never
 * placed underneath it. */
export function computeLayout(
  level: Level,
  mode: GameMode,
  hints: Hints,
  viewport: Viewport,
  leftInset = 0,
  hasPrev = false,
  hasNext = false,
): Layout {
  const showClues = mode === 'play'
  const rowHintCols = showClues ? Math.max(1, maxLen(hints.row)) : 0
  const colHintRows = showClues ? Math.max(1, maxLen(hints.col)) : 0
  // Footer only ever reserves width for help+back — prev/next sit on a second
  // row (see menuRow2) instead of extending this one.
  const menuCols = MENU_BACK_COL + MENU_SLOT_WIDTH
  const hasMenuRow2 = showClues && (hasPrev || hasNext)

  // Everything is inset by FRAME for the outer double-line border. The grid is
  // pushed past the chrome quadrant and the clue gutters, whichever is larger —
  // so chrome (upper-left), clues (gutters), and grid never collide.
  const boxLeft = FRAME + Math.max(CHROME, rowHintCols)
  const boxTop = FRAME + Math.max(CHROME, colHintRows)
  const gridCol = boxLeft + 1
  const gridRow = boxTop + 1
  const boxRight = gridCol + level.x // box right border col
  const boxBottom = gridRow + level.y // box bottom border row
  const nameRow = boxBottom + 1
  // Footer sits a blank line below the title (play only); edit has no footer.
  const menuRow = showClues ? nameRow + 2 : nameRow
  const menuRow2 = menuRow + 1

  const inner = Math.max(
    boxRight + 1,
    boxLeft + level.title.length + 1,
    showClues ? FRAME + menuCols : 0,
    FRAME + CHROME,
  )
  const cols = inner + FRAME // right frame column
  const rows = (showClues ? (hasMenuRow2 ? menuRow2 : menuRow) : nameRow) + 1 + FRAME // bottom frame row

  // Snap to a multiple of GRID_PX so the glyph+clearance unit scales by an
  // integer zoom factor (clean, even pixels at any cell size).
  const usableW = viewport.w - leftInset
  const raw = Math.min(Math.floor(usableW / cols), Math.floor(viewport.h / rows))
  const cell = Math.min(MAX_CELL, Math.max(MIN_CELL, Math.floor(raw / GRID_PX) * GRID_PX))
  const usedW = cols * cell
  const usedH = rows * cell

  return {
    cellW: cell,
    cellH: cell,
    originX: leftInset + Math.floor((usableW - usedW) / 2),
    originY: Math.floor((viewport.h - usedH) / 2),
    cols,
    rows,
    chromeCol: FRAME,
    chromeRow: FRAME,
    menuCol: FRAME,
    gridCol,
    gridRow,
    boxLeft,
    boxTop,
    rowHintCols,
    colHintRows,
    nameRow,
    menuRow,
    menuRow2,
    paletteRow: FRAME + 4,
    paletteCol: FRAME,
  }
}

/** Convert a screen pixel to a puzzle cell coordinate (may be out of bounds). */
export function pixelToGrid(layout: Layout, px: number, py: number): GridPos {
  const col = Math.floor((px - layout.originX) / layout.cellW)
  const row = Math.floor((py - layout.originY) / layout.cellH)
  return { x: col - layout.gridCol, y: row - layout.gridRow }
}

export function inGrid(level: Level, pos: GridPos): boolean {
  return pos.x >= 0 && pos.x < level.x && pos.y >= 0 && pos.y < level.y
}
