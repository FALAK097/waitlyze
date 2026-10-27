import "server-only";
import { AUTOMATION_DEFAULTS, ensureAutomationRecipes } from "@/lib/email/automations.mjs";
import prisma from "@/lib/prisma";

export async function getAutomationConsoleForCampaign(waitListId, scope) {
  await ensureAutomationRecipes(prisma, waitListId);
  const [recipes, runs] = await Promise.all([
    prisma.automationRecipe.findMany({
      where: { waitListId, waitList: scope },
      orderBy: { type: "asc" },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    }),
    prisma.automationRun.findMany({
      where: { waitListId, waitList: scope },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        recipe: { select: { type: true } },
        signUp: { select: { email: true } },
        steps: { select: { status: true, lastErrorCode: true } },
      },
    }),
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
