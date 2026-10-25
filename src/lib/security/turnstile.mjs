// Cloudflare Turnstile server verification for the optional per-form bot
// protection. Only used when a waitlist enables requireTurnstile; the default
// path (toggle off) never touches this module.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileMisconfiguredError extends Error {
  constructor() {
    super("Turnstile is not configured on the server.");
    this.name = "TurnstileMisconfiguredError";
  }
}

// Public site key of the platform Turnstile widget, paired with
// TURNSTILE_SECRET_KEY in the Cloudflare dashboard. Founders must paste this
// exact key into their form: tokens minted by any other widget can never
// verify against our secret, so a mismatched key would break all signups.
export function getTurnstileSiteKey() {
  return (process.env.TURNSTILE_SITE_KEY ?? "").trim();
}

export async function verifyTurnstileToken(token, { ip } = {}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new TurnstileMisconfiguredError();
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (typeof ip === "string" && ip) body.set("remoteip", ip);
  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return false;
  const data = await response.json().catch(() => null);
  return data?.success === true;
}
