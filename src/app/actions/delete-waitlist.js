"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { r2 } from "@/lib/r2";
import { env } from "@/lib/env.mjs";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteWaitlist(id, confirmation) {
  try {
    const { campaign, scope } = await requireCampaign(id, "deleteCampaign");
    if (confirmation !== (campaign.name || "Untitled waitlist")) return { error: "Enter the waitlist name exactly to confirm." };
    const result = await prisma.waitList.deleteMany({ where: { id, name: campaign.name, ...scope } });
    if (!result.count) return { error: "Waitlist not found or access changed. Refresh and try again." };
    if (campaign.logoKey) {
      try { await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: campaign.logoKey })); }
      catch { console.error("Deleted waitlist has a stored logo pending cleanup."); }
    }
    revalidatePath("/wait-lists");
    return { success: true };
  } catch { return { error: "Could not delete this waitlist. Refresh and try again." }; }
}
