"use server";
import { cookies } from "next/headers";
import { ZodError } from "zod";

import { WorkspacePlanError } from "@/lib/billing/plans.mjs";
import {
  createDraft,
  DraftCreationError,
  RESERVED_WAITLIST_SLUGS,
} from "@/lib/campaigns/create-draft.mjs";
import prisma from "@/lib/prisma";
import { isTemplateId } from "@/lib/templates/gallery.mjs";
import {
  BLUEPRINT_COOKIE_NAME,
  claimToolBlueprint,
  getActiveToolBlueprint,
} from "@/lib/tools/blueprint.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";

export async function createWaitlistDraft({
  name,
  description = "",
  publicSlug,
  creationKey,
  templateId,
  blueprintId = null,
}) {
  const { user, workspace } = await currentWorkspace();
  try {
    const existingDraft = creationKey
      ? await prisma.waitList.findFirst({
          where: { creationKey, workspaceId: workspace.id },
          select: { id: true },
        })
      : null;

    const blueprint = blueprintId ? await getActiveToolBlueprint(prisma, blueprintId) : null;
    const effectiveTemplateId = isTemplateId(templateId)
      ? templateId
      : isTemplateId(blueprint?.payload?.templateId)
        ? blueprint.payload.templateId
        : "simple";

    const draft = await createDraft(
      prisma,
      user.id,
      workspace.id,
      {
        name,
        description: description?.trim() || "",
        publicSlug,
        templateId: effectiveTemplateId,
        creationKey,
      },
      { blueprint },
    );
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: user.id,
      action: AUDIT_ACTIONS.WAITLIST_CREATED,
      resourceType: "waitlist",
      resourceId: draft.id,
      resourceName: draft.name,
      detail: blueprint
        ? `Created from Launch Lab (${blueprint.toolSlug})`
        : "Created as a private draft",
    });

    if (blueprint) {
      await claimToolBlueprint(prisma, {
        id: blueprint.id,
        userId: user.id,
        waitListId: draft.id,
      });
      try {
        const cookieStore = await cookies();
        cookieStore.set(BLUEPRINT_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      } catch {
        // Best-effort cookie cleanup
      }
    }

    if (!existingDraft) {
      const [{ trackServerEvent }, { POSTHOG_EVENTS }] = await Promise.all([
        import("@/lib/posthog/server.mjs"),
        import("@/lib/posthog/events.mjs"),
      ]);
      await trackServerEvent({
        distinctId: user.id,
        event: POSTHOG_EVENTS.WAITLIST_CREATED,
        properties: {
          waitlist_id: draft.id,
          template_id: effectiveTemplateId,
          creation_method: blueprint ? "tool_blueprint" : "dialog",
          ...(blueprint ? { tool_slug: blueprint.toolSlug } : {}),
        },
        groups: {
          company: workspace.id,
        },
      });
      if (blueprint) {
        await trackServerEvent({
          distinctId: user.id,
          event: POSTHOG_EVENTS.TOOL_BLUEPRINT_APPLIED,
          properties: {
            tool_slug: blueprint.toolSlug,
            template_id: effectiveTemplateId,
            blueprint_id: blueprint.id,
          },
          groups: {
            company: workspace.id,
          },
        });
      }
    }

    return { ok: true, id: draft.id };
  } catch (error) {
    if (error instanceof WorkspacePlanError)
      return { ok: false, code: error.code, feature: error.feature, message: error.message };
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
