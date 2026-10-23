import assert from "node:assert/strict";
import { test } from "node:test";

import { fontFamilyValue, googleFontsStylesheet, resolveFontFamily } from "./google-fonts.mjs";

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
