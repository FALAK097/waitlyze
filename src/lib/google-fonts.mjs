export const LEGACY_FONT_FAMILIES = {
  hanken: "Hanken Grotesk",
  manrope: "Manrope",
  bricolage: "Bricolage Grotesque",
  figtree: "Figtree",
  archivo: "Archivo",
};

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
