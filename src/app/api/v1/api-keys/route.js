import { NextResponse } from "next/server";
import { listUserApiKeys } from "@/services/api-key";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export async function GET() {
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

    const workspaceId = (await cookies()).get("waitlyze-workspace")?.value;
    const waitlists = await prisma.waitList.findMany({
      where: campaignScope(user.id, "manageConnections", workspaceId || undefined),
      select: { id: true },
    });
    const apiKeys = await listUserApiKeys(user.id, waitlists.map(({ id }) => id));

    const apiKeysWithMaskedKeys = apiKeys.map(({ id, name, keyId, scopes, expiresAt, lastUsedAt, createdAt, waitlist }) => ({
      id, name, keyId, scopes, expiresAt, lastUsedAt, createdAt, waitlist, key: "••••••••••••••••",
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
