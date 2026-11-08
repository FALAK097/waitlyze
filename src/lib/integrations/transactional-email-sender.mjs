import { Resend } from "resend";

import { resolveTransactionalEmailSender } from "@/lib/email/sender-resolution.mjs";
import { sendPlatformEmail } from "@/lib/emails/platform.mjs";
import { sendCloudflareEmail } from "@/lib/integrations/cloudflare-email-sender.mjs";
import prisma from "@/lib/prisma";
import { SITE_SUPPORT_EMAIL } from "@/lib/site-metadata";

/** Signup confirmation mail may use a customer's configured transactional sender. */
export function createTransactionalEmailSender({ db = prisma } = {}) {
  return async ({ to, subject, html, text, headers, idempotencyKey, workspaceId, waitListId }) => {
    const provider = await resolveTransactionalEmailSender(db, {
      workspaceId,
      waitListId,
      platformSender: true,
    });

    if (provider.provider === "PLATFORM_CLOUDFLARE")
      return sendPlatformEmail({ to, subject, html, text, idempotencyKey });

    if (provider.provider === "CLOUDFLARE_EMAIL")
      return sendCloudflareEmail({
        accountId: provider.accountId,
        apiToken: provider.apiToken,
        fromEmail: provider.fromEmail,
        replyTo: provider.replyTo,
        to,
        subject,
        html,
        text,
      });

    const { data, error } = await new Resend(provider.apiKey).emails.send(
      {
        from: provider.fromEmail,
        to,
        subject,
        replyTo: provider.replyTo || SITE_SUPPORT_EMAIL,
        html,
        ...(text ? { text } : {}),
        ...(headers ? { headers } : {}),
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    return { data, error };
  };
}
