import { emailLookupForms } from "../normalize-email.mjs";

// Finds a signup by canonicalized emailNormalized using the unique/indexed column.
export async function findSignupByEmail(db, waitListId, email, include) {
  const forms = emailLookupForms(email);
  if (!forms.length) return null;
  return db.signUp.findFirst({
    where: { waitListId, emailNormalized: { in: forms } },
    include,
  });
}
