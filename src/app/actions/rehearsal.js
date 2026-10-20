"use server";

import { revalidatePath } from "next/cache";

import { runLaunchRehearsal } from "@/lib/campaigns/launch-rehearsal.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";

export async function runWaitlistRehearsal(waitListId) {
  try {
    await requireCampaign(waitListId, "viewCampaign");
    const result = await runLaunchRehearsal(prisma, waitListId);
    revalidatePath(`/waitlists/${waitListId}`);
    return { result };
  } catch {
    return { error: "The launch check could not be completed. Try again." };
  }
}
