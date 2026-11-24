import { testNotificationChannelOp } from "@/lib/api/infra-ops.mjs";
import {
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { isSupportedChatProvider } from "@/lib/integrations/chat-notifiers.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id, channel } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const upper = String(channel || "").toUpperCase();
  if (!isSupportedChatProvider(upper)) {
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

  try {
    const result = await testNotificationChannelOp({
      waitlistId: check.waitlist.id,
      channel: upper,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
