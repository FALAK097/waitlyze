"use server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

import { deleteCloudflareHostname } from "@/lib/domains/provider.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { purgePublicAsset } from "@/lib/uploads/public-cache";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";

export async function deleteWaitlist(id, confirmation) {
  try {
    const { campaign, scope, user } = await requireCampaign(id, "deleteCampaign");
    if (confirmation !== (campaign.name || "Untitled waitlist"))
      return { error: "Enter the waitlist name exactly to confirm." };
    const context = await prisma.waitList.findUnique({
      where: { id },
      select: { workspaceId: true, _count: { select: { signUps: true } } },
    });
    // Read the domain before the cascade removes it with the waitlist, so the
    // Cloudflare hostname can be released too. A leftover hostname would let
    // the next workspace to claim this domain inherit its approval.
    const domain = await prisma.customDomain.findUnique({
      where: { waitListId: id },
      select: { hostname: true, providerId: true },
    });
    const result = await prisma.waitList.deleteMany({
      where: { id, name: campaign.name, ...scope },
    });
    if (!result.count)
      return { error: "Waitlist not found or access changed. Refresh and try again." };
    if (domain) {
      try {
        await deleteCloudflareHostname({
          providerId: domain.providerId,
          hostname: domain.hostname,
        });
      } catch {
        // Best effort: connecting this hostname again deletes and recreates
        // it, so a leftover here cannot hand its approval to another workspace.
        console.error("Cloudflare hostname cleanup after waitlist deletion failed.");
      }
    }
    if (context?.workspaceId) {
      const removed = context._count.signUps;
      await recordAuditEvent(prisma, {
        workspaceId: context.workspaceId,
        userId: user.id,
        action: AUDIT_ACTIONS.WAITLIST_DELETED,
        resourceType: "waitlist",
        resourceId: id,
        resourceName: campaign.name || "Untitled waitlist",
        detail: removed === 1 ? "1 subscriber removed" : `${removed} subscribers removed`,
      });
    }
    if (campaign.logoKey) {
      try {
        await r2.send(
          new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: campaign.logoKey }),
        );
        await purgePublicAsset(campaign.logoKey);
      } catch {
        console.error("Deleted waitlist has a stored logo pending cleanup.");
      }
    }
    revalidatePath("/waitlists");
    return { success: true };
  } catch {
    return { error: "Could not delete this waitlist. Refresh and try again." };
  }
}
