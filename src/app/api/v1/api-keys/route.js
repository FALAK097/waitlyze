import { NextResponse } from 'next/server';
import { createApiKey, listUserApiKeys } from '@/services/api-key';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await prisma.user.findFirst({
      select: {
        id: true,
      },
    });

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const apiKeys = await listUserApiKeys(userId.id);

    return NextResponse.json({ data: apiKeys });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: { code: 'server_error', message: 'Failed to list API keys' } },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const userId = await prisma.user.findFirst({
      select: {
        id: true,
      },
    });

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.length < 3) {
      return NextResponse.json(
        { error: { code: 'invalid_input', message: 'Name is required and must be at least 3 characters' } },
        { status: 400 }
      );
    }

    const apiKey = await createApiKey({
      name,
      userId: userId.id,
    });

    return NextResponse.json({ data: apiKey }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: { code: 'server_error', message: 'Failed to create API key' } },
      { status: 500 }
    );
  }
}
