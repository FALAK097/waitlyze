import { configureNotificationChannelOp } from "@/lib/api/infra-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { parseJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import { CHAT_TRIGGERS, isSupportedChatProvider } from "@/lib/integrations/chat-notifiers.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

function parseChannelProvider(raw) {
  const upper = String(raw || "").toUpperCase();
  return isSupportedChatProvider(upper) ? upper : null;
}

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id, channel } = await params;
  const auth = await authenticateV1(request, "waitlist:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const provider = parseChannelProvider(channel);
  if (!provider) {
    return v1Error(
      400,
      "INVALID_CHANNEL",
      "Channel must be 'slack' or 'discord'.",
      undefined,
      budget,
    );
  }

  const check = await requireV1Waitlist(authContext, id, "viewCampaign", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const row = await prisma.waitlistNotificationChannel.findUnique({
    where: { waitListId_provider: { waitListId: check.waitlist.id, provider } },
  });

  if (!row) {
    return v1Json(
      {
        connected: false,
        channel: provider.toLowerCase(),
        availableTriggers: CHAT_TRIGGERS,
        triggers: [],
      },
      { budget },
    );
  }

  return v1Json(
    {
      connected: true,
      id: row.id,
      channel: provider.toLowerCase(),
      provider: row.provider,
      status: row.status,
      triggers: parseJsonStringArray(row.triggers, [CHAT_TRIGGERS[0]]),
      availableTriggers: CHAT_TRIGGERS,
      lastTestedAt: row.lastTestedAt,
      lastErrorCode: row.lastErrorCode,
      updatedAt: row.updatedAt,
    },
    { budget },
  );
}

export async function PUT(request, { params }) {
  const { id, channel } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const provider = parseChannelProvider(channel);
  if (!provider) {
    return v1Error(
      400,
      "INVALID_CHANNEL",
      "Channel must be 'slack' or 'discord'.",
      undefined,
      budget,
    );
  }

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
    const result = await configureNotificationChannelOp({
      userId: authContext.userId,
      waitlistId: check.waitlist.id,
      channel: provider,
      webhookUrl: body?.webhookUrl,
      triggers: body?.triggers,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id, channel } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const provider = parseChannelProvider(channel);
  if (!provider) {
    return v1Error(
      400,
      "INVALID_CHANNEL",
      "Channel must be 'slack' or 'discord'.",
      undefined,
      budget,
    );
  }

  const check = await requireV1Waitlist(authContext, id, "manageConnections", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  await prisma.waitlistNotificationChannel.deleteMany({
    where: { waitListId: check.waitlist.id, provider },
  });
  await recordAuditEvent(prisma, {
    workspaceId: check.waitlist.workspaceId,
    userId: authContext.userId,
    action: AUDIT_ACTIONS.CHAT_NOTIFICATION_DISCONNECTED,
    resourceType: "waitlist",
    resourceId: check.waitlist.id,
    detail: provider.toLowerCase(),
  });
  return v1Json({ disconnected: true, channel: provider.toLowerCase() }, { budget });
}
