"use server";

import { revalidatePath } from "next/cache";

import { normalizeAutomationConfig } from "@/lib/email/automations.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";

function refresh(waitListId) {
  revalidatePath(`/waitlists/${waitListId}/emails/automations`);
}

export async function saveAutomationRecipe({ waitListId, recipeId, data }) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
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

  const saved = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "automation_recipes" WHERE "id" = ${recipe.id} FOR UPDATE`;
    const current = await tx.automationRecipe.findFirst({
      where: { id: recipe.id, waitListId, waitList: scope },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!current) return { version: 0, config };
    const currentVersion = current.versions[0];
    if (JSON.stringify(currentVersion?.config) === JSON.stringify(config))
      return { version: current.currentVersion, config };
    const version = current.currentVersion + 1;
    await tx.automationRecipeVersion.create({ data: { recipeId: recipe.id, version, config } });
    await tx.automationRecipe.update({
      where: { id: recipe.id },
      data: { currentVersion: version },
    });
    return { version, config };
  });
  refresh(waitListId);
  return { success: true, message: "Recipe saved. New runs will use this version.", ...saved };
}

export async function setAutomationStatus({ waitListId, recipeId, status }) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
  if (!["ENABLED", "PAUSED"].includes(status))
    return { success: false, message: "Choose enable or pause." };
  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId, waitList: scope },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!recipe) return { success: false, message: "Automation recipe not found." };
  if (status === "ENABLED") {
    if (!env.OUTBOX_DISPATCH_SECRET || !env.RESEND_API_KEY)
      return { success: false, message: "Configure email delivery before enabling automations." };
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
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "automation_recipes" WHERE "id" = ${recipe.id} FOR UPDATE`;
      const scheduledSteps = await tx.automationRunStep.findMany({
        where: {
          run: { recipeId: recipe.id, status: { in: ["PENDING", "PROCESSING"] } },
          status: { in: ["PENDING", "PROCESSING"] },
        },
        select: { id: true, runId: true, outboxEventKey: true },
      });
      const scheduledKeys = scheduledSteps.map((step) => step.outboxEventKey);
      const pendingEvents = scheduledKeys.length
        ? await tx.outboxEvent.findMany({
            where: { eventKey: { in: scheduledKeys }, status: "PENDING" },
            select: { eventKey: true },
          })
        : [];
      const cancelKeys = pendingEvents.map((event) => event.eventKey);
      const cancelKeySet = new Set(cancelKeys);
      const cancelSteps = scheduledSteps.filter((step) => cancelKeySet.has(step.outboxEventKey));
      if (cancelKeys.length)
        await tx.outboxEvent.updateMany({
          where: { eventKey: { in: cancelKeys }, status: "PENDING" },
          data: {
            status: "FAILED",
            processedAt: new Date(),
            payload: {},
            lastErrorCode: "AUTOMATION_PAUSED",
          },
        });
      if (cancelSteps.length) {
        await tx.automationRunStep.updateMany({
          where: {
            id: { in: cancelSteps.map((step) => step.id) },
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: { status: "CANCELED", finishedAt: new Date(), lastErrorCode: "AUTOMATION_PAUSED" },
        });
        await tx.automationRun.updateMany({
          where: {
            id: { in: cancelSteps.map((step) => step.runId) },
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: { status: "CANCELED", finishedAt: new Date(), skipReason: "AUTOMATION_PAUSED" },
        });
      }
      await tx.automationRecipe.update({ where: { id: recipe.id }, data: { status: "PAUSED" } });
    });
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
