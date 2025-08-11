import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const waitListId = searchParams.get("waitListId");

    if (!waitListId) {
      return NextResponse.json(
        { success: false, error: "waitListId is required" },
        { status: 400 }
      );
    }

    const signups = await prisma.signUp.findMany({
      where: {
        waitListId: waitListId,
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
