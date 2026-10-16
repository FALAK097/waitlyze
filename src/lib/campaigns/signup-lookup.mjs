import { emailLookupForms, normalizeSignupEmail } from "../normalize-email.mjs";

const GMAIL_DOMAINS = ["gmail.com", "googlemail.com"];

// Finds a signup by any stored email form, including legacy Gmail variants
// (dotted / plus-tagged rows) that predate canonical normalization. The
// indexed lookup covers current and legacy spellings; the Gmail probe below
// catches cross-variant rows (e.g. stored `j.ohn@gmail.com` vs requested
// `john+promo@gmail.com`, both canonically `john@gmail.com`).
export async function findSignupByEmail(db, waitListId, email, include) {
  const direct = await db.signUp.findFirst({
    where: { waitListId, emailNormalized: { in: emailLookupForms(email) } },
    include,
  });
  if (direct) return direct;
  const canonical = normalizeSignupEmail(email);
  const at = canonical.lastIndexOf("@");
  if (at <= 0 || !GMAIL_DOMAINS.includes(canonical.slice(at + 1))) return null;
  const local = canonical.slice(0, at);
  const rows = await db.$queryRaw`
    SELECT "id" FROM "sign_ups"
    WHERE "waitListId" = ${waitListId}
      AND split_part("emailNormalized", '@', 2) IN ('gmail.com', 'googlemail.com')
      AND translate(split_part(split_part("emailNormalized", '@', 1), '+', 1), '.', '') = ${local}
    LIMIT 1`;
  if (!rows.length) return null;
  return db.signUp.findUnique({ where: { id: rows[0].id }, include });
}
