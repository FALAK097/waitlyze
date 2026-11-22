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
  saveClaimedBlueprintForWaitlist,
} from "@/lib/tools/blueprint.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { requireAuth, requireCampaign } from "@/lib/workspaces/authorize";
import { currentWorkspace } from "@/lib/workspaces/current";

export async function createWaitlistDraft({
  name,
  description = "",
  publicSlug,
  creationKey,
  templateId,
  blueprintId = null,
  showReferrals,
}) {
  await requireAuth();
  const { user, workspace } = await currentWorkspace();
  if (!user?.id || !workspace?.id) {
    return { ok: false, message: "Sign in to continue." };
  }
  try {
    const existingDraft = creationKey
      ? await prisma.waitList.findFirst({
          where: { creationKey, workspaceId: workspace.id },
          select: { id: true },
        })
      : null;

    const blueprint = blueprintId ? await getActiveToolBlueprint(prisma, blueprintId) : null;
    if (blueprintId && !blueprint && !existingDraft) {
      return {
        ok: false,
        code: "BLUEPRINT_UNAVAILABLE",
        message:
          "This Launch Lab blueprint has expired or was already used. Continue with a fresh draft or run the tool again.",
      };
    }

    const effectiveTemplateId = isTemplateId(templateId)
      ? templateId
      : isTemplateId(blueprint?.payload?.templateId)
        ? blueprint.payload.templateId
        : "simple";
    const effectiveShowReferrals =
      typeof showReferrals === "boolean"
        ? showReferrals
        : typeof blueprint?.payload?.showReferrals === "boolean"
          ? blueprint.payload.showReferrals
          : undefined;

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
        ...(typeof effectiveShowReferrals === "boolean"
          ? { showReferrals: effectiveShowReferrals }
          : {}),
      },
      { blueprint },
    );

    let blueprintClaimed = false;
    if (blueprint) {
      const claimResult = await claimToolBlueprint(prisma, {
        id: blueprint.id,
        userId: user.id,
        waitListId: draft.id,
      });
      blueprintClaimed = Boolean(claimResult?.claimed || claimResult?.alreadyClaimedForDraft);
      if (blueprintClaimed) {
        try {
          const cookieStore = await cookies();
          cookieStore.set(BLUEPRINT_COOKIE_NAME, "", { path: "/", maxAge: 0 });
        } catch {
          // Best-effort cookie cleanup
        }
      }
    }

    if (!existingDraft) {
      await recordAuditEvent(prisma, {
        workspaceId: workspace.id,
        userId: user.id,
        action: AUDIT_ACTIONS.WAITLIST_CREATED,
        resourceType: "waitlist",
        resourceId: draft.id,
        resourceName: draft.name,
        detail:
          blueprint && blueprintClaimed
            ? `Created from Launch Lab (${blueprint.toolSlug})`
            : "Created as a private draft",
      });

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
          creation_method: blueprint && blueprintClaimed ? "tool_blueprint" : "dialog",
          ...(blueprint && blueprintClaimed ? { tool_slug: blueprint.toolSlug } : {}),
        },
        groups: {
          company: workspace.id,
        },
      });
      if (blueprint && blueprintClaimed) {
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

    return {
      ok: true,
      id: draft.id,
      blueprintClaimed: blueprint ? blueprintClaimed : undefined,
    };
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

export async function saveLaunchLabPlanToWaitlist({ waitListId, blueprint }) {
  await requireAuth();
  if (!waitListId || typeof waitListId !== "string" || !blueprint) {
    return { ok: false, message: "Missing campaign or Launch Lab payload." };
  }
  try {
    const { user, campaign } = await requireCampaign(waitListId, "editCampaign");
    if (!user?.id || !campaign?.id) {
      return { ok: false, message: "Sign in to save this Launch Lab plan." };
    }
    const saved = await saveClaimedBlueprintForWaitlist(prisma, {
      userId: user.id,
      waitListId: campaign.id,
      rawInput: {
        version: 1,
        ...blueprint,
      },
    });
    return { ok: true, id: saved.id, toolSlug: saved.toolSlug };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: error.issues[0]?.message || "Invalid Launch Lab blueprint payload.",
      };
    }
    return { ok: false, message: "Could not save this plan to your campaign. Try again." };
  }
}
