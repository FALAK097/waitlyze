// Fraud basics for the public signup path (Phase 4, stream B).
//
// Additive gates evaluated inside the signup transaction, after the duplicate
// check and before the insert. Verdicts:
//
//   allow  - proceed with the normal signup.
//   limit  - clear abuse (IP velocity over the hard cap): the caller must
//            answer 429. Fail-closed: bots churning one network get an
//            explicit rejection, not a silent pass.
//   silent - suspected farming (device fingerprint velocity): the caller must
//            return the normal success shape WITHOUT persisting anything -
//            no signup row, no points, no webhooks, no verification email.
//            Fake ids/codes are deterministic hashes of the request identity
//            so retries are consistent and reveal no validity oracle.
//
// Reliability contract: infra errors (DB hiccups) fail OPEN to `allow` so a
// wobbly database never blocks legitimate signups; only counted-over-limit
// abuse fails closed. Gmail dot/+ normalization lives in
// `normalize-email.mjs` (canonical form + lookup) - this module reuses it,
// never forks it.

import { createHash } from "node:crypto";

export const FRAUD_MODES = Object.freeze(["STANDARD", "STRICT"]);

const HOUR_MS = 60 * 60 * 1000;

// Signups per IP per trailing hour before the request is rejected with 429.
// STRICT is for launches under active attack; STANDARD stays generous.
const IP_VELOCITY = Object.freeze({
  STANDARD: { limit: 20, windowMs: HOUR_MS },
  STRICT: { limit: 8, windowMs: HOUR_MS },
});

// Signups per device fingerprint per trailing hour before the request goes
// silent. Fingerprints catch bots rotating IPs on one machine; the silent
// response (instead of 429) gives them no signal to tune against.
const FINGERPRINT_VELOCITY = Object.freeze({
  STANDARD: { limit: 10, windowMs: HOUR_MS },
  STRICT: { limit: 4, windowMs: HOUR_MS },
});

export class FraudLimitError extends Error {
  constructor(retryAfterSeconds = 3600) {
    super("Too many signups from this network. Please try again later.");
    this.name = "FraudLimitError";
    this.status = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function normalizeFraudMode(value) {
  return value === "STRICT" ? "STRICT" : "STANDARD";
}

// Stable per-device identity from request-stable fields only. The raw
// user-agent is hashed, never stored - the row keeps just this digest for
// velocity counting. Returns null when there is nothing stable to hash, in
// which case fingerprint gates are skipped (fail-open).
export function fingerprintSignupDevice({ uniqueUserId, userAgent, device } = {}) {
  const browser = typeof uniqueUserId === "string" ? uniqueUserId.trim() : "";
  const agent = typeof userAgent === "string" ? userAgent.trim().slice(0, 512) : "";
  const deviceLabel = typeof device === "string" ? device.trim().slice(0, 256) : "";
  if (!browser && !agent && !deviceLabel) return null;
  return createHash("sha256").update(`v1|${browser}|${agent}|${deviceLabel}`).digest("hex");
}

// Count helper that fails open: a counting failure returns 0 (allow) and
// logs, instead of blocking legitimate signups on DB trouble.
async function countOrZero(tx, label, query) {
  try {
    return await query();
  } catch (error) {
    console.error(
      "Fraud gate check failed",
      label,
      error?.code || error?.name || "unknown",
      "-",
      String(error?.message || "").slice(0, 200),
    );
    return 0;
  }
}

export async function evaluateSignupFraud(
  tx,
  { fraudMode, ipAddress, deviceFingerprint, now = new Date() } = {},
) {
  const mode = normalizeFraudMode(fraudMode);
  const ipPolicy = IP_VELOCITY[mode];
  const fpPolicy = FINGERPRINT_VELOCITY[mode];

  if (typeof ipAddress === "string" && ipAddress) {
    const since = new Date(now.getTime() - ipPolicy.windowMs);
    const ipCount = await countOrZero(tx, "ip_velocity", () =>
      tx.signUp.count({
        where: { ipAddress, createdAt: { gte: since, lte: now } },
      }),
    );
    if (ipCount >= ipPolicy.limit) {
      return { action: "limit", reason: "ip_velocity", mode };
    }
  }

  if (typeof deviceFingerprint === "string" && deviceFingerprint) {
    const since = new Date(now.getTime() - fpPolicy.windowMs);
    const fpCount = await countOrZero(tx, "fingerprint_velocity", () =>
      tx.signUp.count({
        where: { deviceFingerprint, createdAt: { gte: since, lte: now } },
      }),
    );
    if (fpCount >= fpPolicy.limit) {
      return { action: "silent", reason: "device_velocity", mode };
    }
  }

  return { action: "allow", reason: null, mode };
}

// Deterministic fake identifiers for silent-mode responses. Same request
// identity always yields the same fake id/code, so retries look exactly like
// idempotent replays of a real signup instead of shifting values.
function silentDigest(salt, waitListId, emailNormalized) {
  return createHash("sha256").update(`${salt}:${waitListId}:${emailNormalized}`).digest("hex");
}

export function silentSignupShape({ waitListId, email, emailNormalized, uniqueUserId, rank }) {
  const id = `c${silentDigest("silent-id", waitListId, emailNormalized).slice(0, 24)}`;
  // UUID-shaped like the real dbgenerated referral codes, so the fake
  // success is indistinguishable from a real pending signup.
  const hex = silentDigest("silent-code", waitListId, emailNormalized);
  const referralCode = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  return {
    id,
    uniqueUserId,
    email: typeof email === "string" ? email.trim() : "",
    emailNormalized,
    waitListId,
    referralCode,
    verifiedAt: null,
    rank,
    referrals: [],
    referredBy: [],
    signupOutcome: "created",
    silent: true,
  };
}
