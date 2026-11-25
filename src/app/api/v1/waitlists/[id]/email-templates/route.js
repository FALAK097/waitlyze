import { upsertEmailTemplateOp } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "emails:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const templates = await getOrCreateTemplatesForCampaign(check.waitlist.id, check.scope);
    return v1Json(templates, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
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
    const updated = await upsertEmailTemplateOp({
      waitlist: check.waitlist,
      templateType: body?.templateType || body?.type,
      data: body,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
