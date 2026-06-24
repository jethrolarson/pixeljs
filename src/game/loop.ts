import { Level } from '../level'
import { SoundGroup } from '../sound'
import { GameMode } from './types'
import { computeLayout, pixelToGrid, inGrid } from './layout'
import { Sound, createPointer, createInteraction, applyPointer } from './input'
import { computeScore, golfScore, formatTime, computeHints, clueSatisfaction } from './score'
import { projectPuzzle } from './term/project'
import { drawBuffer } from './term/termrender'
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

  const playSound = (sound: Sound | null): void => {
    if (sound) cfg.assets[sound].play(cfg.getMute())
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
      hover: within ? pos : null,
      solved: complete || won,
      reveal: mode === 'edit' || complete || won,
      golf,
      activeColorIndex: cfg.getActiveColor(),
      pop: pop ? { x: pop.x, y: pop.y, t: popT } : null,
    })
    drawBuffer(ctx, buffer, layout)

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
