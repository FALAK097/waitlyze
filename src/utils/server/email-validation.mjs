// Server-side signup email checks: strict format + disposable-domain block.
// Runs before any DB work so junk never reaches the signup transaction.

// Practical subset of known disposable/throwaway providers. Curated, not
// exhaustive — the goal is stopping casual abuse, not winning an arms race.
const DISPOSABLE_DOMAINS = new Set(
  [
    "0815.ru",
    "0wnd.net",
    "10minutemail.com",
    "10minutemail.net",
    "20minutemail.com",
    "33mail.com",
    "anonaddy.com",
    "anonaddy.me",
    "byom.de",
    "cock.li",
    "dayrep.com",
    "dispostable.com",
    "dropmail.me",
    "duck.com",
    "emailondeck.com",
    "fakeinbox.com",
    "fakemailgenerator.com",
    "getairmail.com",
    "getnada.com",
    "gorillaswithdirtyarmpits.com",
    "guerrillamail.com",
    "guerrillamailblock.com",
    "harakirimail.com",
    "hide-my-mail.com",
    "hmamail.com",
    "incognitomail.org",
    "killmail.com",
    "lroid.com",
    "mailcatch.com",
    "maildrop.cc",
    "mailinator.com",
    "mailnesia.com",
    "mailsac.com",
    "mailslime.com",
    "mailticking.com",
    "mailtmp.net",
    "mintemail.com",
    "moakt.com",
    "mohmal.com",
    "mytemp.email",
    "mytrashmail.com",
    "no-spam.ws",
    "opayq.com",
    "privatdemail.net",
    "privaterelay.appleid.com",
    "proxymail.eu",
    "sharklasers.com",
    "shitmail.me",
    "spam4.me",
    "spamgourmet.com",
    "spamhole.com",
    "spaml.de",
    "temp-mail.io",
    "temp-mail.org",
    "tempmail.com",
    "tempmail.net",
    "tempmailo.com",
    "tempomail.fr",
    "trashmail.com",
    "trashmail.net",
    "trashmail.org",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
    "yopweb.com",
    "zoemail.net",
  ].map((domain) => domain.toLowerCase()),
);

// RFC-lite format check: local@domain.tld, no spaces, single @, real TLD.
const EMAIL_FORMAT = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function getEmailDomain(email) {
  const at = email.lastIndexOf("@");
  return at > 0 ? email.slice(at + 1).toLowerCase() : "";
}

export function isDisposableEmail(email) {
  const domain = getEmailDomain(email);
  if (!domain || !DISPOSABLE_DOMAINS.has(domain)) return false;
  return true;
}

// Returns an end-user-safe error message, or null when the email is fine.
export function validateSignupEmail(email) {
  if (typeof email !== "string") return "Enter a valid email address.";
  const value = email.trim();
  if (!value || value.length > 320 || !EMAIL_FORMAT.test(value)) {
    return "Enter a valid email address.";
  }
  if (isDisposableEmail(value)) {
    return "Temporary email addresses aren't allowed. Use your real email to hold your place in line.";
  }
  return null;
}
