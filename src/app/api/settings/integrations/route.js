import { NextResponse } from "next/server";

import { integrationAccess } from "@/lib/integrations/access";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const access = await integrationAccess(request);
  if (access.response) return access.response;
  const data = await prisma.workspaceIntegration.findMany({
    where: { workspaceId: access.workspace.id },
    select: {
      id: true,
      provider: true,
      status: true,
      fromEmail: true,
      lastTestedAt: true,
      lastErrorCode: true,
      updatedAt: true,
    },
    orderBy: { provider: "asc" },
  });
  return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
}
