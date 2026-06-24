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
  /** Play-mode palette swatch strip, inside the chrome quadrant. */
  paletteRow: number
  paletteCol: number
}

/** Size of the reserved upper-left chrome quadrant, in cells. */
export const CHROME = 7

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

  // Grid is pushed past the chrome quadrant and the clue gutters, whichever is
  // larger — so chrome (upper-left), clues (gutters), and grid never collide.
  const boxLeft = Math.max(CHROME, rowHintCols)
  const boxTop = Math.max(CHROME, colHintRows)
  const gridCol = boxLeft + 1
  const gridRow = boxTop + 1
  const boxRight = gridCol + level.x // box right border col
  const boxBottom = gridRow + level.y // box bottom border row
  const nameRow = boxBottom + 1

  const cols = Math.max(boxRight + 1, boxLeft + level.title.length + 1, CHROME)
  const rows = nameRow + 1

  // Snap to a multiple of the glyph size so bitmap glyphs scale by an integer
  // factor (clean, even pixels).
  const raw = Math.min(Math.floor(viewport.w / cols), Math.floor(viewport.h / rows))
  const cell = Math.max(GLYPH_PX, Math.floor(raw / GLYPH_PX) * GLYPH_PX)
  const usedW = cols * cell
  const usedH = rows * cell

  return {
    cellW: cell,
    cellH: cell,
    originX: Math.floor((viewport.w - usedW) / 2),
    originY: Math.floor((viewport.h - usedH) / 2),
    cols,
    rows,
    gridCol,
    gridRow,
    boxLeft,
    boxTop,
    rowHintCols,
    colHintRows,
    nameRow,
    paletteRow: 4,
    paletteCol: 0,
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
