"use server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ZodError } from "zod";

import { createDraft, DraftCreationError } from "@/lib/campaigns/create-draft.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { currentWorkspace } from "@/lib/workspaces/current";

export async function createWaitlistDraft({ name, publicSlug, creationKey }) {
  const { user, workspace } = await currentWorkspace();
  try {
    const draft = await createDraft(prisma, user.id, workspace.id, {
      name,
      description: "",
      publicSlug,
      templateId: "simple",
      creationKey,
    });
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: user.id,
      action: AUDIT_ACTIONS.WAITLIST_CREATED,
      resourceType: "waitlist",
      resourceId: draft.id,
      resourceName: draft.name,
      detail: "Created as a private draft",
    });
    return { ok: true, id: draft.id };
  } catch (error) {
    if (error instanceof DraftCreationError)
      return { ok: false, field: error.field, message: error.message };
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return {
        ok: false,
        field: issue?.path?.[0],
        message: issue?.message || "Review the waitlist details.",
      };
    }
    console.error("Waitlist creation failed", error?.code || error?.name);
    return { ok: false, message: "We couldn't create the waitlist. Try again." };
  }
}

export async function removeImage(logoKey, waitListId) {
  try {
    const { campaign, scope } = await requireCampaign(waitListId, "editCampaign");
    if (!logoKey || logoKey !== campaign.logoKey)
      return { success: false, message: "Image not found." };
    await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: campaign.logoKey }));
    await prisma.waitList.update({
      where: { id: waitListId, logoKey, ...scope },
      data: { logoUrl: "", logoKey: "" },
    });
    return { success: true, message: "Image removed." };
  } catch {
    return { success: false, message: "Could not remove the image. Try again." };
  }
}
