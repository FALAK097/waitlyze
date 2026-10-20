import { NextResponse } from "next/server";

import { env } from "@/lib/env.mjs";
import { integrationAccess } from "@/lib/integrations/access";
import { encryptIntegrationSecret, encryptWebhookSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";

const PROVIDER = "RESEND";
const safeSelect = {
  id: true,
  workspaceId: true,
  provider: true,
  status: true,
  fromEmail: true,
  lastTestedAt: true,
  lastErrorCode: true,
  updatedAt: true,
  webhookSecretCiphertext: true,
};
const publicConnection = (connection) =>
  connection && {
    id: connection.id,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    status: connection.status,
    fromEmail: connection.fromEmail,
    lastTestedAt: connection.lastTestedAt,
    lastErrorCode: connection.lastErrorCode,
    updatedAt: connection.updatedAt,
    webhookConfigured: Boolean(connection.webhookSecretCiphertext),
  };

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
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY)
    return NextResponse.json({ error: "Secret encryption is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const fromEmail = typeof body.fromEmail === "string" ? body.fromEmail.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const webhookSecret = typeof body.webhookSecret === "string" ? body.webhookSecret.trim() : "";
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
    if (!apiKey && !existing)
      return NextResponse.json({ error: "Enter a Resend sending API key." }, { status: 400 });
    if (
      apiKey &&
      (!apiKey.startsWith("re_") || apiKey.length < 12 || apiKey.length > 512 || /\s/.test(apiKey))
    )
      return NextResponse.json({ error: "Enter a valid Resend API key." }, { status: 400 });
    if (
      webhookSecret &&
      (!webhookSecret.startsWith("whsec_") ||
        webhookSecret.length < 16 ||
        webhookSecret.length > 512 ||
        /\s/.test(webhookSecret))
    )
      return NextResponse.json(
        { error: "Enter the webhook signing secret from your Resend account." },
        { status: 400 },
      );
    const secret = apiKey ? encryptIntegrationSecret(apiKey) : undefined;
    const webhook = webhookSecret ? encryptWebhookSecret(webhookSecret) : undefined;
    const connection = await prisma.workspaceIntegration.upsert({
      where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: PROVIDER } },
      create: {
        workspaceId: access.workspace.id,
        provider: PROVIDER,
        fromEmail,
        ...secret,
        ...webhook,
      },
      update: { fromEmail, status: "NEEDS_TEST", lastErrorCode: null, ...secret, ...webhook },
      select: safeSelect,
    });
    await recordAuditEvent(prisma, {
      workspaceId: access.workspace.id,
      userId: access.user.id,
      action: AUDIT_ACTIONS.RESEND_CONNECTED,
      resourceType: "integration",
      resourceName: `Resend · ${fromEmail}`,
    });
    return NextResponse.json(
      { data: publicConnection(connection) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Enter valid connection details." }, { status: 400 });
    return NextResponse.json(
      { error: "Unable to save the Resend connection. Please try again." },
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
    action: AUDIT_ACTIONS.RESEND_DISCONNECTED,
    resourceType: "integration",
    resourceName: "Resend",
    detail: "Falls back to the deployment sender",
  });
  return NextResponse.json({ ok: true });
}
