import { replayWebhookDeliveryOp } from "@/lib/api/infra-ops.mjs";
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
  const { id, subscriptionId } = await params;
  const auth = await authenticateV1(request, "webhooks:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const sub = await prisma.webhookSubscription.findFirst({
    where: { id: subscriptionId, waitListId: check.waitlist.id },
    select: { id: true },
  });
  if (!sub) {
    return v1Error(404, "NOT_FOUND", "Webhook subscription not found.", undefined, budget);
  }

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { subscriptionId: sub.id, subscription: { waitListId: check.waitlist.id } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      status: true,
      attempts: true,
      replayCount: true,
      responseStatus: true,
      lastErrorCode: true,
      availableAt: true,
      deliveredAt: true,
      processedAt: true,
      createdAt: true,
    },
  });

  return v1Json(deliveries, { budget });
}

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const auth = await authenticateV1(request, "webhooks:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const check = await requireV1Waitlist(authContext, id, "manageConnections", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const result = await replayWebhookDeliveryOp({
      waitlistId: check.waitlist.id,
      subscriptionId,
      deliveryId: body?.deliveryId,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
