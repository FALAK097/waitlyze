"use server";

import { revalidatePath } from "next/cache";

import { WorkspacePlanError } from "@/lib/billing/plans.mjs";
import { normalizeAutomationConfig } from "@/lib/email/automations.mjs";
import { senderForWaitlist } from "@/lib/emails/test-delivery.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { requireAuth, requireCampaign, requireCampaignFeature } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";

function refresh(waitListId) {
  revalidatePath(`/waitlists/${waitListId}/emails/automations`);
}

export async function saveAutomationRecipe({ waitListId, recipeId, data }) {
  let scope;
  try {
    await requireAuth();
    ({ scope } = await requireCampaignFeature(waitListId, "sendEmail", "emailMarketing"));
  } catch (error) {
    if (error instanceof AccessError || error instanceof WorkspacePlanError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId, waitList: scope },
    select: { id: true, type: true },
  });
  if (!recipe) return { success: false, message: "Automation recipe not found." };
  let config;
  try {
    config = normalizeAutomationConfig(recipe.type, data);
  } catch (error) {
    return { success: false, message: error.message };
  }

  const current = await prisma.automationRecipe.findFirst({
    where: { id: recipe.id, waitListId, waitList: scope },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  let saved = { version: 0, config };
  if (current) {
    const currentVersion = current.versions[0];
    if (JSON.stringify(currentVersion?.config) === JSON.stringify(config)) {
      saved = { version: current.currentVersion, config };
    } else {
      const version = current.currentVersion + 1;
      await prisma.automationRecipeVersion.create({
        data: { recipeId: recipe.id, version, config },
      });
      await prisma.automationRecipe.update({
        where: { id: recipe.id },
        data: { currentVersion: version },
      });
      saved = { version, config };
    }
  }
  refresh(waitListId);
  return { success: true, message: "Recipe saved. New runs will use this version.", ...saved };
}

export async function setAutomationStatus({ waitListId, recipeId, status }) {
  let scope;
  try {
    await requireAuth();
    const access =
      status === "ENABLED"
        ? await requireCampaignFeature(waitListId, "sendEmail", "emailMarketing")
        : await requireCampaign(waitListId, "sendEmail");
    scope = access.scope;
  } catch (error) {
    if (error instanceof AccessError || error instanceof WorkspacePlanError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
  if (!["ENABLED", "PAUSED"].includes(status))
    return { success: false, message: "Choose enable or pause." };
  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId, waitList: scope },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!recipe) return { success: false, message: "Automation recipe not found." };
  if (status === "ENABLED") {
    if (!env.OUTBOX_DISPATCH_SECRET)
      return { success: false, message: "Email delivery is not configured yet." };
    try {
      await senderForWaitlist(waitListId);
    } catch {
      return {
        success: false,
        message: "Connect and verify a Resend sender before enabling automations.",
      };
    }
    try {
      normalizeAutomationConfig(recipe.type, recipe.versions[0]?.config);
    } catch {
      return {
        success: false,
        message: "Save a valid subject and message before enabling this recipe.",
      };
    }
    await prisma.automationRecipe.update({ where: { id: recipe.id }, data: { status: "ENABLED" } });
  } else {
    await prisma.automationRecipe.update({ where: { id: recipe.id }, data: { status: "PAUSED" } });
    const scheduledSteps = await prisma.automationRunStep.findMany({
      where: {
        run: { recipeId: recipe.id, status: { in: ["PENDING", "PROCESSING"] } },
        status: { in: ["PENDING", "PROCESSING"] },
      },
      select: { id: true, runId: true, outboxEventKey: true },
    });
    const scheduledKeys = scheduledSteps.map((step) => step.outboxEventKey);
    const pendingEvents = scheduledKeys.length
      ? await prisma.outboxEvent.findMany({
          where: { eventKey: { in: scheduledKeys }, status: "PENDING" },
          select: { eventKey: true },
        })
      : [];
    const cancelKeys = pendingEvents.map((event) => event.eventKey);
    const cancelKeySet = new Set(cancelKeys);
    const cancelSteps = scheduledSteps.filter((step) => cancelKeySet.has(step.outboxEventKey));
    if (cancelKeys.length) {
      await prisma.outboxEvent.updateMany({
        where: { eventKey: { in: cancelKeys }, status: "PENDING" },
        data: {
          status: "FAILED",
          processedAt: new Date(),
          payload: {},
          lastErrorCode: "AUTOMATION_PAUSED",
        },
      });
    }
    if (cancelSteps.length) {
      await prisma.automationRunStep.updateMany({
        where: {
          id: { in: cancelSteps.map((step) => step.id) },
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: { status: "CANCELED", finishedAt: new Date(), lastErrorCode: "AUTOMATION_PAUSED" },
      });
      await prisma.automationRun.updateMany({
        where: {
          id: { in: cancelSteps.map((step) => step.runId) },
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: { status: "CANCELED", finishedAt: new Date(), skipReason: "AUTOMATION_PAUSED" },
      });
    }
  }
  refresh(waitListId);
  return {
    success: true,
    message:
      status === "ENABLED"
        ? "Automation enabled for new eligible signups."
        : "Automation paused. Scheduled messages were canceled; an email already being sent may still arrive.",
  };
}
