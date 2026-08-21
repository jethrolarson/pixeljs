// Terminal/ANSI chrome palette — mirrors `game/term/glyphs.ts` `chrome` so the
// DOM menu reads as part of the same character-grid surface.
export const term = {
  bg: "#0d0d0d",
  panel: "#121212",
  dim: "#4d4d4d",
  text: "#cccccc",
  name: "#00d9d9",
  green: "#59b200",
  accent: "#00d9d9",
} as const;

export const inputBase = {
  fontFamily: "inherit",
  background: term.bg,
  color: term.text,
  border: `4px solid ${term.dim}`,
  borderRadius: 0,
  padding: "3px 6px",
  selectors: {
    "&:focus-visible": { outline: "none", borderColor: term.accent },
  },
} as const;
