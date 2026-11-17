import "server-only";
import { cache } from "react";

export const BILLING_INTERVALS = Object.freeze(["monthly", "annual"]);

const PLAN_ENTITLEMENTS = Object.freeze({
  FREE: Object.freeze({
    workspaces: 1,
    waitlists: 1,
    subscribers: 100,
    members: 1,
    analytics: false,
    customDomains: false,
    emailMarketing: false,
    removeBranding: false,
  }),
  PRO: Object.freeze({
    workspaces: null,
    waitlists: null,
    subscribers: null,
    members: null,
    analytics: true,
    customDomains: true,
    emailMarketing: true,
    removeBranding: true,
  }),
});

export class WorkspacePlanError extends Error {
  constructor({ message, feature, limit, used, status = 402 }) {
    super(message);
    this.name = "WorkspacePlanError";
    this.code = "PLAN_UPGRADE_REQUIRED";
    this.status = status;
    this.feature = feature;
    this.limit = limit;
    this.used = used;
  }
}

function periodIsCurrent(subscription, now) {
  return subscription?.currentPeriodEnd instanceof Date && subscription.currentPeriodEnd > now;
}

const BILLING_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

// Dunning keeps Pro alive through the provider's grace deadline when it sends
// one; otherwise we allow seven days past the paid period or the last event.
function gracePeriodEndsAt(subscription) {
  if (subscription?.pastDueEndsAt instanceof Date) return subscription.pastDueEndsAt;
  if (subscription?.currentPeriodEnd instanceof Date)
    return new Date(subscription.currentPeriodEnd.getTime() + BILLING_GRACE_MS);
  if (subscription?.lastEventAt instanceof Date)
    return new Date(subscription.lastEventAt.getTime() + BILLING_GRACE_MS);
  return null;
}

export function effectiveWorkspacePlan(subscription, now = new Date()) {
  if (!subscription || subscription.plan !== "PRO") return "FREE";
  if (subscription.status === "ACTIVE" && periodIsCurrent(subscription, now)) return "PRO";
  if (["PAST_DUE", "ON_HOLD"].includes(subscription.status)) {
    const graceEndsAt = gracePeriodEndsAt(subscription);
    return graceEndsAt && graceEndsAt > now ? "PRO" : "FREE";
  }
  if (
    subscription.status === "CANCELLED" &&
    subscription.cancelAtPeriodEnd &&
    periodIsCurrent(subscription, now)
  )
    return "PRO";
  return "FREE";
}

// A row the provider may still bill against. Never overwrite or replace it
// without reconciling with Dodo first, even when its grace window has lapsed
// and the workspace is effectively Free.
export function providerSubscriptionNeedsReview(subscription) {
  if (!subscription) return false;
  return (
    ["ACTIVE", "PAST_DUE", "ON_HOLD"].includes(subscription.status) ||
    (subscription.status === "CANCELLED" &&
      subscription.cancelAtPeriodEnd &&
      !subscription.currentPeriodEnd) ||
    Boolean(
      subscription.dodoSubscriptionId &&
      !["CANCELLED", "EXPIRED", "FAILED"].includes(subscription.status),
    )
  );
}

export function workspaceEntitlements(subscription, now = new Date()) {
  const plan = effectiveWorkspacePlan(subscription, now);
  return { plan, ...PLAN_ENTITLEMENTS[plan] };
}

const SUBSCRIPTION_PLAN_SELECT = Object.freeze({
  plan: true,
  status: true,
  currentPeriodEnd: true,
  pastDueEndsAt: true,
  cancelAtPeriodEnd: true,
  lastEventAt: true,
});

const loadWorkspaceSubscription = cache(async (db, workspaceId) => {
  return db.workspaceSubscription.findUnique({
    where: { workspaceId },
    select: SUBSCRIPTION_PLAN_SELECT,
  });
});

export async function getWorkspaceEntitlements(db, workspaceId, now = new Date()) {
  if (!workspaceId) return workspaceEntitlements(null, now);
  const subscription = await loadWorkspaceSubscription(db, workspaceId);
  return { ...workspaceEntitlements(subscription, now), subscription };
}

// Workspaces are limited per owner, not per workspace: joining someone else's
// Pro workspace never consumes your own allowance. The plan that governs
// creation is the best plan among the workspaces the user owns.
export async function getOwnedWorkspaceEntitlements(db, userId, now = new Date()) {
  if (typeof userId !== "string" || !userId)
    return { plan: "FREE", ownedCount: 0, ...PLAN_ENTITLEMENTS.FREE };
  const [ownedCount, subscriptions] = await Promise.all([
    db.workspaceMember.count({ where: { userId, role: "OWNER" } }),
    db.workspaceSubscription.findMany({
      where: { workspace: { members: { some: { userId, role: "OWNER" } } } },
      select: SUBSCRIPTION_PLAN_SELECT,
    }),
  ]);
  const hasProWorkspace = subscriptions.some(
    (subscription) => effectiveWorkspacePlan(subscription, now) === "PRO",
  );
  const plan = hasProWorkspace ? "PRO" : "FREE";
  return { plan, ownedCount, ...PLAN_ENTITLEMENTS[plan] };
}

export function requireFeature(entitlements, feature) {
  if (!Object.hasOwn(entitlements, feature)) throw new Error("Unknown plan feature.");
  if (entitlements[feature]) return;
  throw new WorkspacePlanError({
    feature,
    message: "This feature is available on Waitlyze Pro.",
  });
}

export function requireCapacity({ entitlements, feature, used, requested = 1, message }) {
  const limit = entitlements[feature];
  // A null limit is intentionally uncapped (Pro); abuse and platform-level
  // rate limits remain separate from plan entitlements.
  if (limit === null) return;
  if (typeof limit !== "number") throw new Error("Unknown plan limit.");
  if (used + requested <= limit) return;
  throw new WorkspacePlanError({
    feature,
    limit,
    used: used + requested,
    message:
      message ||
      `Your ${entitlements.plan === "FREE" ? "Free" : "Pro"} workspace has reached its ${limit.toLocaleString()} ${feature} limit.`,
  });
}
