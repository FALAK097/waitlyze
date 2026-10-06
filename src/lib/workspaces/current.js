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
