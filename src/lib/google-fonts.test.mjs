import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FALLBACK_FONTS,
  fontFamilyValue,
  googleFontsStylesheet,
  resolveFontFamily,
} from "./google-fonts.mjs";

test("keeps legacy font ids on their optimized local variables", () => {
  assert.equal(resolveFontFamily("bricolage"), "Bricolage Grotesque");
  assert.equal(fontFamilyValue("bricolage"), "var(--wl-bricolage)");
  assert.equal(googleFontsStylesheet(["bricolage", "figtree"]), null);
});

test("builds a deduplicated stylesheet for Google Font family names", () => {
  assert.equal(
    googleFontsStylesheet(["DM Sans", "Source Serif 4", "DM Sans"]),
    "https://fonts.googleapis.com/css2?family=DM+Sans&family=Source+Serif+4&display=swap",
  );
  assert.equal(fontFamilyValue('DM "Sans"'), '"DM Sans", ui-sans-serif, system-ui, sans-serif');
});

test("fallback catalog covers the picker without an API key", () => {
  assert.ok(FALLBACK_FONTS.length >= 40);
  const categories = new Set(FALLBACK_FONTS.map((font) => font.category));
  for (const category of ["sans-serif", "serif", "display", "handwriting", "monospace"])
    assert.ok(categories.has(category), `missing ${category}`);
  const families = new Set(FALLBACK_FONTS.map((font) => font.family));
  for (const family of [
    "Baloo 2",
    "Fraunces",
    "DM Serif Display",
    "Space Grotesk",
    "IBM Plex Mono",
    "Inter",
  ])
    assert.ok(families.has(family), `missing template font ${family}`);
});
