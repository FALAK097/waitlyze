export const LEGACY_FONT_FAMILIES = {
  hanken: "Hanken Grotesk",
  manrope: "Manrope",
  bricolage: "Bricolage Grotesque",
  figtree: "Figtree",
  archivo: "Archivo",
};

// Curated catalog used when no Google Fonts API key is configured, so the
// font picker keeps working out of the box. Shape matches the live API:
// [{ family, category }]. Loading the fonts themselves needs no key.
export const FALLBACK_FONTS = [
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "DM Sans", category: "sans-serif" },
  { family: "Plus Jakarta Sans", category: "sans-serif" },
  { family: "Hanken Grotesk", category: "sans-serif" },
  { family: "Manrope", category: "sans-serif" },
  { family: "Figtree", category: "sans-serif" },
  { family: "Archivo", category: "sans-serif" },
  { family: "Space Grotesk", category: "sans-serif" },
  { family: "Source Sans 3", category: "sans-serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "Source Serif 4", category: "serif" },
  { family: "DM Serif Display", category: "serif" },
  { family: "Fraunces", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "PT Serif", category: "serif" },
  { family: "Newsreader", category: "serif" },
  { family: "Bricolage Grotesque", category: "display" },
  { family: "Sora", category: "display" },
  { family: "Syne", category: "display" },
  { family: "Unbounded", category: "display" },
  { family: "Bebas Neue", category: "display" },
  { family: "Oswald", category: "display" },
  { family: "Anton", category: "display" },
  { family: "Baloo 2", category: "display" },
  { family: "Caveat", category: "handwriting" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Dancing Script", category: "handwriting" },
  { family: "Satisfy", category: "handwriting" },
  { family: "Shadows Into Light", category: "handwriting" },
  { family: "Kalam", category: "handwriting" },
  { family: "Permanent Marker", category: "handwriting" },
  { family: "IBM Plex Mono", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Space Mono", category: "monospace" },
  { family: "Roboto Mono", category: "monospace" },
];

const LEGACY_FONT_VARIABLES = {
  hanken: "var(--wl-body)",
  manrope: "var(--wl-display)",
  bricolage: "var(--wl-bricolage)",
  figtree: "var(--wl-figtree)",
  archivo: "var(--wl-archivo)",
};

const loadedFonts = new Set();

export function resolveFontFamily(value) {
  return LEGACY_FONT_FAMILIES[value] ?? value;
}

export function fontFamilyValue(value, fallback = "ui-sans-serif, system-ui, sans-serif") {
  if (LEGACY_FONT_VARIABLES[value]) return LEGACY_FONT_VARIABLES[value];
  const family = String(value || "")
    .replaceAll('"', "")
    .trim();
  return family ? `"${family}", ${fallback}` : fallback;
}

export function googleFontsStylesheet(values) {
  const families = [...new Set(values.filter((value) => value && !LEGACY_FONT_FAMILIES[value]))];
  if (!families.length) return null;
  const query = families
    .map((family) => `family=${encodeURIComponent(String(family).trim()).replaceAll("%20", "+")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

export function loadGoogleFont(value) {
  if (typeof document === "undefined") return;
  const family = resolveFontFamily(value);
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const href = googleFontsStylesheet([family]);
  if (!href) return;
  const link = document.createElement("link");
  link.href = href;
  link.rel = "stylesheet";
  link.dataset.waitlyzeFont = family;
  document.head.append(link);
}
