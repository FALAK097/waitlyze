import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";

export async function POST(request, context) {
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
        revokedAt: null,
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

    const workspaceId = await selectedWorkspaceId(user.id);
    const waitlist = await prisma.waitList.findFirst({
      where: { id: waitlistId, ...campaignScope(user.id, "manageConnections", workspaceId || undefined) },
    });

    if (!waitlist) {
      return NextResponse.json(
        { error: { message: "Waitlist not found" } },
        { status: 404 }
      );
    }

    const updatedApiKey = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`api-key:${id}`})) IS NULL AS acquired`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${waitlistId})) IS NULL AS acquired`;
      const linkable = await tx.apiKey.findFirst({
        where: { id, userId: user.id, keyId: null, waitlistId: null, revokedAt: null },
        select: { id: true },
      });
      if (!linkable) return null;
      const active = await tx.apiKey.findFirst({ where: { waitlistId, revokedAt: null }, select: { id: true } });
      if (active) return null;
      return tx.apiKey.update({
        where: { id },
        data: { waitlistId },
        select: {
          id: true,
          name: true,
          keyId: true,
          scopes: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          waitlist: { select: { id: true, name: true } },
        },
      });
    });
    if (!updatedApiKey) return NextResponse.json({ error: { message: "This waitlist is already linked to another API key" } }, { status: 409 });
    const apiKeyWithMaskedKey = { ...updatedApiKey, key: "••••••••••••••••" };

    return NextResponse.json({ data: apiKeyWithMaskedKey });
  } catch (error) {
    console.error("Error linking API key to waitlist:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
