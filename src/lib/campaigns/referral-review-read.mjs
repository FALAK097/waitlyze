export async function loadReferralReviews(db, waitListId) {
  try {
    const reviews = await db.referral.findMany({
      where: { signUp: { is: { waitListId } }, reviewStatus: { not: "CLEAR" } },
      select: { id: true, reviewStatus: true, reviewReason: true, resolution: true, reviewedAt: true, signUp: { select: { email: true, createdAt: true } }, referredBy: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { reviews, failed: false };
  } catch {
    return { reviews: [], failed: true };
  }
}
