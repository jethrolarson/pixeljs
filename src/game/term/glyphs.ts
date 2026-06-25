/** Glyph + color vocabulary for the terminal aesthetic.
 *
 * Box-drawing and block glyphs are drawn procedurally by `termrender` (as rects)
 * so they stay crisp and connected at any cell aspect; text glyphs go through the
 * font. These constants are the single source of truth for both. */

// Solid block — a filled cell.
export const FULL = '█'

// Single-line box drawing (CP437 ┌┐└┘─│ family).
export const TL = '┌'
export const TR = '┐'
export const BL = '└'
export const BR = '┘'
export const H = '─'
export const V = '│'

// Double-line box drawing (CP437 ═║╔╗╚╝ family) — the outer game frame and the
// divider under the title.
export const DH = '═'
export const DV = '║'
export const DTL = '╔'
export const DTR = '╗'
export const DBL = '╚'
export const DBR = '╝'

// Player annotations on the play grid.
export const MARK = 'O' // right-click "known empty"
export const WRONG = 'X' // painted-but-incorrect indicator

/** Glyphs that `termrender` draws as geometry rather than text. */
export const GEOMETRIC = new Set([FULL, TL, TR, BL, BR, H, V, DH, DV, DTL, DTR, DBL, DBR])

/** ANSI/chrome palette, sampled from docs/PixelPuzMock.xp. */
export const chrome = {
  name: '#00D9D9', // cyan — puzzle name
  dim: '#4D4D4D', // gray — dimension label, in-progress border
  purple: '#BF00FF', // palette label accent
  green: '#59B200', // title accent
  red: '#FF0000',
  darkRed: '#DC1818',
  solved: '#FFFFFF', // bright border on a solved puzzle
  text: '#cccccc',
  bg: '#0d0d0d',
} as const

export const FONT_STACK = 'Menlo, Monaco, Consolas, "DejaVu Sans Mono", monospace'
