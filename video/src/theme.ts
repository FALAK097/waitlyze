/**
 * Waitlyze Launch Film — Authentic Design Tokens
 * Mapped directly from src/app/globals.css & src/components/landing/wordmark.jsx
 */
export const WL = {
  // Stage grounds
  stageWarm: "#F4F3EE", // Act 1 subtle editorial paper tension
  stageDark: "#0D1512", // Rewind / contrast beat (Waitlyze deep forest charcoal)
  stageClean: "#F5F6F3", // Act 2-5 crisp alabaster studio ground

  // Product surfaces
  white: "#FFFFFF",
  surface: "#FFFFFF",
  inset: "#F2F3F4", // --product-neutral-100
  subtleBg: "#F8F9F8", // --product-neutral-50

  // Borders
  border: "#E4E6E7", // --product-neutral-200
  borderControl: "#D4D7D9", // --product-border-control
  borderDark: "rgba(255, 255, 255, 0.12)",

  // Inks (Waitlyze forest-black + cool neutrals)
  ink: "#00160D", // --product-ink
  textSecondary: "#4F5356", // --product-neutral-600
  textMuted: "#6E7377", // --product-neutral-500
  textFaint: "#91969A", // --product-neutral-400

  // Brand accents (NEVER lime text on white; lime fill always uses WL.ink text)
  lime: "#C6FE1E", // --product-lime-400 (--color-waitlyze-mark)
  limeHover: "#B2DC18", // --product-lime-500
  limeSoft: "#F2FCD4", // subtle lime wash
  forest: "#196640", // --product-green-700 (--product-success-text & wordmark dot)
  forestSoft: "#E8F7EF", // --product-success-bg

  // Semantic status tokens
  warning: "#814A0E", // --product-warning-text
  warningBg: "#FEF5E0", // --product-warning-bg
  danger: "#99192E", // --product-danger-text
  dangerBg: "#FDECEF", // --product-danger-bg
  dangerSolid: "#E5394D", // --destructive

  // Typography
  fontDisplay: "var(--wl-font-display), 'Manrope Local', system-ui, sans-serif",
  fontSans: "var(--wl-font-sans), 'Hanken Local', system-ui, sans-serif",
  fontMono: "'Paper Mono', ui-monospace, 'SFMono-Regular', monospace",

  // Elevation shadows (Stageshow depth hierarchy)
  shadowHero:
    "0 1px 2px rgba(0, 22, 13, 0.05), 0 12px 32px rgba(0, 22, 13, 0.07), 0 36px 80px rgba(0, 22, 13, 0.09)",
  shadowSatellite:
    "0 1px 2px rgba(0, 22, 13, 0.08), 0 10px 28px rgba(0, 22, 13, 0.12)",
  shadowCard:
    "0 1px 2px rgba(0, 22, 13, 0.05), 0 8px 24px rgba(0, 22, 13, 0.06)",
  shadowFloat:
    "0 4px 12px rgba(0, 22, 13, 0.08), 0 20px 44px rgba(0, 22, 13, 0.14)",

  // Radii
  radiusWindow: 18,
  radiusCard: 14,
  radiusControl: 10,
  radiusSm: 8,
  radiusPill: 999,
} as const;
