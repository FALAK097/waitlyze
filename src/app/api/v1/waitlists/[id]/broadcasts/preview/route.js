import { previewBroadcastRecipientsOp } from "@/lib/api/platform-ops.mjs";
import { authenticateV1, requireV1Waitlist, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "emails:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewAudience", {
    id: true,
    workspaceId: true,
  });
  if (check.error) return check.error;

  const url = new URL(request.url);
  const segment = url.searchParams.get("segment") || "ALL";

  try {
    const preview = await previewBroadcastRecipientsOp(check.waitlist.id, segment);
    return v1Json(preview, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
