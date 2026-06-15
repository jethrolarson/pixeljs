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
