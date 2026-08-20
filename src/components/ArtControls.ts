import { Component, h, hx } from '@fun-land/fun-web'
import { ArtAuthoring } from '../game/artAuthoring'
import { termBtn, field } from '../Views/canvasPage.css'

export interface ArtControlsProps {
  art: ArtAuthoring
  /** Called after target/scale changes that affect what's on screen — Edit remounts the game loop. */
  onChange: () => void
}

/**
 * Solved-art authoring controls: target toggle + scale, always available —
 * there's no separate on/off switch. A level ends up with no solved art
 * simply by leaving the art grid blank (see `ArtAuthoring.toSaveData`).
 */
export const ArtControls: Component<ArtControlsProps> = (signal, { art, onChange }) => {
  const targetBtn = hx(
    'button',
    { signal, props: { type: 'button', className: termBtn }, on: { click: () => { art.target = art.target === 'puzzle' ? 'art' : 'puzzle'; update(); onChange() } } },
    ['Edit: Puzzle'],
  )
  const scaleBtn = hx(
    'button',
    { signal, props: { type: 'button', className: termBtn }, on: { click: () => { art.setScale((art.scale % 4) + 1); update(); if (art.target === 'art') onChange() } } },
    ['Art 1×'],
  )

  const update = (): void => {
    targetBtn.textContent = `Edit: ${art.target === 'art' ? 'Art' : 'Puzzle'}`
    scaleBtn.textContent = `Art ${art.scale}×`
    // Scale only matters once you're looking at the art grid — hide it while
    // editing the puzzle so it doesn't read as a puzzle setting.
    scaleBtn.style.display = art.target === 'art' ? '' : 'none'
  }
  update()

  return h('div', { className: field }, [targetBtn, scaleBtn])
}
