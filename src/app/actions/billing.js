"use server";

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

async function createPortalLink(customerId) {
  const client = createDodoClient();
  const portal = await client.customers.customerPortal.create(customerId, {
    return_url: new URL("/settings?section=billing", env.BETTER_AUTH_URL).toString(),
  });
  return portal.link;
}

/** Starts a Dodo-hosted checkout for the selected workspace only. */
export async function createProCheckout(interval, workspaceId) {
  try {
    const session = await checkAuth();
    if (!BILLING_INTERVALS.includes(interval))
      return { error: "Choose monthly or annual billing." };
    const context = await ownerContext(session, workspaceId);
    if (context.error) return context;
    const { workspace } = context;
    const current = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (effectiveWorkspacePlan(current) === "PRO")
      return { error: "This workspace already has Pro. Manage its renewal in Billing settings." };
    if (current?.status === "ON_HOLD" || current?.status === "PAST_DUE") {
      if (!current.dodoCustomerId)
        return { error: "This subscription needs attention. Contact support to recover billing." };
      return {
        portalUrl: await createPortalLink(current.dodoCustomerId),
        billingManagementRequired: true,
      };
    }

    const client = createDodoClient({ requireWebhookKey: true });
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
      },
      feature_flags: { allow_tax_id: true, allow_currency_selection: true },
      return_url: new URL(
        `/api/billing/return?workspaceId=${encodeURIComponent(workspace.id)}`,
        env.BETTER_AUTH_URL,
      ).toString(),
    });
    if (!checkout.checkout_url) return { error: "Dodo did not return a checkout link. Try again." };
    return { checkoutUrl: checkout.checkout_url };
  } catch (error) {
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
    return { portalUrl: await createPortalLink(subscription.dodoCustomerId) };
  } catch (error) {
    if (error instanceof BillingGateError) return { error: error.message };
    if (error instanceof DodoConfigurationError) return { error: error.message };
    console.error("Could not create Dodo billing portal", error?.name || "unknown error");
    return { error: "Could not open billing management. Please try again." };
  }
}
