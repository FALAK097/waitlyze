import { sendBroadcastOp } from "@/lib/api/platform-ops.mjs";
import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id, broadcastId } = await params;
  const auth = await authenticateV1(request, "emails:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const body = await request.json().catch(() => ({}));
  const check = await requireV1Waitlist(authContext, id, "sendEmail", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const result = await sendBroadcastOp({
      userId: authContext.userId,
      waitlist: check.waitlist,
      broadcastId,
      segment: body?.segment || "ALL",
      expectedRecipientCount:
        typeof body?.expectedRecipientCount === "number" ? body.expectedRecipientCount : undefined,
      exact: Boolean(body?.exact),
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
