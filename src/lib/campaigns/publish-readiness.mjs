// Readiness and change summaries for the Builder's publish flow. Blockers stop
// a publish; warnings are shown but never block, so a founder can ship a page
// that is good enough without pretending it is perfect.

import { brandContrastIssues } from "../color/contrast.mjs";
import { findUnchangedStarterCopy } from "../templates/starter-copy.mjs";

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;

export const sameContent = (left, right) =>
  JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

const visibleSignupForms = (snapshot) =>
  snapshot.sections.filter(
    (section) =>
      section.visible && (section.type === "form" || (section.type === "hero" && section.showForm)),
  ).length;

const referralContent = (snapshot) => {
  const rewards = snapshot.sections.some(
    (section) => section.visible && section.type === "referralRewards",
  );
  const status = snapshot.statusPage;
  return (
    rewards ||
    status.showReferralLink ||
    status.showReferralCount ||
    status.shareChannels.length > 0
  );
};

/**
 * Collects the reasons a publish is blocked or worth a second look.
 *
 * @param {object} snapshot draft experience document
 * @param {{ publishedSnapshot?: object|null, showReferrals?: boolean, turnstileConfigured?: boolean }} options
 */
export function assessPublishReadiness(snapshot, options = {}) {
  const { publishedSnapshot = null, showReferrals = true, turnstileConfigured = false } = options;
  const blockers = [];
  const warnings = [];

  if (!snapshot) {
    return {
      blockers: [
        {
          id: "no-snapshot",
          title: "This page has no content yet",
          detail: "Add a block before publishing.",
          fix: { surface: "page", label: "Open the page" },
        },
      ],
      warnings,
    };
  }

  if (visibleSignupForms(snapshot) === 0)
    blockers.push({
      id: "no-signup-form",
      title: "No visible signup form",
      detail: "Add a signup block, or turn the form back on inside the hero.",
      fix: { surface: "page", panel: "blocks", label: "Add a signup block" },
    });

  if (snapshot.form?.requireTurnstile && !turnstileConfigured)
    blockers.push({
      id: "turnstile-not-configured",
      title: "Turnstile needs configuration",
      detail: "Set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY for this deployment.",
      fix: { surface: "publish", label: "Review publish settings" },
    });

  const starterCopy = findUnchangedStarterCopy(snapshot);
  if (starterCopy.length > 0)
    warnings.push({
      id: "starter-copy",
      title: `Starter copy remains in ${starterCopy.length} ${
        starterCopy.length === 1 ? "place" : "places"
      }`,
      detail: `Still unchanged: ${starterCopy.map((field) => field.label).join(", ")}.`,
      fix: { surface: "page", label: "Review the copy" },
    });

  const emptyCopy = snapshot.sections.flatMap((section) => {
    if (!section.visible) return [];
    const name = section.type
      .replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`)
      .replace(/^./, (char) => char.toUpperCase());
    return ["heading", "body"]
      .filter((field) => typeof section[field] === "string" && !section[field].trim())
      .map((field) => `${name} ${field === "heading" ? "headline" : "description"}`);
  });
  if (emptyCopy.length > 0)
    warnings.push({
      id: "empty-copy",
      title: `${emptyCopy.length} empty ${emptyCopy.length === 1 ? "field" : "fields"} in visible blocks`,
      detail: `Nothing to read yet: ${emptyCopy.join(", ")}.`,
      fix: { surface: "page", label: "Review the copy" },
    });

  const hidden = snapshot.sections.filter((section) => !section.visible);
  if (hidden.length > 0)
    warnings.push({
      id: "hidden-blocks",
      title: `${hidden.length} ${hidden.length === 1 ? "block is" : "blocks are"} hidden`,
      detail: "Hidden blocks stay out of the published page.",
      fix: { surface: "page", panel: "blocks", label: "Show or remove them" },
    });

  const contrast = brandContrastIssues(snapshot.brand);
  for (const issue of contrast)
    warnings.push({
      id: `contrast-${issue.id}`,
      title: `${issue.label} is hard to read`,
      detail: `Contrast is ${issue.ratio.toFixed(2)}:1, below the ${issue.required}:1 minimum.`,
      fix: { surface: "design", label: "Fix the colours" },
    });

  if (!snapshot.seo.title.trim())
    warnings.push({
      id: "seo-title",
      title: "No page title",
      detail: "Search results and social shares fall back to the waitlist name.",
      fix: { surface: "seo", label: "Add a title" },
    });

  if (!snapshot.seo.description.trim())
    warnings.push({
      id: "seo-description",
      title: "No page description",
      detail: "A short sentence helps people decide to join from a link.",
      fix: { surface: "seo", label: "Add a description" },
    });

  if (!snapshot.seo.image.trim())
    warnings.push({
      id: "seo-image",
      title: "No share image",
      detail: "Links shared on social platforms show a plain preview.",
      fix: { surface: "seo", label: "Add an image" },
    });

  if (!showReferrals && referralContent(snapshot))
    warnings.push({
      id: "referrals-off",
      title: "Referral content is on but referrals are off",
      detail:
        "The page mentions referrals while referral sharing is disabled in settings, so the loop never starts.",
      fix: { surface: "referrals", label: "Open referral settings" },
    });

  if (snapshot.statusPage.showReferralLink && snapshot.statusPage.shareChannels.length === 0)
    warnings.push({
      id: "no-share-channels",
      title: "No share channels are selected",
      detail: "Visitors get a referral link but no way to share it.",
      fix: { surface: "status", label: "Pick share channels" },
    });

  if (publishedSnapshot && visibleSignupForms(publishedSnapshot) === 0)
    warnings.push({
      id: "published-without-form",
      title: "The published page has no signup form",
      detail: "Publishing replaces the live page with this draft.",
      fix: { surface: "page", panel: "blocks", label: "Add a signup block" },
    });

  return { blockers, warnings };
}

/**
 * Describes what publishing this draft would change, compared with the
 * revision that is live right now.
 */
export function summarizeChanges(draft, published) {
  if (!draft || !published) return null;
  const draftSections = new Map(draft.sections.map((section) => [section.id, section]));
  const publishedSections = new Map(published.sections.map((section) => [section.id, section]));
  const added = draft.sections.filter((section) => !publishedSections.has(section.id)).length;
  const removed = published.sections.filter((section) => !draftSections.has(section.id)).length;
  const edited = draft.sections.filter((section) => {
    const before = publishedSections.get(section.id);
    return before && !sameContent(before, section);
  }).length;
  const brandChanged = !sameContent(draft.brand, published.brand);
  const formChanged = !sameContent(draft.form, published.form);
  const statusChanged = !sameContent(draft.statusPage, published.statusPage);
  const seoChanged = !sameContent(draft.seo, published.seo);
  const templateChanged = draft.templateId !== published.templateId;
  const total = added + removed + edited;
  const changed = total > 0 || brandChanged || formChanged || statusChanged || seoChanged;
  return {
    added,
    removed,
    edited,
    brandChanged,
    formChanged,
    statusChanged,
    seoChanged,
    templateChanged,
    total,
    changed,
  };
}
