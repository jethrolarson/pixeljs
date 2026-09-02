import { PackIcon } from '../pack'

export const renderPixelIcon = (icon: PackIcon | null, sizePx: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  const x = icon?.x ?? 1
  const y = icon?.y ?? 1
  canvas.width = x
  canvas.height = y
  const scale = sizePx / Math.max(x, y)
  canvas.style.width = `${x * scale}px`
  canvas.style.height = `${y * scale}px`
  canvas.style.imageRendering = 'pixelated'
  if (!icon) return canvas

  const ctx = canvas.getContext('2d')!
  const game = icon.game
  for (let col = 0; col < x; col++) {
    for (let row = 0; row < y; row++) {
      const v = game[col * y + row] // column-major, matches Level.getGame()
      if (v && v !== '0') {
        const hex = icon.palette[parseInt(v, 10) - 1]
        if (hex) {
          ctx.fillStyle = hex
          ctx.fillRect(col, row, 1, 1)
        }
      }
    }
  }
  return canvas
}
