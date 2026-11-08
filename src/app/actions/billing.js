"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { createDodoClient, dodoProductId, DodoConfigurationError } from "@/lib/billing/dodo.mjs";
import { BILLING_INTERVALS, effectiveWorkspacePlan } from "@/lib/billing/plans.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";

/**
 * Central auth gate for billing actions (they are public POST endpoints).
 * Throws so no privileged work can proceed without a session.
 */
class BillingGateError extends Error {}

async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new BillingGateError("Sign in to manage this workspace's plan.");
  return session;
}

/** Ensures the caller signs in and can view the workspace; ownership is re-checked per call. */
async function ownerContext(session, workspaceId) {
  const { workspace } = workspaceId
    ? {
        workspace: await createWorkspaceService(prisma).requireAccess(
          session.user.id,
          workspaceId,
          "manageOwnership",
        ),
      }
    : await currentWorkspace();
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
    select: { role: true },
  });
  if (membership?.role !== "OWNER")
    return { error: "Only the workspace owner can manage billing." };
  await createWorkspaceService(prisma).requireAccess(
    session.user.id,
    workspace.id,
    "manageOwnership",
  );
  return { session, workspace };
}

async function createPortalLink(customerId, workspaceId) {
  const client = createDodoClient();
  const portal = await client.customers.customerPortal.create(customerId, {
    return_url: new URL(
      `/api/billing/return?workspaceId=${encodeURIComponent(workspaceId)}`,
      env.BETTER_AUTH_URL,
    ).toString(),
  });
  return portal.link;
}

// Expire the local intent a little before Dodo's 24-hour checkout URL expiry.
const CHECKOUT_INTENT_TTL_MS = 23 * 60 * 60 * 1000 + 55 * 60 * 1000;

async function reserveCheckoutIntent(workspaceId, interval) {
  const newIntentId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CHECKOUT_INTENT_TTL_MS);
  const checkoutInterval = interval === "annual" ? "ANNUAL" : "MONTHLY";

  return prisma.$transaction(async (tx) => {
    const lockedWorkspace =
      await tx.$queryRaw`SELECT "id" FROM "workspaces" WHERE "id" = ${workspaceId} FOR UPDATE`;
    if (lockedWorkspace.length === 0)
      return { error: "This workspace no longer exists. Refresh and try again." };
    const current = await tx.workspaceSubscription.findUnique({ where: { workspaceId } });

    if (effectiveWorkspacePlan(current, now) === "PRO")
      return { error: "This workspace already has Pro. Manage its renewal in Billing settings." };

    const providerStateNeedsReview =
      ["ACTIVE", "PAST_DUE", "ON_HOLD"].includes(current?.status) ||
      (current?.status === "CANCELLED" && current.cancelAtPeriodEnd && !current.currentPeriodEnd);
    if (
      providerStateNeedsReview ||
      (current?.dodoSubscriptionId && !["CANCELLED", "EXPIRED", "FAILED"].includes(current.status))
    ) {
      if (!current.dodoCustomerId)
        return { error: "This subscription needs attention. Contact support to recover billing." };
      return { portalCustomerId: current.dodoCustomerId };
    }

    if (current?.checkoutIntentId && current.checkoutPendingUntil > now) {
      if (current.checkoutInterval !== checkoutInterval)
        return {
          error:
            "A checkout is already open for the other billing interval. Finish it or wait for it to expire.",
        };
      if (current.checkoutUrl) return { checkoutUrl: current.checkoutUrl };
      return { intentId: current.checkoutIntentId };
    }

    await tx.workspaceSubscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        plan: "FREE",
        status: "FREE",
        checkoutIntentId: newIntentId,
        checkoutInterval,
        checkoutPendingUntil: expiresAt,
      },
      update: {
        checkoutIntentId: newIntentId,
        checkoutInterval,
        checkoutUrl: null,
        checkoutPendingUntil: expiresAt,
      },
    });
    return { intentId: newIntentId };
  });
}

async function releaseCheckoutIntent(workspaceId, intentId) {
  await prisma.workspaceSubscription.updateMany({
    where: { workspaceId, checkoutIntentId: intentId },
    data: {
      checkoutIntentId: null,
      checkoutInterval: null,
      checkoutUrl: null,
      checkoutPendingUntil: null,
    },
  });
}

/** Starts a Dodo-hosted checkout for the selected workspace only. */
export async function createProCheckout(interval, workspaceId) {
  let reservedIntentId = null;
  let resolvedWorkspaceId = null;
  try {
    const session = await checkAuth();
    if (!BILLING_INTERVALS.includes(interval))
      return { error: "Choose monthly or annual billing." };
    const context = await ownerContext(session, workspaceId);
    if (context.error) return context;
    const { workspace } = context;
    resolvedWorkspaceId = workspace.id;
    const reservation = await reserveCheckoutIntent(workspace.id, interval);
    if (reservation.error) return { error: reservation.error };
    if (reservation.portalCustomerId)
      return {
        portalUrl: await createPortalLink(reservation.portalCustomerId, workspace.id),
        billingManagementRequired: true,
      };
    if (reservation.checkoutUrl) return { checkoutUrl: reservation.checkoutUrl };
    reservedIntentId = reservation.intentId;

    const client = createDodoClient({ requireWebhookKey: true });
    const checkout = await client.checkoutSessions.create(
      {
        product_cart: [{ product_id: dodoProductId(interval), quantity: 1 }],
        customer: {
          email: session.user.email,
          ...(session.user.name ? { name: session.user.name } : {}),
        },
        metadata: {
          workspaceId: workspace.id,
          userId: session.user.id,
          plan: "PRO",
          interval,
          checkoutIntentId: reservedIntentId,
        },
        feature_flags: { allow_tax_id: true, allow_currency_selection: true },
        return_url: new URL(
          `/api/billing/return?workspaceId=${encodeURIComponent(workspace.id)}`,
          env.BETTER_AUTH_URL,
        ).toString(),
      },
      { idempotencyKey: reservedIntentId },
    );
    if (!checkout.checkout_url) {
      await releaseCheckoutIntent(workspace.id, reservedIntentId);
      reservedIntentId = null;
      return { error: "Dodo did not return a checkout link. Try again." };
    }
    await prisma.workspaceSubscription.updateMany({
      where: { workspaceId: workspace.id, checkoutIntentId: reservedIntentId },
      data: { checkoutUrl: checkout.checkout_url },
    });
    return { checkoutUrl: checkout.checkout_url };
  } catch (error) {
    const status = Number(error?.status || error?.statusCode);
    const permanentDodoError =
      error instanceof DodoConfigurationError ||
      (status >= 400 && status < 500 && ![408, 409, 429].includes(status));
    if (reservedIntentId && resolvedWorkspaceId && permanentDodoError) {
      try {
        await releaseCheckoutIntent(resolvedWorkspaceId, reservedIntentId);
      } catch {
        // Leave the expiring reservation in place rather than risk a second session.
      }
    }
    if (error instanceof BillingGateError) return { error: error.message };
    if (error instanceof DodoConfigurationError) return { error: error.message };
    console.error("Could not create Dodo checkout", error?.name || "unknown error");
    return { error: "Could not start checkout. Please try again." };
  }
}

/** Creates a short-lived Dodo portal link for the selected workspace owner. */
export async function createBillingPortal(workspaceId) {
  try {
    const session = await checkAuth();
    const context = await ownerContext(session, workspaceId);
    if (context.error) return context;
    const { workspace } = context;
    const subscription = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
      select: { dodoCustomerId: true },
    });
    if (!subscription?.dodoCustomerId)
      return { error: "No paid subscription is connected to this workspace." };
    return { portalUrl: await createPortalLink(subscription.dodoCustomerId, workspace.id) };
  } catch (error) {
    if (error instanceof BillingGateError) return { error: error.message };
    if (error instanceof DodoConfigurationError) return { error: error.message };
    console.error("Could not create Dodo billing portal", error?.name || "unknown error");
    return { error: "Could not open billing management. Please try again." };
  }
}
