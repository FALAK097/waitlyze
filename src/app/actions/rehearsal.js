"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { runLaunchRehearsal } from "@/lib/campaigns/launch-rehearsal.mjs";

export async function runWaitlistRehearsal(waitListId) {
  try {
    await requireCampaign(waitListId, "viewCampaign");
    const result = await runLaunchRehearsal(prisma, waitListId);
    revalidatePath(`/wait-lists/${waitListId}`);
    return { result };
  } catch {
    return { error: "The launch check could not be completed. Try again." };
  }
}
