import { globalStyle, style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

// Canvas pages fill the viewport with no scroll.
globalStyle('html, body', { overflow: 'hidden', height: '100%', margin: 0 })
globalStyle('#root', { height: '100%' })

export const canvas = style({ display: 'block' })

export const menu = style({
  position: 'fixed',
  left: 0,
  top: 0,
  padding: '10px 5px',
  width: 140,
  background: 'rgba(0,0,0,0.5)',
  borderRadius: 4,
  color: '#eee',
})

export const backLink = style({
  display: 'block',
  color: colors.text,
  textDecoration: 'none',
  marginBottom: 8,
})

export const field = style({ padding: '4px 0' })
