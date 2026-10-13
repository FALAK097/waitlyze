// Curated page themes for waitlist pages. Presets pair a background with a
// readable text color so every combination has contrast. Accents and fonts are
// independent choices. This module is dependency-free so client components can
// import it for live previews.

export const THEME_PRESETS = {
  light: { name: "Light", bg: "#ffffff", text: "#101613", muted: "#5b625f", card: "#ffffff", border: "#e7eae4" },
  dark: { name: "Dark", bg: "#0c1210", text: "#f2f6f2", muted: "#a4ada7", card: "#141c18", border: "#26302b" },
  sand: { name: "Sand", bg: "#f6f3ea", text: "#1d1a12", muted: "#6f675a", card: "#fffdf7", border: "#e4ddcb" },
  mist: { name: "Mist", bg: "#e9efe7", text: "#14201a", muted: "#5d6c61", card: "#f7faf6", border: "#d3dcd1" },
};

export const THEME_ACCENTS = {
  lime: { name: "Lime", solid: "#c6fe1e", hover: "#aede12", text: "#00160d" },
  coral: { name: "Coral", solid: "#ff6b4a", hover: "#e4572f", text: "#ffffff" },
  sky: { name: "Sky", solid: "#2e7cf6", hover: "#1f66d8", text: "#ffffff" },
  violet: { name: "Violet", solid: "#7c5cfc", hover: "#6443e8", text: "#ffffff" },
};

export const THEME_FONTS = {
  sans: { name: "Modern", stack: "var(--product-font-sans), system-ui, sans-serif" },
  serif: { name: "Editorial", stack: "Georgia, 'Times New Roman', serif" },
  mono: { name: "Mono", stack: "var(--product-font-mono), ui-monospace, monospace" },
};

export const THEME_PRESET_IDS = Object.keys(THEME_PRESETS);
export const THEME_ACCENT_IDS = Object.keys(THEME_ACCENTS);
export const THEME_FONT_IDS = Object.keys(THEME_FONTS);

const DEFAULT_THEME = { preset: "light", accent: "lime", font: "sans" };

// Accepts the current theme shape and the legacy shape stored before themes
// were editable ({ surface, text, action, font }), so old snapshots keep rendering.
export function normalizeTheme(theme) {
  if (theme && typeof theme === "object") {
    if (typeof theme.preset === "string") {
      return {
        preset: THEME_PRESET_IDS.includes(theme.preset) ? theme.preset : DEFAULT_THEME.preset,
        accent: THEME_ACCENT_IDS.includes(theme.accent) ? theme.accent : DEFAULT_THEME.accent,
        font: THEME_FONT_IDS.includes(theme.font) ? theme.font : DEFAULT_THEME.font,
      };
    }
    if (typeof theme.surface === "string") {
      return {
        preset: theme.surface === "ink" ? "dark" : DEFAULT_THEME.preset,
        accent: THEME_ACCENT_IDS.includes(theme.action) ? theme.action : DEFAULT_THEME.accent,
        font: DEFAULT_THEME.font,
      };
    }
  }
  return { ...DEFAULT_THEME };
}

