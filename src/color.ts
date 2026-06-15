export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRGB(hex: string): RGB {
  return {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16),
  }
}

export function rgbToCSS(rgb: RGB, alpha = 1): string {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

// Returns perceived brightness 0–100
export function brightness(rgb: RGB): number {
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 / 2.55
}
