import assert from "node:assert/strict";
import test from "node:test";

import { subscriptionWebhookStatus } from "./subscription-webhook-status.mjs";

test("subscription lifecycle events map to fail-safe workspace billing states", () => {
  const cases = [
    ["subscription.active", {}, "ACTIVE"],
    ["subscription.past_due", { status: "active" }, "PAST_DUE"],
    ["subscription.on_hold", {}, "ON_HOLD"],
    ["subscription.paused", {}, "ON_HOLD"],
    ["subscription.unpaused", {}, "ACTIVE"],
    ["subscription.renewed", {}, "ACTIVE"],
    ["subscription.plan_changed", {}, "ACTIVE"],
    ["subscription.failed", { status: "active" }, "EXPIRED"],
    ["subscription.expired", {}, "EXPIRED"],
    ["subscription.cancelled", { cancel_at_next_billing_date: false }, "CANCELLED"],
    ["subscription.cancelled", { cancel_at_next_billing_date: true }, "ACTIVE"],
  ];

  for (const [type, data, expected] of cases) {
    assert.equal(
      subscriptionWebhookStatus(type, data),
      expected,
      `${type} ${JSON.stringify(data)}`,
    );
  }
});

test("subscription.updated preserves known state when its payload omits status", () => {
  assert.equal(subscriptionWebhookStatus("subscription.updated", {}, "ON_HOLD"), "ON_HOLD");
  assert.throws(() => subscriptionWebhookStatus("subscription.updated", {}), /recognized status/);
});

test("cancelled and terminal lifecycle events override contradictory payload status", () => {
  assert.equal(
    subscriptionWebhookStatus("subscription.cancelled", { status: "active" }),
    "CANCELLED",
  );
  assert.equal(subscriptionWebhookStatus("subscription.expired", { status: "active" }), "EXPIRED");
});
