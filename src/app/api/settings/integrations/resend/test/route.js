import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { integrationAccess } from "@/lib/integrations/access";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import { updateResendTestResult } from "@/lib/integrations/test-result.mjs";

export async function POST(request) {
  const access = await integrationAccess(request, { manage: true });
  if (access.response) return access.response;
  const connection = await prisma.workspaceIntegration.findUnique({ where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: "RESEND" } } });
  if (!connection) return NextResponse.json({ error: "Save a Resend connection before testing it." }, { status: 409 });
  const now = new Date();
  try {
    const resend = new Resend(decryptIntegrationSecret(connection));
    const { data, error } = await resend.emails.send({
      from: connection.fromEmail,
      to: access.user.email,
      subject: "Your Waitlyze email connection is ready",
      html: "<p>This test confirms Waitlyze can send email through the Resend connection configured for your workspace.</p>",
    }, { idempotencyKey: `waitlyze-resend-test:${connection.id}:${randomUUID()}` });
    if (error || !data?.id) throw error || new Error("Provider did not accept the test email.");
    const updated = await updateResendTestResult(prisma, connection, { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null });
    if (!updated) return NextResponse.json({ error: "The connection changed while it was being tested. Save and test it again." }, { status: 409 });
    return NextResponse.json({ data: { status: "CONNECTED", lastTestedAt: now, sentTo: access.user.email } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = typeof error?.statusCode === "number" ? `HTTP_${error.statusCode}` : error?.name === "TypeError" ? "NETWORK_ERROR" : "CONNECTION_FAILED";
    const updated = await updateResendTestResult(prisma, connection, { status: "NEEDS_ATTENTION", lastTestedAt: now, lastErrorCode: code });
    if (!updated) return NextResponse.json({ error: "The connection changed while it was being tested. Save and test it again." }, { status: 409 });
    return NextResponse.json({ error: "The test email could not be sent. Check the API key and sender address, then try again." }, { status: 502 });
  }
}
