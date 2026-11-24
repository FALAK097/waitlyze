import { createOrUpdateBroadcastOp } from "@/lib/api/platform-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";
import prisma from "@/lib/prisma.js";

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

  const broadcasts = await prisma.marketingBroadcast.findMany({
    where: { waitListId: check.waitlist.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      segment: true,
      status: true,
      scheduledAt: true,
      sentAt: true,
      recipientCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return v1Json(
    broadcasts.map((b) => ({
      ...b,
      statusLabel: emailStatusLabel(b.status, { draft: "Draft", sent: "Sent" }),
    })),
    { budget },
  );
}

export async function POST(request, { params }) {
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
    name: true,
  });
  if (check.error) return check.error;

  try {
    const broadcast = await createOrUpdateBroadcastOp({
      waitlist: check.waitlist,
      data: body,
    });
    return v1Json(broadcast, { status: 201, budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
