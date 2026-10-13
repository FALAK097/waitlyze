"use server";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { r2 } from "@/lib/r2";
import { env } from "@/lib/env.mjs";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function removeImage(logoKey, waitListId) {
  try {
    const { campaign, scope } = await requireCampaign(waitListId, "editCampaign");
    if (!logoKey || logoKey !== campaign.logoKey) return { success: false, message: "Image not found." };
    await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: campaign.logoKey }));
    await prisma.waitList.update({ where: { id: waitListId, logoKey, ...scope }, data: { logoUrl: "", logoKey: "" } });
    return { success: true, message: "Image removed." };
  } catch { return { success: false, message: "Could not remove the image. Try again." }; }
}
