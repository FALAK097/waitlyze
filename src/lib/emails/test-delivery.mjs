import "server-only";
import { Resend } from "resend";

import {
  CustomerSenderNotConnectedError,
  resolveEmailSender,
} from "@/lib/email/sender-resolution.mjs";
import prisma from "@/lib/prisma";
import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";
import { requireCampaignFeature } from "@/lib/workspaces/authorize";

const TEST_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A waitlist override takes precedence over the workspace sender. Subscriber
// email tests never use Waitlyze's deployment Resend credentials.
export async function senderForWaitlist(waitListId) {
  const waitlist = await prisma.waitList.findUnique({
    where: { id: waitListId },
    select: { workspaceId: true },
  });
  return resolveEmailSender(prisma, {
    waitListId,
    workspaceId: waitlist?.workspaceId,
  });
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
  const validationError = validate?.();
  if (validationError) return { success: false, message: validationError };

  try {
    const { user, campaign, scope } = await requireCampaignFeature(
      waitListId,
      "sendEmail",
      "emailMarketing",
    );
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
    if (!provider?.apiKey) return { success: false, message: "Email sender not configured" };
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
    if (error?.code === "SENDER_NEEDS_ATTENTION")
      return {
        success: false,
        message: "The email sender needs attention. Update or remove it in settings.",
      };
    if (error instanceof CustomerSenderNotConnectedError)
      return {
        success: false,
        message: "Connect a Resend sender before sending subscriber email.",
      };
    return { success: false, message: "Failed to send email" };
  }
}
