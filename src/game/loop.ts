import { Canvas2D } from '../canvas2d'
import { Level } from '../level'
import { SoundGroup } from '../sound'
import { GameMode, computeLayout, pixelToGrid, inGrid } from './layout'
import { Sound, createPointer, createInteraction, applyPointer } from './input'
import { computeScore, golfScore, formatTime } from './score'
import {
  renderBackground,
  renderCells,
  renderHints,
  renderGrid,
  renderHover,
  renderWinText,
} from './render'

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

export function createGameLoop(cfg: GameLoopConfig): GameLoop {
  const p = new Canvas2D(cfg.canvas)
  const pointer = createPointer(cfg.canvas, cfg.signal)
  const interaction = createInteraction()

  let rafId: number | null = null
  let won = false
  let endTime: Date | null = null
  let startTime = new Date()

  const playSound = (sound: Sound | null): void => {
    if (sound) cfg.assets[sound].play(cfg.getMute())
  }

  const frame = (): void => {
    const { level, mode } = cfg
    const palette = cfg.getPalette()

    const w = window.innerWidth
    const h = window.innerHeight
    if (p.width !== w || p.height !== h) p.resize(w, h)

    const layout = computeLayout(level, mode, { w, h })
    const ptr = pointer.read()
    const pos = pixelToGrid(layout, ptr.x, ptr.y)
    const within = inGrid(level, pos)
    const complete = mode === 'play' && level.isComplete()

    if (!complete && ptr.pressed && within) {
      playSound(applyPointer(level, mode, cfg.getActiveColor(), ptr, pos, interaction))
    }
    pointer.afterFrame()

    if (mode === 'play' && complete && !won) {
      won = true
      endTime = new Date()
      playSound('win')
    }

    renderBackground(p, level, layout)
    renderCells(p, level, layout, palette, mode, complete || won)
    if (mode === 'play') renderHints(p, level, layout, palette)
    renderGrid(p, level, layout)

    const score = mode === 'play' ? computeScore(level) : 0
    if (won) renderWinText(p, golfScore(score, level.par))
    if (!complete && within) renderHover(p, level, layout, pos)

    if (mode === 'play') {
      cfg.onHud?.({
        faults: score,
        par: level.par,
        time: formatTime(startTime, endTime ?? new Date()),
        golf: won ? golfScore(score, level.par) : null,
      })
    }

    interaction.lastCell = `${pos.x},${pos.y}`
  }

  const start = (): void => {
    startTime = new Date()
    won = false
    endTime = null
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
