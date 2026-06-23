import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const sortBar = style({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 20,
  fontSize: 13,
  color: colors.textDim,
})

export const loadMoreWrap = style({ textAlign: 'center', marginTop: 24 })
