import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Signup ID is required" },
        { status: 400 }
      );
    }

    await prisma.signUp.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Signup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting signup:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete signup",
      },
      { status: 500 }
    );
  }
}
