import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  cookieStore.set("waitlyze-workspace", requestedWorkspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(
    new URL("/settings?section=billing&checkout=return", env.BETTER_AUTH_URL),
  );
}
