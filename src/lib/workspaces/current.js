import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { createWorkspaceService } from "./service.mjs";

export const currentSession = cache(async () => {
  const started = performance.now();
  try {
    return await auth.api.getSession({ headers: await headers() });
  } finally {
    const latencyMs = Math.round(performance.now() - started);
    if (latencyMs >= 500) console.warn("Slow session lookup", { latencyMs });
  }
});

// The cookie is the fast path; users.lastWorkspaceId keeps the selection when
// the cookie is lost so an invited member returns to the right workspace.
// Best effort only: remembering must never fail a mutation.
export async function rememberWorkspace(userId, workspaceId) {
  if (!userId || !workspaceId) return;
  try {
    await prisma.user.update({ where: { id: userId }, data: { lastWorkspaceId: workspaceId } });
  } catch {
    /* best effort */
  }
}

export const currentWorkspace = cache(async () => {
  const session = await currentSession();
  if (!session?.user?.id) redirect("/");
  const service = createWorkspaceService(prisma);
  const started = performance.now();
  const context = service.currentContext(session.user.id).finally(() => {
    const latencyMs = Math.round(performance.now() - started);
    if (latencyMs >= 500) console.warn("Slow workspace lookup", { latencyMs });
  });
  const [{ personal, workspaces }, cookieStore] = await Promise.all([context, cookies()]);
  const selectedId = cookieStore.get("waitlyze-workspace")?.value;
  const cookieWorkspace = workspaces.find((item) => item.id === selectedId);
  let rememberedId;
  if (!cookieWorkspace) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { lastWorkspaceId: true },
      });
      rememberedId = user?.lastWorkspaceId;
    } catch {
      // Best effort: fall back to the account's first workspace.
    }
  }
  const workspace =
    cookieWorkspace ||
    workspaces.find((item) => item.id === rememberedId) ||
    workspaces.find((item) => item.id === personal.id) ||
    workspaces[0];
  return { user: session.user, workspace, workspaces };
});

// Route-handler variant: returns the cookie's workspace id only when the user
// is a member; otherwise falls back to "no selection" (undefined) so callers
// keep the legacy cross-workspace scope instead of failing on a stale cookie.
export const selectedWorkspaceId = cache(async (userId) => {
  const selectedId = (await cookies()).get("waitlyze-workspace")?.value;
  if (!selectedId) return undefined;
  const workspaces = await createWorkspaceService(prisma).list(userId);
  return workspaces.some((item) => item.id === selectedId) ? selectedId : undefined;
});
