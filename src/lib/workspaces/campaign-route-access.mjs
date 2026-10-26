import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function campaignRouteAccess({ request, id, permission, select }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { workspace, user } = await currentWorkspace();
  if (!workspace) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };

  const scope = campaignScope(session.user.id, permission, workspace.id);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...scope },
    select,
  });
  if (!waitlist) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };

  return { scope, waitlist, workspace, user: user || session.user };
}
