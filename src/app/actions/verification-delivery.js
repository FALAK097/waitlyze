"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { dispatchVerificationNow } from "@/lib/email/dispatch-now.mjs";

const cooldownMs = 5 * 60 * 1000;

export async function retryFailedVerification({ waitListId, signupIds }) {
  if (typeof waitListId !== "string" || !Array.isArray(signupIds) || !signupIds.length || signupIds.length > 25 || signupIds.some((id) => typeof id !== "string" || !id || id.length > 128) || new Set(signupIds).size !== signupIds.length) return { ok: false, message: "Select up to 25 signups on this page." };
  const { campaign } = await requireCampaign(waitListId, "sendEmail");
  if (campaign.status !== "PUBLISHED") return { ok: false, message: "Publish the waitlist before resending confirmation emails." };
  const results = [];
  let failures = 0;
  for (const signupId of signupIds) {
    let eventKey;
    try {
      eventKey = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "sign_ups" WHERE "id" = ${signupId} AND "waitListId" = ${waitListId} FOR UPDATE`;
        const signup = await tx.signUp.findFirst({ where: { id: signupId, waitListId, verifiedAt: null }, select: { id: true, email: true, emailNormalized: true } });
        if (!signup) return null;
        const [latest] = await tx.outboxEvent.findMany({ where: { waitListId, type: "SIGNUP_VERIFICATION_REQUESTED", payload: { path: ["signUpId"], equals: signupId } }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true, createdAt: true, lastErrorCode: true } });
        if (!latest || latest.status !== "FAILED" || ["SIGNUP_NOT_SENDABLE", "RECIPIENT_SUPPRESSED"].includes(latest.lastErrorCode) || Date.now() - latest.createdAt.getTime() < cooldownMs) return null;
        if (campaign.workspaceId) {
          const suppressed = await tx.emailSuppression.findUnique({ where: { workspaceId_emailNormalized: { workspaceId: campaign.workspaceId, emailNormalized: signup.emailNormalized || signup.email.toLowerCase() } }, select: { id: true } });
          if (suppressed) return null;
        }
        const token = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await tx.signUpVerification.upsert({
          where: { signUpId: signup.id },
          create: { signUpId: signup.id, tokenHash, expiresAt },
          update: { tokenHash, expiresAt, usedAt: null },
        });
        const key = `signup.verify:${randomUUID()}`;
        await tx.outboxEvent.create({ data: { eventKey: key, type: "SIGNUP_VERIFICATION_REQUESTED", waitListId, payload: { signUpId: signup.id, waitListId, email: signup.email, token } } });
        return key;
      });
    } catch (error) {
      console.error("Could not retry verification delivery", error);
      failures++;
    }
    if (!eventKey) { results.push({ id: signupId, queued: false }); continue; }
    await dispatchVerificationNow(eventKey);
    results.push({ id: signupId, queued: true });
  }
  const queued = results.filter((item) => item.queued).length;
  const skipped = results.length - queued - failures;
  if (failures) return { ok: false, queued, skipped, failed: failures, message: `Could not retry ${failures} confirmation email${failures === 1 ? "" : "s"}.${queued ? ` ${queued} other retry${queued === 1 ? " was" : "ies were"} queued.` : " Try again later."}` };
  return { ok: true, queued, skipped, message: queued ? `Retried ${queued} confirmation email${queued === 1 ? "" : "s"}. Check the email status for the result.` : "No eligible failed confirmation emails. Check the status or try again later." };
}
