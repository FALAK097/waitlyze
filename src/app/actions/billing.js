"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  extractSessionIdFromUrl,
  reconcileCheckoutSession,
} from "@/lib/billing/checkout-reconciliation.mjs";
import { createDodoClient, dodoProductId, DodoConfigurationError } from "@/lib/billing/dodo.mjs";
import {
  BILLING_INTERVALS,
  effectiveWorkspacePlan,
  isDetachedCustomerId,
  providerSubscriptionNeedsReview,
} from "@/lib/billing/plans.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
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

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!workspace) return { error: "This workspace no longer exists. Refresh and try again." };
  const current = await prisma.workspaceSubscription.findUnique({ where: { workspaceId } });

  if (effectiveWorkspacePlan(current, now) === "PRO")
    return { error: "This workspace already has Pro. Manage its renewal in Billing settings." };

  if (providerSubscriptionNeedsReview(current)) {
    if (!current.dodoCustomerId || isDetachedCustomerId(current.dodoCustomerId))
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

  await prisma.workspaceSubscription.upsert({
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
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!workspace) return false;
  if (userId) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (membership?.role !== "OWNER") return false;
  }
  const claimed = await prisma.workspaceSubscription.updateMany({
    where: {
      workspaceId,
      checkoutIntentId: intentId,
      checkoutCreationStartedAt: null,
    },
    data: { checkoutCreationStartedAt: now },
  });
  return claimed.count === 1;
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
    if (reservation.checkoutUrl) {
      await recordAuditEvent(prisma, {
        workspaceId: workspace.id,
        userId: session.user.id,
        action: AUDIT_ACTIONS.BILLING_CHECKOUT_STARTED,
        resourceType: "billing",
        resourceId: extractSessionIdFromUrl(reservation.checkoutUrl) || null,
        resourceName: `Pro (${interval})`,
        detail: `Resumed active Pro checkout with ${interval} billing`,
      });
      return { checkoutUrl: reservation.checkoutUrl };
    }
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
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: AUDIT_ACTIONS.BILLING_CHECKOUT_STARTED,
      resourceType: "billing",
      resourceId: checkout.session_id,
      resourceName: `Pro (${interval})`,
      detail: `Started Pro checkout with ${interval} billing`,
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
    if (!subscription?.dodoCustomerId || isDetachedCustomerId(subscription.dodoCustomerId))
      return { error: "No paid subscription is connected to this workspace." };
    const portalUrl = await createPortalLink(subscription.dodoCustomerId, workspace.id);
    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: AUDIT_ACTIONS.BILLING_PORTAL_OPENED,
      resourceType: "billing",
      resourceId: subscription.dodoCustomerId,
      resourceName: "Customer Portal",
      detail: "Opened billing management portal",
    });
    return { portalUrl };
  } catch (error) {
    if (error instanceof BillingGateError) return { error: error.message };
    if (error instanceof DodoConfigurationError) return { error: error.message };
    console.error("Could not create Dodo billing portal", error?.name || "unknown error");
    return { error: "Could not open billing management. Please try again." };
  }
}

function hasPendingCheckout(subscription) {
  return Boolean(
    subscription?.checkoutIntentId || subscription?.checkoutSessionId || subscription?.checkoutUrl,
  );
}

/** Moves the owner's only effective-Pro subscription to the workspace being viewed. */
export async function transferProSubscription(workspaceId) {
  try {
    const session = await checkAuth();
    const context = await ownerContext(session, workspaceId);
    if (context.error) return context;
    const { workspace } = context;

    const target = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (effectiveWorkspacePlan(target) === "PRO")
      return { error: "This workspace already has Pro." };

    // Only workspaces this account owns can donate their subscription; the
    // target ownership check already ran in ownerContext.
    const ownedWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id, role: "OWNER", workspaceId: { not: workspace.id } },
      select: { workspace: { select: { id: true, name: true, subscription: true } } },
    });
    const proWorkspaces = ownedWorkspaces
      .map(({ workspace: owned }) => owned)
      .filter((owned) => effectiveWorkspacePlan(owned.subscription) === "PRO");
    if (proWorkspaces.length === 0) return { error: "You don’t have a Pro subscription to move." };
    if (proWorkspaces.length > 1)
      return {
        error: "You have Pro on more than one workspace. Contact support to move a subscription.",
      };

    const [source] = proWorkspaces;
    const sourceSubscription = source.subscription;
    if (hasPendingCheckout(sourceSubscription) || hasPendingCheckout(target))
      return { error: "Finish or reconcile the pending checkout before moving Pro." };
    if (providerSubscriptionNeedsReview(target))
      return {
        error:
          "This workspace has a subscription that still needs attention in Billing. Resolve it before moving Pro here.",
      };
    if (!sourceSubscription.dodoSubscriptionId)
      return { error: "This subscription is not connected to Dodo Payments. Contact support." };

    // Move the provider metadata first so later webhooks address the new workspace.
    const client = createDodoClient().withOptions({ maxRetries: 0, timeout: 30_000 });
    try {
      await client.subscriptions.update(sourceSubscription.dodoSubscriptionId, {
        metadata: {
          workspaceId: workspace.id,
          userId: session.user.id,
          plan: "PRO",
          transferredFrom: source.id,
        },
      });
    } catch (providerError) {
      console.error(
        "Could not update Dodo subscription metadata for a move",
        providerError?.name || "unknown error",
      );
      return { error: "Could not reach Dodo Payments to move Pro. No billing changes were made." };
    }

    try {
      const [sourceOwner, targetOwner, currentSource, currentTarget] = await Promise.all([
        prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: source.id, userId: session.user.id } },
          select: { role: true },
        }),
        prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
          select: { role: true },
        }),
        prisma.workspaceSubscription.findUnique({ where: { workspaceId: source.id } }),
        prisma.workspaceSubscription.findUnique({ where: { workspaceId: workspace.id } }),
      ]);
      if (sourceOwner?.role !== "OWNER" || targetOwner?.role !== "OWNER")
        throw new Error("You must be an owner of both workspaces to move Pro.");
      if (
        currentSource?.dodoSubscriptionId !== sourceSubscription.dodoSubscriptionId ||
        effectiveWorkspacePlan(currentSource) !== "PRO"
      )
        throw new Error("The source subscription changed while Pro was being moved.");
      if (
        effectiveWorkspacePlan(currentTarget) === "PRO" ||
        hasPendingCheckout(currentSource) ||
        hasPendingCheckout(currentTarget)
      )
        throw new Error("Billing changed while Pro was being moved.");
      if (providerSubscriptionNeedsReview(currentTarget))
        throw new Error("The target subscription needs reconciliation before Pro can move.");

      const movedSubscriptionData = {
        plan: currentSource.plan,
        status: currentSource.status,
        interval: currentSource.interval,
        dodoCustomerId: currentSource.dodoCustomerId,
        dodoSubscriptionId: currentSource.dodoSubscriptionId,
        dodoProductId: currentSource.dodoProductId,
        currentPeriodStart: currentSource.currentPeriodStart,
        currentPeriodEnd: currentSource.currentPeriodEnd,
        pastDueEndsAt: currentSource.pastDueEndsAt,
        cancelAtPeriodEnd: currentSource.cancelAtPeriodEnd,
        lastEventAt: currentSource.lastEventAt,
      };
      await prisma.$transaction([
        prisma.workspaceSubscription.delete({ where: { workspaceId: source.id } }),
        prisma.workspaceSubscription.upsert({
          where: { workspaceId: workspace.id },
          create: {
            workspaceId: workspace.id,
            ...movedSubscriptionData,
          },
          update: movedSubscriptionData,
        }),
      ]);
    } catch (transactionError) {
      try {
        const parked = await prisma.workspaceSubscription.findFirst({
          where: {
            workspaceId: source.id,
            dodoSubscriptionId: sourceSubscription.dodoSubscriptionId,
          },
        });
        if (parked) {
          await client.subscriptions.update(sourceSubscription.dodoSubscriptionId, {
            metadata: { workspaceId: source.id, userId: session.user.id, plan: "PRO" },
          });
        }
      } catch (revertError) {
        console.error(
          "Could not revert Dodo subscription metadata after a failed move",
          revertError?.name || "unknown error",
        );
      }
      console.error(
        "Could not move Pro between workspaces",
        transactionError?.name || "unknown error",
      );
      return {
        error: "Could not move Pro. No billing changes were kept; try again or contact support.",
      };
    }

    await recordAuditEvent(prisma, {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: AUDIT_ACTIONS.SUBSCRIPTION_TRANSFERRED,
      resourceType: "billing",
      resourceId: sourceSubscription.dodoSubscriptionId,
      resourceName: source.name,
      detail: `Moved Pro from ${source.name}`,
    });
    revalidatePath("/settings");
    return { success: `Pro moved to this workspace from ${source.name}.` };
  } catch (error) {
    if (error instanceof BillingGateError) return { error: error.message };
    if (error instanceof DodoConfigurationError) return { error: error.message };
    console.error("Could not move Pro between workspaces", error?.name || "unknown error");
    return { error: "Could not move Pro. Please try again." };
  }
}
