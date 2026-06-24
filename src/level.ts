import { Matrix } from './matrix'

export interface HintGroup {
  count: number
  colorIndex: number  // 1-based index into palette; 0 means empty row/col
}

export interface LevelData {
  id?: string
  ownerId?: string
  title?: string
  x?: number
  y?: number
  game?: string       // column-major color indices: "012120..."
  palette?: string[]  // hex colors for index 1..n
  par?: number
  levelSetName?: string
  key?: string
}

export class Level {
  title: string
  x: number
  y: number
  par: number
  levelSetName: string
  palette: string[]
  grid: Matrix   // solution: '0'=empty, '1'=palette[0], '2'=palette[1], ...
  paint: Matrix  // player's painting, same encoding as grid
  mark: Matrix   // right-click X marks: '0' or '1'

  constructor(data: LevelData = {}) {
    this.title = data.title ?? 'untitled'
    this.x = data.x ?? 10
    this.y = data.y ?? 10
    this.par = data.par ?? 3
    this.levelSetName = data.levelSetName ?? 'My Levels'
    this.palette = data.palette?.length ? [...data.palette] : ['#0000ff']

    const game = data.game ?? '0'.repeat(this.x * this.y)
    this.grid = new Matrix(this.x, this.y, game.split(''))
    this.paint = new Matrix(this.x, this.y)
    this.mark = new Matrix(this.x, this.y)
  }

  getRowHints(): HintGroup[][] {
    return Array.from({ length: this.y }, (_, y) =>
      this.getLineHints(this.grid.getRow(y))
    )
  }

  getColHints(): HintGroup[][] {
    return Array.from({ length: this.x }, (_, x) =>
      this.getLineHints(this.grid.getCol(x))
    )
  }

  getLineHints(cells: string[]): HintGroup[] {
    const hints: HintGroup[] = []
    let run = 0
    let runColor = '0'

    const pushRun = () => {
      if (run > 0) hints.push({ count: run, colorIndex: parseInt(runColor) })
      run = 0
    }

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (cell !== '0') {
        if (cell !== runColor && run > 0) pushRun()
        runColor = cell
        run++
        if (i === cells.length - 1) pushRun()
      } else {
        pushRun()
      }
    }

    return hints.length > 0 ? hints : [{ count: 0, colorIndex: 0 }]
  }

  isRowComplete(y: number): boolean {
    const row = this.grid.getRow(y)
    const paintRow = this.paint.getRow(y)
    return row.every((cell, i) => cell === '0' || paintRow[i] === cell)
  }

  isColComplete(x: number): boolean {
    const col = this.grid.getCol(x)
    const paintCol = this.paint.getCol(x)
    return col.every((cell, i) => cell === '0' || paintCol[i] === cell)
  }

  isComplete(): boolean {
    for (let x = 0; x < this.x; x++) {
      if (!this.isColComplete(x)) return false
    }
    return true
  }

  getGame(): string {
    let s = ''
    for (let x = 0; x < this.x; x++) {
      for (const cell of this.grid.getCol(x)) s += cell
    }
    return s
  }

  addCols(num: number): void {
    this.x += num
    this.grid.addCols(num)
    this.paint.addCols(num)
    this.mark.addCols(num)
  }

  addRows(num: number): void {
    this.y += num
    this.grid.addRows(num)
    this.paint.addRows(num)
    this.mark.addRows(num)
  }

  subtractCols(num: number): void {
    this.x -= num
    this.grid.subtractCols(num)
    this.paint.subtractCols(num)
    this.mark.subtractCols(num)
  }

  subtractRows(num: number): void {
    this.y -= num
    this.grid.subtractRows(num)
    this.paint.subtractRows(num)
    this.mark.subtractRows(num)
  }
}
