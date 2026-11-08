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

  const outcome = await db.$transaction(async (tx) => {
    const chatUnlocks = [];
    const update = await tx.referral.updateMany({
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
    // A newly approved referral credits the referrer once the invitee has
    // verified. Idempotent: re-resolving is impossible, and the event key
    // guards double awards regardless. Amounts resolve from the published
    // snapshot (defaults when unpublished), and crossing a tier threshold
    // here fires the same milestone unlock as the verify path.
    if (status === "APPROVED") {
      const referral = await tx.referral.findUnique({
        where: { id: referralId },
        select: {
          referredById: true,
          signUp: { select: { id: true, waitListId: true, verifiedAt: true, ipAddress: true } },
        },
      });
      // Anchor the farm window at verification time so a delayed approval
      // replays the exact decision the verify flow would have made, instead
      // of evaluating a shifted trailing window.
      const verifiedAt = referral?.signUp.verifiedAt
        ? new Date(referral.signUp.verifiedAt)
        : new Date();
      if (
        referral?.referredById &&
        referral.signUp.verifiedAt &&
        !(await isFarmSuspect(tx, referral.signUp.ipAddress, verifiedAt))
      ) {
        const { rewards, tiers } = await getPublishedRewards(tx, waitListId);
        await awardPoints(tx, {
          waitListId,
          signUpId: referral.referredById,
          kind: "REFERRAL_CREDIT",
          points: rewards.pointsReferral,
          eventKey: referralEventKey(referralId),
        });
        const counts = await getEligibleReferralCounts(tx, waitListId, [referral.referredById]);
        const unlocked = await checkRewardTierUnlocks(tx, {
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
    return { status, chatUnlocks };
  });
  if (outcome.chatUnlocks.length) {
    // The approved referral is committed. A chat outage cannot undo it.
    await queueVerifiedChatNotifications(db, {
      waitListId,
      signUpId: null,
      unlocks: outcome.chatUnlocks,
    });
  }
  return { status: outcome.status };
}
