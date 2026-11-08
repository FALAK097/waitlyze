import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { dispatchPendingOutboxEvents } from "@/lib/email/outbox.mjs";
import { createPlatformSender } from "@/lib/emails/platform.mjs";
import { env } from "@/lib/env.mjs";
import { createWorkspaceResendSender } from "@/lib/integrations/resend-sender.mjs";
import { createTransactionalEmailSender } from "@/lib/integrations/transactional-email-sender.mjs";
import prisma from "@/lib/prisma";
import { dispatchPendingWebhooks } from "@/lib/webhooks/delivery.mjs";

export const runtime = "nodejs";

const BATCH_SIZE = 40;
const MAX_BATCHES = 10;
const DRAIN_BUDGET_MS = 25_000;

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !/^Bearer\s+/i.test(request.headers.get("authorization") || "")) return false;
  const suppliedBytes = Buffer.from(supplied);
  const secretBytes = Buffer.from(secret);
  return suppliedBytes.length === secretBytes.length && timingSafeEqual(suppliedBytes, secretBytes);
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const started = Date.now();
  const sendEmail = createWorkspaceResendSender({
    db: prisma,
    defaults: null,
    createClient: (apiKey) => new Resend(apiKey),
  });
  const sendPlatform = createPlatformSender();
  const sendVerification = createTransactionalEmailSender({ db: prisma });
  // Drain several small batches rather than claiming the entire queue at
  // once. Finish in-flight sends before returning, even when the budget is up.
  async function drainEmail() {
    const result = { accepted: 0, retried: 0, failed: 0, skipped: 0, claimed: 0, batches: 0 };
    while (result.batches < MAX_BATCHES && Date.now() - started < DRAIN_BUDGET_MS) {
      const batch = await dispatchPendingOutboxEvents(prisma, {
        send: sendEmail,
        sendVerification,
        sendPlatform,
        batchSize: BATCH_SIZE,
        sweepScheduled: result.batches === 0,
      });
      result.batches++;
      for (const key of ["accepted", "retried", "failed", "skipped", "claimed"])
        result[key] += batch[key];
      // No more due events, or another dispatcher won all the claims.
      if (batch.claimed === 0 || batch.claimed < BATCH_SIZE) break;
    }
    return result;
  }
  async function drainChat() {
    const result = { accepted: 0, retried: 0, failed: 0, skipped: 0, claimed: 0, batches: 0 };
    while (result.batches < 4 && Date.now() - started < DRAIN_BUDGET_MS) {
      const batch = await dispatchPendingOutboxEvents(prisma, {
        send: sendEmail,
        sendVerification,
        sendPlatform,
        chatOnly: true,
        sweepScheduled: false,
        batchSize: 20,
        concurrency: 2,
      });
      result.batches++;
      for (const key of ["accepted", "retried", "failed", "skipped", "claimed"])
        result[key] += batch[key];
      if (batch.claimed < 20) break;
    }
    return result;
  }
  // Email, chat, and webhook drains have independent capacity. Wait for all
  // before surfacing a failure so neither queue is left unobserved.
  const [outboxResult, chatResult, webhooksResult] = await Promise.allSettled([
    drainEmail(),
    drainChat(),
    dispatchPendingWebhooks(prisma),
  ]);
  if (outboxResult.status === "rejected") throw outboxResult.reason;
  if (chatResult.status === "rejected") throw chatResult.reason;
  if (webhooksResult.status === "rejected") throw webhooksResult.reason;
  const pendingCount = await prisma.outboxEvent.count({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
  });
  return NextResponse.json({
    ...outboxResult.value,
    pendingCount,
    durationMs: Date.now() - started,
    chat: chatResult.value,
    webhooks: webhooksResult.value,
  });
}
