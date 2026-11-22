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

// Both halves must be present: a matching site key with no secret would pass
// the publish gate and then fail every signup verification at runtime.
export function isTurnstileConfigured() {
  return getTurnstileSiteKey() !== "" && (process.env.TURNSTILE_SECRET_KEY ?? "").trim() !== "";
}

function canonicalAllowedHostnames(extraHostnames = []) {
  const allowed = new Set();
  const baseUrl = (process.env.BETTER_AUTH_URL ?? "").trim();
  if (baseUrl) {
    try {
      allowed.add(new URL(baseUrl).hostname.toLowerCase());
    } catch {
      // Ignore malformed BETTER_AUTH_URL
    }
  }
  const appRoot = (process.env.APP_ROOT_DOMAIN ?? "").trim().toLowerCase();
  if (appRoot) allowed.add(appRoot);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("localhost");
    allowed.add("127.0.0.1");
  }
  for (const host of extraHostnames) {
    if (typeof host === "string" && host.trim()) allowed.add(host.trim().toLowerCase());
  }
  return allowed;
}

export async function verifyTurnstileToken(
  token,
  { ip, expectedAction = "signup", allowedHostnames = [] } = {},
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new TurnstileMisconfiguredError();
  if (typeof token !== "string" || !token || token.length > 2048) return false;
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
  if (data?.success !== true) return false;
  if (expectedAction && data.action !== expectedAction) return false;
  const allowed = canonicalAllowedHostnames(allowedHostnames);
  if (allowed.size > 0 && typeof data.hostname === "string" && data.hostname) {
    const tokenHost = data.hostname.toLowerCase();
    const matchesAllowed =
      allowed.has(tokenHost) || [...allowed].some((host) => tokenHost.endsWith(`.${host}`));
    if (!matchesAllowed) return false;
  }
  return true;
}
