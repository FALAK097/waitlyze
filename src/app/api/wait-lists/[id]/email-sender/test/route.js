import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { auth } from "@/lib/auth";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";

// Proves the per-waitlist BYOK sender end-to-end: decrypts the waitlist's own
// key, sends a real test email through the founder's Resend account, and only
// then marks the sender CONNECTED so resolution prefers it. Until a test
// succeeds the waitlist keeps using the workspace sender (failover, not
// fail-silent: a broken CONNECTED sender fails closed via the seam).
export async function POST(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const session = await auth.api.getSession({ headers: request.headers });
  const recipient = session?.user?.email;
  if (!recipient)
    return NextResponse.json({ error: "Unable to test without a session email." }, { status: 409 });
  const sender = await prisma.waitlistEmailSender.findUnique({ where: { waitListId: id } });
  if (!sender)
    return NextResponse.json(
      { error: "Save a waitlist sender before testing it." },
      { status: 409 },
    );
  let apiKey;
  try {
    apiKey = decryptIntegrationSecret(sender);
  } catch {
    await prisma.waitlistEmailSender.update({
      where: { id: sender.id },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    return NextResponse.json(
      { error: "The waitlist sender needs attention. Save it again and retest." },
      { status: 503 },
    );
  }
  const now = new Date();
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: sender.fromEmail,
        to: recipient,
        subject: "Your Waitlyze waitlist sender is ready",
        html: "<p>This test confirms Waitlyze can send email for this waitlist through its own Resend connection.</p>",
      },
      { idempotencyKey: `waitlyze-waitlist-sender-test:${sender.id}:${randomUUID()}` },
    );
    if (error || !data?.id) throw error || new Error("Provider did not accept the test email.");
    const updated = await prisma.waitlistEmailSender.updateMany({
      where: {
        id: sender.id,
        status: sender.status,
        fromEmail: sender.fromEmail,
        secretCiphertext: sender.secretCiphertext,
        secretIv: sender.secretIv,
        secretTag: sender.secretTag,
      },
      data: { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null },
    });
    if (!updated.count)
      return NextResponse.json(
        { error: "The sender changed while it was being tested. Save and test it again." },
        { status: 409 },
      );
    return NextResponse.json(
      { data: { status: "CONNECTED", lastTestedAt: now, sentTo: recipient } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code =
      typeof error?.statusCode === "number"
        ? `HTTP_${error.statusCode}`
        : error?.name === "TypeError"
          ? "NETWORK_ERROR"
          : "CONNECTION_FAILED";
    await prisma.waitlistEmailSender.updateMany({
      where: { id: sender.id },
      data: { status: "NEEDS_ATTENTION", lastTestedAt: now, lastErrorCode: code },
    });
    return NextResponse.json(
      {
        error:
          "The test email could not be sent. Check the API key and sender address, then try again.",
      },
      { status: 502 },
    );
  }
}
