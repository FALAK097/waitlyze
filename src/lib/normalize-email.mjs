// Canonical email form used for waitlist signup dedupe and fraud checks.
// Gmail (and Googlemail) ignore dots and plus-tags — normalize them so
// john.doe+promo@gmail.com and johndoe@gmail.com map to one identity.
// Every other provider keeps trim + lowercase only.

export function normalizeSignupEmail(email) {
  const base = String(email ?? "").trim().toLowerCase();
  const at = base.lastIndexOf("@");
  if (at <= 0) return base;
  const domain = base.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const local = base.slice(0, at).split("+")[0].replaceAll(".", "");
    if (!local) return base;
    return `${local}@gmail.com`;
  }
  return base;
}

export function legacyLowerEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

// All stored forms an address may have: rows written before canonical
// normalization only match the legacy lowercase form, so lookups must check
// both until a backfill unifies them.
export function emailLookupForms(email) {
  const canonical = normalizeSignupEmail(email);
  const legacy = legacyLowerEmail(email);
  return canonical === legacy ? [canonical] : [canonical, legacy];
}
