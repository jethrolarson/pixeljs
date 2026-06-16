import { Level } from '../level'

export type GameMode = 'play' | 'edit'

export interface Viewport {
  w: number
  h: number
}

export interface GridBounds {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Layout {
  cw: number
  offset: { x: number; y: number }
  gridBounds: GridBounds
  /** Largest hint stack width/height (in cells) reserved around the grid. */
  rowHintCells: number
  colHintCells: number
}

/** Reserved screen margins for the grid area, by mode. */
function gridBoundsFor(mode: GameMode, viewport: Viewport): GridBounds {
  return {
    x1: mode === 'edit' ? 140 : 10,
    y1: 10,
    x2: mode === 'play' ? viewport.w - 10 : viewport.w - 80,
    y2: viewport.h - 30,
  }
}

/** Largest hint group counts, used to reserve space for hint columns/rows (play only). */
function hintReservation(level: Level, mode: GameMode): { rowHintCells: number; colHintCells: number } {
  if (mode !== 'play') return { rowHintCells: 0, colHintCells: 0 }
  let rowHintCells = 2
  let colHintCells = 2
  for (const row of level.getRowHints()) rowHintCells = Math.max(rowHintCells, row.length)
  for (const col of level.getColHints()) colHintCells = Math.max(colHintCells, col.length)
  return { rowHintCells, colHintCells }
}

/** Pure: derive cell size + grid offset from the level, mode, and viewport. */
export function computeLayout(level: Level, mode: GameMode, viewport: Viewport): Layout {
  const gridBounds = gridBoundsFor(mode, viewport)
  const { rowHintCells, colHintCells } = hintReservation(level, mode)

  const gridAreaW = gridBounds.x2 - gridBounds.x1
  const gridAreaH = gridBounds.y2 - gridBounds.y1
  const cw = Math.min(
    Math.floor(gridAreaW / (level.x + rowHintCells)),
    Math.floor(gridAreaH / (level.y + colHintCells)),
  )

  return {
    cw,
    offset: {
      x: gridBounds.x1 + rowHintCells * cw,
      y: gridBounds.y1 + colHintCells * cw,
    },
    gridBounds,
    rowHintCells,
    colHintCells,
  }
}

export interface GridPos {
  x: number
  y: number
}

/** Convert a screen pixel to a grid cell coordinate (may be out of bounds). */
export function pixelToGrid(layout: Layout, px: number, py: number): GridPos {
  return {
    x: Math.floor((px - layout.offset.x) / layout.cw),
    y: Math.floor((py - layout.offset.y) / layout.cw),
  }
}

export function inGrid(level: Level, pos: GridPos): boolean {
  return pos.x >= 0 && pos.x < level.x && pos.y >= 0 && pos.y < level.y
}
