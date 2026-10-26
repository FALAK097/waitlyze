import { NextResponse } from "next/server";

import { integrationAccess } from "@/lib/integrations/access";
import { listResendDomains } from "@/lib/integrations/resend-domains.mjs";
import { decryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import prisma from "@/lib/prisma";

// Lists the domains on the workspace's connected Resend account so founders
// can pick a verified sending domain. The stored key is decrypted in memory
// only and never logged or returned.
export async function GET(request) {
  const access = await integrationAccess(request);
  if (access.response) return access.response;
  const connection = await prisma.workspaceIntegration.findUnique({
    where: { workspaceId_provider: { workspaceId: access.workspace.id, provider: "RESEND" } },
  });
  if (!connection)
    return NextResponse.json({ error: "Connect a Resend account first." }, { status: 409 });
  let apiKey;
  try {
    apiKey = decryptIntegrationSecret(connection);
  } catch {
    return NextResponse.json(
      { error: "The connected sender needs attention. Reconnect and try again." },
      { status: 503 },
    );
  }
  try {
    const domains = await listResendDomains(apiKey);
    return NextResponse.json({ data: domains }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to list domains." },
      { status: 502 },
    );
  }
}
