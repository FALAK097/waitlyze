import { templateSnapshotSchema } from "../templates/catalog.mjs";

const HEX = /^#[0-9a-f]{6}$/i;
const FONT = /^[\w -]{1,80}$/;

const safeHex = (value) =>
  typeof value === "string" && HEX.test(value.trim()) ? value.trim() : "";
const safeFont = (value) =>
  typeof value === "string" && FONT.test(value.trim()) ? value.trim() : "";
// Email clients fetch remote images: only absolute TLS URLs make sense here.
// Site-relative and inline data URLs are dropped.
const safeLogo = (value) =>
  typeof value === "string" && /^https:\/\//i.test(value.trim()) ? value.trim() : "";

/**
 * Brand chrome for founder→list emails, derived from the waitlist's stored
 * template snapshot. Returns null when no snapshot parses, so every caller
 * falls back to the neutral default styling. No migration: snapshot fields
 * only.
 */
export function emailBrandFromSnapshot(snapshot) {
  const parsed = templateSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const brand = parsed.data.brand;
  return {
    logo: safeLogo(brand.logo),
    linkColor: safeHex(brand.buttonColor),
    bodyFont: safeFont(brand.bodyFont),
  };
}

export function emailFontStack(font) {
  return font ? `'${font}',Arial,sans-serif` : "Arial,sans-serif";
}
