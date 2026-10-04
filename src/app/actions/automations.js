"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AUTOMATION_DEFAULTS, ensureAutomationRecipes, normalizeAutomationConfig } from "@/lib/email/automations.mjs";

function refresh(waitListId) {
  revalidatePath(`/wait-lists/${waitListId}/emails/automations`);
}

export async function saveAutomationRecipe({ waitListId, recipeId, data }) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
  const recipe = await prisma.automationRecipe.findFirst({ where: { id: recipeId, waitListId, waitList: scope }, select: { id: true, type: true } });
  if (!recipe) return { success: false, message: "Automation recipe not found." };
  let config;
  try { config = normalizeAutomationConfig(recipe.type, data); }
  catch (error) { return { success: false, message: error.message }; }

  const saved = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "automation_recipes" WHERE "id" = ${recipe.id} FOR UPDATE`;
    const current = await tx.automationRecipe.findFirst({
      where: { id: recipe.id, waitListId, waitList: scope },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!current) return { version: 0, config };
    const currentVersion = current.versions[0];
    if (JSON.stringify(currentVersion?.config) === JSON.stringify(config)) return { version: current.currentVersion, config };
    const version = current.currentVersion + 1;
    await tx.automationRecipeVersion.create({ data: { recipeId: recipe.id, version, config } });
    await tx.automationRecipe.update({ where: { id: recipe.id }, data: { currentVersion: version } });
    return { version, config };
  });
  refresh(waitListId);
  return { success: true, message: "Recipe saved. New runs will use this version.", ...saved };
}

export async function setAutomationStatus({ waitListId, recipeId, status }) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
  if (!["ENABLED", "PAUSED"].includes(status)) return { success: false, message: "Choose enable or pause." };
  const recipe = await prisma.automationRecipe.findFirst({ where: { id: recipeId, waitListId, waitList: scope }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!recipe) return { success: false, message: "Automation recipe not found." };
  if (status === "ENABLED") {
    if (!env.OUTBOX_DISPATCH_SECRET || !env.RESEND_API_KEY) return { success: false, message: "Configure email delivery before enabling automations." };
    try { normalizeAutomationConfig(recipe.type, recipe.versions[0]?.config); }
    catch { return { success: false, message: "Save a valid subject and message before enabling this recipe." }; }
    await prisma.automationRecipe.update({ where: { id: recipe.id }, data: { status: "ENABLED" } });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "automation_recipes" WHERE "id" = ${recipe.id} FOR UPDATE`;
      const scheduledSteps = await tx.automationRunStep.findMany({ where: { run: { recipeId: recipe.id, status: { in: ["PENDING", "PROCESSING"] } }, status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true, runId: true, outboxEventKey: true } });
      const scheduledKeys = scheduledSteps.map((step) => step.outboxEventKey);
      const pendingEvents = scheduledKeys.length ? await tx.outboxEvent.findMany({ where: { eventKey: { in: scheduledKeys }, status: "PENDING" }, select: { eventKey: true } }) : [];
      const cancelKeys = pendingEvents.map((event) => event.eventKey);
      const cancelKeySet = new Set(cancelKeys);
      const cancelSteps = scheduledSteps.filter((step) => cancelKeySet.has(step.outboxEventKey));
      if (cancelKeys.length) await tx.outboxEvent.updateMany({ where: { eventKey: { in: cancelKeys }, status: "PENDING" }, data: { status: "FAILED", processedAt: new Date(), payload: {}, lastErrorCode: "AUTOMATION_PAUSED" } });
      if (cancelSteps.length) {
        await tx.automationRunStep.updateMany({ where: { id: { in: cancelSteps.map((step) => step.id) }, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELED", finishedAt: new Date(), lastErrorCode: "AUTOMATION_PAUSED" } });
        await tx.automationRun.updateMany({ where: { id: { in: cancelSteps.map((step) => step.runId) }, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELED", finishedAt: new Date(), skipReason: "AUTOMATION_PAUSED" } });
      }
      await tx.automationRecipe.update({ where: { id: recipe.id }, data: { status: "PAUSED" } });
    });
  }
  refresh(waitListId);
  return { success: true, message: status === "ENABLED" ? "Automation enabled for new eligible signups." : "Automation paused. Scheduled messages were canceled; an email already being sent may still arrive." };
}

export async function getAutomationConsole(waitListId) {
  const { scope } = await requireCampaign(waitListId, "sendEmail");
  await ensureAutomationRecipes(prisma, waitListId);
  const [recipes, runs] = await Promise.all([
    prisma.automationRecipe.findMany({ where: { waitListId, waitList: scope }, orderBy: { type: "asc" }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } }),
    prisma.automationRun.findMany({ where: { waitListId, waitList: scope }, orderBy: { createdAt: "desc" }, take: 30, include: { recipe: { select: { type: true } }, signUp: { select: { email: true } }, steps: { select: { status: true, lastErrorCode: true } } } }),
  ]);
  const title = (type) => AUTOMATION_DEFAULTS[type]?.title || type;
  return {
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      type: recipe.type,
      title: title(recipe.type),
      description: AUTOMATION_DEFAULTS[recipe.type]?.description || "",
      status: recipe.status,
      version: recipe.currentVersion,
      config: recipe.versions[0]?.config || AUTOMATION_DEFAULTS[recipe.type],
    })),
    runs: runs.map((run) => ({
      id: run.id,
      recipe: title(run.recipe.type),
      status: run.status,
      scheduledAt: run.scheduledAt.toISOString(),
      createdAt: run.createdAt.toISOString(),
      recipient: run.signUp.email.replace(/^(.).+(@.+)$/, "$1•••$2"),
      reason: run.skipReason || run.steps.find((step) => step.lastErrorCode)?.lastErrorCode || "",
    })),
  };
}
