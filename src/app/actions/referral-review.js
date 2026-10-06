"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { resolveReferralReview as resolve } from "@/lib/campaigns/referral-review.mjs";

export async function resolveReferralReview(waitListId, referralId, status, resolution) {
  try {
    const { user } = await requireCampaign(waitListId, "manageAudience");
    await resolve(prisma, { waitListId, referralId, status, resolution, reviewedById: user.id });
    revalidatePath(`/wait-lists/${waitListId}/subscribers`);
    revalidatePath(`/wait-lists/${waitListId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof TypeError) return { error: error.message };
    return { error: "Could not resolve this referral. Refresh the list and try again." };
  }
}
