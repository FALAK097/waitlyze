import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { integrationAccess } from "@/lib/integrations/access";
import { sendCloudflareEmail } from "@/lib/integrations/cloudflare-email-sender.mjs";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";

const PROVIDER = "CLOUDFLARE_EMAIL";

export async function POST(request) {
  const access = await integrationAccess(request, { manage: true });
  if (access.response) return access.response;
  const session = await auth.api.getSession({ headers: request.headers });
  const recipient = session?.user?.email;
  if (!recipient)
    return NextResponse.json({ error: "Unable to test without a session email." }, { status: 409 });

  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: PROVIDER } },
  });
  if (!connection)
    return NextResponse.json(
      { error: "Save a Cloudflare Email connection before testing it." },
      { status: 409 },
    );

  let apiToken;
  try {
    apiToken = decryptIntegrationSecret(connection);
  } catch {
    // Version guard: never clobber a row another admin changed while this
    // test was decrypting the old secret.
    await prisma.workspaceIntegration.updateMany({
      where: { id: connection.id, updatedAt: connection.updatedAt },
      data: { status: "NEEDS_ATTENTION", lastErrorCode: "SECRET_DECRYPTION_FAILED" },
    });
    return NextResponse.json(
      { error: "The Cloudflare Email connection needs attention. Save it again and retest." },
      { status: 503 },
    );
  }

  const accountId = connection.providerConfig?.accountId;
  const now = new Date();
  try {
    const result = await sendCloudflareEmail({
      accountId,
      apiToken,
      fromEmail: connection.fromEmail,
      replyTo: connection.fromEmail,
      to: recipient,
      subject: "Your Cloudflare Email sender is ready",
      html: "<p>This test confirms the Cloudflare Email Sending account configured for your workspace is ready for transactional confirmation messages.</p>",
      text: "This test confirms the Cloudflare Email Sending account configured for your workspace is ready for transactional confirmation messages.",
    });
    // Version guard: the predicate covers status, sender address, secret, and
    // providerConfig (account ID). If the row changed while the test was in
    // flight - a save, a replacement token, or another test - the result of
    // testing the old values must not overwrite the newer state.
    const updated = await prisma.workspaceIntegration.updateMany({
      where: { id: connection.id, updatedAt: connection.updatedAt },
      data: { status: "CONNECTED", lastTestedAt: now, lastErrorCode: null },
    });
    if (!updated.count)
      return NextResponse.json(
        {
          error:
            "The Cloudflare Email connection changed while it was being tested. Save and test again.",
        },
        { status: 409 },
      );
    return NextResponse.json(
      {
        data: {
          status: "CONNECTED",
          lastTestedAt: now,
          sentTo: recipient,
          messageId: result.data.id,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code =
      String(error?.code || error?.name || "CONNECTION_FAILED")
        .replace(/[^A-Za-z0-9_.-]/g, "")
        .slice(0, 80) || "CONNECTION_FAILED";
    // Version guard: a slow failing test must not mark replacement
    // credentials NEEDS_ATTENTION after another admin tested them.
    const failed = await prisma.workspaceIntegration.updateMany({
      where: { id: connection.id, updatedAt: connection.updatedAt },
      data: { status: "NEEDS_ATTENTION", lastTestedAt: now, lastErrorCode: code },
    });
    if (!failed.count)
      return NextResponse.json(
        {
          error:
            "The Cloudflare Email connection changed while it was being tested. Save and test again.",
        },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          "The test email could not be sent. Check the Cloudflare API token, onboarded sending domain, and sender address, then try again.",
      },
      { status: 502 },
    );
  }
}
