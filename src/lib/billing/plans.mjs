import "server-only";

export const BILLING_INTERVALS = Object.freeze(["monthly", "annual"]);

const PLAN_ENTITLEMENTS = Object.freeze({
  FREE: Object.freeze({
    waitlists: 1,
    subscribers: 100,
    members: 1,
    analytics: false,
    customDomains: false,
    emailMarketing: false,
    removeBranding: false,
  }),
  PRO: Object.freeze({
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

export function effectiveWorkspacePlan(subscription, now = new Date()) {
  if (!subscription || subscription.plan !== "PRO") return "FREE";
  if (subscription.status === "ACTIVE" && periodIsCurrent(subscription, now)) return "PRO";
  if (
    subscription.status === "PAST_DUE" &&
    subscription.pastDueEndsAt &&
    subscription.pastDueEndsAt > now
  )
    return "PRO";
  if (
    subscription.status === "CANCELLED" &&
    subscription.cancelAtPeriodEnd &&
    periodIsCurrent(subscription, now)
  )
    return "PRO";
  return "FREE";
}

export function workspaceEntitlements(subscription, now = new Date()) {
  const plan = effectiveWorkspacePlan(subscription, now);
  return { plan, ...PLAN_ENTITLEMENTS[plan] };
}

export async function getWorkspaceEntitlements(db, workspaceId, now = new Date()) {
  if (!workspaceId) return workspaceEntitlements(null, now);
  const subscription = await db.workspaceSubscription.findUnique({
    where: { workspaceId },
  });
  return { ...workspaceEntitlements(subscription, now), subscription };
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
