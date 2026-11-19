"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import { isUniqueConstraintError } from "@/lib/db/sqlite-helpers.mjs";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";
import prisma from "@/lib/prisma";
import { requireAuth, requireCampaign } from "@/lib/workspaces/authorize";

const cooldownMs = 5 * 60 * 1000;

export async function retryFailedVerification({ waitListId, signupIds }) {
  await requireAuth();
  if (
    typeof waitListId !== "string" ||
    !Array.isArray(signupIds) ||
    !signupIds.length ||
    signupIds.length > 25 ||
    signupIds.some((id) => typeof id !== "string" || !id || id.length > 128) ||
    new Set(signupIds).size !== signupIds.length
  )
    return { ok: false, message: "Select up to 25 signups on this page." };
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  if (campaign.status !== "PUBLISHED")
    return { ok: false, message: "Publish the waitlist before resending confirmation emails." };
  const results = [];
  let failures = 0;
  for (const signupId of signupIds) {
    let eventKey = null;
    try {
      const signup = await prisma.signUp.findFirst({
        where: { id: signupId, waitListId },
        select: { id: true, email: true, emailNormalized: true, verifiedAt: true },
      });
      if (signup) {
        const [latest] = await prisma.$queryRaw`
          SELECT "status", "createdAt", "lastErrorCode"
          FROM "outbox_events"
          WHERE "waitListId" = ${waitListId}
            AND "type" = 'SIGNUP_VERIFICATION_REQUESTED'
            AND json_extract("payload", '$.signUpId') = ${signupId}
          ORDER BY REPLACE("createdAt", ' ', 'T') DESC, "id" DESC
          LIMIT 1`;
        const latestCreatedAt = latest?.createdAt ? new Date(latest.createdAt) : null;
        const canRetry =
          latest &&
          latest.status === "FAILED" &&
          latest.lastErrorCode !== "RECIPIENT_SUPPRESSED" &&
          latestCreatedAt &&
          Date.now() - latestCreatedAt.getTime() >= cooldownMs;

        if (canRetry) {
          let blockedBySuppression = false;
          if (campaign.workspaceId) {
            const suppressed = await prisma.emailSuppression.findUnique({
              where: {
                workspaceId_emailNormalized: {
                  workspaceId: campaign.workspaceId,
                  emailNormalized: signup.emailNormalized || signup.email.trim().toLowerCase(),
                },
              },
              select: { id: true },
            });
            blockedBySuppression = Boolean(suppressed);
          }

          if (!blockedBySuppression) {
            const token = randomBytes(32).toString("base64url");
            const tokenHash = createHash("sha256").update(token).digest("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await prisma.signUpVerification.upsert({
              where: { signUpId: signup.id },
              create: { signUpId: signup.id, tokenHash, expiresAt },
              update: { tokenHash, expiresAt, usedAt: null },
            });
            const key = `signup.verify:${randomUUID()}`;
            try {
              await prisma.outboxEvent.create({
                data: {
                  eventKey: key,
                  type: "SIGNUP_VERIFICATION_REQUESTED",
                  waitListId,
                  payload: {
                    signUpId: signup.id,
                    waitListId,
                    email: signup.email,
                    token,
                    manualRetry: true,
                  },
                },
              });
              eventKey = key;
            } catch (err) {
              if (!isUniqueConstraintError(err)) throw err;
            }
          }
        }
      }
    } catch (error) {
      console.error("Could not retry verification delivery", error);
      failures++;
    }
    if (!eventKey) {
      results.push({ id: signupId, queued: false });
      continue;
    }
    await dispatchVerificationNow(eventKey);
    results.push({ id: signupId, queued: true });
  }
  const queued = results.filter((item) => item.queued).length;
  const skipped = results.length - queued - failures;
  if (failures)
    return {
      ok: false,
      queued,
      skipped,
      failed: failures,
      message: `Could not retry ${failures} confirmation email${failures === 1 ? "" : "s"}.${queued ? ` ${queued} other retry${queued === 1 ? " was" : "ies were"} queued.` : " Try again later."}`,
    };
  return {
    ok: true,
    queued,
    skipped,
    message: queued
      ? `Retried ${queued} confirmation email${queued === 1 ? "" : "s"}. Check the email status for the result.`
      : "No eligible failed confirmation emails. Check the status or try again later.",
  };
}
