import { Level } from '../level'
import { SoundGroup } from '../sound'
import { GameMode, GridPos, ScoreMode } from './types'
import { computeLayout, pixelToGrid, inGrid } from './layout'
import { Sound, createPointer, createInteraction, applyPointer } from './input'
import { computeScore, golfScore, formatTime, computeHints, clueSatisfaction } from './score'
import { projectPuzzle, projectSolvedArt, Underlay, MENU_HELP_COL, MENU_BACK_COL, MENU_PREV_COL, MENU_NEXT_COL } from './term/project'
import { projectHelp } from './term/help'
import { projectPackMenu, PackMenuItem } from './term/packmenu'
import { drawBuffer, drawStipple, TermMetrics } from './term/termrender'
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
  /** Play-mode feedback model; ignored in edit. Defaults to `zen`. */
  scoreMode?: ScoreMode
  /** Edit mode: faint puzzle guide behind the art grid (solved-art authoring). */
  underlay?: Underlay
  getActiveColor: () => number
  setActiveColor?: (index: number) => void
  getMute: () => boolean
  getPalette: () => string[]
  assets: Assets
  onHud?: (hud: Hud) => void
  /** Invoked by the `~` menu hotkey (play) when no `packMenu` is set: navigate
   * back to the pack/home. With `packMenu`, `~` opens the picker instead. */
  onBack?: () => void
  /** Invoked by the `>` menu hotkey (play); when set, the hotkey is shown. */
  onNext?: () => void
  /** Invoked by the `<` menu hotkey (play); when set, the hotkey is shown. */
  onPrev?: () => void
  /** In-session pack picker (play); when set, `~` opens it. */
  packMenu?: PackMenu
  /** Leave the session entirely (the picker's `q`/leave action). */
  onExit?: () => void
  /** Fired once when the puzzle is first solved. */
  onSolved?: () => void
  signal: AbortSignal
}

/** The in-session pack picker opened by `~`. When provided, `~` opens the
 * picker instead of calling `onBack`; `getItems` is read live so solved state
 * stays current. */
export interface PackMenu {
  title: string
  current: number
  getItems: () => PackMenuItem[]
  onPick: (index: number) => void
}

export interface GameLoop {
  start(): void
  stop(): void
  /** Hook for callers that mutate dimensions; layout is recomputed each frame. */
  relayout(): void
}

/** How long a freshly-painted cell's scale-pop takes to settle. */
const POP_MS = 220

/** A footer hotkey slot spans its start column plus `key␠label` (6 chars). */
const inSlot = (col: number, start: number): boolean => col >= start && col <= start + 5

export function createGameLoop(cfg: GameLoopConfig): GameLoop {
  const ctx = cfg.canvas.getContext('2d')!
  const pointer = createPointer(cfg.canvas, cfg.signal)
  const interaction = createInteraction()
  const scoreMode: ScoreMode = cfg.scoreMode ?? 'zen'
  // Zen hides errors, so the win must be an exact match (no stray paint on
  // blanks); faults mode keeps the looser solution-cells-only completion.
  const isDone = (): boolean => (scoreMode === 'zen' ? cfg.level.isSolvedExactly() : cfg.level.isComplete())

  let rafId: number | null = null
  let won = false
  let endTime: Date | null = null
  let startTime = new Date()
  let pop: { x: number; y: number; time: number } | null = null
  // Keyboard cursor (play): a selected cell, shown once a key is used and hidden
  // again on mouse move so whichever input you last touched is what's displayed.
  let cursor: GridPos | null = null
  let cursorActive = false
  // Help guide modal (play): when open, the puzzle freezes behind a dim overlay
  // and game input is swallowed. A press just after closing is also swallowed so
  // dismissing the modal doesn't paint the cell underneath.
  let helpOpen = false
  let suppressPaintUntilRelease = false
  // Pack picker (play, in a session): selection cursor + last-rendered geometry
  // for click hit-testing. Modal like the help guide.
  let pickerOpen = false
  let pickerSel = 0
  let pickerGeom: { metrics: TermMetrics; itemRows: number[]; footerRow: number; cols: number; rows: number } | null = null
  const openPicker = (): void => {
    if (!cfg.packMenu) return
    pickerSel = cfg.packMenu.current
    pickerOpen = true
  }
  const pickSelected = (): void => {
    pickerOpen = false
    cfg.packMenu?.onPick(pickerSel)
  }

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
      if (isDone()) return
      const prev = level.paint.getAt(c.x, c.y)
      const v = String(cfg.getActiveColor())
      level.paint.setAt(c.x, c.y, v)
      if (prev === '0') {
        const correct = level.grid.getAt(c.x, c.y) === v
        // Zen: a single neutral tone so audio can't leak correctness either.
        playSound(scoreMode === 'zen' ? 'bing' : correct ? 'bing' : 'boom')
        pop = { x: c.x, y: c.y, time: Date.now() }
      }
    }
    const eraseCursor = (): void => {
      const c = ensure()
      if (!isDone()) level.paint.setAt(c.x, c.y, '0')
    }
    // Known-empty mark (the right-click equivalent). The first cell of a drag
    // decides whether we're adding or removing marks.
    let markErasing = false
    const markCursor = (fresh: boolean): void => {
      const c = ensure()
      if (isDone()) return
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
        // Menu hotkeys, independent of the cursor and intercepted first. The
        // unshifted key works too (`/` shares `?`, backtick shares `~`, etc).
        if (e.key === '?' || e.key === '/') {
          if (!pickerOpen) helpOpen = !helpOpen
          e.preventDefault()
          return
        }
        if (e.key === 'Escape') {
          if (helpOpen) {
            helpOpen = false
            e.preventDefault()
          } else if (pickerOpen) {
            pickerOpen = false
            e.preventDefault()
          }
          return
        }
        if (helpOpen) {
          e.preventDefault() // swallow game input while the guide is open
          return
        }
        if (e.key === '~' || e.key === '`') {
          if (cfg.packMenu) pickerOpen ? (pickerOpen = false) : openPicker()
          else cfg.onBack?.()
          e.preventDefault()
          return
        }
        if (pickerOpen && cfg.packMenu) {
          const n = cfg.packMenu.getItems().length
          if (e.key === 'ArrowUp') pickerSel = (pickerSel - 1 + n) % n
          else if (e.key === 'ArrowDown') pickerSel = (pickerSel + 1) % n
          else if (e.key === 'Enter' || e.key === ' ') pickSelected()
          else if (e.key === 'q' || e.key === 'Q') {
            pickerOpen = false
            cfg.onExit?.()
          } else if (/^[1-9]$/.test(e.key)) {
            const idx = +e.key - 1
            if (idx < n) pickerSel = idx
          }
          e.preventDefault()
          return
        }
        if ((e.key === '>' || e.key === '.') && cfg.onNext) {
          cfg.onNext()
          e.preventDefault()
          return
        }
        if ((e.key === '<' || e.key === ',') && cfg.onPrev) {
          cfg.onPrev()
          e.preventDefault()
          return
        }
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
    const complete = mode === 'play' && isDone()

    if (!ptr.pressed) suppressPaintUntilRelease = false

    // Click handling for chrome (play): the menu hotkeys, dismissing the help
    // modal, and palette swatches. Any of these suppress paint for this press.
    if (mode === 'play' && ptr.newlyPressed) {
      const charCol = Math.floor((ptr.x - layout.originX) / layout.cellW)
      const charRow = Math.floor((ptr.y - layout.originY) / layout.cellH)
      const i = charCol - layout.paletteCol
      if (pickerOpen) {
        // Click a picker row to open it; click outside the panel to dismiss.
        suppressPaintUntilRelease = true
        const g = pickerGeom
        if (g) {
          const pc = Math.floor((ptr.x - g.metrics.originX) / g.metrics.cellW)
          const pr = Math.floor((ptr.y - g.metrics.originY) / g.metrics.cellH)
          const idx = g.itemRows.indexOf(pr)
          if (idx >= 0) {
            pickerSel = idx
            pickSelected()
          } else if (pr === g.footerRow && pc >= 0 && pc < g.cols) {
            pickerOpen = false
            cfg.onExit?.()
          } else if (pc < 0 || pc >= g.cols || pr < 0 || pr >= g.rows) {
            pickerOpen = false
          }
        } else {
          pickerOpen = false
        }
      } else if (helpOpen) {
        helpOpen = false
        suppressPaintUntilRelease = true
      } else if (charRow === layout.menuRow && inSlot(charCol, layout.menuCol + MENU_HELP_COL)) {
        helpOpen = true
        suppressPaintUntilRelease = true
      } else if (charRow === layout.menuRow && inSlot(charCol, layout.menuCol + MENU_BACK_COL)) {
        if (cfg.packMenu) openPicker()
        else cfg.onBack?.()
        suppressPaintUntilRelease = true
      } else if (charRow === layout.menuRow && inSlot(charCol, layout.menuCol + MENU_PREV_COL) && cfg.onPrev) {
        cfg.onPrev()
        suppressPaintUntilRelease = true
      } else if (charRow === layout.menuRow && inSlot(charCol, layout.menuCol + MENU_NEXT_COL) && cfg.onNext) {
        cfg.onNext()
        suppressPaintUntilRelease = true
      } else if (charRow === layout.paletteRow && i >= 0 && i < palette.length) {
        cfg.setActiveColor?.(i + 1)
        suppressPaintUntilRelease = true
      }
    }

    if (!helpOpen && !pickerOpen && !suppressPaintUntilRelease && !complete && ptr.pressed && within) {
      const sound = applyPointer(level, mode, cfg.getActiveColor(), ptr, pos, interaction)
      // Zen: collapse the correct/wrong tones into one neutral tap.
      playSound(scoreMode === 'zen' && sound === 'boom' ? 'bing' : sound)
      if (sound === 'bing' || sound === 'boom') pop = { x: pos.x, y: pos.y, time: now }
    }
    pointer.afterFrame()

    if (mode === 'play' && complete && !won) {
      won = true
      endTime = new Date()
      playSound('win')
      cfg.onSolved?.()
    }

    const popT = pop ? Math.max(0, 1 - (now - pop.time) / POP_MS) : 0
    if (pop && popT <= 0) pop = null

    const score = mode === 'play' ? computeScore(level) : 0
    const sat = mode === 'play' ? clueSatisfaction(level, hints) : null
    // Golf is a faults concept; zen has no fault label.
    const golf = won && scoreMode === 'faults' ? golfScore(score, level.par) : null

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
      revealErrors: scoreMode === 'faults',
      golf,
      activeColorIndex: cfg.getActiveColor(),
      pop: pop ? { x: pop.x, y: pop.y, t: popT } : null,
      hasNext: !!cfg.onNext,
      hasPrev: !!cfg.onPrev,
      hasPack: !!cfg.packMenu,
      underlay: cfg.underlay,
    })
    drawBuffer(ctx, buffer, layout)

    // Reward art replaces the puzzle interior once solved (its own palette, drawn
    // at cellW/scale so a 2× grid fits the same area).
    if (mode === 'play' && (complete || won) && level.art) {
      const art = level.art
      const artBuf = projectSolvedArt(art, level.x * art.scale, level.y * art.scale)
      drawBuffer(ctx, artBuf, {
        cellW: layout.cellW / art.scale,
        cellH: layout.cellH / art.scale,
        originX: layout.originX + layout.gridCol * layout.cellW,
        originY: layout.originY + layout.gridRow * layout.cellH,
      })
    }

    // Keyboard cursor cell: a see-through stipple in the active color, drawn over
    // the grid so the cell behind stays visible.
    if (cursorActive && cursor && mode === 'play' && !complete && !won && inGrid(level, cursor)) {
      const color = palette[cfg.getActiveColor() - 1] ?? chrome.text
      const cx = layout.originX + (layout.gridCol + cursor.x) * layout.cellW
      const cy = layout.originY + (layout.gridRow + cursor.y) * layout.cellH
      drawStipple(ctx, cx, cy, layout.cellW, layout.cellH, color)
    }

    // Help guide: dim the puzzle and draw the ANSI panel over it.
    if (helpOpen && mode === 'play') {
      ctx.fillStyle = 'rgba(13,13,13,0.82)'
      ctx.fillRect(0, 0, w, h)
      const help = projectHelp({ w, h })
      drawBuffer(ctx, help.buffer, help.metrics)
    }

    // Pack picker: dim the puzzle and draw the selectable list over it.
    if (pickerOpen && mode === 'play' && cfg.packMenu) {
      ctx.fillStyle = 'rgba(13,13,13,0.82)'
      ctx.fillRect(0, 0, w, h)
      const pm = projectPackMenu({
        title: cfg.packMenu.title,
        items: cfg.packMenu.getItems(),
        current: cfg.packMenu.current,
        selected: pickerSel,
        viewport: { w, h },
      })
      drawBuffer(ctx, pm.buffer, pm.metrics)
      pickerGeom = { metrics: pm.metrics, itemRows: pm.itemRows, footerRow: pm.footerRow, cols: pm.buffer.cols, rows: pm.buffer.rows }
    } else {
      pickerGeom = null
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
