"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  extractSessionIdFromUrl,
  reconcileCheckoutSession,
} from "@/lib/billing/checkout-reconciliation.mjs";
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

const CHECKOUT_URL_TTL_MS = 24 * 60 * 60 * 1000;
// Dodo retries a webhook for about 28 hours after the event. Keep deletion and
// replacement blocked through the checkout lifetime plus that retry window.
const CHECKOUT_PROTECTION_TTL_MS = 54 * 60 * 60 * 1000;
const CHECKOUT_CREATION_LEASE_MS = 60 * 1000;

async function reserveCheckoutIntent(workspaceId, interval) {
  const newIntentId = randomUUID();
  const now = new Date();
  const protectionUntil = new Date(now.getTime() + CHECKOUT_PROTECTION_TTL_MS);
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

    const activeSessionId =
      current?.checkoutSessionId || extractSessionIdFromUrl(current?.checkoutUrl);

    if (activeSessionId) {
      const checkoutUrlIsActive = Boolean(
        current.checkoutUrl && current.checkoutUrlExpiresAt && current.checkoutUrlExpiresAt > now,
      );
      if (checkoutUrlIsActive) {
        if (current.checkoutInterval !== checkoutInterval)
          return {
            error:
              "A checkout is already open for the other billing interval. Finish it or wait for it to expire.",
          };
        return { checkoutUrl: current.checkoutUrl };
      }
      return {
        reconcile: {
          intentId: current.checkoutIntentId,
          sessionId: activeSessionId,
        },
      };
    }

    if (current?.checkoutIntentId && current.checkoutPendingUntil > now) {
      if (current.checkoutInterval !== checkoutInterval)
        return {
          error:
            "A checkout is already open for the other billing interval. Finish it or wait for it to expire.",
        };
      if (current.checkoutUrl) {
        const checkoutUrlIsActive = Boolean(
          current.checkoutUrlExpiresAt && current.checkoutUrlExpiresAt > now,
        );
        if (checkoutUrlIsActive) return { checkoutUrl: current.checkoutUrl };
        return {
          error: "This checkout needs reconciliation before another payment attempt can start.",
        };
      }
      if (current.checkoutCreationStartedAt) {
        const isLeaseActive =
          now.getTime() - current.checkoutCreationStartedAt.getTime() < CHECKOUT_CREATION_LEASE_MS;
        if (isLeaseActive) return { creationPending: true };
        return {
          error:
            "A previous checkout request is still pending confirmation. Please wait or contact support before starting another payment.",
        };
      }
      // If checkoutCreationStartedAt is null, the reservation was abandoned before a Dodo
      // request was dispatched. Safe to recover/release this abandoned reservation.
    }

    if (current?.checkoutIntentId && current.checkoutUrl && current.checkoutPendingUntil > now)
      return {
        error: "This checkout needs reconciliation before another payment attempt can start.",
      };

    await tx.workspaceSubscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        plan: "FREE",
        status: "FREE",
        checkoutIntentId: newIntentId,
        checkoutInterval,
        checkoutCreationStartedAt: null,
        checkoutPendingUntil: protectionUntil,
      },
      update: {
        checkoutIntentId: newIntentId,
        checkoutInterval,
        checkoutUrl: null,
        checkoutSessionId: null,
        checkoutUrlExpiresAt: null,
        checkoutCreationStartedAt: null,
        checkoutPendingUntil: protectionUntil,
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
      checkoutSessionId: null,
      checkoutUrlExpiresAt: null,
      checkoutCreationStartedAt: null,
      checkoutPendingUntil: null,
    },
  });
}

async function claimCheckoutDispatch(workspaceId, intentId, now, userId) {
  return prisma.$transaction(async (tx) => {
    const lockedWorkspace =
      await tx.$queryRaw`SELECT "id" FROM "workspaces" WHERE "id" = ${workspaceId} FOR UPDATE`;
    if (lockedWorkspace.length === 0) return false;
    if (userId) {
      const membership = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { role: true },
      });
      if (membership?.role !== "OWNER") return false;
    }
    const current = await tx.workspaceSubscription.findUnique({
      where: { workspaceId },
      select: { checkoutIntentId: true, checkoutCreationStartedAt: true },
    });
    if (
      !current ||
      current.checkoutIntentId !== intentId ||
      current.checkoutCreationStartedAt !== null
    ) {
      return false;
    }
    await tx.workspaceSubscription.update({
      where: { workspaceId },
      data: { checkoutCreationStartedAt: now },
    });
    return true;
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
    let reservation = await reserveCheckoutIntent(workspace.id, interval);
    if (reservation.error) return { error: reservation.error };
    if (reservation.portalCustomerId)
      return {
        portalUrl: await createPortalLink(reservation.portalCustomerId, workspace.id),
        billingManagementRequired: true,
      };
    if (reservation.reconcile) {
      const reconciled = await reconcileCheckoutSession(prisma, {
        workspaceId: workspace.id,
        intentId: reservation.reconcile.intentId,
        sessionId: reservation.reconcile.sessionId,
      });
      if (reconciled.state === "safe_to_retry") {
        reservation = await reserveCheckoutIntent(workspace.id, interval);
        if (reservation.error) return { error: reservation.error };
        if (reservation.portalCustomerId)
          return {
            portalUrl: await createPortalLink(reservation.portalCustomerId, workspace.id),
            billingManagementRequired: true,
          };
        if (reservation.reconcile)
          return { error: "A payment is still being reconciled. Refresh billing before retrying." };
      } else if (reconciled.state === "active") {
        if (!reconciled.customerId)
          return {
            error:
              "Payment is confirmed, but billing is still syncing. Refresh shortly or contact support.",
          };
        return {
          portalUrl: await createPortalLink(reconciled.customerId, workspace.id),
          billingManagementRequired: true,
        };
      } else if (reconciled.state === "terminal") {
        return {
          error:
            "Dodo confirmed a payment, but its subscription is no longer active. Contact support before retrying checkout.",
        };
      } else {
        return {
          error: "A checkout payment is still being reconciled. Refresh billing before retrying.",
        };
      }
    }
    if (reservation.creationPending)
      return {
        error:
          "A secure checkout request is still being reconciled. Please wait or contact support before starting another payment.",
      };
    if (reservation.checkoutUrl) return { checkoutUrl: reservation.checkoutUrl };
    reservedIntentId = reservation.intentId;

    // The installed SDK does not send an idempotency header for this endpoint.
    // The workspace-row claim elects one creator; disable blind POST retries.
    const client = createDodoClient({ requireWebhookKey: true }).withOptions({
      maxRetries: 0,
      timeout: 30_000,
    });
    const creatorStartedAt = new Date();
    const claimed = await claimCheckoutDispatch(
      workspace.id,
      reservedIntentId,
      creatorStartedAt,
      session.user.id,
    );
    if (!claimed) {
      return { error: "Checkout reservation expired or was superseded. Please try again." };
    }
    const checkout = await client.checkoutSessions.create({
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
    });
    if (!checkout.session_id) {
      return { error: "Dodo did not return a checkout session. Try again." };
    }
    if (!checkout.checkout_url) {
      await prisma.workspaceSubscription.updateMany({
        where: {
          workspaceId: workspace.id,
          checkoutIntentId: reservedIntentId,
          checkoutCreationStartedAt: creatorStartedAt,
        },
        data: {
          checkoutSessionId: checkout.session_id,
          checkoutUrlExpiresAt: new Date(creatorStartedAt.getTime() + CHECKOUT_URL_TTL_MS),
          checkoutCreationStartedAt: null,
        },
      });
      reservedIntentId = null;
      return { error: "Dodo did not return a checkout link. Try again." };
    }
    const persisted = await prisma.workspaceSubscription.updateMany({
      where: {
        workspaceId: workspace.id,
        checkoutIntentId: reservedIntentId,
        checkoutCreationStartedAt: creatorStartedAt,
      },
      data: {
        checkoutUrl: checkout.checkout_url,
        checkoutSessionId: checkout.session_id,
        checkoutUrlExpiresAt: new Date(creatorStartedAt.getTime() + CHECKOUT_URL_TTL_MS),
        checkoutCreationStartedAt: null,
      },
    });
    if (persisted.count !== 1)
      return { error: "Checkout changed while being created. Refresh billing before retrying." };
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
    // For ambiguous errors, preserve the creator lease. Another request must
    // not issue a second POST while Dodo may have created a session; no URL is
    // returned until its session ID and URL are stored.
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
