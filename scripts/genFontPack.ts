/**
 * Generate puzzle test data from the 8×8 bitmap font: each printable glyph is a
 * monochrome 8×8 grid, i.e. a ready-made nonogram solution. Emits a LevelData[]
 * JSON array to stdout.
 *
 *   npx tsx scripts/genFontPack.ts > fixtures/font-levels.json
 *
 * Optional args: a set of chars to include, e.g.
 *   npx tsx scripts/genFontPack.ts ABC123 > fixtures/abc.json
 * Default: printable ASCII 0x21–0x7E, skipping any glyph with no ink.
 */
import { FONT8X8 } from '../src/game/term/font8x8'
import type { LevelData } from '../src/level'

const INK = '#cccccc' // single ink color; grid '1' -> palette[0]

/** Column-major solution string for glyph `code`: game[col*8 + row].
 * Ink is recentered in the 8×8 field (font bitmaps hug top-left), so glyphs
 * don't render off-center as puzzles. */
function glyphGame(code: number): { game: string; filled: number } {
  // decode to on[col][row]
  const on: boolean[][] = Array.from({ length: 8 }, () => Array(8).fill(false))
  let filled = 0
  let x0 = 8, x1 = -1, y0 = 8, y1 = -1
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((FONT8X8[code * 8 + row] >> col) & 1) {
        on[col][row] = true
        filled++
        if (col < x0) x0 = col
        if (col > x1) x1 = col
        if (row < y0) y0 = row
        if (row > y1) y1 = row
      }
    }
  }
  // shift ink bbox to center of 8×8
  const dx = filled ? ((8 - (x1 - x0 + 1)) >> 1) - x0 : 0
  const dy = filled ? ((8 - (y1 - y0 + 1)) >> 1) - y0 : 0
  let game = ''
  for (let col = 0; col < 8; col++) {
    for (let row = 0; row < 8; row++) {
      const sc = col - dx
      const sr = row - dy
      const lit = sc >= 0 && sc < 8 && sr >= 0 && sr < 8 && on[sc][sr]
      game += lit ? '1' : '0'
    }
  }
  return { game, filled }
}

function label(ch: string): string {
  return ch === ' ' ? 'space' : ch
}

function glyphLevel(code: number): LevelData | null {
  const { game, filled } = glyphGame(code)
  if (filled === 0) return null // blank glyph — nothing to solve
  const ch = String.fromCharCode(code)
  return {
    title: `glyph ${label(ch)}`,
    x: 8,
    y: 8,
    game,
    palette: [INK],
    par: 3,
    levelSetName: 'Font 8×8',
    key: `font-${code}`,
  }
}

function main(): void {
  const arg = process.argv[2]
  const codes = arg
    ? [...arg].map(c => c.charCodeAt(0))
    : Array.from({ length: 0x7e - 0x21 + 1 }, (_, i) => 0x21 + i)

  const levels = codes.map(glyphLevel).filter((l): l is LevelData => l !== null)
  process.stdout.write(JSON.stringify(levels, null, 2) + '\n')
  process.stderr.write(`generated ${levels.length} levels\n`)
}

main()
