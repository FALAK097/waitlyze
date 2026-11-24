import { configureWaitlistEmailSenderOp, getWaitlistEmailSenderOp } from "@/lib/api/infra-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

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
    const sender = await getWaitlistEmailSenderOp(check.waitlist);
    return v1Json(sender, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "integrations:write");
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
    const sender = await configureWaitlistEmailSenderOp({
      userId: authContext.userId,
      waitlistId: check.waitlist.id,
      fromEmail: body?.fromEmail,
      apiKey: body?.apiKey,
    });
    return v1Json(sender, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "manageConnections", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    await prisma.waitlistEmailSender.deleteMany({ where: { waitListId: check.waitlist.id } });
    await recordAuditEvent(prisma, {
      workspaceId: check.waitlist.workspaceId,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.WAITLIST_SENDER_DISCONNECTED,
      resourceType: "waitlist",
      resourceId: check.waitlist.id,
    });
    return v1Json({ disconnected: true }, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
