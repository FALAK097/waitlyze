// Referral points engine (backend). Awards flow through the append-only
// PointLedger so every bump is idempotent (eventKey) and auditable;
// SignUp.points is the denormalized balance bumped in the same transaction.
//
// Defaults (Phase 4): verified signup = 50 pts, completed referral = 30 pts.
// Farm guard: signups from an IP over the velocity limit earn nothing, and
// their referrals grant nothing either.

export const SIGNUP_POINTS = 50;
export const REFERRAL_POINTS = 30;

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

// Idempotent award: ON CONFLICT DO NOTHING keeps the transaction healthy
// (a caught unique violation would abort it), and the balance bumps only
// when the ledger row is actually new.
export async function awardPoints(tx, { waitListId, signUpId, kind, points, eventKey }) {
  const inserted = await tx.pointLedger.createMany({ data: [{ waitListId, signUpId, kind, points, eventKey }], skipDuplicates: true });
  if (inserted.count !== 1) return { awarded: false };
  await tx.signUp.update({ where: { id: signUpId }, data: { points: { increment: points } } });
  return { awarded: true };
}

export async function isFarmSuspect(tx, ipAddress, now = new Date()) {
  if (!ipAddress) return false;
  // Bounded on both ends so re-evaluating a historical instant (e.g. a
  // delayed approval anchored at verification time) replays the exact
  // decision instead of seeing a shifted window.
  const count = await tx.signUp.count({
    where: { ipAddress, createdAt: { gte: new Date(now.getTime() - VELOCITY_WINDOW_MS), lte: now } },
  });
  return count > POINTS_VELOCITY_LIMIT;
}
