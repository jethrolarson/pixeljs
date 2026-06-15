export class Matrix {
  x: number
  y: number
  private cols: string[][]

  constructor(x: number, y: number, initialValues?: string[], defaultValue = '0') {
    this.x = x
    this.y = y
    this.cols = []
    for (let i = 0; i < x; i++) {
      const col: string[] = []
      for (let j = 0; j < y; j++) {
        col.push(initialValues?.shift() ?? defaultValue)
      }
      this.cols.push(col)
    }
  }

  getAt(x: number, y: number): string { return this.cols[x][y] }
  setAt(x: number, y: number, val: string): void { this.cols[x][y] = val }

  getRow(y: number): string[] {
    if (y >= this.y) return []
    return this.cols.map(col => col[y])
  }

  getCol(x: number): string[] { return this.cols[x] }

  addCols(num: number): void {
    this.x += num
    for (let i = 0; i < num; i++) {
      this.cols.push(Array.from({ length: this.y }, () => '0'))
    }
  }

  addRows(num: number): void {
    this.y += num
    for (const col of this.cols) {
      for (let i = 0; i < num; i++) col.push('0')
    }
  }

  subtractCols(num: number): void {
    this.x -= num
    this.cols = this.cols.slice(0, this.x)
  }

  subtractRows(num: number): void {
    this.y -= num
    for (let i = 0; i < this.cols.length; i++) {
      this.cols[i] = this.cols[i].slice(0, this.y)
    }
  }
}
