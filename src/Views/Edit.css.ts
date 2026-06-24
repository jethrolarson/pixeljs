import { style } from '@vanilla-extract/css'
import { term, mono } from './canvasPage.css'

const inputBase = {
  fontFamily: mono,
  background: term.bg,
  color: term.text,
  border: `1px solid ${term.dim}`,
  borderRadius: 0,
  padding: '3px 6px',
  selectors: { '&:focus': { outline: 'none', borderColor: term.accent } },
} as const

export const titleInput = style({ ...inputBase, width: '100%' })

export const num = style({ ...inputBase, width: '4em' })

export const label = style({ fontFamily: mono, color: term.text, fontSize: 13 })

export const muteRow = style({ fontFamily: mono, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 })

export const signinMsg = style({ fontFamily: mono, fontSize: 11, color: term.dim })

export const testLink = style({ fontFamily: mono, marginLeft: 8, fontSize: 13, color: term.name })
