import { bulkAudienceActionOp, retryVerificationOp } from "@/lib/api/audience-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "subscribers:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const check = await requireV1Waitlist(authContext, id, "manageAudience", {
    id: true,
    workspaceId: true,
    name: true,
    status: true,
  });
  if (check.error) return check.error;

  const action = body?.action;
  const ids = Array.isArray(body?.ids)
    ? body.ids
    : Array.isArray(body?.subscriberIds)
      ? body.subscriberIds
      : [];

  try {
    if (action === "retry_verification" || action === "retryVerification") {
      const result = await retryVerificationOp({ waitlist: check.waitlist, signupIds: ids });
      return v1Json(result, { budget });
    }
    const result = await bulkAudienceActionOp({
      waitlist: check.waitlist,
      userId: authContext.userId,
      actorLabel: authContext.authType === "api_key" ? "API key" : "OAuth/Session",
      action,
      ids,
    });
    const totalSignups = await prisma.signUp.count({ where: { waitListId: check.waitlist.id } });
    return v1Json({ ...result, totalSignups }, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
