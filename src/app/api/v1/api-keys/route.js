import { NextResponse } from "next/server";
import { listUserApiKeys } from "@/services/api-key";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }

    const apiKeys = await listUserApiKeys(user.id);

    const apiKeysWithMaskedKeys = apiKeys.map((key) => ({
      ...key,
      key: "••••••••••••••••",
    }));

    return NextResponse.json({ data: apiKeysWithMaskedKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
