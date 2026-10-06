import test from "node:test";
import assert from "node:assert/strict";
import { assessWaitlistReadiness } from "../../src/lib/campaigns/readiness.mjs";
import { snapshotTemplate } from "../../src/lib/templates/catalog.mjs";

function draft(overrides = {}) {
  return {
    id: "waitlist-1",
    status: "DRAFT",
    templateSnapshot: snapshotTemplate("saas"),
    templateRevision: 1,
    publishedRevision: null,
    publishedTemplateRevision: null,
    publishedSnapshot: null,
    customDomain: null,
    ...overrides,
  };
}

test("draft readiness identifies valid page/form and keeps publication as the next action", () => {
  const checks = assessWaitlistReadiness(draft());
  assert.deepEqual(checks.map(({ key, status }) => [key, status]), [
    ["page-structure", "ready"], ["signup-form", "ready"], ["publication", "action"],
  ]);
  assert.equal(checks[0].label, "Page structure");
  assert.match(checks[0].detail, /template requirements/);
  assert.equal(checks[2].href, "/wait-lists/waitlist-1/edit#publication-actions");
  assert.equal(checks[2].actionLabel, "Open publish controls");
});

test("invalid content and missing or duplicate signup forms point back to the page editor", () => {
  const invalid = snapshotTemplate("saas");
  invalid.sections = invalid.sections.filter((section) => section.type !== "form");
  const withoutForm = assessWaitlistReadiness(draft({ templateSnapshot: invalid }));
  assert.equal(withoutForm.find(({ key }) => key === "page-structure").status, "action");
  assert.equal(withoutForm.find(({ key }) => key === "signup-form").status, "action");
  assert.equal(withoutForm.find(({ key }) => key === "signup-form").href, "/wait-lists/waitlist-1/edit#page-content");
  const publication = withoutForm.find(({ key }) => key === "publication");
  assert.equal(publication.status, "pending");
  assert.equal(publication.stateLabel, "Finish setup");
  assert.equal(publication.href, undefined);

  const duplicate = snapshotTemplate("saas");
  duplicate.sections.push(structuredClone(duplicate.sections.find((section) => section.type === "form")));
  assert.equal(assessWaitlistReadiness(draft({ templateSnapshot: duplicate })).find(({ key }) => key === "signup-form").status, "action");
});

test("published readiness requires a valid live snapshot with no unpublished edits", () => {
  const published = snapshotTemplate("saas");
  const ready = draft({ status: "PUBLISHED", publishedRevision: 1, publishedTemplateRevision: 2, templateRevision: 2, publishedSnapshot: published });
  assert.equal(assessWaitlistReadiness(ready).find(({ key }) => key === "publication").status, "ready");

  const stale = assessWaitlistReadiness({ ...ready, templateRevision: 3 }).find(({ key }) => key === "publication");
  assert.equal(stale.status, "action");
  assert.equal(stale.label, "Publish your latest changes");
  assert.equal(stale.href, "/wait-lists/waitlist-1/edit#publication-actions");

  const missing = assessWaitlistReadiness({ ...ready, publishedSnapshot: null }).find(({ key }) => key === "publication");
  assert.equal(missing.status, "action");
  assert.match(missing.detail, /fresh, valid version/);
  const adminUpdate = assessWaitlistReadiness({ ...ready, templateRevision: 3, canPublish: false }).find(({ key }) => key === "publication");
  assert.equal(adminUpdate.status, "pending");
  assert.equal(adminUpdate.stateLabel, "Admin required");
  assert.equal(adminUpdate.href, undefined);
});

test("paused signups and unfinished custom domains are explicit without exposing provider details", () => {
  const checks = assessWaitlistReadiness(draft({
    status: "PAUSED",
    customDomain: { status: "NEEDS_DNS", hostname: "private.example.test", verification: [{ value: "secret" }] },
  }));
  assert.equal(checks.find(({ key }) => key === "publication").label, "Resume signups");
  assert.equal(checks.find(({ key }) => key === "publication").href, "/wait-lists/waitlist-1/edit#publication-actions");
  const memberResume = assessWaitlistReadiness(draft({ status: "PAUSED", canPublish: false })).find(({ key }) => key === "publication");
  assert.equal(memberResume.status, "pending");
  assert.equal(memberResume.stateLabel, "Admin required");
  assert.equal(memberResume.href, undefined);
  const domain = checks.find(({ key }) => key === "custom-domain");
  assert.equal(domain.status, "action");
  assert.equal(domain.href, "/wait-lists/waitlist-1/settings#custom-domain-title");
  assert.equal(JSON.stringify(domain).includes("private.example.test"), false);
  assert.equal(JSON.stringify(domain).includes("secret"), false);
});

test("a domain still being checked is pending instead of asking for an unnecessary action", () => {
  const domain = assessWaitlistReadiness(draft({ customDomain: { status: "VERIFYING" } })).find(({ key }) => key === "custom-domain");
  assert.equal(domain.status, "pending");
  assert.match(domain.detail, /still checking/);
  assert.equal(Object.hasOwn(domain, "href"), false);
});
