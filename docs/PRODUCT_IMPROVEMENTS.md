# Waitlyze product improvement backlog

Updated 11 October 2026 for PR #89. This is a comprehensive working backlog, not
an announcement that these capabilities are available. The user requested ideas
across the product; implementing every item is outside this PR's scope.

## Status and prioritization

**Built** means an implementation exists in this checkout, not that it has been
accepted by customers or verified in production. **Partial** means a foundation
exists but the full user workflow, provider setup, or operational proof remains
incomplete. **Planned** means a proposed capability. Every unchecked task needs
its acceptance condition verified before being marked complete.

- **P0:** release safety and proof of existing promises.
- **P1:** reduce friction and improve conversion in the existing workflow.
- **P2:** extend growth, developer, and collaboration capabilities.
- **P3:** optional advanced offerings, justified by customer demand.

Dependencies: Phase 0 is the release gate. Phase 1 can improve presentation in
parallel with Phase 0. Phases 2 and 3 require stable signup, event, and delivery
contracts. Phase 4 requires the consent/attribution foundation. Phase 5 requires
reliable invitations and billing/entitlement boundaries. Phase 6 is continuous.
Do not delay release for every optional idea; explicitly defer it.

## Verified code map

| Area | Current status | Evidence and limits |
| --- | --- | --- |
| Launch templates and section builder | Built | `src/lib/templates/catalog.mjs`, `src/components/product/snapshot-page-builder.jsx`; catalog validates hero/features/FAQ/form/footer sections. More template breadth and custom fields remain proposals. |
| Draft editing/versioning | Built | `src/lib/campaigns/save-draft-snapshot.mjs`, `src/app/actions/draft-snapshot.js`; revision control is distinct from collaborative realtime editing. |
| Publish, pause, rollback | Built | `src/lib/campaigns/publication.mjs`, `src/app/actions/publication.js`; persistent public snapshots and launch readiness exist. |
| Hosted page and embed | Built | `src/components/product/waitlist-page-content.jsx`, `public/js/embed.js`, `src/components/product/publication-options.jsx`; external host compatibility needs runtime tests. |
| Custom domains | Partial | `src/lib/domains/provider.mjs`, domain API route and product settings; Vercel authorization/DNS/host routing remain provider-dependent. |
| Signup and email verification | Built | `src/lib/campaigns/signups.mjs`, signup/verify API routes; system-wide abuse controls and email-delivery proof remain separate. |
| Referrals and manual review | Built | `src/lib/campaigns/referral-position.mjs`, `referral-review.mjs`, `src/components/dashboard/referral-review.jsx`; reward fulfillment and launch waves are not implied. |
| Audience listing/filter/export | Built | `src/lib/audience-query.mjs`, `src/components/dashboard/audience-table.jsx`, subscriber API and account export; scheduled CRM synchronization is separate. |
| Acquisition analytics | Built | `src/lib/analytics/waitlist-analytics.mjs`, `src/components/product/waitlist-analytics.jsx`; basic date-window metrics exist, full attribution/activation analytics do not. |
| Email templates, tests, broadcasts | Built | `src/app/actions/emails.js`, `src/components/email/broadcast-manager.jsx`; live recipient delivery and verified sender-domain configuration require separate evidence. |
| Welcome/referral automations | Built | `src/lib/email/automations.mjs`, automation actions/UI; workers, scheduled processing, consent, and provider results need runtime validation. |
| Outbox, suppression, unsubscribe | Built | `src/lib/email/outbox.mjs`, `suppression.mjs`, `unsubscribe.mjs`; not a claim of exactly-once delivery or unlimited throughput. |
| Resend workspace integration | Built | `src/lib/integrations/resend-sender.mjs`, secret storage and integration settings routes; not a catalog of native integrations. |
| Signed webhooks, retries, replay, rotation | Built | `src/lib/webhooks/delivery.mjs`, `security.mjs`, webhook settings/routes; receiver-level and failure-mode validation required. |
| Scoped API keys | Built | `src/lib/campaigns/api-key.mjs`, `src/utils/api-key-auth.js`, key API routes; public API docs/SDK breadth remain planned. |
| Workspaces, roles, invitations | Built | `src/lib/workspaces/service.mjs`, `invitations.mjs`, invitation actions, team settings; SSO, fine-grained roles, and audit-log UI remain proposals. |
| Account settings/export | Built | `src/app/actions/settings.js`, `src/lib/account-export.mjs`; complete data-deletion/retention workflows require further design. |
| Local migration upgrade checks | Built | `scripts/check-migration.mjs`, `docs/MIGRATION_CONSOLIDATION.md`; not proof that external databases have compatible migration history. |
| Pricing and billing | Partial presentation | Pricing/upgrade components exist; payment-provider and subscription entitlement enforcement were not established by this audit. Do not describe paid-plan operations as verified. |

## Competitor and design evidence

Detailed public-source research, limitations, and links are in
[LANDING_PRODUCT_RESEARCH.md](LANDING_PRODUCT_RESEARCH.md). Suggested directions
below are **our proposals**, informed by those observed workflows:

- [LaunchList](https://getlaunchlist.com/): connect pages/forms, qualified contacts,
  referral growth, communication, and controlled releases.
- [GetWaitlist docs](https://getwaitlist.com/docs): separate hosted/embed/API
  installation from integrations, and provide useful signup-quality controls.
- [WaitForIt](https://waitforit.me/): connect branded forms, referrals, and insight;
  public editor demo establishes a useful way to demonstrate editing.
- [WaitlistNow](https://www.waitlistsnow.com/): template-led setup and a guided
  product demonstration, rather than a long list of invisible promises.
- [Prefinery](https://www.prefinery.com/) and
  [KickoffLabs](https://kickofflabs.com/): optional referral incentives and access
  waves after trusted identity, qualification, and delivery are established.
- [Dodo Payments](https://dodopayments.com/): prominent product demonstrations with
  selectable workflow stages. Waitlyze should show its own interface, with manual
  control, reduced-motion behavior, and restrained colored demonstration surfaces.

Vendor descriptions are not independent operational proof. No private competitor
account or paid workflow was tested. Public source inspections of EarlyPass and
OpenLaunch are documented in the research file; do not copy restricted code or
infer reliability from comments/README claims.

## Phase 0 — P0: prove and secure the release

These are acceptance checks for existing/partial functionality before promoting
this PR to production, not speculative feature scope.

- [ ] **Complete launch journey:** create account/workspace → select template → edit/save → publish → hosted signup → verify → referral → analytics/export. Accept when persisted state and the visitor/customer experience agree, including refresh and return visits.
- [ ] **Workspace isolation:** test two organizations and OWNER/ADMIN/MEMBER boundaries across reads, writes, exports, uploads, key management, email sends, domains, and invitations. Accept when unauthorized direct API/action requests are denied independently of UI visibility.
- [ ] **Key revocation:** demonstrate removed/demoted issuers, expired/revoked keys, changed scopes, and paused campaigns lose access. Accept when retries cannot resurrect access and logs contain no raw secrets.
- [ ] **Public signup abuse:** burst-test atomic duplicate handling, self-referral, cross-campaign referral, normalized emails, invalid payloads, and token replay. Accept when identity/credit cannot be inflated and valid retries are idempotent.
- [ ] **Verification lifecycle:** exercise expiry, resent links, used tokens, already-verified users, and provider delay. Accept when responses reveal no unnecessary subscriber data and recovery is understandable.
- [ ] **Distributed rate limiting:** prove enforcement across server instances using trusted proxy IP rules. Accept when rotating requests between instances cannot bypass sensitive endpoint limits; document fail-open/fail-closed decisions by route.
- [ ] **Worker operation:** establish authenticated scheduling, lease recovery, retries, bounded batches, queue latency alarms, and a runbook. Accept when killed/stalled jobs recover without unbounded replay or duplicate recipient enrollment.
- [ ] **Real email delivery:** test verified sender domain, bounce/complaint ingestion, suppression, unsubscribe, missing credentials, and provider failures. Accept when suppressed/unsubscribed recipients are excluded across broadcasts and automation paths.
- [ ] **Webhook receiver proof:** test HMAC, exact bytes, timestamp tolerance, rotation overlap, replay/timeout/retry, SSRF/DNS rebinding, redirect policy, and paused subscriptions. Accept when private targets remain unreachable and failure details are safely actionable.
- [ ] **Upload safety:** test decompression bombs, misleading MIME/extensions, SVG/HTML, ownership checks, and public asset deletion. Accept when only decoded/re-encoded approved images are served and other tenants' objects remain inaccessible.
- [ ] **Migration/provider readiness:** run fresh and populated-main upgrades; check actual deployment migration history before deploy. Accept when main-only history is compatible and no old PR migration mismatch is bypassed.
- [ ] **Secrets/provider inventory:** classify required versus optional integrations, use production-specific keys, verify server-only imports, and redact logs. Accept when local generated secrets are never assumed to configure external production services.
- [ ] **Dependency and release audit:** review dependency advisories, security headers, unsafe HTML/Markdown sinks, auth redirects, CORS, cron endpoints, and any capture/fixture routes. Accept when exploitable findings have fixes or documented release blockers.
- [ ] **Restore drill:** restore an isolated database backup and check user/workspace/publication/email state. Accept when recovery time and data-loss expectations are documented and verified.

## Phase 1 — P1: faster setup and clearer presentation

### Onboarding and first publish

- [ ] **Goal-based setup** (Planned): ask launch type and first use case, then select a useful starter. Accept when users can skip and defaults remain editable.
- [ ] **Contextual onboarding checklist** (Partial readiness foundation): include branding, form copy, consent, publication, test signup, sender/integration readiness. Accept when each item reads actual state and links to its fix.
- [ ] **Safe sample workspace** (Planned): opt-in dummy data with a reset/delete action. Accept when sample subscribers never enter real sends or integrations.
- [ ] **Template preview gallery** (Partial catalog): compare SaaS, AI, mobile app, creator, community, event, and ecommerce launch layouts. Accept when preview works on mobile and applying a template clearly explains replacement of draft content.
- [ ] **Starter-copy quality** (Partial): remove hidden placeholders and give concise headline/benefit/form examples. Accept when publish readiness surfaces remaining sample copy without blocking intentionally chosen wording.
- [ ] **Import onboarding** (Planned): validated CSV mapping, duplicate preview, explicit consent provenance, and rollback report. Accept when imported addresses are not silently treated as opted-in or verified.

### Builder, form, and publish

- [ ] **Builder undo/redo** (Planned): local history plus server save revisions. Accept when an accidental edit can be undone without losing a newer server revision.
- [ ] **Autosave and save-state clarity** (Partial manual revision flow): show saving/saved/offline/conflict states; preserve unsaved edits. Accept when route changes and reconnects do not silently discard edits.
- [ ] **Version comparison** (Partial revision records): readable draft/published diff and restore-to-draft. Accept when restoring never changes the live page until explicit publish.
- [ ] **Form custom fields** (Planned): optional name, company, role, dropdown, and short response; bounded schema/versioning. Accept when published forms, embed, API, export, and privacy handling share the same contract.
- [ ] **Conditional questions** (P2 Planned): request additional information only when relevant. Accept when hidden required fields never block a signup.
- [ ] **Brand asset polish** (Partial upload): logo crop/fit controls, accessible contrast checks, font fallbacks. Accept when hosted/embed rendering is consistent and unreadable choices are explained.
- [ ] **Mobile editor preview** (Partial): phone/tablet/desktop widths without changing data. Accept when published pages remain usable at 320px and zoomed layouts.
- [ ] **Publish choice clarity** (Built options, polish): show hosted Waitlyze URL and copyable embed script with a short install example. Accept when neither path exposes a privileged secret.
- [ ] **Install verification** (Planned): check embed detection, origin/setup errors, and a successful safe test event. Accept when cross-origin restrictions have specific guidance instead of a generic failure.
- [ ] **Custom-domain guidance** (Partial): present exact DNS records, propagation state, retry, conflict, and disconnect behavior. Accept when incorrect DNS and provider authorization failures can be distinguished.
- [ ] **Availability controls** (Planned): opening/closing date, signup cap, pause message, optional closed-state follow-up. Accept when enforcement happens server-side across all signup paths.
- [ ] **Localized pages** (Planned): campaign languages, locale-aware messages, RTL testing, and language fallback. Accept when forms, verification, email, and metadata use the selected locale consistently.

### Landing and honest demos

- [ ] **Product tour playback** (Planned enhancement): short actual product recordings for Design/Publish/Understand; advance on completion, click selects/restarts, slim progress, pause control. Accept when reduced-motion users receive a stable manual view and hidden tabs/offscreen media pause.
- [ ] **Publish demo story** (Planned presentation): show script installation and hosted URL from the same campaign. Accept when the demo describes actual production-supported options.
- [ ] **Interactive signup example** (Planned): local-only simulated join/confirmation/referral state. Accept when input is not transmitted or persisted and the simulation remains visibly truthful.
- [ ] **Template gallery section** (Planned): a small visual set linked to creation. Accept when it adds product evidence without repeating the tour or creating a wall of cards.
- [ ] **Integrations section** (Partial): show shipped Resend/webhooks/API; label proposed native connectors separately. Accept when every published logo has an available setup path or a planned marker.
- [ ] **Use-case example pages** (Planned): focused launch examples for relevant audience groups. Accept when they show real configurations, unique helpful content, and avoid fabricated customer proof.
- [ ] **Customer proof** (Planned after customers): permissioned quotes/results/case studies. Accept when attribution and measurement sources exist; do not fill gaps with fake testimonials.
- [ ] **Accessible tour alternatives** (Planned): captions/transcripts and stills/full-size views. Accept when the tour conveys the same core message without motion or audio.

## Phase 2 — P1/P2: trust, audience, and launch management

Depends on stable identity, verification, suppression, and workspace isolation.

- [ ] **Signup quality dashboard** (Partial manual referral review): separate pending verification, suspected abuse, excluded referral credit, and delivery suppression. Accept when each state has a reason and recoverable action.
- [ ] **Honeypot/challenge protection** (Planned): progressive bot friction rather than universal CAPTCHA. Accept when genuine keyboard/screen-reader users can recover and bypass attempts hit server-side checks.
- [ ] **Email/domain rules** (Planned): disposable-domain checks, allow/deny rules, and organization-only launches. Accept when configurable policy gives clear rejection reasons without leaking other subscribers.
- [ ] **Risk signals with appeal** (Planned): velocity/device/referral-pattern signals with documented retention and false-positive review. Accept when a score cannot silently delete qualified users or create inaccessible appeal flows.
- [ ] **Subscriber detail timeline** (Planned): signup source, consent, verification, referrals, messages, invitations, and integration events. Accept when tenant scoping and sensitive-data redaction apply to every event.
- [ ] **Tags and saved segments** (Planned): verification, referral count, fields, source, and signup age. Accept when segment counts have clear snapshot/live semantics and exclusions remain visible.
- [ ] **Bulk audience actions** (Planned): tag, export, invite, or unsubscribe with preview and confirmation. Accept when large batches are resumable and cannot bypass per-recipient eligibility.
- [ ] **Duplicate merge workflow** (Planned): retain historical events and consent provenance while consolidating identity. Accept when manual merges cannot transfer referral credit twice.
- [ ] **Reward milestones** (Planned): qualifying thresholds, limits, fulfillment status, and auditable adjustments. Accept when self/duplicate/unverified referrals cannot earn unintended rewards.
- [ ] **Referral sharing kit** (Partial links): copy/share actions, optional message templates, social image, and source attribution. Accept when IDs/URLs are safe and no private signup identifiers leak.
- [ ] **Leaderboard privacy** (Planned): opt-in display names, masked identity, and no email exposure. Accept when private campaigns cannot disclose their audience through leaderboard endpoints.
- [ ] **Access waves** (Planned): prioritized eligible segment, preview recipients, idempotent invitation tokens, expiry, and redemption. Accept when retries cannot grant duplicate access or exceed the wave cap.
- [ ] **Invitation outcomes** (Planned): invited → delivered → redeemed → activated states; optional external activation event. Accept when email opens are not reported as product activation.
- [ ] **Capacity/wave scheduling** (Planned): timed waves, pause/retry, and manual override. Accept when job crashes recover deterministically and canceled waves cannot later send.
- [ ] **Campaign duplication/archive** (Planned): clone editable configuration without subscribers/secrets; archive preserves exports. Accept when copying never exposes old integrations or sends to the original audience.

## Phase 3 — P1/P2: communication and developer experience

### Email operations

- [ ] **Sender setup wizard** (Partial Resend settings): identity/domain verification, connection test, and missing DNS guidance. Accept when unsafe/unverified sender choices fail before a real campaign send.
- [ ] **Consent provenance UI** (Partial event records): show timestamp, source, and exact consent text; import legacy state as unknown. Accept when unknown consent never becomes opted-in through retries or edits.
- [ ] **Broadcast scheduling** (Planned): timezone, audience snapshot, preview, safe cancellation, and send limits. Accept when cancellation excludes unsent recipients and duplicate scheduled executions are harmless.
- [ ] **Template preview/test quality** (Partial): mobile/email-client preview, plain-text version, variable validation, and safe test recipients. Accept when missing variables cannot produce broken production messages.
- [ ] **Automation recipe expansion** (Partial three recipes): verification reminder, re-engagement, wave invite, and post-activation follow-up. Accept when each recipe defines consent class, frequency cap, cancellation, and eligibility.
- [ ] **Delivery center** (Partial provider/outbox records): show queued/attempted/provider-accepted/delivered/bounced/suppressed states distinctly. Accept when provider acceptance is not mislabeled as recipient delivery.
- [ ] **Dead-letter retry controls** (Partial failed states): inspect safe reason, fix config, replay bounded recipients. Accept when replay honors unsubscribe/suppression again and records who triggered it.
- [ ] **Deliverability safeguards** (Planned): unsubscribe headers, bounce/complaint thresholds, rate/ramp controls, and automatic suspension. Accept when bad lists cannot silently damage a shared sender reputation.
- [ ] **Additional providers** (P3 Planned): assess SES/Postmark/other providers by demand; keep a narrow sender interface. Accept when provider-specific events map to explicit common semantics.

### API, webhooks, and integrations

- [ ] **OpenAPI contract** (Planned): documented request/response schemas, authentication, scopes, errors, pagination, rate limits, and idempotency. Accept when contract tests and generated examples agree with actual routes.
- [ ] **Developer docs site** (Planned): quickstarts, server/client security boundaries, troubleshooting, changelog, and version policy. Accept when a new developer can integrate without asking for undocumented fields.
- [ ] **Embed installation guides** (Planned): plain HTML, React/Next.js, Webflow, Framer, WordPress, Shopify, and Squarespace. Accept when copy/paste guides are tested in actual host environments before claiming compatibility.
- [ ] **TypeScript SDK** (Planned after contract): typed methods/errors, timeout/abort, explicit retry policy, and tree-shakable entry points. Accept when privileged keys cannot accidentally be bundled into browser examples.
- [ ] **React embed wrapper** (Planned): lifecycle-safe mount/unmount and no duplicate event listeners. Accept when Strict Mode and client navigation do not create duplicate forms/events.
- [ ] **Python SDK** (P3 Planned): evaluate demand after stable HTTP API. Accept when maintained examples cover real error/retry cases rather than only the happy path.
- [ ] **Webhook event catalog** (Partial delivery system): signup created/verified, referral qualified, invitation redeemed, delivery status. Accept when versioned payloads expose minimum required data and have contract fixtures.
- [ ] **Webhook signing examples** (Planned): raw-body verification for Node/Python, rotation, replay protection, response expectations. Accept when examples pass tampering and timestamp tests.
- [ ] **Integration delivery logs** (Partial generic webhooks): correlation IDs, redacted payloads, retry/replay status, downloadable debug summaries. Accept when logs cannot leak credentials or cross-workspace data.
- [ ] **Slack/Discord notifications** (Planned): scoped connection, configurable events, batching, and disable/revoke. Accept when bursts do not flood channels and failed delivery is visible.
- [ ] **Zapier/Make connectors** (Planned): triggers/actions with test samples and least privilege. Accept when reconnection and retry do not duplicate subscriber records or change consent.
- [ ] **Airtable/Sheets synchronization** (Planned): field mapping and explicit one-way/two-way semantics. Accept when deletion/unsubscribe rules are defined and row updates are idempotent.
- [ ] **HubSpot/Mailchimp/Brevo connectors** (P2/P3 Planned): demand-ranked connectors with subscription-state mapping. Accept when destination marketing consent never overrides source suppression silently.
- [ ] **Integration health checks** (Partial test endpoints): reconnect state, failure alarms, and last successful delivery. Accept when a green connection test does not imply all future events delivered.
- [ ] **API usage view** (Partial lastUsedAt): per-key volume/errors, scope summary, expiry, and rotation guidance. Accept when raw key material appears only at creation and never in history/export.

## Phase 4 — P2: analytics and experimentation

Requires validated event capture, visitor definitions, consent, and referral trust.

- [ ] **Metric dictionary:** define unique visitors, signups, verified signups, conversion, referral credit, attribution window, timezone, and exclusions. Accept when chart/tooltips/export calculate the same quantities.
- [ ] **Source/UTM breakdown:** first/last-touch source, campaign tags, referrer policy, and unknown bucket. Accept when missing attribution remains visible instead of falsely assigned.
- [ ] **Acquisition → activation funnel:** visitor, signup, verification, qualified referral, invite, redemption, activation. Accept when steps are independently timestamped and comparable date cohorts are used.
- [ ] **Segment comparisons:** qualified conversion by source, template, device, region, and launch wave. Accept when small cohorts/privacy limits and denominator context prevent misleading rankings.
- [ ] **Time-series comparison:** previous period, timezone-aware boundaries, annotations, and data delay notice. Accept when daylight-saving changes and late events do not distort totals.
- [ ] **Referral network insight:** sources of qualified referrals, conversion, and exclusion reasons. Accept when graph/detail views do not expose private subscriber identity publicly.
- [ ] **Email/integration analytics:** delivery/failed/suppressed counts and actionable failure trends. Accept when open/click estimates are labeled and privacy-protected opens are not treated as engagement certainty.
- [ ] **Analytics export/API:** filter/date-aligned CSV or JSON with stable columns. Accept when large exports are bounded/backgrounded and use the same authorization as screens.
- [ ] **Experiment framework:** opt-in headline/template/form A/B tests with fixed allocation and minimum sample guidance. Accept when users cannot publish false certainty from tiny samples or switch allocations retroactively.
- [ ] **Campaign insights:** rule-based useful recommendations before AI summaries. Accept when every suggestion references observed data and avoids unsupported causal claims.
- [ ] **Benchmarks** (P3): opt-in aggregate comparisons only after enough representative customers. Accept when aggregation privacy and sample bias are documented.

## Phase 5 — P2/P3: teams, commercial model, and governance

- [ ] **Team role management** (Partial): member list, revocation, invitation history, and safe role changes. Accept when there is always an owner and revoked members lose active access promptly.
- [ ] **Ownership transfer** (Planned): reauthentication, accepted transfer, notification, audit trail. Accept when a pending transfer cannot lock out the current owner or elevate an unverified account.
- [ ] **Project permissions** (Planned): campaign-level access only if team demand warrants complexity. Accept when API/action/export paths share one policy source.
- [ ] **Audit trail** (Planned): publish, role/key/secret changes, exports, sends, retries, and deletion. Accept when events are append-only in ordinary app paths and exclude sensitive payloads.
- [ ] **Notification preferences** (Planned): digest, incidents, growth milestones, delivery failures. Accept when critical security notices have a clear policy and routine notifications are controllable.
- [ ] **Billing provider integration** (Planned): checkout/customer portal, signed idempotent webhooks, plan state, cancellation and refunds. Accept when delayed/out-of-order events cannot incorrectly grant or revoke entitlements.
- [ ] **Transparent plan limits** (Planned): active campaigns, subscribers, sends, team seats, domains, and API capacity. Accept when server-side enforcement and usage displays agree; do not imply unlimited usage without capacity evidence.
- [ ] **Limit approach behavior** (Planned): reminders, grace policy, export access, and clear upgrade path. Accept when hitting a plan limit does not silently lose signups or lock users out of their data.
- [ ] **Usage metering** (Planned): deduplicated billable units and reconciliation with provider invoices. Accept when retry/replay does not double charge.
- [ ] **Trials/free tier** (Planned): genuine activation value and explicit end state. Accept when conversion does not auto-enroll users into unexpected marketing or payment charges.
- [ ] **Annual/agency offerings** (P3): multiple client workspaces, delegated access, and white-label options. Accept when client isolation is proven before adding shared agency dashboards.
- [ ] **SSO/SCIM** (P3): demand-driven enterprise identity and lifecycle sync. Accept when deprovisioning revokes sessions/keys/invitations and recovery is documented.

## Phase 6 — continuous: quality, privacy, and operations

### Security and privacy

- [ ] **Threat model:** document trust boundaries for hosted forms, browser embed, privileged APIs, workers, uploads, integrations, and domains. Accept when each sensitive flow has an abuse case and owning mitigation.
- [ ] **Session controls:** session list/revoke, reauthentication for high-risk actions, secure-cookie/CSRF/origin coverage. Accept when revoked credentials cannot continue sensitive activity.
- [ ] **PII minimization:** inventory IP/geolocation/email/custom-field data and reduce collection to justified needs. Accept when privacy copy, collection, retention, and export match.
- [ ] **Retention and deletion:** account/workspace/subscriber deletion jobs, export-before-delete, tombstone/backup policy. Accept when deletion covers queued jobs, external connector copies, and public caches within documented limits.
- [ ] **Secret key rotation:** durable encryption-key versioning and re-encryption plan. Accept when rotating keys does not orphan stored webhook/integration credentials or require plaintext exports.
- [ ] **Logging policy:** redacted structured logs/correlation IDs and bounded access/retention. Accept when sample emails, tokens, URLs with credentials, and provider payload secrets cannot enter routine logs.
- [ ] **Dependency policy:** scheduled advisory review, lockfile checks, minimal permissions, and update regression suite. Accept when actionable advisories have owners and disposition.
- [ ] **Incident response:** contact path, severity triage, key revocation, customer notice procedure, and recovery exercises. Accept when an incident can be handled without relying on an undocumented developer laptop.

### Reliability and observability

- [ ] **Service objectives:** signup availability/latency, queue age, verification delivery, and webhook success targets. Accept when alerts reflect user impact rather than noisy raw infrastructure metrics.
- [ ] **Database capacity:** inspect real query plans, indexes, connection pooling, paginated scans, and transaction bounds. Accept when representative large audiences fit tested latency/memory limits.
- [ ] **Job execution limits:** batch size, concurrency, jittered backoff, retry budget, poison-event handling. Accept when one invalid recipient does not block unrelated campaigns.
- [ ] **Provider outage behavior:** graceful degraded states, paused sends, recovery, and clear user status. Accept when replay respects current consent and no outage creates a mass send storm.
- [ ] **Idempotency end to end:** signup → verification → referral → outbox → provider request → webhook. Accept when duplicate invocations are distinguishable from duplicate business effects.
- [ ] **Backup/restore and migration runbooks:** automated retention, tested restoration, deploy rollback limits. Accept when schema rollback and application rollback are not assumed interchangeable.
- [ ] **Health/status tooling:** internal health signals without public secrets, operational dashboard, public incident page if demand warrants. Accept when liveness does not falsely claim provider readiness.

### Performance, accessibility, and design consistency

- [ ] **Vercel React review:** parallel independent reads, request-scoped deduplication, small client props, dynamic heavy tools, minimal client boundaries. Accept when measured changes avoid regressions and authentication remains at every server mutation boundary.
- [ ] **Route bundle budget:** inspect builder/chart/editor chunks and load heavy tools only where used. Accept when marketing visitors do not download authenticated editing code.
- [ ] **Media budget:** responsive AVIF/WebP stills, compressed recordings, lazy/offscreen loading, stable aspect ratios. Accept when tour interaction remains fast on slow mobile links and layout does not shift.
- [ ] **Interaction performance:** profile large audience tables and chart state; paginate or virtualize when measured. Accept when sorting/filtering keeps input responsive without hiding information from assistive technology.
- [ ] **Keyboard/screen-reader journey:** dialogs, builder controls, tabs, FAQ, forms/errors, tables, copy actions. Accept when focus is visible, restored, and never trapped outside the intended dialog.
- [ ] **Reduced motion:** disable automatic tour advancement where appropriate and stop unnecessary animated effects. Accept when product meaning does not depend on motion.
- [ ] **Responsive/zoom sweep:** 320px, tablet, desktop, 200% zoom, large text, long names, and empty/error/loading states. Accept when controls stay reachable and content does not overflow.
- [ ] **Design tokens:** shared white/lime light-only surfaces, spacing, typography, button/input states, common containers. Accept when semantic product styling does not require reintroducing a theme branch.
- [ ] **Charts as data:** provide textual summaries/table/export and non-color-only series distinctions. Accept when key metrics remain understandable without the graphic.
- [ ] **Error writing:** actionable recovery, honest async states, field-level validation, and safe support identifiers. Accept when errors avoid raw stacks, contradictory status, or silent data loss.

### SEO, AEO, and distribution

- [ ] **Metadata consistency:** title/description/canonical/OG/Twitter/manifest/icons across landing, legal, and public campaigns. Accept when deployed URLs use the intended canonical host and previews do not share production canonicals incorrectly.
- [ ] **Indexation boundaries:** robots/sitemap exclude auth/private/API/fixture/admin routes; public campaign indexing is explicit. Accept when robots is never treated as access control.
- [ ] **Structured data:** truthful organization/software/FAQ markup matching visible content. Accept when no invented ratings, pricing, availability, or customer claims appear in JSON-LD.
- [ ] **Answer-focused docs:** concise setup answers, terminology, error explanations, accessible headings and real examples. Accept when useful content is available as HTML and not only video/images.
- [ ] **Public campaign SEO:** per-campaign metadata, safe image defaults, social-share preview, paused/unpublished behavior. Accept when private drafts cannot leak through metadata/image routes.
- [ ] **Content strategy:** installation guides, launch playbooks, honest comparisons, and changelog. Accept when content answers real support/search questions without duplicated thin pages.

## Folder and naming convention audit

The repository uses App Router routes, domain libraries, and shared/purpose-built
components. Those boundaries are useful; a whole-tree rename before launch would
add risk without improving the customer workflow. Recommended targeted work:

| Observation | Proposed convention and acceptance |
| --- | --- |
| Runtime domain logic is mostly `src/lib/<domain>/*.mjs`; server adapters use `.js`; UI uses `.jsx`. | Retain the current extensions for this PR. Document ESM/pure-domain versus Next-bound modules; consider TypeScript incrementally at contract boundaries instead of changing every file. |
| `src/app/actions/emails.js` combines templates, rendering/testing, transactional mail, and broadcasts. | Extract narrow pure/domain functions into `src/lib/email/` while keeping authenticated actions as thin adapters. Acceptance: authorization, eligibility, and provider behavior remain covered by integration tests. |
| `src/components/product/` mixes shared primitives with campaign-specific screens. | Move only during feature work: stable primitives remain shared; new campaign/analytics/publishing features get purposeful folders. Acceptance: imports stay direct and ownership is understandable; avoid barrel-export dependency chains. |
| Legacy `src/components/wait-lists/` coexists with snapshot-based product components. | Trace route imports and retire proven-unused legacy components in a separate cleanup. Acceptance: hosted and embed compatibility remains tested; never delete a public renderer solely because its name looks old. |
| Several older landing components coexist with the new public shell/page. | Remove only unused files identified through import/reference analysis, preserving any reused auth/footer logic. Acceptance: all public routes build and no hidden legal/auth surface regresses. |
| API spellings include `waitlist`, `wait-lists`, `waitlists`, and legacy `sign_up`. | Choose kebab-case for new unversioned folders and a documented versioned resource vocabulary. Existing public URLs need compatibility aliases and deprecation guidance before changes; internal names can be consolidated separately. |
| `src/utils/api-key-auth.js` is domain authorization outside `src/lib/campaigns/`. | On a later focused change, colocate API-key authentication with its domain or create `src/lib/api/` only if multiple API contracts justify it. Acceptance: no circular imports or unintended server/client imports. |
| Shared CSS, CSS modules, and legacy utility styling coexist. | Keep global CSS limited to tokens/base/shell; new feature styles prefer colocated modules where appropriate. Acceptance: semantic tokens and responsive behavior stay consistent rather than rewriting every stylesheet. |
| Migration history is deployment-critical, not disposable source cleanup. | Preserve main's two migrations and add this PR's single combined migration. Acceptance: fresh/legacy upgrades and history compatibility are proven; details in migration document. |
| Tests currently cover specific security and migration boundaries. | Grow `tests/<domain>/` with meaningful contract/database tests and reusable fixture helpers. Keep test-only data/routes out of production route trees. Acceptance: CI exercises new regressions and fixture endpoints cannot deploy. |
| Docs grew during revamp work. | Maintain this backlog, research evidence, migration runbook, and deployment proof as distinct linked documents. Acceptance: dates/status/links agree and obsolete instructions are explicitly superseded. |

## Decision log and proof boundaries

The requested launch design keeps white landing/product backgrounds, lime brand
accents, restrained borders, actual product imagery, and clear feature status.
The newest tour request supersedes the earlier click-only recommendation:
automatically advance when a short recording finishes, while preserving manual
selection and accessible pause/reduced-motion behavior.

Closing a backlog item requires evidence at its own boundary: code review,
local test, database integration, CI, browser runtime, provider/deployment
configuration, and customer acceptance are different checks. Generated local
secrets, a successful build, or an illustrative marketing recording cannot prove
production email/domain/billing operation.
