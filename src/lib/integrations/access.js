import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";

export async function integrationAccess(request, { manage = false } = {}) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } }, select: { role: true } });
  if (!membership) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const canManage = ["OWNER", "ADMIN"].includes(membership.role);
  if (manage && !canManage) return { response: NextResponse.json({ error: "Only a workspace owner or admin can manage integrations." }, { status: 403 }) };
  return { user: session.user, workspace, canManage };
}
