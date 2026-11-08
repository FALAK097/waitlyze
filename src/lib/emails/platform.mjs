import { getCloudflareContext } from "@opennextjs/cloudflare";

import prisma from "@/lib/prisma";
import { SITE_SUPPORT_EMAIL } from "@/lib/site-metadata";

import {
  recordCloudflarePlatformEmail,
  releaseCloudflarePlatformEmail,
  reserveCloudflarePlatformEmail,
} from "./cloudflare-usage.mjs";

const PLATFORM_FROM = { email: "noreply@waitlyze.com", name: "Waitlyze" };
const REJECTED_WITHOUT_DELIVERY = new Set([
  "E_VALIDATION_ERROR",
  "E_FIELD_MISSING",
  "E_TOO_MANY_RECIPIENTS",
  "E_TOO_MANY_ATTACHMENTS",
  "E_SENDER_NOT_VERIFIED",
  "E_RECIPIENT_NOT_ALLOWED",
  "E_RECIPIENT_SUPPRESSED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE",
  "E_CONTENT_TOO_LARGE",
  "E_HEADER_NOT_ALLOWED",
  "E_HEADER_USE_API_FIELD",
  "E_HEADER_VALUE_INVALID",
  "E_HEADER_NAME_INVALID",
  "E_HEADERS_TOO_LARGE",
  "E_HEADERS_TOO_MANY",
  "E_RATE_LIMIT_EXCEEDED",
  "E_DAILY_LIMIT_EXCEEDED",
]);

function emailBinding() {
  let binding;
  try {
    binding = getCloudflareContext().env.EMAIL;
  } catch {
    binding = null;
  }
  if (!binding || typeof binding.send !== "function") {
    throw Object.assign(new Error("Cloudflare Email Sending is not configured."), {
      code: "EMAIL_BINDING_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return binding;
}

/** Sends Waitlyze-owned transactional email from the onboarded Cloudflare domain. */
export async function sendPlatformEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
  idempotencyKey,
}) {
  const binding = emailBinding();
  const reservation = await reserveCloudflarePlatformEmail(prisma, idempotencyKey);
  if (reservation.duplicate) return { data: { id: reservation.messageId } };

  try {
    const response = await binding.send({
      from: PLATFORM_FROM,
      to,
      subject,
      replyTo: replyTo || SITE_SUPPORT_EMAIL,
      html,
      ...(text ? { text } : {}),
      ...(attachments?.length
        ? {
            attachments: attachments.map((attachment) => ({
              content: attachment.content,
              filename: attachment.filename,
              type: attachment.contentType || "application/octet-stream",
              disposition: attachment.contentId ? "inline" : "attachment",
              ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
            })),
          }
        : {}),
    });
    if (typeof response?.messageId !== "string" || !response.messageId) {
      throw Object.assign(new Error("Cloudflare accepted no message identifier."), {
        code: "PLATFORM_EMAIL_DELIVERY_UNCERTAIN",
        statusCode: 409,
      });
    }
    await recordCloudflarePlatformEmail(prisma, reservation.key, response.messageId);
    return { data: { id: response.messageId } };
  } catch (error) {
    if (REJECTED_WITHOUT_DELIVERY.has(String(error?.code)))
      await releaseCloudflarePlatformEmail(prisma, reservation.key).catch(() => {});
    const code = error?.code || "PLATFORM_EMAIL_DELIVERY_UNCERTAIN";
    const statusCode =
      error?.statusCode ??
      (code === "E_RATE_LIMIT_EXCEEDED" || code === "E_DAILY_LIMIT_EXCEEDED" ? 429 : 409);
    throw Object.assign(
      new Error(
        code === "PLATFORM_EMAIL_DELIVERY_UNCERTAIN"
          ? "Platform email delivery outcome is uncertain."
          : `Platform email rejected: ${error?.name || "provider error"}`,
      ),
      { name: error?.name || "Error", code, statusCode },
    );
  }
}

// Dispatcher-compatible platform sender for the email outbox. Founder notices
// must never depend on a workspace's marketing-email provider.
export function createPlatformSender() {
  return async ({ to, subject, html, text, idempotencyKey }) =>
    sendPlatformEmail({ to, subject, html, text, idempotencyKey });
}
