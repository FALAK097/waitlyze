export async function resolveReferralReview(db, { waitListId, referralId, status, resolution, reviewedById }) {
  if (!['APPROVED', 'EXCLUDED'].includes(status)) throw new TypeError("Choose whether the referral is approved or excluded.");
  if (typeof resolution !== "string" || resolution.trim().length < 8 || resolution.trim().length > 240) {
    throw new TypeError("Add a review note between 8 and 240 characters.");
  }

  const update = await db.referral.updateMany({
    where: {
      id: referralId,
      reviewStatus: "NEEDS_REVIEW",
      signUp: { is: { waitListId } },
    },
    data: { reviewStatus: status, resolution: resolution.trim(), reviewedAt: new Date(), reviewedById },
  });
  if (update.count !== 1) throw new Error("This referral has already been reviewed or is unavailable.");
  return { status };
}
