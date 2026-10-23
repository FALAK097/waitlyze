import assert from "node:assert/strict";
import { test } from "node:test";

import { listTemplates, snapshotTemplate, templateSnapshotSchema } from "./catalog.mjs";

test("leaves every v2 starter snapshot unchanged", () => {
  for (const { snapshot } of listTemplates()) {
    assert.deepEqual(templateSnapshotSchema.parse(snapshot), snapshot);
  }
});

test("rejects excessive blocks and edits that remove the last visible signup form", () => {
  const snapshot = snapshotTemplate("simple");
  snapshot.sections[0].showForm = false;
  const parsed = templateSnapshotSchema.safeParse(snapshot);
  assert.equal(parsed.success, false);
  assert.ok(
    parsed.error.issues.some(
      (issue) => issue.message === "Add a visible signup form before publishing.",
    ),
  );
  snapshot.sections[0].showForm = true;
  snapshot.sections = Array.from({ length: 25 }, (_, index) => ({
    ...snapshot.sections[0],
    id: `hero-${index}`,
  }));
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, false);
});

test("brand type size accepts pixels and migrates legacy presets", () => {
  const snapshot = snapshotTemplate("simple");
  assert.equal(snapshot.brand.headingSize, 48);
  assert.equal(snapshot.brand.bodySize, 16);
  snapshot.brand.headingSize = 64;
  snapshot.brand.bodySize = 18;
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, true);
  snapshot.brand.headingSize = "large";
  const migrated = templateSnapshotSchema.safeParse(snapshot);
  assert.equal(migrated.success, true);
  assert.equal(migrated.data.brand.headingSize, 60);
  snapshot.brand.headingSize = "gigantic";
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, false);
});

test("status page supports icon style and card layout", () => {
  const { statusPage } = snapshotTemplate("blank");
  assert.equal(statusPage.iconStyle, "filled");
  assert.equal(statusPage.layout, "centered");
  const snapshot = snapshotTemplate("blank");
  snapshot.statusPage.iconStyle = "soft";
  snapshot.statusPage.layout = "card";
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, true);
});

test("starter status pages offer all share channels", () => {
  const { statusPage } = snapshotTemplate("simple");
  assert.deepEqual(statusPage.shareChannels, ["x", "instagram", "linkedin", "whatsapp", "email"]);
  assert.ok(
    templateSnapshotSchema.safeParse(snapshotTemplate("event")).success,
    "templates with all channels still validate",
  );
});

test("logos accept names, images, or a mix", () => {
  const snapshot = snapshotTemplate("saas");
  const section = snapshot.sections.find((item) => item.type === "logos");
  section.items = [
    "Acme",
    { label: "Lumen", imageUrl: "" },
    { label: "Hexlab", imageUrl: "https://example.com/hexlab.svg" },
  ];
  assert.equal(templateSnapshotSchema.safeParse(snapshot).success, true);
});

test("accepts persisted Google Font family names", () => {
  const snapshot = snapshotTemplate("simple");
  snapshot.brand.headingFont = "DM Sans";
  snapshot.brand.bodyFont = "Source Serif 4";
  const parsed = templateSnapshotSchema.parse(snapshot);
  assert.equal(parsed.brand.headingFont, "DM Sans");
  assert.equal(parsed.brand.bodyFont, "Source Serif 4");
});

test("templates look different from each other", () => {
  const templates = listTemplates();
  assert.ok(templates.length >= 14);

  const accents = new Set(templates.map(({ snapshot }) => snapshot.brand.accentColor));
  assert.ok(accents.size >= 12, `expected distinct accents, got ${accents.size}`);

  const heroVariants = new Set(
    templates.flatMap(({ snapshot }) =>
      snapshot.sections.filter((s) => s.type === "hero").map((s) => s.variant),
    ),
  );
  assert.ok(heroVariants.has("centered"), "expected a centered hero");
  assert.ok(heroVariants.has("split"), "expected a split hero");

  const mediaVariants = new Set(
    templates.flatMap(({ snapshot }) =>
      snapshot.sections.filter((s) => s.type === "media").map((s) => s.variant),
    ),
  );
  for (const variant of ["browser", "phone", "wide"])
    assert.ok(mediaVariants.has(variant), `expected a ${variant} media block`);

  const seen = new Set();
  for (const { snapshot } of templates)
    for (const section of snapshot.sections) seen.add(`${section.type}:${section.variant}`);
  for (const key of [
    "navigation:default",
    "logos:default",
    "cta:default",
    "referralRewards:default",
    "signupCount:default",
    "features:list",
    "steps:timeline",
    "testimonials:editorial",
    "form:card",
  ])
    assert.ok(seen.has(key), `expected a ${key} block`);

  const benefitHeadings = new Set(
    templates.flatMap(({ snapshot }) =>
      snapshot.sections.filter((s) => s.type === "features").map((s) => s.heading),
    ),
  );
  const benefitCount = templates.flatMap(({ snapshot }) =>
    snapshot.sections.filter((s) => s.type === "features"),
  ).length;
  assert.equal(benefitHeadings.size, benefitCount, "benefit blocks should not share copy");

  const heroHeadings = new Set(
    templates.flatMap(({ snapshot }) =>
      snapshot.sections.filter((s) => s.type === "hero").map((s) => s.heading),
    ),
  );
  assert.equal(heroHeadings.size, templates.length, "hero headlines should be unique");
});
