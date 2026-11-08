import "server-only";
import { createDodoClient, dodoBillingInterval } from "./dodo.mjs";
import { subscriptionWebhookStatus } from "./subscription-webhook-status.mjs";

function validDate(value) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function checkoutFields() {
  return {
    checkoutIntentId: null,
    checkoutInterval: null,
    checkoutUrl: null,
    checkoutSessionId: null,
    checkoutUrlExpiresAt: null,
    checkoutCreationStartedAt: null,
    checkoutPendingUntil: null,
  };
}

async function clearUnpaidCheckout(db, { workspaceId, intentId, sessionId }) {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "workspaces" WHERE "id" = ${workspaceId} FOR UPDATE`;
    await tx.workspaceSubscription.updateMany({
      where: { workspaceId, checkoutIntentId: intentId, checkoutSessionId: sessionId },
      data: checkoutFields(),
    });
  });
}

async function applyPaidSubscription(db, { workspaceId, intentId, payment, now }) {
  const client = createDodoClient();
  const subscriptionId = payment.subscription_id;
  if (typeof subscriptionId !== "string" || !subscriptionId) return { state: "paid_unresolved" };

  const providerSubscription = await client.subscriptions.retrieve(
    subscriptionId,
    {},
    { timeout: 5000 },
  );
  const metadata = providerSubscription.metadata || payment.metadata || {};
  if (metadata.workspaceId && metadata.workspaceId !== workspaceId)
    throw new TypeError("Reconciled subscription workspace does not match checkout metadata.");
  if (metadata.checkoutIntentId && metadata.checkoutIntentId !== intentId)
    throw new TypeError("Reconciled subscription intent does not match the stored checkout.");

  const productId =
    typeof providerSubscription.product_id === "string" ? providerSubscription.product_id : null;
  const interval = dodoBillingInterval(productId);
  const customerId =
    providerSubscription.customer?.customer_id || payment.customer?.customer_id || null;

  return db.$transaction(async (tx) => {
    const lockedWorkspace =
      await tx.$queryRaw`SELECT "id" FROM "workspaces" WHERE "id" = ${workspaceId} FOR UPDATE`;
    if (!lockedWorkspace.length) throw new TypeError("Checkout workspace no longer exists.");

    const current = await tx.workspaceSubscription.findUnique({ where: { workspaceId } });
    if (!current) throw new TypeError("Checkout workspace billing record is missing.");
    const sameSubscription = current.dodoSubscriptionId === subscriptionId;
    if (!sameSubscription && current.checkoutIntentId !== intentId)
      throw new TypeError("Checkout intent changed while its payment was being reconciled.");
    if (
      current.dodoSubscriptionId &&
      !sameSubscription &&
      !["CANCELLED", "EXPIRED", "FAILED"].includes(current.status)
    )
      throw new TypeError("Workspace already has a different provider subscription.");

    const status = subscriptionWebhookStatus(
      "subscription.updated",
      providerSubscription,
      current.status,
    );
    const plan = interval && status !== "EXPIRED" ? "PRO" : "FREE";
    await tx.workspaceSubscription.update({
      where: { workspaceId },
      data: {
        plan,
        status,
        interval,
        dodoCustomerId: customerId || (sameSubscription ? current.dodoCustomerId : null),
        dodoSubscriptionId: subscriptionId,
        dodoProductId: productId || (sameSubscription ? current.dodoProductId : null),
        currentPeriodStart:
          validDate(providerSubscription.previous_billing_date) ||
          validDate(providerSubscription.created_at) ||
          (sameSubscription ? current.currentPeriodStart : null) ||
          now,
        currentPeriodEnd:
          validDate(providerSubscription.next_billing_date) ||
          validDate(providerSubscription.current_period_end) ||
          (sameSubscription ? current.currentPeriodEnd : null),
        pastDueEndsAt:
          status === "PAST_DUE"
            ? validDate(providerSubscription.past_due_ends_at) ||
              (sameSubscription ? current.pastDueEndsAt : null)
            : null,
        cancelAtPeriodEnd:
          typeof providerSubscription.cancel_at_next_billing_date === "boolean"
            ? providerSubscription.cancel_at_next_billing_date
            : sameSubscription && current.cancelAtPeriodEnd,
        lastEventAt: now,
        ...(current.checkoutIntentId === intentId ? checkoutFields() : {}),
      },
    });
    return {
      state: ["EXPIRED", "FAILED", "CANCELLED"].includes(status) ? "terminal" : "active",
      customerId,
    };
  });
}

/** Reconcile a saved Dodo checkout before replacing its intent or deleting its workspace. */
export async function reconcileCheckoutSession(db, { workspaceId, intentId, sessionId }) {
  const client = createDodoClient();
  const session = await client.checkoutSessions.retrieve(sessionId, { timeout: 5000 });
  const now = new Date();

  if (session.payment_id) {
    const payment = await client.payments.retrieve(session.payment_id, { timeout: 5000 });
    const status = String(payment.status || session.payment_status || "").toLowerCase();
    if (status === "succeeded")
      return applyPaidSubscription(db, { workspaceId, intentId, payment, now });
    if (status !== "failed" && status !== "cancelled") return { state: "pending" };
  } else {
    const createdAt = validDate(session.created_at);
    const expiresAt = createdAt ? createdAt.getTime() + 24 * 60 * 60 * 1000 : Infinity;
    if (now.getTime() < expiresAt) return { state: "pending" };
  }

  await clearUnpaidCheckout(db, { workspaceId, intentId, sessionId });
  return { state: "safe_to_retry" };
}
