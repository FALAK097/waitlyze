import { emailLookupForms, normalizeSignupEmail } from "../normalize-email.mjs";

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

// Finds a signup by any stored email form, including legacy Gmail variants
// (dotted / plus-tagged rows) that predate canonical normalization.
export async function findSignupByEmail(db, waitListId, email, include) {
  const direct = await db.signUp.findFirst({
    where: { waitListId, emailNormalized: { in: emailLookupForms(email) } },
    include,
  });
  if (direct) return direct;
  const canonical = normalizeSignupEmail(email);
  const at = canonical.lastIndexOf("@");
  if (at <= 0 || !GMAIL_DOMAINS.has(canonical.slice(at + 1))) return null;
  const candidates = await db.signUp.findMany({
    where: {
      waitListId,
      OR: [
        { emailNormalized: { endsWith: "@gmail.com" } },
        { emailNormalized: { endsWith: "@googlemail.com" } },
      ],
    },
    select: { id: true, emailNormalized: true },
  });
  const match = candidates.find(
    (row) => row.emailNormalized && normalizeSignupEmail(row.emailNormalized) === canonical,
  );
  if (!match) return null;
  return db.signUp.findUnique({ where: { id: match.id }, include });
}
