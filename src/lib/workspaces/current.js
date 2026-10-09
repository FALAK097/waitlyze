import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createWorkspaceService } from "./service.mjs";

export const currentWorkspace = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/");
  const service = createWorkspaceService(prisma);
  const personal = await service.ensurePersonal(session.user.id);
  const workspaces = await service.list(session.user.id);
  const selectedId = (await cookies()).get("waitlyze-workspace")?.value;
  const workspace = workspaces.find((item) => item.id === selectedId) || workspaces.find((item) => item.id === personal.id);
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
