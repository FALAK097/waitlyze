import assert from "node:assert/strict";
import test from "node:test";

import {
  identifyClientUser,
  initClientPostHog,
  resetClientUser,
  setClientGroup,
  trackClientEvent,
} from "../src/lib/posthog/client.js";
import { POSTHOG_EVENTS } from "../src/lib/posthog/events.mjs";
import { setServerGroup, trackServerEvent } from "../src/lib/posthog/server.mjs";

test("POSTHOG_EVENTS contains valid namespaced event taxonomy", () => {
  assert.ok(Object.isFrozen(POSTHOG_EVENTS), "POSTHOG_EVENTS must be frozen");

  // Check critical namespaced events
  assert.equal(POSTHOG_EVENTS.MARKETING_PAGE_VIEWED, "marketing:page_viewed");
  assert.equal(POSTHOG_EVENTS.MARKETING_SIGNUP_STARTED, "marketing:signup_started");
  assert.equal(POSTHOG_EVENTS.MARKETING_SIGNUP_COMPLETED, "marketing:signup_completed");
  assert.equal(POSTHOG_EVENTS.MARKETING_PRICING_VIEWED, "marketing:pricing_viewed");
  assert.equal(POSTHOG_EVENTS.WORKSPACE_CREATED, "workspace:created");
  assert.equal(POSTHOG_EVENTS.WAITLIST_CREATED, "waitlist:created");
  assert.equal(POSTHOG_EVENTS.WAITLIST_PUBLISHED, "waitlist:published");
  assert.equal(POSTHOG_EVENTS.WAITLIST_MILESTONE_REACHED, "waitlist:milestone_reached");
  assert.equal(POSTHOG_EVENTS.REFERRAL_CONVERSION_RECEIVED, "referral:conversion_received");
  assert.equal(POSTHOG_EVENTS.REFERRAL_REWARD_UNLOCKED, "referral:reward_unlocked");
  assert.equal(POSTHOG_EVENTS.BILLING_SUBSCRIPTION_CREATED, "billing:subscription_created");
  assert.equal(POSTHOG_EVENTS.BILLING_SUBSCRIPTION_UPDATED, "billing:subscription_updated");
  assert.equal(POSTHOG_EVENTS.BILLING_SUBSCRIPTION_CANCELLED, "billing:subscription_cancelled");
  assert.equal(POSTHOG_EVENTS.BILLING_PAYMENT_FAILED, "billing:payment_failed");
  assert.equal(POSTHOG_EVENTS.BILLING_REFUND_PROCESSED, "billing:refund_processed");
});

test("trackServerEvent and setServerGroup fail open on missing inputs", async () => {
  await assert.doesNotReject(async () => {
    await trackServerEvent({ distinctId: null, event: null });
    await trackServerEvent({ distinctId: "test_user", event: "" });
    await trackServerEvent({
      distinctId: "usr_123",
      event: POSTHOG_EVENTS.WORKSPACE_CREATED,
      properties: { workspace_id: "ws_456" },
      groups: { company: "ws_456" },
    });
    await setServerGroup({ groupKey: null });
    await setServerGroup({ groupKey: "ws_456", properties: { plan: "pro" } });
  });
});

test("client tracking methods safely no-op in server / non-window runtime", () => {
  assert.doesNotThrow(() => {
    initClientPostHog();
    trackClientEvent(POSTHOG_EVENTS.MARKETING_PAGE_VIEWED, { page_path: "/" });
    identifyClientUser("usr_123", { name: "Test User" });
    setClientGroup("ws_456", { name: "Test Workspace" });
    resetClientUser();
  });
});
