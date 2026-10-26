// Referral points engine (backend). Awards flow through the append-only
// PointLedger so every bump is idempotent (eventKey) and auditable;
// SignUp.points is the denormalized balance bumped in the same transaction.
//
// Defaults (Phase 4): verified signup = 50 pts, completed referral = 30 pts.
// Farm guard: signups from an IP over the velocity limit earn nothing, and
// their referrals grant nothing either.

export const SIGNUP_POINTS = 50;
export const REFERRAL_POINTS = 30;
export const FOLLOW_POINTS = 5;

// Networks the follow-claim endpoint accepts. Founder-configured follow URLs
// ship with the Phase-3 cockpit; the award path stays zero-config so points
// accrue from activation even before links are set.
export const FOLLOW_NETWORKS = ["x", "instagram"];

// Max signups from one IP in the trailing 24h before awards are skipped.
export const POINTS_VELOCITY_LIMIT = 20;
const VELOCITY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const REFERRAL_CREDIT_STATUSES = ["CLEAR", "APPROVED"];

export function signupEventKey(signUpId) {
  return `signup-verified:${signUpId}`;
}

export function referralEventKey(referralId) {
  return `referral-credit:${referralId}`;
}

export function followEventKey(signUpId, network) {
  return `follow-credited:${signUpId}:${network}`;
}

export function customEventKey(signUpId, event, key) {
  return `custom-credit:${signUpId}:${event}:${key}`;
}

// Idempotent award: ON CONFLICT DO NOTHING keeps the transaction healthy
// (a caught unique violation would abort it), and the balance bumps only
// when the ledger row is actually new.
export async function awardPoints(tx, { waitListId, signUpId, kind, points, eventKey }) {
  const inserted = await tx.pointLedger.createMany({
    data: [{ waitListId, signUpId, kind, points, eventKey }],
    skipDuplicates: true,
  });
  if (inserted.count !== 1) return { awarded: false };
  // Returning the balance from the same update removes the separate read-back
  // inside callers' transactions.
  const updated = await tx.signUp.update({
    where: { id: signUpId },
    data: { points: { increment: points } },
    select: { points: true },
  });
  return { awarded: true, balance: updated.points };
}

export async function isFarmSuspect(tx, ipAddress, now = new Date()) {
  if (!ipAddress) return false;
  // Bounded on both ends so re-evaluating a historical instant (e.g. a
  // delayed approval anchored at verification time) replays the exact
  // decision instead of seeing a shifted window.
  const count = await tx.signUp.count({
    where: {
      ipAddress,
      createdAt: { gte: new Date(now.getTime() - VELOCITY_WINDOW_MS), lte: now },
    },
  });
  return count > POINTS_VELOCITY_LIMIT;
}
