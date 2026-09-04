import { style } from '@vanilla-extract/css'
import { colors, scale } from '../theme.css'

export const layout = style({ maxWidth: 480 })

export const formGroup = style({ marginBottom: 16 })

export const label = style({
  display: 'block',
  color: colors.text,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

export const input = style({ width: '100%' })

export const formActions = style({
  display: 'flex',
  gap: 8,
  marginTop: 24,
  alignItems: 'center',
})

// Sign-out and Admin: account-level actions, held apart from the profile-edit
// controls above.
export const accountRow = style({
  display: 'flex',
  gap: 8,
  marginTop: 32,
  paddingTop: 16,
  borderTop: `${scale.borderWidth} solid ${colors.border}`,
})

export const status = style({ color: colors.textDim })

export const iconTrigger = style({
  background: 'none',
  border: `${scale.borderWidth} solid ${colors.borderInput}`,
  padding: 4,
  cursor: 'pointer',
  lineHeight: 0,
  ':hover': { borderColor: colors.link },
})

// Opaque full-screen swap, matching PackEdit's icon modal: the small canvas
// needs the whole viewport so drawing doesn't fight page scroll for touch.
export const iconModal = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: colors.bg,
  display: 'flex',
  flexDirection: 'column',
  padding: 12,
})

export const iconModalHidden = style({ display: 'none' })

export const iconModalHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
  flex: '0 0 auto',
})

export const iconModalBody = style({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
})
