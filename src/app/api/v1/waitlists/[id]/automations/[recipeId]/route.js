import { saveAutomationRecipeOp, setAutomationStatusOp } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { AUTOMATION_DEFAULTS } from "@/lib/email/automations.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id, recipeId } = await params;
  const auth = await authenticateV1(request, "emails:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const recipe = await prisma.automationRecipe.findFirst({
    where: { id: recipeId, waitListId: check.waitlist.id },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!recipe) {
    return v1Error(404, "NOT_FOUND", "Automation recipe not found.", undefined, budget);
  }

  return v1Json(
    {
      id: recipe.id,
      type: recipe.type,
      title: AUTOMATION_DEFAULTS[recipe.type]?.title || recipe.type,
      status: recipe.status,
      currentVersion: recipe.currentVersion,
      config: recipe.versions?.[0]?.config ?? null,
      updatedAt: recipe.updatedAt,
    },
    { budget },
  );
}

export async function PATCH(request, { params }) {
  const { id, recipeId } = await params;
  const auth = await authenticateV1(request, "emails:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const check = await requireV1Waitlist(authContext, id, "sendEmail", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    let result = null;
    if (body?.config && typeof body.config === "object") {
      result = await saveAutomationRecipeOp({
        waitlist: check.waitlist,
        recipeId,
        data: body.config,
      });
    } else if (body?.subject || body?.body || body?.delayHours !== undefined) {
      const { status: _s, ...cfgData } = body;
      if (Object.keys(cfgData).length > 0) {
        result = await saveAutomationRecipeOp({
          waitlist: check.waitlist,
          recipeId,
          data: cfgData,
        });
      }
    }
    if (body?.status) {
      const statusRes = await setAutomationStatusOp({
        waitlist: check.waitlist,
        recipeId,
        status: body.status,
      });
      result = { ...result, ...statusRes };
    }
    if (!result) {
      return v1Error(
        400,
        "INVALID_REQUEST",
        "Provide config fields and/or status ('ENABLED' or 'PAUSED').",
        undefined,
        budget,
      );
    }
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
