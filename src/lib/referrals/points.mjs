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

// Idempotent award: inserts the ledger row, bumps the balance only when the
// row is new (P2002 = already awarded, e.g. retried verify or re-approve).
export async function awardPoints(tx, { waitListId, signUpId, kind, points, eventKey }) {
  try {
    await tx.pointLedger.create({ data: { waitListId, signUpId, kind, points, eventKey } });
  } catch (error) {
    if (error?.code === "P2002") return { awarded: false };
    throw error;
  }
  await tx.signUp.update({ where: { id: signUpId }, data: { points: { increment: points } } });
  return { awarded: true };
}

export async function isFarmSuspect(tx, ipAddress, now = new Date()) {
  if (!ipAddress) return false;
  const count = await tx.signUp.count({
    where: { ipAddress, createdAt: { gte: new Date(now.getTime() - VELOCITY_WINDOW_MS) } },
  });
  return count > POINTS_VELOCITY_LIMIT;
}
