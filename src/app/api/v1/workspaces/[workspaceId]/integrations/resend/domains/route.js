import { listResendDomainsForWorkspaceOp } from "@/lib/api/infra-ops.mjs";
import { authenticateV1, resolveV1Workspace, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "integrations:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageConnections");
  if (wsCheck.error) return wsCheck.error;

  try {
    const domains = await listResendDomainsForWorkspaceOp(wsCheck.workspaceId);
    return v1Json(domains, { budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
