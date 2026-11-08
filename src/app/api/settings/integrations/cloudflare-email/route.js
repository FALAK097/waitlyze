import { NextResponse } from "next/server";

import { integrationAccess } from "@/lib/integrations/access";
import { encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

const PROVIDER = "CLOUDFLARE_EMAIL";
const safeSelect = {
  id: true,
  workspaceId: true,
  status: true,
  fromEmail: true,
  providerConfig: true,
  lastTestedAt: true,
  lastErrorCode: true,
  updatedAt: true,
};

function publicConnection(connection) {
  if (!connection) return null;
  const config =
    connection.providerConfig && typeof connection.providerConfig === "object"
      ? connection.providerConfig
      : {};
  return {
    id: connection.id,
    workspaceId: connection.workspaceId,
    provider: PROVIDER,
    status: connection.status,
    fromEmail: connection.fromEmail,
    accountId: config.accountId || null,
    lastTestedAt: connection.lastTestedAt,
    lastErrorCode: connection.lastErrorCode,
    updatedAt: connection.updatedAt,
  };
}

export async function GET(request) {
  const access = await integrationAccess(request);
  if (access.response) return access.response;
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: PROVIDER } },
    select: safeSelect,
  });
  return NextResponse.json(
    { data: publicConnection(connection) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(request) {
  const access = await integrationAccess(request, { manage: true });
  if (access.response) return access.response;
  if (!process.env.WEBHOOK_SECRET_ENCRYPTION_KEY)
    return NextResponse.json({ error: "Secret encryption is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId.trim() : "";
    const apiToken = typeof body.apiToken === "string" ? body.apiToken.trim() : "";
    const fromEmail = typeof body.fromEmail === "string" ? body.fromEmail.trim() : "";
    if (!/^[a-f0-9]{32}$/i.test(accountId))
      return NextResponse.json({ error: "Enter a valid Cloudflare account ID." }, { status: 400 });
    if (
      fromEmail.length > 254 ||
      /[\r\n]/.test(fromEmail) ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail)
    )
      return NextResponse.json({ error: "Enter a valid sender email address." }, { status: 400 });

    const existing = await prisma.workspaceIntegration.findUnique({
      where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: PROVIDER } },
      select: { id: true },
    });
    if (!apiToken && !existing)
      return NextResponse.json({ error: "Enter a Cloudflare API token." }, { status: 400 });
    if (apiToken && (apiToken.length < 20 || apiToken.length > 512 || /\s/.test(apiToken)))
      return NextResponse.json({ error: "Enter a valid Cloudflare API token." }, { status: 400 });

    const secret = apiToken ? encryptIntegrationSecret(apiToken) : undefined;
    const connection = await prisma.workspaceIntegration.upsert({
      where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: PROVIDER } },
      create: {
        workspaceId: access.workspace.id,
        provider: PROVIDER,
        fromEmail,
        providerConfig: { accountId: accountId.toLowerCase() },
        ...secret,
      },
      update: {
        fromEmail,
        providerConfig: { accountId: accountId.toLowerCase() },
        status: "NEEDS_TEST",
        lastErrorCode: null,
        ...secret,
      },
      select: safeSelect,
    });
    await recordAuditEvent(prisma, {
      workspaceId: access.workspace.id,
      userId: access.user.id,
      action: AUDIT_ACTIONS.CLOUDFLARE_EMAIL_CONNECTED,
      resourceType: "integration",
      resourceName: `Cloudflare Email · ${fromEmail}`,
    });
    return NextResponse.json(
      { data: publicConnection(connection) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Enter valid connection details." }, { status: 400 });
    return NextResponse.json(
      { error: "Unable to save the Cloudflare Email connection. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const access = await integrationAccess(request, { manage: true });
  if (access.response) return access.response;
  await prisma.workspaceIntegration.deleteMany({
    where: { workspaceId: access.workspace.id, provider: PROVIDER },
  });
  await recordAuditEvent(prisma, {
    workspaceId: access.workspace.id,
    userId: access.user.id,
    action: AUDIT_ACTIONS.CLOUDFLARE_EMAIL_DISCONNECTED,
    resourceType: "integration",
    resourceName: "Cloudflare Email",
    detail: "Transactional confirmation email falls back to the Waitlyze sender",
  });
  return NextResponse.json({ ok: true });
}
