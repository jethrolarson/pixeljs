import { TL, TR, BL, BR, H, V, DH, DV, DTL, DTR, DBL, DBR } from './glyphs'

/** One character cell. `glyph` is rendered on top of an optional `bg` fill.
 * The animation fields perturb only how the cell is drawn, never game state:
 * `scale` (about the cell center), `alpha`, and `dx`/`dy` (offset in fractions
 * of a cell). A pure projection sets these; the renderer applies them. */
export interface Cell {
  glyph: string
  fg: string
  bg?: string
  scale?: number
  alpha?: number
  dx?: number
  dy?: number
}

/** A grid of character cells — pure data, no canvas knowledge. The bridge
 * between game state and the renderer; animations live here as cell fields. */
export class CellBuffer {
  readonly cols: number
  readonly rows: number
  private data: (Cell | null)[]

  constructor(cols: number, rows: number) {
    this.cols = Math.max(0, cols)
    this.rows = Math.max(0, rows)
    this.data = new Array(this.cols * this.rows).fill(null)
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows
  }

  clear(): void {
    this.data.fill(null)
  }

  set(col: number, row: number, cell: Cell): void {
    if (this.inBounds(col, row)) this.data[row * this.cols + col] = cell
  }

  get(col: number, row: number): Cell | null {
    return this.inBounds(col, row) ? this.data[row * this.cols + col] : null
  }

  /** Write a string left-to-right starting at (col, row). */
  text(col: number, row: number, str: string, fg: string, bg?: string): void {
    for (let i = 0; i < str.length; i++) this.set(col + i, row, { glyph: str[i], fg, bg })
  }

  /** Draw a single-line box border of size w×h with its top-left at (col, row).
   * Only the border cells are written; the interior is left untouched. */
  box(col: number, row: number, w: number, h: number, fg: string, bg?: string): void {
    if (w < 2 || h < 2) return
    const right = col + w - 1
    const bottom = row + h - 1
    this.set(col, row, { glyph: TL, fg, bg })
    this.set(right, row, { glyph: TR, fg, bg })
    this.set(col, bottom, { glyph: BL, fg, bg })
    this.set(right, bottom, { glyph: BR, fg, bg })
    for (let c = col + 1; c < right; c++) {
      this.set(c, row, { glyph: H, fg, bg })
      this.set(c, bottom, { glyph: H, fg, bg })
    }
    for (let r = row + 1; r < bottom; r++) {
      this.set(col, r, { glyph: V, fg, bg })
      this.set(right, r, { glyph: V, fg, bg })
    }
  }

  /** Draw a double-line box border of size w×h with its top-left at (col, row).
   * Only the border cells are written; the interior is left untouched. */
  doubleBox(col: number, row: number, w: number, h: number, fg: string, bg?: string): void {
    if (w < 2 || h < 2) return
    const right = col + w - 1
    const bottom = row + h - 1
    this.set(col, row, { glyph: DTL, fg, bg })
    this.set(right, row, { glyph: DTR, fg, bg })
    this.set(col, bottom, { glyph: DBL, fg, bg })
    this.set(right, bottom, { glyph: DBR, fg, bg })
    for (let c = col + 1; c < right; c++) {
      this.set(c, row, { glyph: DH, fg, bg })
      this.set(c, bottom, { glyph: DH, fg, bg })
    }
    for (let r = row + 1; r < bottom; r++) {
      this.set(col, r, { glyph: DV, fg, bg })
      this.set(right, r, { glyph: DV, fg, bg })
    }
  }

  /** Visit every non-empty cell. */
  each(cb: (col: number, row: number, cell: Cell) => void): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.data[r * this.cols + c]
        if (cell) cb(c, r, cell)
      }
    }
  }
}
