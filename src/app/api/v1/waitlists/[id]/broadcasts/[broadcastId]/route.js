import { createOrUpdateBroadcastOp, deleteBroadcastOp } from "@/lib/api/platform-ops.mjs";
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

export async function GET(request, { params }) {
  const { id, broadcastId } = await params;
  const auth = await authenticateV1(request, "emails:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const broadcast = await prisma.marketingBroadcast.findFirst({
    where: { id: broadcastId, waitListId: check.waitlist.id },
  });
  if (!broadcast) {
    return v1Error(404, "NOT_FOUND", "Broadcast not found.", undefined, budget);
  }

  return v1Json(broadcast, { budget });
}

export async function PATCH(request, { params }) {
  const { id, broadcastId } = await params;
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
    const updated = await createOrUpdateBroadcastOp({
      waitlist: check.waitlist,
      broadcastId,
      data: body,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id, broadcastId } = await params;
  const auth = await authenticateV1(request, "emails:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "sendEmail", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const result = await deleteBroadcastOp({
      waitListId: check.waitlist.id,
      broadcastId,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
