"use server";
import { ZodError } from "zod";

import {
  createDraft,
  DraftCreationError,
  RESERVED_WAITLIST_SLUGS,
} from "@/lib/campaigns/create-draft.mjs";
import prisma from "@/lib/prisma";
import { isTemplateId } from "@/lib/templates/gallery.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";

export async function createWaitlistDraft({ name, publicSlug, creationKey, templateId }) {
  const { user, workspace } = await currentWorkspace();
  try {
    const draft = await createDraft(prisma, user.id, workspace.id, {
      name,
      description: "",
      publicSlug,
      templateId: isTemplateId(templateId) ? templateId : "simple",
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

export async function checkWaitlistSlug(publicSlug) {
  await currentWorkspace();
  if (
    typeof publicSlug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publicSlug) ||
    publicSlug.length < 3 ||
    publicSlug.length > 48 ||
    RESERVED_WAITLIST_SLUGS.has(publicSlug)
  )
    return { available: false, message: "Choose another page address." };
  const existing = await prisma.waitList.findUnique({
    where: { publicSlug },
    select: { id: true },
  });
  return existing
    ? { available: false, message: "This address is already taken." }
    : { available: true, message: "This address is available." };
}
