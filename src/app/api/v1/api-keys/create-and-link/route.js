import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from '@/lib/prisma';
import { createApiKey } from '@/services/api-key';

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const { name, waitlistId } = await request.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: { message: 'Name must be at least 3 characters' } },
        { status: 400 }
      );
    }

    if (!waitlistId) {
      return NextResponse.json(
        { error: { message: 'Waitlist ID is required' } },
        { status: 400 }
      );
    }

    const waitlist = await prisma.waitList.findFirst({
      where: {
        id: waitlistId,
        userId: user.id
      }
    });

    if (!waitlist) {
      return NextResponse.json(
        { error: { message: 'Waitlist not found' } },
        { status: 404 }
      );
    }

    const existingApiKeyForWaitlist = await prisma.apiKey.findFirst({
      where: {
        waitlistId: waitlistId,
        userId: user.id
      }
    });

    if (existingApiKeyForWaitlist) {
      return NextResponse.json(
        { error: { message: 'This waitlist is already linked to another API key' } },
        { status: 400 }
      );
    }

    const newApiKey = await createApiKey({
      name: name.trim(),
      userId: user.id
    });

    const linkedApiKey = await prisma.apiKey.update({
      where: { id: newApiKey.id },
      data: { waitlistId: waitlistId },
      include: {
        waitlist: {
          select: { id: true, name: true }
        }
      }
    });

    const responseData = {
      apiKey: {
        ...linkedApiKey,
        key: "••••••••••••••••",
        apiKey: newApiKey.apiKey
      }
    };

    return NextResponse.json({
      data: responseData
    });
  } catch (error) {
    console.error('Error creating and linking API key:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
