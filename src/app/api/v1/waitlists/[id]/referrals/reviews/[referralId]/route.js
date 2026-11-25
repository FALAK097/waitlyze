import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { resolveReferralReview } from "@/lib/campaigns/referral-review.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function PATCH(request, { params }) {
  const { id, referralId } = await params;
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
  });
  if (check.error) return check.error;

  try {
    const result = await resolveReferralReview(prisma, {
      waitListId: check.waitlist.id,
      referralId,
      status: body?.status,
      resolution: body?.resolution,
      reviewedById: authContext.userId,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
