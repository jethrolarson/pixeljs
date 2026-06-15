import { Canvas2D, Color } from './canvas2d'
import { hexToRGB, brightness, rgbToCSS } from './color'
import { Level, LevelData } from './level'
import { SoundGroup } from './sound'

type GameMode = 'play' | 'edit'

interface Assets {
  boom: SoundGroup
  bing: SoundGroup
  win: SoundGroup
}

export class Game {
  private canvas!: Canvas2D
  level!: Level
  private gameMode: GameMode = 'play'
  private mute = false
  private win = false
  private score = 0
  private newlyPressed = false
  private isErasing = false
  private lastCell = ''
  private startTime = new Date()
  private endTime: Date | null = null
  private rafId: number | null = null
  private assets!: Assets
  private activeColorIndex = 1  // 1-based index into level.palette

  private mouseX = 0
  private mouseY = 0
  private mouseIsPressed = false
  private mouseButton: 'left' | 'right' = 'left'

  private cw = 0
  private offset = { x: 0, y: 0 }
  private w = 0
  private h = 0
  private gridBounds = { x1: 10, y1: 10, x2: 0, y2: 0 }

  private $layers!: HTMLElement
  private $faults!: HTMLElement
  private $time!: HTMLElement

  init(): void {
    const canvasEl = document.getElementById('canvas') as HTMLCanvasElement
    this.$layers = document.getElementById('layers')!
    this.$faults = document.getElementById('faults')!
    this.$time = document.getElementById('time')!

    this.canvas = new Canvas2D(canvasEl)
    this.loadAssets()
    this.bindMouseEvents(canvasEl)
    this.bindUIEvents()
  }

  start(levelData: LevelData): void {
    this.loadGame(levelData)
  }

  edit(): void {
    this.gameMode = 'edit'
  }

  getLevelData(): LevelData {
    return {
      title: this.level.title,
      x: this.level.x,
      y: this.level.y,
      game: this.level.getGame(),
      palette: [...this.level.palette],
      bgcolor: this.level.bgcolor,
      ...(this.level.gridcolor ? { gridcolor: this.level.gridcolor } : {}),
      par: this.level.par,
      levelSetName: this.level.levelSetName,
    }
  }

  addPaletteColor(): void {
    this.level.palette.push('#888888')
    this.renderPaletteUI()
  }

  updateCols(cols: number): void {
    const delta = cols - this.level.x
    if (delta > 0) this.level.addCols(delta)
    else if (delta < 0) this.level.subtractCols(-delta)
    this.renderLevel()
  }

  updateRows(rows: number): void {
    const delta = rows - this.level.y
    if (delta > 0) this.level.addRows(delta)
    else if (delta < 0) this.level.subtractRows(-delta)
    this.renderLevel()
  }

  private loadAssets(): void {
    this.assets = {
      boom: new SoundGroup('boom.wav'),
      bing: new SoundGroup('bing.wav'),
      win: new SoundGroup('win.wav'),
    }
  }

  private loadGame(data: LevelData): void {
    this.win = false
    this.endTime = null
    this.activeColorIndex = 1
    this.level = new Level(data)
    this.renderLevel()
    this.renderPaletteUI()
    this.startTime = new Date()
    document.title = this.level.title
    if (this.gameMode === 'edit') this.bindEditEvents()
  }

  private renderLevel(): void {
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.resize(this.w, this.h)

    this.gridBounds = { x1: 10, y1: 10, x2: this.w - 80, y2: this.h - 30 }
    if (this.gameMode === 'play') {
      this.gridBounds.x2 = this.w - 10
    } else {
      this.gridBounds.x1 = 140
    }

    this.startLoop()
  }

  private startLoop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    const loop = () => {
      this.rafId = requestAnimationFrame(loop)
      this.draw()
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private draw(): void {
    const p = this.canvas
    const bgRGB = hexToRGB(this.level.bgcolor)
    const bgColor = rgbToCSS(bgRGB)

    p.background(bgColor)

    // Compute cell size to fit grid + hints
    let biggestRowHints = 0
    let biggestColHints = 0
    let rowHints = this.level.getRowHints()
    let colHints = this.level.getColHints()

    if (this.gameMode === 'play') {
      biggestRowHints = 2
      biggestColHints = 2
      for (const row of rowHints) biggestRowHints = Math.max(biggestRowHints, row.length)
      for (const col of colHints) biggestColHints = Math.max(biggestColHints, col.length)
    }

    const gridAreaW = this.gridBounds.x2 - this.gridBounds.x1
    const gridAreaH = this.gridBounds.y2 - this.gridBounds.y1
    const cw = Math.min(
      Math.floor(gridAreaW / (this.level.x + biggestRowHints)),
      Math.floor(gridAreaH / (this.level.y + biggestColHints))
    )
    this.cw = cw
    this.offset = {
      x: this.gridBounds.x1 + biggestRowHints * cw,
      y: this.gridBounds.y1 + biggestColHints * cw,
    }

    p.textSize(Math.floor(cw / 3))
    p.fill(bgColor)
    p.noStroke()
    p.rect(this.offset.x, this.offset.y, cw * this.level.x, cw * this.level.y)

    const gridX = Math.floor((this.mouseX - this.offset.x) / cw)
    const gridY = Math.floor((this.mouseY - this.offset.y) / cw)
    const inGrid = gridX >= 0 && gridX < this.level.x && gridY >= 0 && gridY < this.level.y
    const curCell = `${gridX},${gridY}`

    const puzzleComplete = this.gameMode === 'play' && this.level.isComplete()

    // Handle input
    if (!puzzleComplete && this.mouseIsPressed && inGrid) {
      if (this.gameMode === 'play') {
        if (this.mouseButton === 'right') {
          // Mark/unmark
          if (this.newlyPressed) {
            this.isErasing = this.level.mark.getAt(gridX, gridY) === '1'
          }
          this.level.mark.setAt(gridX, gridY, this.isErasing ? '0' : '1')
        } else {
          // Paint
          if (this.newlyPressed) {
            this.isErasing = this.level.paint.getAt(gridX, gridY) === String(this.activeColorIndex)
          }
          const prev = this.level.paint.getAt(gridX, gridY)
          if (!this.isErasing && !+this.level.mark.getAt(gridX, gridY)) {
            const newVal = String(this.activeColorIndex)
            this.level.paint.setAt(gridX, gridY, newVal)
            if (prev === '0') {
              const correct = this.level.grid.getAt(gridX, gridY) === newVal
              correct ? this.assets.bing.play(this.mute) : this.assets.boom.play(this.mute)
            }
          } else if (this.isErasing) {
            this.level.paint.setAt(gridX, gridY, '0')
          }
        }
      } else {
        // Edit mode
        if (this.newlyPressed) {
          this.isErasing = this.level.grid.getAt(gridX, gridY) === String(this.activeColorIndex)
        }
        const newVal = this.isErasing ? '0' : String(this.activeColorIndex)
        if (this.level.grid.getAt(gridX, gridY) !== newVal) {
          this.level.grid.setAt(gridX, gridY, newVal)
          if (this.lastCell !== curCell || this.newlyPressed) {
            this.assets.bing.play(this.mute)
          }
        }
      }
    }
    this.newlyPressed = false

    this.drawCells(puzzleComplete)

    // Draw hints
    if (this.gameMode === 'play') {
      for (let y = 0; y < rowHints.length; y++) {
        const hintGroup = [...rowHints[y]].reverse()
        const rowComplete = this.level.isRowComplete(y)
        for (let x = 0; x < hintGroup.length; x++) {
          const { count, colorIndex } = hintGroup[x]
          const pos = { x: this.offset.x - cw * (x + 1), y: cw * y + this.offset.y }
          const hintColor = colorIndex > 0 ? this.paletteColor(colorIndex) : 'rgb(160,160,160)'
          p.fill(hintColor)
          p.noStroke()
          p.rect(pos.x, pos.y, cw, cw)
          p.fill(rowComplete ? 180 : 0)
          p.textAlign('center', 'middle')
          p.text(count, pos.x + cw / 2, pos.y + cw / 2)
        }
      }

      for (let x = 0; x < colHints.length; x++) {
        const hintGroup = [...colHints[x]].reverse()
        const colComplete = this.level.isColComplete(x)
        for (let y = 0; y < hintGroup.length; y++) {
          const { count, colorIndex } = hintGroup[y]
          const pos = { x: cw * x + this.offset.x, y: this.offset.y - cw * (y + 1) }
          const hintColor = colorIndex > 0 ? this.paletteColor(colorIndex) : 'rgb(160,160,160)'
          p.fill(hintColor)
          p.noStroke()
          p.rect(pos.x, pos.y, cw, cw)
          p.fill(colComplete ? 180 : 0)
          p.textAlign('center', 'middle')
          p.text(count, pos.x + cw / 2, pos.y + cw / 2)
        }
      }
    }

    this.drawGrid()

    p.fill(255)
    p.noStroke()
    p.textAlign('left')

    if (this.gameMode === 'play') {
      if (puzzleComplete && !this.win) {
        this.endTime = new Date()
        this.assets.win.play(this.mute)
        this.win = true
      }
      if (this.win) p.text(this.getGolfScore(), 150, 40)
      this.$faults.textContent = `${this.score}/${this.level.par}`
      this.$time.textContent = this.getTime(this.endTime ?? new Date())
    }

    // Hover highlight
    if (!puzzleComplete && inGrid) {
      p.noStroke()
      p.fill(p.color(30, 30, 200, 90))
      p.rect(this.offset.x, gridY * cw + this.offset.y, cw * this.level.x, cw)
      p.rect(gridX * cw + this.offset.x, this.offset.y, cw, cw * this.level.y)
    }

    this.lastCell = curCell
  }

  private drawCells(puzzleComplete: boolean): void {
    const p = this.canvas
    p.noStroke()
    this.score = 0

    if (puzzleComplete || this.win) {
      // Reveal the full solution
      for (let x = 0; x < this.level.x; x++) {
        for (let y = 0; y < this.level.y; y++) {
          const gridVal = this.level.grid.getAt(x, y)
          if (gridVal !== '0') {
            p.fill(this.paletteColor(parseInt(gridVal)))
            this.drawCell(x, y)
          }
        }
      }
      return
    }

    for (let x = 0; x < this.level.x; x++) {
      for (let y = 0; y < this.level.y; y++) {
        const gridVal = this.level.grid.getAt(x, y)
        const paintVal = this.level.paint.getAt(x, y)
        const markVal = this.level.mark.getAt(x, y)

        if (this.gameMode === 'play') {
          if (paintVal !== '0') {
            if (paintVal === gridVal) {
              p.fill(this.paletteColor(parseInt(paintVal)))
              this.drawCell(x, y)
            } else {
              // Wrong color or painted an empty cell
              this.score++
              this.drawMark(x, y, p.color(180, 30, 30))
            }
          } else if (markVal !== '0') {
            this.drawMark(x, y, p.color(0, 0, 0))
          }
        } else {
          // Edit mode: show solution
          if (gridVal !== '0') {
            p.fill(this.paletteColor(parseInt(gridVal)))
            this.drawCell(x, y)
          }
        }
      }
    }
  }

  private drawCell(x: number, y: number): void {
    const { cw, offset } = this
    this.canvas.rect(x * cw + offset.x, y * cw + offset.y, cw, cw)
  }

  private drawMark(x: number, y: number, color: Color = 'rgb(0,0,0)'): void {
    const { cw, offset } = this
    const p = this.canvas
    p.stroke(color)
    p.strokeWeight(1)
    p.line(x * cw + offset.x, y * cw + offset.y, (x + 1) * cw + offset.x, (y + 1) * cw + offset.y)
    p.line(x * cw + offset.x, (y + 1) * cw + offset.y, (x + 1) * cw + offset.x, y * cw + offset.y)
    p.noStroke()
  }

  private drawGrid(): void {
    const p = this.canvas
    const { cw, offset, level } = this
    const gridLineColor = level.gridcolor
      ?? (brightness(hexToRGB(level.bgcolor)) > 80 ? 'rgb(0,0,0)' : 'rgb(200,200,200)')
    p.stroke(gridLineColor)
    for (let i = 1; i < level.x; i++) {
      p.strokeWeight(i % 5 === 0 ? 3 : 1)
      p.line(i * cw + offset.x, offset.y, i * cw + offset.x, level.y * cw + offset.y)
    }
    for (let i = 1; i < level.y; i++) {
      p.strokeWeight(i % 5 === 0 ? 3 : 1)
      p.line(offset.x, i * cw + offset.y, level.x * cw + offset.x, i * cw + offset.y)
    }
  }

  private paletteColor(index: number): string {
    const color = this.level.palette[index - 1]
    return color ? rgbToCSS(hexToRGB(color)) : 'rgb(0,0,0)'
  }

  private renderPaletteUI(): void {
    let html = ''
    for (let i = 0; i < this.level.palette.length; i++) {
      const colorIndex = i + 1
      const on = colorIndex === this.activeColorIndex ? 'on' : ''
      const color = this.level.palette[i]
      if (this.gameMode === 'play') {
        html += `<div class="changeLayer ${on}" data-color-index="${colorIndex}" style="background-color:${color}"></div>`
      } else {
        // <label> wrapping the input: clicking it natively opens the color picker
        html += `<label class="changeLayer ${on}" data-color-index="${colorIndex}" style="background-color:${color}">
          <input type="color" name="color${colorIndex}" value="${color}"/>
        </label>`
      }
    }
    if (this.gameMode === 'edit') {
      html += '<button id="addColor" type="button">+</button>'
    }
    this.$layers.innerHTML = html
  }

  private bindMouseEvents(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousemove', e => {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
    })
    canvas.addEventListener('mousedown', e => {
      this.mouseIsPressed = true
      this.mouseButton = e.button === 2 ? 'right' : 'left'
      this.newlyPressed = true
    })
    canvas.addEventListener('mouseup', () => {
      this.mouseIsPressed = false
    })
    canvas.addEventListener('contextmenu', e => e.preventDefault())
  }

  private bindUIEvents(): void {
    this.$layers.addEventListener('click', e => {
      const target = e.target as HTMLElement
      if (target.id === 'addColor') {
        this.addPaletteColor()
        return
      }
      const swatch = target.closest<HTMLElement>('[data-color-index]')
      if (!swatch) return
      const idx = parseInt(swatch.dataset.colorIndex ?? '0')
      if (!idx) return
      this.activeColorIndex = idx
      this.$layers.querySelectorAll('[data-color-index]').forEach(el => el.classList.remove('on'))
      swatch.classList.add('on')
      // edit mode: label click natively opens the wrapped color input — no JS needed
    })

    // Palette color changes (edit mode) — fires as user drags the picker
    this.$layers.addEventListener('input', e => {
      const target = e.target as HTMLInputElement
      if (target.type !== 'color') return
      const match = /color(\d+)/.exec(target.name)
      if (!match) return
      const idx = parseInt(match[1]) - 1
      this.level.palette[idx] = target.value
      const swatch = target.closest<HTMLElement>('[data-color-index]')
      if (swatch) swatch.style.backgroundColor = target.value
    })

    const muteEl = document.getElementById('mute')
    muteEl?.addEventListener('change', e => {
      this.mute = (e.target as HTMLInputElement).checked
    })
  }

  private bindEditEvents(): void {
    const get = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)

    const titleEl = get<HTMLInputElement>('[name=title]')
    const bgcolorEl = get<HTMLInputElement>('[name=bgcolor]')
    const gridcolorEl = get<HTMLInputElement>('[name=gridcolor]')
    const parEl = get<HTMLInputElement>('[name=par]')
    const xEl = get<HTMLInputElement>('#x')
    const yEl = get<HTMLInputElement>('#y')

    if (titleEl) titleEl.value = this.level.title
    if (bgcolorEl) bgcolorEl.value = this.level.bgcolor
    if (gridcolorEl && this.level.gridcolor) gridcolorEl.value = this.level.gridcolor
    if (parEl) parEl.value = String(this.level.par)
    if (xEl) xEl.value = String(this.level.x)
    if (yEl) yEl.value = String(this.level.y)

    titleEl?.addEventListener('input', () => {
      this.level.title = titleEl.value
      document.title = titleEl.value
    })
    bgcolorEl?.addEventListener('input', () => { this.level.bgcolor = bgcolorEl.value })
    gridcolorEl?.addEventListener('input', () => { this.level.gridcolor = gridcolorEl.value })
    parEl?.addEventListener('change', () => { this.level.par = parseInt(parEl.value) })
    xEl?.addEventListener('change', () => {
      this.updateCols(parseInt(xEl.value))
      xEl.value = String(this.level.x)
    })
    yEl?.addEventListener('change', () => {
      this.updateRows(parseInt(yEl.value))
      yEl.value = String(this.level.y)
    })
  }

  private getTime(at: Date): string {
    const elapsed = new Date(at.getTime() - this.startTime.getTime())
    const mins = elapsed.getMinutes()
    const secs = elapsed.getSeconds()
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private getGolfScore(): string {
    const par = this.score - this.level.par
    if (this.score === 0) return 'Ace!'
    if (par <= -3) return 'Albatross!'
    if (par === -2) return 'Eagle!'
    if (par === -1) return 'Birdie'
    if (par === 0) return 'Par'
    if (par === 1) return 'Bogey'
    if (par === 2) return 'Double Bogey'
    if (par === 3) return 'Triple Bogey'
    return `${this.score} over par`
  }
}
