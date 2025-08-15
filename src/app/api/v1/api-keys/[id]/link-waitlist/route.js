import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request, context) {
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

    const params = await context.params;
    const { id } = params;
    const { waitlistId } = await request.json();

    if (!waitlistId) {
      return NextResponse.json(
        { error: { message: "Waitlist ID is required" } },
        { status: 400 }
      );
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "API key not found" } },
        { status: 404 }
      );
    }

    if (apiKey.waitlistId) {
      return NextResponse.json(
        {
          error: { message: "This API key is already linked to a waitlist" },
        },
        { status: 400 }
      );
    }

    const waitlist = await prisma.waitList.findFirst({
      where: {
        id: waitlistId,
        userId: user.id,
      },
    });

    if (!waitlist) {
      return NextResponse.json(
        { error: { message: "Waitlist not found" } },
        { status: 404 }
      );
    }

    const existingApiKeyForWaitlist = await prisma.apiKey.findFirst({
      where: {
        waitlistId: waitlistId,
        userId: user.id,
      },
    });

    if (existingApiKeyForWaitlist) {
      return NextResponse.json(
        {
          error: { message: "This waitlist is already linked to another API key" },
        },
        { status: 400 }
      );
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: { id: id },
      data: { waitlistId: waitlistId },
      include: {
        waitlist: {
          select: { id: true, name: true },
        },
      },
    });

    const apiKeyWithMaskedKey = {
      ...updatedApiKey,
      key: "••••••••••••••••",
    };

    return NextResponse.json({ data: apiKeyWithMaskedKey });
  } catch (error) {
    console.error("Error linking API key to waitlist:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
