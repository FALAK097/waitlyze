"use server";

import { imageSize } from "image-size";
import { headers } from "next/headers";

import { renderFeedbackEmail } from "@/emails/render.jsx";
import { feedbackText } from "@/emails/text.mjs";
import { auth } from "@/lib/auth";
import { sendPlatformEmail } from "@/lib/emails/platform.mjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_SUPPORT_EMAIL } from "@/lib/site-metadata";

const FEEDBACK_INBOX = SITE_SUPPORT_EMAIL;
const FEEDBACK_LABELS = new Set([
  "Idea",
  "Issue",
  "Question",
  "Feature Request",
  "Complaint",
  "Other",
]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_FORMATS = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_PIXELS = 20_000_000;

/** Validates and emails signed-in product feedback with an optional image attachment. */
export async function submitFeedback(previous, formData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || !session.user.email)
    return { error: "Sign in again to send feedback." };

  const titleValue = formData.get("title");
  const labelValue = formData.get("label");
  const feedbackValue = formData.get("feedback");
  const pageValue = formData.get("page");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const label = typeof labelValue === "string" ? labelValue.trim() : "";
  const feedback = typeof feedbackValue === "string" ? feedbackValue.trim() : "";
  const page = typeof pageValue === "string" ? pageValue.trim().slice(0, 500) : "";

  if (title.length < 3 || title.length > 150)
    return { error: "Enter a title between 3 and 150 characters." };
  if (!FEEDBACK_LABELS.has(label)) return { error: "Choose a feedback type." };
  if (feedback.length < 10 || feedback.length > 5000)
    return { error: "Feedback must be between 10 and 5000 characters." };
  let feedbackAllowed;
  try {
    feedbackAllowed = await checkRateLimit(prisma, session.user.id, 10, 60 * 60 * 1000);
  } catch {
    return { error: "Feedback sending is temporarily unavailable. Try again shortly." };
  }
  if (!feedbackAllowed) {
    return { error: "You've sent several feedback messages recently. Try again in an hour." };
  }

  const image = formData.get("image");
  let attachment;
  if (image instanceof File && image.size > 0) {
    const expectedFormat = IMAGE_FORMATS[image.type];
    if (!expectedFormat) return { error: "Screenshots must be PNG, JPEG, WebP, or GIF images." };
    if (image.size > MAX_IMAGE_BYTES) return { error: "Keep screenshots under 3 MB." };
    try {
      const source = Buffer.from(await image.arrayBuffer());
      const metadata = imageSize(source);
      const expectedType = expectedFormat === "jpeg" ? "jpg" : expectedFormat;
      if (
        metadata.type !== expectedType ||
        !Number.isInteger(metadata.width) ||
        !Number.isInteger(metadata.height) ||
        metadata.width <= 0 ||
        metadata.height <= 0 ||
        metadata.width * metadata.height > MAX_IMAGE_PIXELS
      )
        return { error: "The screenshot file does not match its image type." };
      const extension = expectedType;
      attachment = {
        filename: `feedback-screenshot.${extension}`,
        content: source.toString("base64"),
        contentType: expectedFormat === "jpeg" ? "image/jpeg" : image.type,
        contentId: "feedback-screenshot",
      };
    } catch {
      return { error: "That file couldn't be decoded as a supported image." };
    }
  }

  const submittedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const emailProps = {
    name: session.user.name || "Waitlyze user",
    email: session.user.email,
    title,
    label,
    feedback,
    page,
    submittedAt,
    hasImage: Boolean(attachment),
  };
  const html = await renderFeedbackEmail(emailProps);

  try {
    await sendPlatformEmail({
      to: FEEDBACK_INBOX,
      subject: `[Waitlyze feedback] ${label}: ${title}`,
      html,
      text: feedbackText(emailProps),
      replyTo: session.user.email,
      attachments: attachment ? [attachment] : undefined,
    });
  } catch {
    return { error: "Couldn't send your feedback right now. Try again in a moment." };
  }

  return { success: "Thanks - your feedback is on its way." };
}
