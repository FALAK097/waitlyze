import test from "node:test";
import assert from "node:assert/strict";
import { AUTOMATION_DEFAULTS, normalizeAutomationConfig } from "../../src/lib/email/automations.mjs";

test("automation starters stay consent-gated, versionable email recipes", () => {
  assert.deepEqual(Object.keys(AUTOMATION_DEFAULTS), ["WELCOME", "REFERRAL_REMINDER", "REFERRAL_MILESTONE"]);
  for (const [type, defaults] of Object.entries(AUTOMATION_DEFAULTS)) {
    const config = normalizeAutomationConfig(type, defaults);
    assert.equal(config.trigger, defaults.trigger);
    assert.equal(config.subject, defaults.subject);
    assert.ok(config.body.length > 0);
    assert.ok(config.delayMinutes >= 0 && config.delayMinutes <= 10080);
  }
});

test("recipe copies reject blank content, strip subject newlines, and bound delay and milestone inputs", () => {
  assert.throws(() => normalizeAutomationConfig("WELCOME", { subject: " ", body: "Hi", delayMinutes: 0 }), /subject and message/);
  assert.throws(() => normalizeAutomationConfig("REFERRAL_MILESTONE", { subject: "Thanks", body: "Great work", delayMinutes: 20000, milestoneCount: 2 }), /delay between/);
  assert.throws(() => normalizeAutomationConfig("REFERRAL_MILESTONE", { subject: "Thanks", body: "Great work", delayMinutes: 60, milestoneCount: 101 }), /milestone between/);
  const config = normalizeAutomationConfig("REFERRAL_MILESTONE", { subject: "Thanks\n{{waitlist}}", body: "Great work", delayMinutes: 60, milestoneCount: 4 });
  assert.equal(config.subject, "Thanks {{waitlist}}");
  assert.equal(config.delayMinutes, 60);
  assert.equal(config.milestoneCount, 4);
});
