import { CellBuffer } from './cellbuffer'
import { chrome } from './glyphs'
import { TermMetrics } from './termrender'
import { GLYPH_PX } from './font8x8'
import { Viewport } from '../layout'

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

const FOOTER = 'enter open    q leave    esc back'
const MAX_TITLE = 30

/**
 * The in-session pack picker as a self-contained ANSI panel (its own opaque
 * buffer + metrics, like the help guide). Sizing assumes the pack fits one
 * screen — guaranteed by MAX_PACK_LEVELS, so there's no scrolling. Returns the
 * buffer row of each item so the loop can hit-test clicks.
 */
export function projectPackMenu(
  opts: PackMenuOpts,
): { buffer: CellBuffer; metrics: TermMetrics; itemRows: number[]; footerRow: number } {
  // `*` marks solved; a 2-wide number column keeps titles aligned to 20.
  const rowStr = (it: PackMenuItem, i: number): string =>
    `${it.solved ? '*' : ' '} ${String(i + 1).padStart(2, ' ')} ${it.title.slice(0, MAX_TITLE)}`
  const itemStrs = opts.items.map(rowStr)

  const innerW = Math.max(opts.title.length, FOOTER.length, ...itemStrs.map((s) => s.length))
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

  let cell = Math.floor(Math.min((opts.viewport.w * 0.92) / cols, (opts.viewport.h * 0.92) / rows))
  cell = Math.max(GLYPH_PX, Math.floor(cell / GLYPH_PX) * GLYPH_PX)
  cell = Math.min(cell, GLYPH_PX * 3)

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
  }
}
