import { queueVerifiedChatNotifications } from "../integrations/chat-notifiers.mjs";
import { awardPoints, isFarmSuspect, referralEventKey } from "../referrals/points.mjs";
import { checkRewardTierUnlocks, getPublishedRewards } from "../referrals/rewards.mjs";
import { getEligibleReferralCounts } from "./referral-position.mjs";

export async function resolveReferralReview(
  db,
  { waitListId, referralId, status, resolution, reviewedById },
) {
  if (!["APPROVED", "EXCLUDED"].includes(status))
    throw new TypeError("Choose whether the referral is approved or excluded.");
  if (
    typeof resolution !== "string" ||
    resolution.trim().length < 8 ||
    resolution.trim().length > 240
  ) {
    throw new TypeError("Add a review note between 8 and 240 characters.");
  }

  const chatUnlocks = [];
  const update = await db.referral.updateMany({
    where: {
      id: referralId,
      reviewStatus: "NEEDS_REVIEW",
      signUp: { is: { waitListId } },
    },
    data: {
      reviewStatus: status,
      resolution: resolution.trim(),
      reviewedAt: new Date(),
      reviewedById,
    },
  });
  if (update.count !== 1)
    throw new Error("This referral has already been reviewed or is unavailable.");

  if (status === "APPROVED") {
    const referral = await db.referral.findUnique({
      where: { id: referralId },
      select: {
        referredById: true,
        signUp: { select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true } },
      },
    });
    const verifiedAt = referral?.signUp.verifiedAt
      ? new Date(referral.signUp.verifiedAt)
      : new Date();
    if (
      referral?.referredById &&
      referral.signUp.verifiedAt &&
      !(await isFarmSuspect(db, referral.signUp.ipAddress, verifiedAt))
    ) {
      const { rewards, tiers } = await getPublishedRewards(db, waitListId);
      await awardPoints(db, {
        waitListId,
        signUpId: referral.referredById,
        kind: "REFERRAL_CREDIT",
        points: rewards.pointsReferral,
        eventKey: referralEventKey(referralId),
      });
      const counts = await getEligibleReferralCounts(db, waitListId, [referral.referredById]);
      const unlocked = await checkRewardTierUnlocks(db, {
        waitListId,
        referrerId: referral.referredById,
        triggeringSignupId: referral.signUp.id,
        verifiedReferrals: counts.get(referral.referredById) ?? 0,
        tiers,
      });
      chatUnlocks.push(
        ...unlocked.map((tier) => ({
          referrerId: referral.referredById,
          count: tier.referrals,
          reward: tier.reward,
        })),
      );
    }
  }

  if (chatUnlocks.length) {
    await queueVerifiedChatNotifications(db, {
      waitListId,
      signUpId: null,
      unlocks: chatUnlocks,
    });
  }
  return { status };
}
