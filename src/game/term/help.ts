import { CellBuffer } from './cellbuffer'
import { chrome } from './glyphs'
import { TermMetrics } from './termrender'
import { GLYPH_PX } from './font8x8'
import { Viewport } from '../layout'

interface Line {
  s: string
  fg: string
}

// ASCII-only (plus the synthetic '·'); the bitmap font is 0x00–0x7F.
const LINES: Line[] = [
  { s: 'pp·wf  guide', fg: chrome.green },
  { s: '', fg: chrome.text },
  { s: 'A color nonogram. Each clue number is', fg: chrome.text },
  { s: 'the length of a run of that color;', fg: chrome.text },
  { s: 'fill the grid so every clue is met.', fg: chrome.text },
  { s: 'A clue lights up once it is satisfied.', fg: chrome.text },
  { s: '', fg: chrome.text },
  { s: 'MOUSE', fg: chrome.name },
  { s: '  swatch     select a color', fg: chrome.text },
  { s: '  cell       paint selected color', fg: chrome.text },
  { s: '  r-click    mark a cell empty', fg: chrome.text },
  { s: '', fg: chrome.text },
  { s: 'KEYBOARD', fg: chrome.name },
  { s: '  arrows     move cursor', fg: chrome.text },
  { s: '  space      paint', fg: chrome.text },
  { s: '  back       clear cell', fg: chrome.text },
  { s: '  x          mark empty', fg: chrome.text },
  { s: '  tab        next color', fg: chrome.text },
  { s: '', fg: chrome.text },
  { s: 'MENU', fg: chrome.name },
  { s: '  ?          this guide', fg: chrome.text },
  { s: '  ~          pack menu', fg: chrome.text },
  { s: '  <          prev puzzle', fg: chrome.text },
  { s: '  >          next puzzle', fg: chrome.text },
  { s: '', fg: chrome.text },
  { s: 'press ? or esc to close', fg: chrome.dim },
]

/**
 * The help guide as a self-contained ANSI panel: its own opaque char buffer and
 * metrics, independent of the puzzle layout (the puzzle's cells can be huge, so
 * the modal sizes itself). The loop dims the screen and draws this over the top.
 */
export function projectHelp(viewport: Viewport): { buffer: CellBuffer; metrics: TermMetrics } {
  const innerW = LINES.reduce((m, l) => Math.max(m, l.s.length), 0)
  const cols = innerW + 4 // 1 border + 1 pad on each side
  const rows = LINES.length + 4 // 1 border + 1 pad, top and bottom

  // Fit the panel to the viewport, snapped to the glyph size, capped so it stays
  // a modest dialog rather than filling the screen.
  let cell = Math.floor(Math.min((viewport.w * 0.92) / cols, (viewport.h * 0.92) / rows))
  cell = Math.max(GLYPH_PX, Math.floor(cell / GLYPH_PX) * GLYPH_PX)
  cell = Math.min(cell, GLYPH_PX * 3)

  const buf = new CellBuffer(cols, rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) buf.set(c, r, { glyph: ' ', fg: chrome.text, bg: chrome.bg })
  }
  buf.box(0, 0, cols, rows, chrome.name, chrome.bg)
  LINES.forEach((l, i) => buf.text(2, 2 + i, l.s, l.fg, chrome.bg))

  return {
    buffer: buf,
    metrics: {
      cellW: cell,
      cellH: cell,
      originX: Math.floor((viewport.w - cols * cell) / 2),
      originY: Math.floor((viewport.h - rows * cell) / 2),
    },
  }
}
