import { REFERRAL_POINTS, awardPoints, isFarmSuspect, referralEventKey } from "../referrals/points.mjs";

export async function resolveReferralReview(db, { waitListId, referralId, status, resolution, reviewedById }) {
  if (!['APPROVED', 'EXCLUDED'].includes(status)) throw new TypeError("Choose whether the referral is approved or excluded.");
  if (typeof resolution !== "string" || resolution.trim().length < 8 || resolution.trim().length > 240) {
    throw new TypeError("Add a review note between 8 and 240 characters.");
  }

  return db.$transaction(async (tx) => {
    const update = await tx.referral.updateMany({
      where: {
        id: referralId,
        reviewStatus: "NEEDS_REVIEW",
        signUp: { is: { waitListId } },
      },
      data: { reviewStatus: status, resolution: resolution.trim(), reviewedAt: new Date(), reviewedById },
    });
    if (update.count !== 1) throw new Error("This referral has already been reviewed or is unavailable.");
    // A newly approved referral credits the referrer once the invitee has
    // verified. Idempotent: re-resolving is impossible, and the event key
    // guards double awards regardless.
    if (status === "APPROVED") {
      const referral = await tx.referral.findUnique({
        where: { id: referralId },
        select: { referredById: true, signUp: { select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true } } },
      });
      const now = new Date();
      if (referral?.referredById && referral.signUp.verifiedAt && !(await isFarmSuspect(tx, referral.signUp.ipAddress, now))) {
        await awardPoints(tx, { waitListId, signUpId: referral.referredById, kind: "REFERRAL_CREDIT", points: REFERRAL_POINTS, eventKey: referralEventKey(referralId) });
      }
    }
    return { status };
  });
}
