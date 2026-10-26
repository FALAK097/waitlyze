import { seedPreviewVars } from "./variables.mjs";

// Client-side seed interpolation for editor previews. Mirrors the
// server-side fallback rules with fixed sample data (Ada, #42…).
export function applySeedVars(html, waitlistName) {
  const vars = seedPreviewVars(waitlistName);
  return String(html || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, name) => {
    const key = String(name).toLowerCase();
    return Object.hasOwn(vars, key) ? String(vars[key] ?? "") : match;
  });
}
