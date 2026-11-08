import { NextResponse } from "next/server";

import {
  createDodoClient,
  dodoBillingInterval,
  DodoConfigurationError,
} from "@/lib/billing/dodo.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

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

function eventStatus(type, data) {
  const status = String(data.status || "").toLowerCase();
  if (type === "subscription.past_due") return "PAST_DUE";
  if (type === "subscription.on_hold" || type === "subscription.paused") return "ON_HOLD";
  if (type === "subscription.expired" || type === "subscription.failed") return "EXPIRED";
  if (type === "subscription.cancelled" && !data.cancel_at_next_billing_date) return "CANCELLED";
  if (type === "subscription.updated") {
    if (status === "past_due") return "PAST_DUE";
    if (status === "on_hold" || status === "paused") return "ON_HOLD";
    if (status === "expired" || status === "failed") return "EXPIRED";
    if ((status === "cancelled" || status === "canceled") && !data.cancel_at_next_billing_date)
      return "CANCELLED";
  }
  return "ACTIVE";
}

function eventWorkspaceId(data) {
  const metadata = data?.metadata || {};
  const value = metadata.workspaceId || metadata.workspace_id;
  return typeof value === "string" && value ? value : null;
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
    const rawBody = await request.text();
    event = client.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": signature,
        "webhook-timestamp": timestamp,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const type = event?.type;
  const data = event?.data || {};
  try {
    await prisma.$transaction(async (tx) => {
      await tx.dodoWebhookReceipt.create({
        data: {
          webhookId,
          eventType: String(type || "unknown"),
          workspaceId: eventWorkspaceId(data),
        },
      });

      if (!SUBSCRIPTION_EVENTS.has(type)) return;
      const subscriptionId = data.subscription_id;
      if (typeof subscriptionId !== "string" || !subscriptionId) return;

      const existing = await tx.workspaceSubscription.findFirst({
        where: { dodoSubscriptionId: subscriptionId },
      });
      const workspaceId = eventWorkspaceId(data) || existing?.workspaceId;
      if (!workspaceId) throw new TypeError("Subscription webhook is missing workspace metadata.");

      const productId =
        typeof data.product_id === "string" ? data.product_id : existing?.dodoProductId;
      const interval = dodoBillingInterval(productId) || existing?.interval;
      if (!interval)
        throw new TypeError("Subscription webhook references an unknown Dodo product.");

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
        type === "subscription.cancelled"
          ? data.cancel_at_next_billing_date === true
          : existing?.cancelAtPeriodEnd || false;

      await tx.workspaceSubscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          plan: type === "subscription.failed" || type === "subscription.expired" ? "FREE" : "PRO",
          status: eventStatus(type, data),
          interval,
          dodoCustomerId: customerId || null,
          dodoSubscriptionId: subscriptionId,
          dodoProductId: productId || null,
          currentPeriodStart,
          currentPeriodEnd,
          pastDueEndsAt: validDate(data.past_due_ends_at),
          cancelAtPeriodEnd,
          lastEventAt: eventAt,
        },
        update: {
          plan: type === "subscription.failed" || type === "subscription.expired" ? "FREE" : "PRO",
          status: eventStatus(type, data),
          interval,
          ...(customerId ? { dodoCustomerId: customerId } : {}),
          ...(productId ? { dodoProductId: productId } : {}),
          currentPeriodStart,
          currentPeriodEnd,
          pastDueEndsAt: validDate(data.past_due_ends_at),
          cancelAtPeriodEnd,
          lastEventAt: eventAt,
        },
      });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error?.code === "P2002") return NextResponse.json({ received: true, duplicate: true });
    console.error("Dodo webhook processing failed", error?.code || error?.name || "unknown error");
    return NextResponse.json({ error: "Could not process this webhook." }, { status: 500 });
  }
}
