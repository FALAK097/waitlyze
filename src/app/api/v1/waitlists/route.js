import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }

    const workspaceId = await selectedWorkspaceId(user.id);
    const waitlists = await prisma.waitList.findMany({
      where: campaignScope(user.id, "manageConnections", workspaceId || undefined),
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ data: waitlists });
  } catch (error) {
    console.error("Error fetching waitlists:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
