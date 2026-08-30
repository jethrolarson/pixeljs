import { Level } from '../level'
import { GameMode, GridPos } from './types'

export type Sound = 'bing' | 'boom' | 'win'

export interface Pointer {
  x: number
  y: number
  pressed: boolean
  button: 'left' | 'right'
  newlyPressed: boolean
}

/** Drag-scoped interaction state that persists across frames. */
export interface Interaction {
  isErasing: boolean
  lastCell: string
}

export const createInteraction = (): Interaction => ({ isErasing: false, lastCell: '' })

export interface PointerSource {
  read(): Pointer
  /** Clear the per-press 'newlyPressed' edge; call once per frame after use. */
  afterFrame(): void
}

// A genuine two-finger touch lands with real, human-scale stagger between
// fingers — tens of ms, not one animation frame — so committing a touch's
// paint immediately on pointerdown draws a real stroke with the first finger
// before the second is ever seen. Holding off this long is enough to see the
// second finger in the near-simultaneous case a scroll/zoom gesture produces,
// while staying well under normal tap-and-release timing.
const TOUCH_HOLD_MS = 60

export function createPointer(canvas: HTMLCanvasElement, signal: AbortSignal): PointerSource {
  const state: Pointer = { x: 0, y: 0, pressed: false, button: 'left', newlyPressed: false }
  const opts = { signal }
  // Pointer events unify mouse and touch. touch-action: pinch-zoom blocks
  // single-finger pan (so a drag arrives as pointermove and paints instead of
  // scrolling the page) while still letting the browser handle two-finger
  // pinch natively as a real OS-level viewport zoom. But a two-finger pan
  // (fingers moving together, not apart) isn't recognized as a pinch, so the
  // browser doesn't take it over — both touches arrive here as ordinary
  // pointer events and would otherwise paint. `activePointers` tracks
  // concurrent touches so a second one cancels the paint instead.
  canvas.style.touchAction = 'pinch-zoom'
  const activePointers = new Set<number>()

  // A touch pointerdown doesn't commit to painting immediately — see
  // TOUCH_HOLD_MS — so there's a window where we know a finger is down but
  // haven't started painting yet. `pendingId` is that finger's pointerId.
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingId: number | null = null
  let pendingButton: Pointer['button'] = 'left'

  const clearPending = (): void => {
    if (pendingTimer !== null) clearTimeout(pendingTimer)
    pendingTimer = null
    pendingId = null
  }

  const commit = (id: number, button: Pointer['button']): void => {
    state.pressed = true
    state.button = button
    state.newlyPressed = true
    canvas.setPointerCapture(id)
  }

  canvas.addEventListener('pointermove', (e) => {
    if (activePointers.size > 1) return
    state.x = e.clientX
    state.y = e.clientY
  }, opts)
  canvas.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId)
    if (activePointers.size > 1) {
      // Second finger down mid-gesture: this is a pan/zoom, not a paint —
      // drop whatever the first finger started (or was about to).
      clearPending()
      state.pressed = false
      return
    }
    // Touch has no hover: the press itself must establish the position.
    state.x = e.clientX
    state.y = e.clientY
    const button = e.button === 2 ? 'right' : 'left'
    if (e.pointerType !== 'touch') {
      commit(e.pointerId, button)
      return
    }
    pendingId = e.pointerId
    pendingButton = button
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      // Must clear before commit: pendingId still set is what tells
      // pointerup "this one never committed, flush it as a tap" — leaving it
      // set here made a real pointerup arriving after this timer re-commit
      // (and re-trigger newlyPressed) at the release position.
      pendingId = null
      if (activePointers.size === 1 && activePointers.has(e.pointerId)) commit(e.pointerId, pendingButton)
    }, TOUCH_HOLD_MS)
  }, opts)
  canvas.addEventListener('pointerup', (e) => {
    activePointers.delete(e.pointerId)
    if (pendingId === e.pointerId) {
      // Lifted before the hold elapsed with no second finger ever showing up
      // — a real, deliberate tap, quicker than TOUCH_HOLD_MS. Commit so it
      // still paints, but let it read as pressed for one frame before
      // releasing rather than flipping pressed true-then-false within this
      // same synchronous handler, which the game loop (driven by
      // requestAnimationFrame) would never observe.
      clearPending()
      commit(e.pointerId, pendingButton)
      requestAnimationFrame(() => { state.pressed = false })
      return
    }
    state.pressed = false
  }, opts)
  canvas.addEventListener('pointercancel', (e) => {
    activePointers.delete(e.pointerId)
    if (pendingId === e.pointerId) clearPending()
    state.pressed = false
  }, opts)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault(), opts)

  return {
    read: () => state,
    afterFrame: () => { state.newlyPressed = false },
  }
}

/**
 * Apply a paint / mark / edit action at `pos`. Mutates `level` + `it`.
 * Caller guarantees the puzzle isn't complete, the pointer is pressed, and
 * `pos` is inside the grid. Returns a sound for the caller to play.
 */
export function applyPointer(
  level: Level,
  mode: GameMode,
  activeColorIndex: number,
  pointer: Pointer,
  pos: GridPos,
  it: Interaction,
): Sound | null {
  const { x, y } = pos

  if (mode === 'play') {
    if (pointer.button === 'right') {
      if (pointer.newlyPressed) it.isErasing = level.mark.getAt(x, y) === '1'
      const newMark = it.isErasing ? '0' : '1'
      level.mark.setAt(x, y, newMark)
      // Marked-empty and painted are mutually exclusive — a cell can't be both.
      if (newMark === '1') level.paint.setAt(x, y, '0')
      return null
    }
    if (pointer.newlyPressed) it.isErasing = level.paint.getAt(x, y) === String(activeColorIndex)
    const prev = level.paint.getAt(x, y)
    if (!it.isErasing && !+level.mark.getAt(x, y)) {
      const newVal = String(activeColorIndex)
      level.paint.setAt(x, y, newVal)
      if (prev === '0') return level.grid.getAt(x, y) === newVal ? 'bing' : 'boom'
    } else if (it.isErasing) {
      level.paint.setAt(x, y, '0')
    }
    return null
  }

  // edit mode: paint the solution grid
  if (pointer.newlyPressed) it.isErasing = level.grid.getAt(x, y) === String(activeColorIndex)
  const newVal = it.isErasing ? '0' : String(activeColorIndex)
  const curCell = `${x},${y}`
  if (level.grid.getAt(x, y) !== newVal) {
    level.grid.setAt(x, y, newVal)
    if (it.lastCell !== curCell || pointer.newlyPressed) return 'bing'
  }
  return null
}
