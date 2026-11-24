import { authenticateV1, v1CorsResponse, v1Error, v1Json } from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import prisma from "@/lib/prisma.js";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request) {
  const auth = await authenticateV1(request, "workspace:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  if (authContext.waitlistId) {
    const wl = await prisma.waitList.findUnique({
      where: { id: authContext.waitlistId },
      select: {
        workspace: { select: { id: true, name: true, personalOwnerId: true, createdAt: true } },
      },
    });
    return v1Json(wl?.workspace ? [wl.workspace] : [], { budget });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: authContext.userId,
      ...(authContext.workspaceId ? { workspaceId: authContext.workspaceId } : {}),
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          personalOwnerId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { waitLists: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = await Promise.all(
    memberships.map(async (m) => {
      const [entitlements, totalSignups] = await Promise.all([
        getWorkspaceEntitlements(prisma, m.workspace.id),
        prisma.signUp.count({ where: { waitList: { workspaceId: m.workspace.id } } }),
      ]);
      return {
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        isPersonal: Boolean(m.workspace.personalOwnerId),
        plan: entitlements.plan,
        waitlistCount: m.workspace._count.waitLists,
        memberCount: m.workspace._count.members,
        totalSignups,
        createdAt: m.workspace.createdAt,
        updatedAt: m.workspace.updatedAt,
      };
    }),
  );

  return v1Json(data, { budget });
}

export async function POST(request) {
  const auth = await authenticateV1(request, "workspace:manage");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  if (authContext.waitlistId || authContext.workspaceId) {
    return v1Error(
      403,
      "SCOPED_KEY_FORBIDDEN",
      "Creating a new workspace requires an account-wide OAuth/session token.",
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

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return v1Error(
      400,
      "INVALID_NAME",
      "Enter a workspace name (1-80 characters).",
      undefined,
      budget,
    );
  }

  try {
    const workspace = await createWorkspaceService(prisma).createWorkspace(
      authContext.userId,
      name,
    );
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: authContext.userId,
      action: AUDIT_ACTIONS.WORKSPACE_CREATED,
      resourceType: "workspace",
      resourceId: workspace.id,
      resourceName: workspace.name,
    });
    return v1Json(workspace, { status: 201, budget });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
