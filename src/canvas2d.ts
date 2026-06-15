// Thin wrapper around CanvasRenderingContext2D with a Processing-like stateful API
// so game.ts stays close to the original CoffeeScript logic.
export type Color = string

export class Canvas2D {
  readonly ctx: CanvasRenderingContext2D
  width: number
  height: number

  private _fill: Color = 'rgb(0,0,0)'
  private _stroke: Color = 'rgb(0,0,0)'
  private _hasStroke = true

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
  }

  resize(w: number, h: number): void {
    this.ctx.canvas.width = w
    this.ctx.canvas.height = h
    this.width = w
    this.height = h
  }

  // Create a CSS color string (alpha is 0–255 to match Processing)
  color(r: number, g: number, b: number, a = 255): Color {
    return `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`
  }

  fill(rOrGrayOrColor: number | Color, g?: number, b?: number, a = 255): void {
    if (typeof rOrGrayOrColor === 'string') {
      this._fill = rOrGrayOrColor
    } else if (g === undefined) {
      const v = rOrGrayOrColor
      this._fill = `rgb(${v},${v},${v})`
    } else {
      this._fill = `rgba(${rOrGrayOrColor},${g},${b!},${+(a / 255).toFixed(3)})`
    }
  }

  stroke(rOrGrayOrColor: number | Color, g?: number, b?: number): void {
    this._hasStroke = true
    if (typeof rOrGrayOrColor === 'string') {
      this._stroke = rOrGrayOrColor
    } else if (g === undefined) {
      const v = rOrGrayOrColor
      this._stroke = `rgb(${v},${v},${v})`
    } else {
      this._stroke = `rgb(${rOrGrayOrColor},${g},${b!})`
    }
  }

  noStroke(): void {
    this._hasStroke = false
  }

  strokeWeight(n: number): void {
    this.ctx.lineWidth = n
  }

  background(color: Color): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  rect(x: number, y: number, w: number, h: number): void {
    this.ctx.fillStyle = this._fill
    this.ctx.fillRect(x, y, w, h)
    if (this._hasStroke) {
      this.ctx.strokeStyle = this._stroke
      this.ctx.strokeRect(x, y, w, h)
    }
  }

  line(x1: number, y1: number, x2: number, y2: number): void {
    if (!this._hasStroke) return
    this.ctx.strokeStyle = this._stroke
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }

  textSize(n: number): void {
    this.ctx.font = `${n}px sans-serif`
  }

  textAlign(h: 'center' | 'left' | 'right', v?: 'middle' | 'top' | 'bottom'): void {
    this.ctx.textAlign = h
    this.ctx.textBaseline = v ?? 'alphabetic'
  }

  text(str: string | number, x: number, y: number): void {
    this.ctx.fillStyle = this._fill
    this.ctx.fillText(String(str), x, y)
  }

  // Returns perceived brightness 0–100 of a CSS color string
  brightness(color: Color): number {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return 50
    return (parseInt(m[1]) * 299 + parseInt(m[2]) * 587 + parseInt(m[3]) * 114) / 1000 / 2.55
  }
}
