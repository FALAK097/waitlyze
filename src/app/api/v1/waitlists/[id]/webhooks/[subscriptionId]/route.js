import { formatSafeWebhook, updateWebhookSubscriptionOp } from "@/lib/api/infra-ops.mjs";
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
    select: {
      id: true,
      name: true,
      url: true,
      eventTypes: true,
      enabled: true,
      includeSubscriberData: true,
      lastDeliveredAt: true,
      createdAt: true,
    },
  });
  if (!sub) {
    return v1Error(404, "NOT_FOUND", "Webhook subscription not found.", undefined, budget);
  }
  return v1Json(formatSafeWebhook(sub), { budget });
}

export async function PATCH(request, { params }) {
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
    const updated = await updateWebhookSubscriptionOp({
      waitlistId: check.waitlist.id,
      subscriptionId,
      updates: body,
    });
    return v1Json(updated, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id, subscriptionId } = await params;
  const auth = await authenticateV1(request, "webhooks:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "manageConnections", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const existing = await prisma.webhookSubscription.findFirst({
    where: { id: subscriptionId, waitListId: check.waitlist.id },
    select: { id: true },
  });
  if (!existing) {
    return v1Error(404, "NOT_FOUND", "Webhook subscription not found.", undefined, budget);
  }

  await prisma.webhookSubscription.delete({ where: { id: existing.id } });
  return v1Json({ deleted: true, id: existing.id }, { budget });
}
