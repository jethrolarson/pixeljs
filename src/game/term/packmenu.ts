import { CellBuffer } from './cellbuffer'
import { chrome } from './glyphs'
import { TermMetrics } from './termrender'
import { GRID_PX, ZOOM_STEP, Viewport } from '../layout'

export interface PackMenuItem {
  title: string
  solved: boolean
}

export interface PackMenuOpts {
  title: string
  items: PackMenuItem[]
  /** Index of the puzzle currently open (shown distinct from the selection). */
  current: number
  /** Index under the picker cursor. */
  selected: number
  viewport: Viewport
}

const FOOTER = 'q leave  esc close'
// Kept narrow so the panel fits phone portrait without shrinking the cell —
// item rows and the footer drive the width; the pack title (opts.title) is
// truncated to whatever that produces instead of being allowed to widen it.
const MAX_TITLE = 20

/**
 * The in-session pack picker as a self-contained ANSI panel (its own opaque
 * buffer + metrics, like the help guide). Sizing assumes the pack fits one
 * screen — guaranteed by MAX_PACK_LEVELS, so there's no scrolling. Returns the
 * buffer row of each item so the loop can hit-test clicks.
 */
export function projectPackMenu(
  opts: PackMenuOpts,
): { buffer: CellBuffer; metrics: TermMetrics; itemRows: number[]; footerRow: number; footerCloseCol: number } {
  // `*` marks solved; a 2-wide number column keeps titles aligned to 20.
  const rowStr = (it: PackMenuItem, i: number): string =>
    `${it.solved ? '*' : ' '} ${String(i + 1).padStart(2, ' ')} ${it.title.slice(0, MAX_TITLE)}`
  const itemStrs = opts.items.map(rowStr)

  const innerW = Math.max(FOOTER.length, ...itemStrs.map((s) => s.length))
  const cols = innerW + 4 // border + 1 pad on each side
  const firstItemRow = 3 // border, title, blank, then items
  const rows = itemStrs.length + 6 // +title +2 blanks +footer +2 borders

  const buf = new CellBuffer(cols, rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) buf.set(c, r, { glyph: ' ', fg: chrome.text, bg: chrome.bg })
  }
  buf.box(0, 0, cols, rows, chrome.name, chrome.bg)
  buf.text(2, 1, opts.title.slice(0, innerW), chrome.green, chrome.bg)

  const itemRows: number[] = []
  itemStrs.forEach((s, i) => {
    const r = firstItemRow + i
    itemRows.push(r)
    const sel = i === opts.selected
    const fg = sel ? chrome.bg : i === opts.current ? chrome.green : chrome.text
    const bg = sel ? chrome.name : chrome.bg
    for (let c = 1; c < cols - 1; c++) buf.set(c, r, { glyph: ' ', fg, bg }) // row fill for the highlight
    buf.text(2, r, s, fg, bg)
  })

  const footerRow = rows - 2
  buf.text(2, footerRow, FOOTER, chrome.dim, chrome.bg)
  // Re-paint the key tokens over the dim base so 'q' and 'esc' pop in the
  // same highlight color as the selected-row background (chrome.name).
  for (const key of ['q', 'esc']) {
    const at = FOOTER.indexOf(key)
    if (at >= 0) buf.text(2 + at, footerRow, key, chrome.name, chrome.bg)
  }
  // Column where the "esc close" segment starts — the loop uses this to tell
  // a click on "close" (dismiss the picker only) apart from "q leave" (leave
  // the puzzle), instead of treating the whole footer row as one action.
  const footerCloseCol = 2 + FOOTER.indexOf('esc')

  let cell = Math.floor(Math.min((opts.viewport.w * 0.92) / cols, (opts.viewport.h * 0.92) / rows))
  cell = Math.max(GRID_PX, Math.floor(cell / ZOOM_STEP) * ZOOM_STEP)
  cell = Math.min(cell, GRID_PX * 3)

  return {
    buffer: buf,
    metrics: {
      cellW: cell,
      cellH: cell,
      originX: Math.floor((opts.viewport.w - cols * cell) / 2),
      originY: Math.floor((opts.viewport.h - rows * cell) / 2),
    },
    itemRows,
    footerRow,
    footerCloseCol,
  }
}
