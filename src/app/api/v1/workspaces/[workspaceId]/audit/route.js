import { authenticateV1, resolveV1Workspace, v1CorsResponse, v1Json } from "@/lib/api/v1-auth.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "workspace:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageWorkspace");
  if (wsCheck.error) return wsCheck.error;

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const where = { workspaceId: wsCheck.workspaceId };
  const [total, events] = await Promise.all([
    prisma.workspaceAuditEvent.count({ where }),
    prisma.workspaceAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return v1Json(events, {
    budget,
    pagination: { total, limit, offset, hasMore: offset + events.length < total },
  });
}
