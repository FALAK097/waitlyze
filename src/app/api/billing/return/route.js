import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const requestedWorkspaceId = new URL(request.url).searchParams.get("workspaceId");
  const settingsUrl = new URL("/settings?section=billing", env.BETTER_AUTH_URL);
  if (!session?.user?.id || !requestedWorkspaceId) return NextResponse.redirect(settingsUrl);

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: requestedWorkspaceId, userId: session.user.id },
    },
    select: { role: true },
  });
  if (membership?.role !== "OWNER") return NextResponse.redirect(settingsUrl);

  const returnUrl = new URL("/settings", env.BETTER_AUTH_URL);
  returnUrl.searchParams.set("section", "billing");
  returnUrl.searchParams.set("checkout", "return");
  returnUrl.searchParams.set("workspaceId", requestedWorkspaceId);
  return NextResponse.redirect(returnUrl);
}
