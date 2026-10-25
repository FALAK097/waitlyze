// Workspace plan + analytics history windows. Plan gating is enforced
// server-side (API routes clamp the requested range); clients only render the
// honest window message returned alongside the data.

export const FREE_PLAN = "FREE";
export const PAID_PLANS = Object.freeze(["PRO"]);

// Free workspaces see the most recent 28 days of analytics history.
export const FREE_HISTORY_DAYS = 28;
// Upper bound for any analytics query, paid or otherwise.
export const MAX_HISTORY_DAYS = 365;

export function normalizePlan(value) {
  const plan = String(value || "")
    .trim()
    .toUpperCase();
  return PAID_PLANS.includes(plan) ? plan : FREE_PLAN;
}

export function isPaidPlan(value) {
  return normalizePlan(value) !== FREE_PLAN;
}

/**
 * Clamp a requested analytics range to the workspace plan, server-side.
 * Paid plans keep the full request (up to MAX_HISTORY_DAYS); free plans are
 * capped at FREE_HISTORY_DAYS. Never throws for over-range requests — it
 * reports the cap so the UI can message it honestly.
 */
export function resolveHistoryWindow({ plan, requestedDays }) {
  const normalized = normalizePlan(plan);
  const paid = normalized !== FREE_PLAN;
  const cap = paid ? MAX_HISTORY_DAYS : FREE_HISTORY_DAYS;
  const requested = Number.isInteger(requestedDays) ? requestedDays : FREE_HISTORY_DAYS;
  const days = Math.min(Math.max(requested, 1), cap);
  return {
    plan: normalized,
    requested,
    days,
    capped: requested > days,
    allTime: paid,
    freeWindowDays: FREE_HISTORY_DAYS,
  };
}

export function historyWindowMessage(window) {
  if (!window?.capped) return null;
  return `Showing the last ${window.days} days — upgrade for all-time history.`;
}
