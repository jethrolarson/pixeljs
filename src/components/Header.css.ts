import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const title = style({
  margin: 0,
  fontSize: 20,
  color: colors.textBright,
})

export const actions = style({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
})

export const hidden = style({
  display: 'none',
})

export const tab = style({
  padding: '5px 14px',
  color: colors.textDim,
  textDecoration: 'none',
  borderRadius: 4,
  fontSize: 14,
  ':hover': { color: colors.textBright, background: colors.panelHover },
})

export const tabActive = style({
  color: colors.textBright,
  background: colors.panel,
})
