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
  /** Hotkey footer line along the bottom (play mode). */
  menuRow: number
  /** Play-mode palette swatch strip, inside the chrome quadrant. */
  paletteRow: number
  paletteCol: number
}

/** Size of the reserved upper-left chrome quadrant, in cells. */
export const CHROME = 7

/** One-cell margin reserved for the outer double-line game frame. */
const FRAME = 1

/** Columns reserved for the bottom hotkey footer (4 slots, 7 apart). */
const MENU_COLS = 27

/** Max cell size (px), a multiple of GLYPH_PX. Caps zoom so small puzzles don't
 * balloon to fill the screen and cell sizes stay stable when switching puzzles
 * in a pack. Only ever shrinks the cell, so the footer always still fits. */
const MAX_CELL = GLYPH_PX * 4

function maxLen(groups: HintGroup[][]): number {
  let m = 0
  for (const g of groups) m = Math.max(m, g.length)
  return m
}

/** Pure: derive the char-grid structure and its pixel placement. */
export function computeLayout(level: Level, mode: GameMode, hints: Hints, viewport: Viewport): Layout {
  const showClues = mode === 'play'
  const rowHintCols = showClues ? Math.max(1, maxLen(hints.row)) : 0
  const colHintRows = showClues ? Math.max(1, maxLen(hints.col)) : 0

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

  const inner = Math.max(
    boxRight + 1,
    boxLeft + level.title.length + 1,
    showClues ? FRAME + MENU_COLS : 0,
    FRAME + CHROME,
  )
  const cols = inner + FRAME // right frame column
  const rows = (showClues ? menuRow : nameRow) + 1 + FRAME // bottom frame row

  // Snap to a multiple of the glyph size so bitmap glyphs scale by an integer
  // factor (clean, even pixels).
  const raw = Math.min(Math.floor(viewport.w / cols), Math.floor(viewport.h / rows))
  const cell = Math.min(MAX_CELL, Math.max(GLYPH_PX, Math.floor(raw / GLYPH_PX) * GLYPH_PX))
  const usedW = cols * cell
  const usedH = rows * cell

  return {
    cellW: cell,
    cellH: cell,
    originX: Math.floor((viewport.w - usedW) / 2),
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
