import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function webhookAccess(request, waitListId, permission = "manageConnections") {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { workspace } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const scope = campaignScope(session.user.id, permission, workspace.id);
  const waitList = await prisma.waitList.findFirst({ where: { id: waitListId, ...scope }, select: { id: true } });
  if (!waitList) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { waitList };
}
