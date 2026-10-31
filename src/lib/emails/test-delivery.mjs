import "server-only";
import { Resend } from "resend";

import { env } from "@/lib/env.mjs";
import { resolveWorkspaceEmailSender } from "@/lib/integrations/email-sender.mjs";
import prisma from "@/lib/prisma";
import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";
import { requireCampaign } from "@/lib/workspaces/authorize";

const platformSender = {
  apiKey: env.RESEND_API_KEY,
  fromEmail: env.RESEND_FROM_EMAIL,
  replyTo: env.RESEND_REPLY_TO,
};

const TEST_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Prefer a verified workspace provider, with the platform sender as fallback.
export async function senderForWaitlist(waitListId) {
  const waitlist = await prisma.waitList.findUnique({
    where: { id: waitListId },
    select: { workspaceId: true },
  });
  const provider = await resolveWorkspaceEmailSender(prisma, waitlist?.workspaceId, null);
  return provider || platformSender;
}

export async function deliverTestEmail({
  waitListId,
  to,
  waitlistSelect,
  validate,
  prepareEmail,
  successMessage,
}) {
  if (typeof to !== "string" || to.length > 320 || !TEST_ADDRESS_PATTERN.test(to)) {
    return { success: false, message: "Enter one valid test email address." };
  }
  if (!env.RESEND_API_KEY) return { success: false, message: "RESEND_API_KEY not configured" };

  const validationError = validate?.();
  if (validationError) return { success: false, message: validationError };

  try {
    const { user, campaign, scope } = await requireCampaign(waitListId, "sendEmail");
    await consumePublicBudget(prisma, {
      kind: "testEmail",
      campaignId: campaign.workspaceId || campaign.id,
      actorId: user.id,
      email: to,
    });

    const waitList = await prisma.waitList.findFirst({
      where: { id: waitListId, ...scope },
      select: waitlistSelect,
    });
    if (!waitList) return { success: false, message: "Waitlist not found" };

    const prepared = await prepareEmail({ waitList, scope });
    if (prepared.error) return { success: false, message: prepared.error };

    const provider = await senderForWaitlist(waitListId);
    const { error } = await new Resend(provider.apiKey).emails.send({
      from: provider.fromEmail,
      to,
      replyTo: provider.replyTo,
      ...prepared.email,
    });
    if (error) return { success: false, message: `Resend error: ${error.name} ${error.message}` };

    return { success: true, message: successMessage(to) };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to send email" };
  }
}
