import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { resolveEmailSender } from "@/lib/email/sender-resolution.mjs";
import { env } from "@/lib/env.mjs";
import { encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";

async function actorUserId(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

const safeSelect = {
  id: true,
  waitListId: true,
  status: true,
  fromEmail: true,
  lastTestedAt: true,
  lastErrorCode: true,
  updatedAt: true,
};

function validateSenderInput(fromEmail, apiKey, { keyRequired }) {
  if (
    fromEmail.length > 254 ||
    /[\r\n]/.test(fromEmail) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail)
  )
    return "Enter a valid sender email address.";
  if (!apiKey && keyRequired) return "Enter a Resend sending API key.";
  if (
    apiKey &&
    (!apiKey.startsWith("re_") || apiKey.length < 12 || apiKey.length > 512 || /\s/.test(apiKey))
  )
    return "Enter a valid Resend API key.";
  return null;
}

// Per-waitlist BYOK sender. A CONNECTED row here wins over the workspace
// connection (see sender-resolution.mjs); deleting it falls back to the
// workspace sender, then the deployment default.
export async function GET(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id, "viewCampaign");
  if (access.response) return access.response;
  const [sender, waitList] = await Promise.all([
    prisma.waitlistEmailSender.findUnique({ where: { waitListId: id }, select: safeSelect }),
    prisma.waitList.findUnique({
      where: { id },
      select: { workspaceId: true },
    }),
  ]);
  let resolved = null;
  try {
    const provider = await resolveEmailSender(prisma, {
      workspaceId: waitList?.workspaceId,
      waitListId: id,
      defaults: { apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL },
    });
    if (provider) resolved = { source: provider.source, fromEmail: provider.fromEmail };
  } catch {
    resolved = { source: "needs-attention", fromEmail: sender?.fromEmail || null };
  }
  return NextResponse.json(
    { data: sender, resolved },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY)
    return NextResponse.json({ error: "Secret encryption is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const fromEmail = typeof body.fromEmail === "string" ? body.fromEmail.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const existing = await prisma.waitlistEmailSender.findUnique({
      where: { waitListId: id },
      select: { id: true },
    });
    const invalid = validateSenderInput(fromEmail, apiKey, { keyRequired: !existing });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    const secret = apiKey ? encryptIntegrationSecret(apiKey) : undefined;
    const sender = await prisma.waitlistEmailSender.upsert({
      where: { waitListId: id },
      create: { waitListId: id, fromEmail, ...secret },
      update: { fromEmail, status: "NEEDS_TEST", lastErrorCode: null, ...secret },
      select: safeSelect,
    });
    await recordWaitlistAuditEvent(prisma, {
      userId: await actorUserId(request),
      waitListId: id,
      action: AUDIT_ACTIONS.WAITLIST_SENDER_CONNECTED,
      resourceType: "waitlist_sender",
      resourceName: fromEmail,
    });
    return NextResponse.json({ data: sender }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Enter valid sender details." }, { status: 400 });
    return NextResponse.json(
      { error: "Unable to save the waitlist sender. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  await prisma.waitlistEmailSender.deleteMany({ where: { waitListId: id } });
  await recordWaitlistAuditEvent(prisma, {
    userId: await actorUserId(request),
    waitListId: id,
    action: AUDIT_ACTIONS.WAITLIST_SENDER_DISCONNECTED,
    resourceType: "waitlist_sender",
    detail: "Falls back to the workspace sender",
  });
  return NextResponse.json({ ok: true });
}
