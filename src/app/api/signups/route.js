import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const scope = campaignScope(session.user.id, "viewAudience");
    const { searchParams } = new URL(request.url);
    const waitListId = searchParams.get("waitListId");

    if (!waitListId) {
      return NextResponse.json(
        { success: false, error: "waitListId is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.waitList.findFirst({ where: { id: waitListId, ...scope }, select: { id: true } });
    if (!campaign) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const signups = await prisma.signUp.findMany({
      where: {
        waitListId: waitListId,
        waitList: scope,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: signups,
    });
  } catch (error) {
    console.error("Error fetching signups:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch signup data" },
      { status: 500 }
    );
  }
}
