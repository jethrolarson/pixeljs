import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 16,
})

export const sectionTitle = style({
  fontSize: 16,
  color: colors.textBright,
  margin: 0,
})
