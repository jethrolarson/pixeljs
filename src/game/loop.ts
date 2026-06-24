import { Level } from '../level'
import { SoundGroup } from '../sound'
import { GameMode, GridPos } from './types'
import { computeLayout, pixelToGrid, inGrid } from './layout'
import { Sound, createPointer, createInteraction, applyPointer } from './input'
import { computeScore, golfScore, formatTime, computeHints, clueSatisfaction } from './score'
import { projectPuzzle } from './term/project'
import { drawBuffer, drawStipple } from './term/termrender'
import { chrome } from './term/glyphs'

export interface Assets {
  boom: SoundGroup
  bing: SoundGroup
  win: SoundGroup
}

export const createAssets = (): Assets => ({
  boom: new SoundGroup('boom.wav'),
  bing: new SoundGroup('bing.wav'),
  win: new SoundGroup('win.wav'),
})

export interface Hud {
  faults: number
  par: number
  time: string
  golf: string | null
}

export interface GameLoopConfig {
  canvas: HTMLCanvasElement
  level: Level
  mode: GameMode
  getActiveColor: () => number
  setActiveColor?: (index: number) => void
  getMute: () => boolean
  getPalette: () => string[]
  assets: Assets
  onHud?: (hud: Hud) => void
  signal: AbortSignal
}

export interface GameLoop {
  start(): void
  stop(): void
  /** Hook for callers that mutate dimensions; layout is recomputed each frame. */
  relayout(): void
}

/** How long a freshly-painted cell's scale-pop takes to settle. */
const POP_MS = 220

export function createGameLoop(cfg: GameLoopConfig): GameLoop {
  const ctx = cfg.canvas.getContext('2d')!
  const pointer = createPointer(cfg.canvas, cfg.signal)
  const interaction = createInteraction()

  let rafId: number | null = null
  let won = false
  let endTime: Date | null = null
  let startTime = new Date()
  let pop: { x: number; y: number; time: number } | null = null
  // Keyboard cursor (play): a selected cell, shown once a key is used and hidden
  // again on mouse move so whichever input you last touched is what's displayed.
  let cursor: GridPos | null = null
  let cursorActive = false

  const playSound = (sound: Sound | null): void => {
    if (sound) cfg.assets[sound].play(cfg.getMute())
  }

  if (cfg.mode === 'play') {
    const opts = { signal: cfg.signal }
    const { level } = cfg
    const ensure = (): GridPos => (cursor ??= { x: (level.x / 2) | 0, y: (level.y / 2) | 0 })
    const move = (dx: number, dy: number): void => {
      const c = ensure()
      c.x = Math.min(level.x - 1, Math.max(0, c.x + dx))
      c.y = Math.min(level.y - 1, Math.max(0, c.y + dy))
    }
    const cycleColor = (back: boolean): void => {
      const n = cfg.getPalette().length
      const cur = cfg.getActiveColor()
      cfg.setActiveColor?.(back ? ((cur - 2 + n) % n) + 1 : (cur % n) + 1)
    }
    const paintCursor = (): void => {
      const c = ensure()
      if (level.isComplete()) return
      const prev = level.paint.getAt(c.x, c.y)
      const v = String(cfg.getActiveColor())
      level.paint.setAt(c.x, c.y, v)
      if (prev === '0') {
        playSound(level.grid.getAt(c.x, c.y) === v ? 'bing' : 'boom')
        pop = { x: c.x, y: c.y, time: Date.now() }
      }
    }
    const eraseCursor = (): void => {
      const c = ensure()
      if (!level.isComplete()) level.paint.setAt(c.x, c.y, '0')
    }
    // Known-empty mark (the right-click equivalent). The first cell of a drag
    // decides whether we're adding or removing marks.
    let markErasing = false
    const markCursor = (fresh: boolean): void => {
      const c = ensure()
      if (level.isComplete()) return
      if (fresh) markErasing = level.mark.getAt(c.x, c.y) === '1'
      level.mark.setAt(c.x, c.y, markErasing ? '0' : '1')
    }
    // While a paint/erase/mark key is held, moving the cursor applies it to each
    // cell it enters — keyboard drag.
    let heldPaint = false
    let heldErase = false
    let heldMark = false
    window.addEventListener(
      'keydown',
      (e) => {
        let handled = true
        switch (e.key) {
          case 'ArrowUp': move(0, -1); break
          case 'ArrowDown': move(0, 1); break
          case 'ArrowLeft': move(-1, 0); break
          case 'ArrowRight': move(1, 0); break
          case 'Enter':
          case ' ': heldPaint = true; paintCursor(); break
          case 'Backspace':
          case 'Delete': heldErase = true; eraseCursor(); break
          case 'x':
          case 'X': heldMark = true; markCursor(true); break
          case 'Tab': cycleColor(e.shiftKey); break
          default: handled = false
        }
        if (handled) {
          if (e.key.startsWith('Arrow')) {
            if (heldPaint) paintCursor()
            else if (heldErase) eraseCursor()
            else if (heldMark) markCursor(false)
          }
          cursorActive = true
          e.preventDefault()
        }
      },
      opts,
    )
    window.addEventListener(
      'keyup',
      (e) => {
        if (e.key === 'Enter' || e.key === ' ') heldPaint = false
        else if (e.key === 'Backspace' || e.key === 'Delete') heldErase = false
        else if (e.key === 'x' || e.key === 'X') heldMark = false
      },
      opts,
    )
    window.addEventListener('mousemove', () => { cursorActive = false }, opts)
  }

  const frame = (): void => {
    const { level, mode, canvas } = cfg
    const palette = cfg.getPalette()
    const now = Date.now()

    const w = window.innerWidth
    const h = window.innerHeight
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    const hints = computeHints(level)
    const layout = computeLayout(level, mode, hints, { w, h })
    const ptr = pointer.read()
    const pos = pixelToGrid(layout, ptr.x, ptr.y)
    const within = inGrid(level, pos)
    const complete = mode === 'play' && level.isComplete()

    // Palette select (play): a fresh click on a swatch sets the active color.
    if (mode === 'play' && ptr.newlyPressed) {
      const charCol = Math.floor((ptr.x - layout.originX) / layout.cellW)
      const charRow = Math.floor((ptr.y - layout.originY) / layout.cellH)
      const i = charCol - layout.paletteCol
      if (charRow === layout.paletteRow && i >= 0 && i < palette.length) cfg.setActiveColor?.(i + 1)
    }

    if (!complete && ptr.pressed && within) {
      const sound = applyPointer(level, mode, cfg.getActiveColor(), ptr, pos, interaction)
      playSound(sound)
      if (sound === 'bing' || sound === 'boom') pop = { x: pos.x, y: pos.y, time: now }
    }
    pointer.afterFrame()

    if (mode === 'play' && complete && !won) {
      won = true
      endTime = new Date()
      playSound('win')
    }

    const popT = pop ? Math.max(0, 1 - (now - pop.time) / POP_MS) : 0
    if (pop && popT <= 0) pop = null

    const score = mode === 'play' ? computeScore(level) : 0
    const sat = mode === 'play' ? clueSatisfaction(level, hints) : null
    const golf = won ? golfScore(score, level.par) : null

    ctx.fillStyle = chrome.bg
    ctx.fillRect(0, 0, w, h)
    const buffer = projectPuzzle({
      level,
      palette,
      mode,
      layout,
      hints,
      sat,
      hover: !cursorActive && within ? pos : null,
      cursor: cursorActive ? cursor : null,
      solved: complete || won,
      reveal: mode === 'edit' || complete || won,
      golf,
      activeColorIndex: cfg.getActiveColor(),
      pop: pop ? { x: pop.x, y: pop.y, t: popT } : null,
    })
    drawBuffer(ctx, buffer, layout)

    // Keyboard cursor cell: a see-through stipple in the active color, drawn over
    // the grid so the cell behind stays visible.
    if (cursorActive && cursor && mode === 'play' && !complete && !won && inGrid(level, cursor)) {
      const color = palette[cfg.getActiveColor() - 1] ?? chrome.text
      const cx = layout.originX + (layout.gridCol + cursor.x) * layout.cellW
      const cy = layout.originY + (layout.gridRow + cursor.y) * layout.cellH
      drawStipple(ctx, cx, cy, layout.cellW, layout.cellH, color)
    }

    if (mode === 'play') {
      cfg.onHud?.({
        faults: score,
        par: level.par,
        time: formatTime(startTime, endTime ?? new Date()),
        golf,
      })
    }

    interaction.lastCell = `${pos.x},${pos.y}`
  }

  const start = (): void => {
    startTime = new Date()
    won = false
    endTime = null
    pop = null
    stop()
    const tick = (): void => {
      rafId = requestAnimationFrame(tick)
      frame()
    }
    rafId = requestAnimationFrame(tick)
  }

  const stop = (): void => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  cfg.signal.addEventListener('abort', stop)
  return { start, stop, relayout: () => {} }
}
