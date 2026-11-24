import { createWebhookSubscriptionOp, formatSafeWebhook } from "@/lib/api/infra-ops.mjs";
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
  const { id } = await params;
  const auth = await authenticateV1(request, "webhooks:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const subs = await prisma.webhookSubscription.findMany({
    where: { waitListId: check.waitlist.id },
    orderBy: { createdAt: "desc" },
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
  return v1Json(
    subs.map((s) => formatSafeWebhook(s)),
    { budget },
  );
}

export async function POST(request, { params }) {
  const { id } = await params;
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
    const created = await createWebhookSubscriptionOp({
      waitlistId: check.waitlist.id,
      name: body?.name,
      url: body?.url,
      events: body?.events,
      includeSubscriberData: body?.includeSubscriberData,
    });
    return v1Json(created, { status: 201, budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
