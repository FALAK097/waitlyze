export function subscriptionWebhookStatus(type, data, existingStatus) {
  if (type === "subscription.past_due") return "PAST_DUE";
  if (type === "subscription.on_hold" || type === "subscription.paused") return "ON_HOLD";
  if (type === "subscription.expired" || type === "subscription.failed") return "EXPIRED";
  if (type === "subscription.cancelled")
    return data.cancel_at_next_billing_date ? "ACTIVE" : "CANCELLED";

  const status = String(data.status || "").toLowerCase();
  if (status === "past_due") return "PAST_DUE";
  if (status === "on_hold" || status === "paused") return "ON_HOLD";
  if (status === "expired" || status === "failed") return "EXPIRED";
  if (status === "active" || status === "trialing") return "ACTIVE";
  if (status === "cancelled" || status === "canceled")
    return data.cancel_at_next_billing_date ? "ACTIVE" : "CANCELLED";
  if (
    [
      "subscription.active",
      "subscription.unpaused",
      "subscription.renewed",
      "subscription.plan_changed",
    ].includes(type)
  )
    return "ACTIVE";
  if (existingStatus) return existingStatus;
  throw new TypeError("Subscription webhook is missing a recognized status.");
}
