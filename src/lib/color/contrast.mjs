// WCAG 2.1 contrast helpers for the brand kit colours a founder can edit.
// Only six-digit hex colours are supported, which is what the brand kit
// schema allows, so anything else is reported as unknown instead of guessed.

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export function parseHex(value) {
  if (typeof value !== "string") return null;
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;
  const packed = Number.parseInt(match[1], 16);
  return { r: (packed >> 16) & 255, g: (packed >> 8) & 255, b: packed & 255 };
}

export function relativeLuminance(color) {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const channel = (value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  if (first === null || second === null) return null;
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

// "AA" is the accessibility floor, "AAA" the enhanced level, "fail" below AA.
export function contrastGrade(ratio, { large = false } = {}) {
  if (ratio === null) return null;
  if (ratio >= (large ? 4.5 : 7)) return "AAA";
  if (ratio >= (large ? 3 : 4.5)) return "AA";
  return "fail";
}

// The two inks used as safe fallbacks: a near-black and a near-white.
export const INK_DARK = "#101418";
export const INK_LIGHT = "#ffffff";

// Returns whichever fallback reads better on the given background.
export function readableInk(background) {
  const dark = contrastRatio(INK_DARK, background);
  const light = contrastRatio(INK_LIGHT, background);
  if (dark === null || light === null) return null;
  return dark >= light ? INK_DARK : INK_LIGHT;
}

// Every foreground/background pair the rendered page actually puts together.
export const BRAND_CONTRAST_PAIRS = [
  {
    id: "text-on-page",
    label: "Body text on page",
    foreground: "textColor",
    background: "pageBackground",
  },
  {
    id: "text-on-surface",
    label: "Body text on card",
    foreground: "textColor",
    background: "surfaceColor",
  },
  {
    id: "muted-on-page",
    label: "Muted text on page",
    foreground: "mutedColor",
    background: "pageBackground",
  },
  {
    id: "button-label",
    label: "Button label",
    foreground: "buttonTextColor",
    background: "buttonColor",
  },
  {
    id: "input-text",
    label: "Input text",
    foreground: "inputTextColor",
    background: "inputBackground",
  },
];

export const CONTRAST_TARGET = 4.5;

// Reports every pair that falls below the WCAG AA threshold, with the safe
// fallback colour the founder can apply in one click.
export function brandContrastIssues(brand) {
  if (!brand) return [];
  return BRAND_CONTRAST_PAIRS.flatMap((pair) => {
    const foreground = brand[pair.foreground];
    const background = brand[pair.background];
    const ratio = contrastRatio(foreground, background);
    if (ratio === null || ratio >= CONTRAST_TARGET) return [];
    return [
      {
        id: pair.id,
        label: pair.label,
        foreground,
        background,
        ratio,
        required: CONTRAST_TARGET,
        grade: contrastGrade(ratio),
        // The background stays as the founder chose it; the foreground moves
        // to whichever fallback stays legible on it.
        fix: { key: pair.foreground, value: readableInk(background) },
      },
    ];
  });
}
