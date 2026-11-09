import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

async function isWorkspaceOwner(userId, workspaceId) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return membership?.role === "OWNER";
}

function billingSettingsUrl(workspaceId, checkoutReturn = false) {
  const url = new URL("/settings", env.BETTER_AUTH_URL);
  url.searchParams.set("section", "billing");
  if (checkoutReturn) url.searchParams.set("checkout", "return");
  if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
  return url;
}

export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const requestedWorkspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (
    !session?.user?.id ||
    !requestedWorkspaceId ||
    !(await isWorkspaceOwner(session.user.id, requestedWorkspaceId))
  )
    return NextResponse.redirect(billingSettingsUrl());

  // GET only selects the verified workspace for this page load. Persisting the
  // selection is an explicit same-origin POST from the return banner below.
  return NextResponse.redirect(billingSettingsUrl(requestedWorkspaceId, true));
}

export async function POST(request) {
  const origin = request.headers.get("origin");
  let requestOrigin;
  try {
    requestOrigin = origin ? new URL(origin).origin : null;
  } catch {
    requestOrigin = null;
  }
  if (!requestOrigin || requestOrigin !== new URL(env.BETTER_AUTH_URL).origin)
    return NextResponse.json({ error: "Invalid workspace selection request." }, { status: 403 });

  const session = await auth.api.getSession({ headers: request.headers });
  const formData = await request.formData();
  const requestedWorkspaceId = formData.get("workspaceId");
  if (
    !session?.user?.id ||
    typeof requestedWorkspaceId !== "string" ||
    !requestedWorkspaceId ||
    !(await isWorkspaceOwner(session.user.id, requestedWorkspaceId))
  )
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

  const returnUrl = new URL("/settings", env.BETTER_AUTH_URL);
  returnUrl.searchParams.set("section", "billing");
  returnUrl.searchParams.set("checkout", "return");
  const cookieStore = await cookies();
  cookieStore.set("waitlyze-workspace", requestedWorkspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(returnUrl, 303);
}
