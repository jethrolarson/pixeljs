import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const layout = style({ display: 'flex', gap: 32, alignItems: 'flex-start' })
export const form = style({ flex: 1, maxWidth: 480 })
export const previewCol = style({ width: 200 })

export const formGroup = style({ marginBottom: 16 })

export const label = style({
  display: "block",
  color: colors.text,

  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export const input = style({ width: '100%' })

export const textarea = style({ width: '100%', minHeight: 80, resize: 'vertical' })

export const levelResults = style({
  border: `4px solid ${colors.border}`,
  borderRadius: 0,
  maxHeight: 200,
  overflowY: "auto",
});

export const levelResult = style({
  padding: "8px 12px",
  cursor: "pointer",
  color: colors.text,

  display: "flex",
  justifyContent: "space-between",
});

export const packLevels = style({
  listStyle: 'none',
  padding: 0,
  margin: '0 0 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const packLevelItem = style({
  background: colors.panel,
  border: `4px solid ${colors.border}`,
  padding: "6px 10px",
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const dragHandle = style({
  cursor: "grab",
  color: colors.textFaint,
});

export const levTitle = style({ flex: 1, color: colors.text, fontSize: 20 });

export const addLabel = style({ color: colors.textFaint })

export const editBtn = style({
  background: colors.accent,
  border: `0`,
  color: "#000",
  cursor: "pointer",
  fontSize: 16,
  padding: "2px 8px",
  ":hover": { borderColor: colors.accent, color: colors.accent },
});

export const removeBtn = style({
  background: "none",
  border: "none",
  color: colors.textFaint,
  cursor: "pointer",

  padding: "0 4px",
  ":hover": { color: colors.danger },
});

export const formActions = style({ display: 'flex', gap: 8, marginTop: 24, alignItems: 'center' })

export const previewLabel = style({
  color: colors.text,

  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
});

export const publishRow = style({ display: 'flex', alignItems: 'center', gap: 10 })

export const publishLabel = style({
  textTransform: "none",

  color: colors.text,
  margin: 0,
  cursor: "pointer",
});

export const status = style({ color: colors.textDim });

export const heading = style({
  color: colors.text,

  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "0 0 10px",
});

export const hint = style({
  color: colors.textDim,
  marginLeft: 8,
});

export const emptyLevels = style({
  color: colors.textFaint,
  fontStyle: "italic",

  padding: "4px 0",
});
