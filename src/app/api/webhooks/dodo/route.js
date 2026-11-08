import { NextResponse } from "next/server";

import {
  createDodoClient,
  dodoBillingInterval,
  DodoConfigurationError,
} from "@/lib/billing/dodo.mjs";
import { subscriptionWebhookStatus } from "@/lib/billing/subscription-webhook-status.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.active",
  "subscription.updated",
  "subscription.past_due",
  "subscription.on_hold",
  "subscription.paused",
  "subscription.unpaused",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.failed",
  "subscription.expired",
]);

function validDate(value) {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function eventWorkspaceId(data) {
  const metadata = data?.metadata || {};
  const value = metadata.workspaceId || metadata.workspace_id;
  return typeof value === "string" && value ? value : null;
}

async function readRawBody(request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES)
    throw new RangeError("Webhook body is too large.");
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_WEBHOOK_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("Webhook body is too large.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function POST(request) {
  let client;
  try {
    client = createDodoClient({ requireWebhookKey: true });
  } catch (error) {
    if (error instanceof DodoConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json(
      { error: "Dodo webhook verification is not configured." },
      { status: 503 },
    );
  }

  const webhookId = request.headers.get("webhook-id");
  const signature = request.headers.get("webhook-signature");
  const timestamp = request.headers.get("webhook-timestamp");
  if (!webhookId || !signature || !timestamp)
    return NextResponse.json({ error: "Missing webhook signature headers." }, { status: 400 });

  let event;
  try {
    const rawBody = await readRawBody(request);
    event = client.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": signature,
        "webhook-timestamp": timestamp,
      },
    });
  } catch (error) {
    if (error instanceof RangeError)
      return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const type = event?.type;
  const data = event?.data || {};
  try {
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.dodoWebhookReceipt.createMany({
        data: [
          {
            webhookId,
            eventType: String(type || "unknown"),
            workspaceId: eventWorkspaceId(data),
          },
        ],
        skipDuplicates: true,
      });
      if (claimed.count === 0) return { duplicate: true };

      if (!SUBSCRIPTION_EVENTS.has(type)) return;
      const subscriptionId = data.subscription_id;
      if (typeof subscriptionId !== "string" || !subscriptionId) return;

      const candidateSubscription = await tx.workspaceSubscription.findFirst({
        where: { dodoSubscriptionId: subscriptionId },
      });
      const workspaceId = eventWorkspaceId(data) || candidateSubscription?.workspaceId;
      if (!workspaceId) throw new TypeError("Subscription webhook is missing workspace metadata.");
      const lockedWorkspace =
        await tx.$queryRaw`SELECT "id" FROM "workspaces" WHERE "id" = ${workspaceId} FOR UPDATE`;
      if (lockedWorkspace.length === 0) return;

      const [existing, workspaceSubscription] = await Promise.all([
        tx.workspaceSubscription.findFirst({ where: { dodoSubscriptionId: subscriptionId } }),
        tx.workspaceSubscription.findUnique({ where: { workspaceId } }),
      ]);
      if (existing?.workspaceId && existing.workspaceId !== workspaceId)
        throw new TypeError(
          "Subscription webhook workspace does not match its stored subscription.",
        );
      const eventCheckoutIntentId =
        typeof data.metadata?.checkoutIntentId === "string" ? data.metadata.checkoutIntentId : null;
      const matchesPendingCheckout =
        Boolean(eventCheckoutIntentId) &&
        workspaceSubscription?.checkoutIntentId === eventCheckoutIntentId;
      if (workspaceSubscription?.checkoutIntentId && !matchesPendingCheckout) return;
      if (
        workspaceSubscription?.dodoSubscriptionId &&
        workspaceSubscription.dodoSubscriptionId !== subscriptionId &&
        !matchesPendingCheckout
      )
        return;

      const suppliedProductId = typeof data.product_id === "string" ? data.product_id : null;
      const productId = suppliedProductId || existing?.dodoProductId || null;
      if (!productId) throw new TypeError("Subscription webhook is missing a product identifier.");
      const productInterval = dodoBillingInterval(productId);
      const historicalInterval =
        suppliedProductId && suppliedProductId === existing?.dodoProductId && existing?.interval
          ? existing.interval
          : null;
      const interval =
        productInterval || historicalInterval || (suppliedProductId ? null : existing?.interval);

      const eventAt = validDate(event.timestamp) || new Date();
      if (existing?.lastEventAt && existing.lastEventAt > eventAt) return;

      const customerId = data.customer?.customer_id || existing?.dodoCustomerId;
      const currentPeriodStart =
        validDate(data.previous_billing_date) ||
        validDate(data.created_at) ||
        existing?.currentPeriodStart ||
        eventAt;
      const currentPeriodEnd =
        validDate(data.next_billing_date) ||
        validDate(data.current_period_end) ||
        existing?.currentPeriodEnd ||
        null;
      const cancelAtPeriodEnd =
        typeof data.cancel_at_next_billing_date === "boolean"
          ? data.cancel_at_next_billing_date
          : existing?.cancelAtPeriodEnd || false;
      const status = subscriptionWebhookStatus(
        type,
        data,
        existing?.status || workspaceSubscription?.status,
      );
      const pastDueEndsAt =
        status === "PAST_DUE"
          ? validDate(data.past_due_ends_at) || existing?.pastDueEndsAt || null
          : null;
      const clearCheckoutIntent = matchesPendingCheckout;
      const plan =
        (productInterval || historicalInterval) &&
        type !== "subscription.failed" &&
        type !== "subscription.expired"
          ? "PRO"
          : "FREE";

      await tx.workspaceSubscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          plan,
          status,
          interval,
          dodoCustomerId: customerId || null,
          dodoSubscriptionId: subscriptionId,
          dodoProductId: productId || null,
          currentPeriodStart,
          currentPeriodEnd,
          pastDueEndsAt,
          cancelAtPeriodEnd,
          lastEventAt: eventAt,
        },
        update: {
          plan,
          status,
          interval,
          dodoSubscriptionId: subscriptionId,
          ...(customerId ? { dodoCustomerId: customerId } : {}),
          ...(productId ? { dodoProductId: productId } : {}),
          currentPeriodStart,
          currentPeriodEnd,
          pastDueEndsAt,
          cancelAtPeriodEnd,
          lastEventAt: eventAt,
          ...(clearCheckoutIntent
            ? {
                checkoutIntentId: null,
                checkoutInterval: null,
                checkoutUrl: null,
                checkoutPendingUntil: null,
              }
            : {}),
        },
      });
    });
    if (result?.duplicate) return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook processing failed", error?.code || error?.name || "unknown error");
    return NextResponse.json({ error: "Could not process this webhook." }, { status: 500 });
  }
}
