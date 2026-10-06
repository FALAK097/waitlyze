import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import prisma from '@/lib/prisma';
import { createApiKey } from '@/services/api-key';
import { campaignScope } from "@/lib/workspaces/service.mjs";

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

    const { name, waitlistId, expiresInDays = 90 } = await request.json();

    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 64) {
      return NextResponse.json(
        { error: { message: 'Name must be between 3 and 64 characters' } },
        { status: 400 }
      );
    }

    if (!waitlistId) {
      return NextResponse.json(
        { error: { message: 'Waitlist ID is required' } },
        { status: 400 }
      );
    }

    if (![30, 90, 365, null].includes(expiresInDays)) {
      return NextResponse.json({ error: { message: 'Choose an expiry of 30, 90, 365 days, or no expiry' } }, { status: 400 });
    }

    const workspaceId = (await cookies()).get("waitlyze-workspace")?.value;
    const waitlist = await prisma.waitList.findFirst({
      where: { id: waitlistId, ...campaignScope(user.id, "manageConnections", workspaceId || undefined) },
      select: { id: true, name: true, workspaceId: true },
    });

    if (!waitlist) {
      return NextResponse.json(
        { error: { message: 'Waitlist not found' } },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize key creation for this waitlist so concurrent requests cannot both pass the check.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${waitlistId})) IS NULL AS acquired`;
      const existing = await tx.apiKey.findFirst({ where: { waitlistId, revokedAt: null }, select: { id: true } });
      if (existing) return { conflict: true };
      const apiKey = await createApiKey({
        name: name.trim(),
        userId: user.id,
        waitlistId,
        expiresAt: expiresInDays === null ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        scopes: ["waitlist:write"],
        db: tx,
      });
      return { apiKey };
    });

    if (result.conflict) {
      return NextResponse.json({ error: { message: 'This waitlist is already linked to another API key' } }, { status: 409 });
    }
    const newApiKey = result.apiKey;

    const responseData = {
      apiKey: {
        ...newApiKey,
        key: "••••••••••••••••",
        apiKey: newApiKey.apiKey,
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
