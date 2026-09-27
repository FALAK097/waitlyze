import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Signup ID is required" },
        { status: 400 }
      );
    }

    const result = await prisma.signUp.deleteMany({
      where: { id, waitList: campaignScope(session.user.id, "manageAudience") },
    });
    if (!result.count) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: "Signup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting signup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete signup",
      },
      { status: 500 }
    );
  }
}
