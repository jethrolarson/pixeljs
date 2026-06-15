import { Matrix } from './matrix'

export class Layer {
  x: number
  y: number
  fgcolor: string
  visible: boolean
  complete = false
  grid: Matrix
  mark: Matrix
  paint: Matrix

  constructor(options: { x: number; y: number; game?: string; fgcolor?: string; visible?: boolean }) {
    this.x = options.x
    this.y = options.y
    this.fgcolor = options.fgcolor ?? '#0000ff'
    this.visible = options.visible ?? true
    this.grid = new Matrix(this.x, this.y, options.game?.split(''))
    this.mark = new Matrix(this.x, this.y)
    this.paint = new Matrix(this.x, this.y)
  }

  getRowHints(): number[][] {
    return Array.from({ length: this.y }, (_, row) => this.getLineHints(this.grid.getRow(row)))
  }

  getColHints(): number[][] {
    return Array.from({ length: this.x }, (_, col) => this.getLineHints(this.grid.getCol(col)))
  }

  getLineHints(cells: string[]): number[] {
    const hints: number[] = []
    let run = 0
    for (let i = 0; i < cells.length; i++) {
      if (+cells[i]) {
        run++
        if (i === cells.length - 1) hints.push(run)
      } else {
        if (run > 0) hints.push(run)
        run = 0
      }
    }
    if (hints.length === 0) hints.push(0)
    return hints
  }

  isRowComplete(y: number): boolean {
    const row = this.grid.getRow(y)
    const paintRow = this.paint.getRow(y)
    return row.every((cell, i) => !+cell || !!+paintRow[i])
  }

  isColComplete(x: number): boolean {
    const col = this.grid.getCol(x)
    const paintCol = this.paint.getCol(x)
    return col.every((cell, i) => !+cell || !!+paintCol[i])
  }
}
