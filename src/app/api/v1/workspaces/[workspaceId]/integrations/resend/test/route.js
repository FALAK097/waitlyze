import { testWorkspaceResendOp } from "@/lib/api/infra-ops.mjs";
import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function POST(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  try {
    const res = await testWorkspaceResendOp({
      workspaceId: wsCheck.workspaceId,
      recipientEmail: body?.to || body?.email,
    });
    return v1Json(res, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
