"use server";

import { headers } from "next/headers";
import sharp from "sharp";

import { renderFeedbackEmail } from "@/emails/render.jsx";
import { auth } from "@/lib/auth";
import { sendPlatformEmail } from "@/lib/emails/platform.mjs";
import { checkRateLimit } from "@/lib/rate-limit";

const FEEDBACK_INBOX = "hi@falakgala.dev";
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
const MAX_PROCESSED_IMAGE_BYTES = 8 * 1024 * 1024;

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
  if (!checkRateLimit(session.user.id, 10, 60 * 60 * 1000)) {
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
      const metadata = await sharp(source, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
      if (metadata.format !== expectedFormat)
        return { error: "The screenshot file does not match its image type." };
      const verifiedImage = await sharp(source, { limitInputPixels: MAX_IMAGE_PIXELS })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      if (verifiedImage.byteLength > MAX_PROCESSED_IMAGE_BYTES)
        return { error: "The processed screenshot is too large to attach." };
      attachment = {
        filename: "feedback-screenshot.png",
        content: verifiedImage.toString("base64"),
        contentType: "image/png",
        contentId: "feedback-screenshot",
      };
    } catch {
      return { error: "That file couldn't be decoded as a supported image." };
    }
  }

  const html = await renderFeedbackEmail({
    name: session.user.name || "Waitlyze user",
    email: session.user.email,
    title,
    label,
    feedback,
    page,
    submittedAt: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }),
    hasImage: Boolean(attachment),
  });

  try {
    await sendPlatformEmail({
      to: FEEDBACK_INBOX,
      subject: `[Waitlyze feedback] ${label}: ${title}`,
      html,
      replyTo: session.user.email,
      attachments: attachment ? [attachment] : undefined,
    });
  } catch {
    return { error: "Couldn't send your feedback right now. Try again in a moment." };
  }

  return { success: "Thanks — your feedback is on its way." };
}
