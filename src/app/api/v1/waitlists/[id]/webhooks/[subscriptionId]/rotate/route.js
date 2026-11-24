import { rotateWebhookSecretOp } from "@/lib/api/infra-ops.mjs";
import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { id, subscriptionId } = await params;
  const auth = await authenticateV1(request, "webhooks:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "manageConnections", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  try {
    const result = await rotateWebhookSecretOp({
      waitlistId: check.waitlist.id,
      subscriptionId,
    });
    return v1Json(result, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
