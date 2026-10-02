# Waitlyze revamp: product, design, architecture, and delivery

Date: 2026-10-02. Status: execution roadmap; the campaign-first product is shipping through stacked PRs, and implementation continues against the latest verified `main` (`ef2f54a`).
Source: `waitlyze_product_blueprint.md` supplied from Downloads, read in full. This document resolves its conflicting scope statements and grounds delivery in the current repository. It is the working plan; update the ledger as each PR ships.

## 1. Product decision

Waitlyze helps founders turn pre-launch interest into a verified audience, understand what brings valuable signups, and release access with confidence.

The unit of work is a **campaign** inside a **workspace**. The differentiator is a complete, trustworthy launch loop: choose a starter → publish → collect → verify → refer → understand → communicate → invite. Visual quality matters because it makes these jobs easier to understand and faster to finish.

Primary customer: an independent founder or small product team launching a SaaS, app, or community. Agencies are supported by workspace boundaries, but agency-specific features follow demonstrated demand. Avoid CRM, generic email marketing, arbitrary workflow canvases, and a full website builder.

Three distinctive experiences should make the product worth choosing:

1. **Launch readiness:** an actionable checklist grounded in real checks, with deep links to fix page, form, verification, delivery, and domain problems. Checks show checked time and stale/unknown states; a green score must never conceal a critical failure.
2. **Launch rehearsal:** run a clearly labeled test visitor through signup, verification, referral, and notifications. Test records, messages, and events are isolated from real audiences and reports. No external notification is sent until explicitly requested by the founder.
3. **Audience to release:** later, preview exactly who will receive access, why they qualify, and what will be sent; invite in waves with auditable results and a stop control.

These are product proposals, not features proven by market research. Validate them with founders before expanding their scope.

## 2. Current repository and consequences

Inspected on clean `main`; origin is `FALAK097/waitlyze`. No repository AGENTS.md or dedicated design standards were found in the inspected scope. README exists but needs runtime/setup modernization.

| Current evidence | Revamp consequence |
| --- | --- |
| Next 16.2.6, React 19, Tailwind 4, JSX, PostgreSQL/Prisma 7, Better Auth, R2 helpers, Resend, Recharts | Keep the stack; evolve services and contracts incrementally. Introduce TypeScript only for new domain contracts if the tooling slice demonstrates compatibility. |
| `components.json` uses `new-york`; current primitives import Radix | New product components use shadcn with Base UI. Migration needs composition and focus tests, not package substitution. |
| `prisma/schema.prisma`: User → WaitList; no Workspace, Campaign publication, page version, or consent model | Add tenancy and publication as expand/backfill/contract migrations. Preserve IDs and old public URLs. |
| SignUp lacks a campaign/email compound uniqueness constraint | Deduplicate deliberately, then enforce canonical-email uniqueness transactionally. A pre-read cannot protect concurrent joins. |
| `src/services/sign-up/index.js:39–85` reads all signups and rewrites all ranks; counts incoming and outgoing referral relations | Define eligible successful referrals, deterministic ordering, and indexed ranking. No whole-audience write fanout on each join. |
| `src/app/api/waitlist/route.js` also writes signups directly | Route all ingestion paths through one service, with legacy response adapters. |
| `src/lib/menu-list.js`: Dashboard, WaitLists, API Keys | Move to campaign context and workspace settings only when destinations work. |
| `src/app/layout.jsx` loads Inter; globals declare Montserrat and several unrelated font tokens | Establish one font source and one semantic type scale. |
| `package.json` has `eslint .` but no declared ESLint dependency/config found | Tooling phase must make lint runnable before claiming it is a gate. |

Scope of inspection: blueprint, package/tooling declarations, schema, route inventory, navigation, typography/color declarations, dashboard query, and signup service/API. This is **not** a completed runtime interface or security audit. Keyboard, screen reader, rendered contrast, zoom, theme, and mobile flows remain unverified.

## 3. Resolve the blueprint before coding

| Blueprint tension | Execution decision | Why |
| --- | --- | --- |
| Six creation stages versus a three-minute target | Three panels: Starter → Details → Review. Save a draft early. Page and advanced options are edited in campaign context. | Fewer compulsory decisions; time-to-first-publish is measured with real users. |
| Create versus publish conflated | Create saves a draft; Publish is a separate explicit action with checks and a public URL. | No accidental launch or email sending. |
| Beta type offered in V1, release flow deferred to V2 | Hide beta mode until basic invitation behavior works end to end. | Do not promise functionality through a selector. |
| Custom domains listed in both V1 and V1.5 | Hosted path first; subdomain only once wildcard DNS/TLS is configured. Custom domains follow the core loop. | A fabricated domain cannot be a launch destination. |
| Orange used for interaction, charts, and status | The current lime/ink direction assigns lime to primary action; statuses use dedicated semantics plus text/icons. Charts use separate chart roles. | Avoid implying static status text is clickable. |
| Applied → Verified → Invited → Active | Verification, audience membership, consent, and access are independent state dimensions. | An invited subscriber can later unsubscribe; these states cannot form one universal linear enum. |
| Workspace domains versus campaign domains | Domain ownership/verification belongs to the workspace; each hostname binding belongs to a campaign. | Avoid ambiguous routing and competing ownership. |

## 4. Information architecture

The owner selected a simpler two-destination product on 2026-09-27: **Waitlists · Settings**. This supersedes the earlier Dashboard/Campaigns/Audience navigation. Keep “waitlist” as the user-facing noun; the campaign domain adapter remains an internal implementation detail. Do not create a second dashboard, global audience page, template library, integration hub or automation hub merely to fill navigation.

**Waitlists** is the default authenticated entry. A concise table shows real waitlists with name, state and subscriber count, search when useful, and one “New waitlist” action. Starter selection belongs to creation. Any portfolio summary must earn its space with real data; an empty account has one clear creation path. Show a workspace selector only when the user belongs to multiple workspaces; a first-time founder receives a personal workspace automatically.

Opening a waitlist reveals contextual route tabs: **Overview · Page · Subscribers · Emails · Settings**. Show only implemented tabs. Overview changes with lifecycle: readiness for drafts; actual performance and failures for published waitlists. Analytics and referral performance live here, with time controls and readable data equivalents. Page owns the builder and publication. Subscribers owns search, filtering, profiles, exports and later invitation batches. Emails owns transactional messages, broadcasts and automation recipes through progressive secondary navigation; it does not open more global destinations. The local Settings tab owns that waitlist's form/referral options and publishing/domain configuration. Keep it short in the tab strip; use **Waitlist settings** in breadcrumbs or command results. The global Settings destination is **Workspace settings** in those same contexts. The visible waitlist name and a “Back to waitlists” link keep context clear.

**Settings** owns account/workspace configuration, with a quiet sticky table of contents on desktop and a collapsible section index on narrow screens. Sections are Profile, Workspace, Team, Integrations and Developers as those capabilities ship. Connection credentials and API keys live here; a waitlist selects which connection receives its events. Keep unrelated forms independently saveable and labeled, retain entered values on failure, and deep-link sections. Hide unsupported sections instead of displaying coming-soon controls. Billing receives no destination before actual paid functionality exists.

Canonical authenticated routes remain `/wait-lists`, `/wait-lists/new`, `/wait-lists/[id]` and contextual subroutes, plus `/settings` and its section anchors. Existing `/dashboard` becomes a compatibility entry to Waitlists when the shell ships. Preserve `/wait-lists/[id]/edit`, `/wait-lists/[id]/emails`, `/forms/[id]`, IDs and API payloads with adapters or safe GET redirects. Do not redirect POST requests without compatibility tests. Resolve workspace permissions on the server; a selected tab/workspace is not authorization.

Use native links for destinations, current-page semantics and stable URLs so reload, Back, Cmd/Ctrl-click and shared links work. Reserve actual ARIA tabs for local panels with their expected arrow-key behavior. At 320px, use a compact navigation strip and horizontally scrollable labeled waitlist destinations; keep the selected destination visible, avoid nested drawers, and leave the primary action reachable. Subscriber profiles use a focus-managed panel and full-screen mobile presentation.

Reference evidence: the supplied authenticated [GetWaitlist dashboard](https://getwaitlist.com/dashboard) showed a compact waitlist table and a New Waitlist action. Its waitlist detail exposes a local section menu (Signups, Widget Builder, Settings, Analytics, Email, Segments, Blast History, Automations); Signups then uses tabs for All Signups, Offboarded Signups, and Import/Export. Settings groups its long form into General, Collect Info, Redirection, Email Verification, Send Email, Leaderboard, and Delete. This supports keeping work inside each waitlist and using tabs only for peer views while giving settings a section index. Waitlyze intentionally starts with fewer contextual sections and grows them only as capabilities ship. The two-destination architecture is the owner's product decision, not a claim that the competitor implements every proposed detail.

## 5. Visual and interaction specification

Direction: cool neutral surfaces, ink typography, restrained lime actions, compact but comfortable controls. The owner selected [Dodo Payments](https://dodopayments.com/) as the visual reference: adopt its clear hierarchy, generous whitespace and lime/ink relationship across public and authenticated views while retaining Waitlyze copy and behavior. Atmospheric backgrounds belong only in marketing; operational screens stay quiet. This supersedes the initial warm/orange candidate. Stripe contributes clear operational detail; Linear contributes efficient hierarchy; Raycast contributes fast keyboard access; Notion contributes direct editing; Plivo contributes explicit delivery/status inspection. These are design intentions, not claims that their authenticated products were audited.

### Typography, layout, and surfaces

Use Geist Sans for app chrome and content; Geist Mono for code, tokens, and technical identifiers. Load through Next font tooling, real 400/500/600 weights, with one source of truth. Use root antialiasing, tabular numerals on metrics, balanced titles, and pretty body wrapping.

| Role | Size / line height | Use |
| --- | --- | --- |
| Page title | 28 / 36 px | One h1 per view |
| Section title | 20 / 28 px | Meaningful groups |
| Item title | 16 / 24 px | Campaign rows, panel headings |
| UI body | 14 / 22 px | Dense professional interface |
| Supporting copy | 13 / 20 px | Help and captions |
| Metadata | 12 / 18 px | Nonessential timestamps; never sole instructions |
| Mobile input / public body | 16 / 24 px | Avoid iOS input zoom; comfortable visitor forms |

Translate sizes to rem tokens. Use a compact top bar for the two primary destinations; avoid a permanent full-height navigation rail for two links. Settings can use a local 200 px section index on desktop. Main readable width is 1280 px; the builder can fill available space. Spacing scale 4/8/12/16/24/32/48. At least twice as much space between groups as within them. Break at content failure, not arbitrary device labels. Desktop targets aim for 40 px, touch 44 px. Radius roles: controls 8 px; ordinary panels 12 px; nested radii derived from padding. Borders communicate structure; layered shadows communicate elevation. One Lucide icon set, currentColor, optical alignment.

### Color contract

Keep existing HSL notation during migration; introduce hue primitives and semantic roles rather than scattering a second color format. Map shadcn compatibility tokens to the new roles. Candidate palette: cool near-white page, white surfaces, ink `#00160D`, readable slate secondary text, lime action `#C6FE1E` with ink label. Dark mode uses neutral charcoal surfaces, near-white content, and lime actions. A contrasting border defines the pale action against light surfaces; status green remains a distinct hue with labels/icons. Geist remains the shared UI font rather than importing Dodo proprietary assets.

These are starting design values, not verified rendered pairs. Generate consumed ramp steps with a color library; compute every text/control/focus/status pair and record exact results in the foundation PR. Normal text ≥4.5:1, qualifying large text ≥3:1, meaningful component boundaries/focus indicators ≥3:1 where required. Test composited backgrounds and both themes. Do not use a low-contrast muted token for readable content. Success, caution, and destructive need distinct roles; all carry icons or labels. Theme mechanism: next-themes class only, Light/Dark/System, transitions suppressed during switching.

### Motion and accessibility contract

Command palette, keyboard navigation, frequently repeated selection, and page content appear immediately. Occasional pointer-open overlays can use 160–200 ms opacity/transform ease-out, origin-aware popovers, and faster exits. Never transition all properties. Press feedback uses the more specific better-ui/make-interfaces convention: 0.96, pointer only, with a static escape hatch. No keyboard scale effects. Reduced motion removes transforms and decorative autoplay; touch hover is gated by hover/fine-pointer media conditions. No dashboard chart entrance choreography.

Native controls first; Base UI for composite widgets. Visible ≥2 px focus perimeter, forced-colors support, skip link, meaningful landmarks, labels and autocomplete, inline announced errors, first-invalid-field focus, modal focus trap/restore, Escape dismissal. Toast actions/errors persist until dismissed. Stable polite status regions announce routine updates. Builder drag has Move up/Move down keyboard alternatives; chart data has a readable table. A command palette accelerates visible navigation; it never replaces it.

### States are part of each feature

Every slice supplies loading, first-use empty, filtered empty, recoverable error, partial failure, read-only/permission-denied, pending-save, saved, and stale-data states as applicable. Skeletons match the final layout. Keep cached content visible during refresh. Never optimistically claim publish, email sent, domain verified, or invitation accepted. Autosave shows Saving/Saved/Unable to save and a retry path; revision conflicts preserve both drafts.

## 6. Required libraries and migration strategy

**shadcn + Base UI:** use current official Base UI-backed shadcn components, installed into a temporary reference directory first. Own wrappers under the product component namespace; move legacy callers only after behavior tests. Audit `asChild` → `render`, refs, controlled values, portal stacking, data attributes, and trigger origins. Do not run an overwrite of the entire existing component directory. Retire Radix packages only after their last import disappears.

**@shadcn/lint:** register with working tooling first, without activating a blanket preset. Then add deliberate contracts for the new product namespace: semantic colors, component-owned sizes, allowed layout overrides, and theme spacing. Legacy and campaign-customization styles get explicit scoped treatment with a migration ledger, not global disabling. Passing plugin registration does not prove design enforcement.

**Evil Charts:** use selected source/registry recipes for signup trend and acquisition, adapted to our chart wrappers. Inspect actual source dependencies and license before importing; the homepage alone does not verify Base UI compatibility. Recharts is already present; no second chart engine without demonstrated need. Remove unnecessary animation, provide labels/table equivalents, consistent periods, zero states, and theme contrast. Avoid radial charts for simple ordered source comparisons.

**DiceBear:** generate deterministic fallback avatars locally with `@dicebear/core` and a chosen licensed style. Seed with an opaque identifier, never email sent to a public avatar API. Prefer uploaded avatars when available. No synthetic headshots or generated social proof. Adjacent named avatars are decorative; standalone functional avatars get accessible names. Cache generation and constrain SVG output to trusted library code.

## 7. Templates and the publishing model

Launch with six purposeful starters: SaaS, mobile app, AI tool, community, consumer product, newsletter; Blank is an escape hatch. Each includes page sections, minimal form, thank-you copy, and transactional email copy. Referrals default off unless explicitly chosen. Templates may recommend verification; the review screen explains the requirement and sending prerequisites. No template invents testimonials, subscriber counts, or claims.

Use a versioned template manifest: ID, schema version, template version, category, preview asset, section list, theme roles, form fields, thank-you variant, and email defaults. Applying a template copies a snapshot; upstream edits never mutate existing campaigns. Keep starter content editable. Validate section discriminators and payloads server-side.

Builder V1: section-based configuration with inline text editing, ordered section list, properties panel, desktop/mobile preview, undo/redo, and autosave. Narrow screens use Preview/Sections/Properties modes rather than shrinking three columns. Limit typography and spacing to useful presets. Separate draft revision from immutable published snapshot. Publish validates required content, valid form, destination, and enabled delivery dependencies, then atomically points the public campaign at the snapshot. Unpublishing preserves data and serves a clear paused state.

## 8. Domain architecture and migration

Keep Next App Router, PostgreSQL/Prisma, Better Auth, and existing media/email providers. Introduce services for campaign, ingestion, referrals, delivery, and authorization; route handlers and server actions call them. Tenant checks happen on every resource read/write, nested query, media operation, export, and API-key request. Never accept a client workspace ID as proof of access.

Minimum models by delivery need:

- Foundation: Workspace, WorkspaceMember, workspace linkage on WaitList, member role and default personal workspace.
- Campaign core: campaign lifecycle, unique public slug, draft/published PageRevision, versioned form config, template snapshot.
- Audience: workspace Contact and campaign Signup membership; canonical email, verification state/token, consent ledger, suppression state, attributed source.
- Growth: Referral with eligible/rejected state, score inputs, stable public referral token, events and indexed ordering.
- Delivery: Domain/DomainBinding, EmailTemplateRevision, Broadcast, RecipientSnapshot, EmailDelivery, AutomationVersion/Run/Step, IntegrationConnection/Subscription, Webhook/Delivery, ApiKey scope.
- Release: Invitation, Wave, access token and accepted state. Active requires a real external activation signal; opening an email does not mean active.

Initially retain the WaitList database/table name behind a Campaign domain adapter to avoid a destructive rename. Add nullable workspace linkage, backfill one personal workspace per existing owner using idempotent batches, verify counts and orphan checks, then require the foreign key. Preserve ownership while adding roles. Owner manages billing/deletion/ownership; Admin manages campaigns, sending and connections; Member edits drafts and views audience. Workspace audience access must be explained before inviting teammates. Per-campaign ACLs follow demand.

Email canonicalization trims and normalizes case according to a documented policy; never strip dots or plus suffixes globally. Report duplicate groups before merging. Preserve referral relationships and consent evidence; never convert historical records into “verified” or “marketing consented” by default. Add indexes for tenant/campaign/date/status and composite uniqueness after backfill.

Feature flags separately control new shell, workspace enforcement, campaign core, new ingestion, and delivery. Rollout sequence: additive schema → backfill/report → scoped service reads → compatible writes → canary → broad enablement → later cleanup. Rehearse on sanitized production-shaped data. Old app remains deployable while migrations are additive. Take and restore-test a backup before production migration; rollback flags do not undo destructive SQL.

## 9. Reliable ingestion, referrals, analytics

Signup acceptance, deduplication, attribution, and an outbox event commit in one transaction. Rate-limit public ingress; protect against replay, self-referrals and cross-campaign tokens. Existing subscriber responses must not disclose private profile data. Public keys identify forms; server API secrets never appear in embeds. Verification tokens are hashed, expire, have bounded resends, and are single use. Do not log raw signup payloads or credentials.

Only eligible referrals contribute to position. Define order as verified referral score descending, joined timestamp ascending, stable ID ascending. Compute indexed ranks for individual views or refresh a versioned snapshot asynchronously; benchmark before picking a strategy. Concurrent signups cannot overwrite each other's scores. Suspicious activity is held for review with reasons and an appeal/review action; IP alone is not proof of fraud.

Metrics contract: signups are distinct accepted campaign memberships; verified counts are separate; visitors are eligible distinct visitor identifiers within the period and collection policy; conversion is accepted signups / eligible visitors, shown unavailable when denominator is absent; referral share uses eligible attributed signups / accepted signups. Counts above expected ratios surface instrumentation warnings. Define first-touch source, direct/unknown, last-touch separately, bot filtering, timezone boundaries, and equal-length comparison windows. Never render fake sample data as live metrics. Visitor counts before instrumentation is deployed remain unavailable.

Events carry ID, schema version, workspace, campaign, subject, occurrence time, source, test/live context, and minimal payload. Outbox is durable; consumers use event ID deduplication. Domain events power operational records; aggregates power charts. PostHog measures Waitlyze activation separately from campaign audience analytics. Historical impressions/signups get clearly marked legacy aggregates, not fabricated precise events.

## 10. Emails, automations, and integrations

Deliver transactional confirmation/verification before broadcasts. Configure the platform sender for first launch; bring-your-own Resend and custom sending domains follow. Broadcasts require verified sending setup, recipient preview, permission, explicit send confirmation, consent/suppression filtering, cancellation of unsent work, and delivery results. Apply provider callback signature verification, bounce/complaint suppression, unsubscribe handling, sending limits, and credentials encrypted at rest. Email opens are noisy; never claim them as reliable activation.

Automation V1 uses three editable recipes: welcome after eligible signup, one referral reminder after a delay, and verified referral milestone. Use a clear trigger → condition → delay → action list, not a node canvas. Configure Draft/Enabled/Paused, explain timing/timezone, test with isolated records, show run history and why a step was skipped. Reminder eligibility must be rechecked at execution. Default off; transactional messages and recipes cannot double-send the same welcome.

Persist immutable automation versions and per-run steps. Queue execution from the outbox; idempotency key includes event + automation version + step. Cancellation/consent checked before each send; cap runs, retries, and delays. Define whether edits affect existing runs (default: existing runs keep their version, pause cancels pending delivery). Exactly-once external delivery is not guaranteed: reconcile provider idempotency/results and expose uncertain outcomes before retry.

Integrations order: signed webhooks + scoped REST API → Resend connection → Slack summaries/alerts → optional PostHog/GA script configuration → Zapier/Make using stable events. Connection is workspace-level, subscription campaign-level. Show Connected/Needs attention/Disconnected with last successful check and redacted diagnostics. Provide test, reconnect, revoke, event selection, and delivery history.

Webhook delivery: stable event ID, signed payload and timestamp, bounded retries with backoff/jitter, dead-letter state, manual replay, redacted logs. Restrict destinations against SSRF including private/link-local/metadata addresses, redirects, and DNS changes. Secret rotation has overlap. Test payloads explicitly say test. API keys shown once, hashed, scoped, revocable, optionally expiring, with last-use metadata. Hosted jobs need a real durable worker/scheduler; choose managed queue versus existing infrastructure after validating retries, operational cost, and deployment limits. Do not launch background work in untracked request promises.

## 11. Phases and stacked PR map

Branch naming: `codex/revamp-NN-short-name`. Each child PR targets its preceding unmerged branch; first targets main. Keep stacks to 2–3 open PRs; merge bottom-up, rebase children, retarget to main, rerun checks. Each PR description states dependency, visible behavior, validation, migration/flag, rollback, and remaining coverage. Planning a row does not mean a PR exists.

| Phase / PR | Concrete slice | Depends on | Acceptance gate |
| --- | --- | --- | --- |
| 0 / 00 | This roadmap, baseline/decisions | main | Blueprint reconciled; repo evidence and research labeled |
| 1 / 01 | Working lint/build CI, shadcn lint registration, test harness | 00 | Reproducible clean install; lint config loads; baseline failures explicit |
| 1 / 02 | Tokens, Geist, Base UI primitives, DiceBear wrapper, component states | 01 | Both themes, measured pairs, focus/keyboard/modal/composition checks |
| 1 / 03 | Workspace schema, backfill, authorization service | 02 | Two-workspace isolation, role matrix, idempotent rehearsal, old routes work |
| 1 / 04 | Two-destination shell, conditional workspace switcher, waitlist tabs and Settings TOC | 03 | Real destinations; selection survives reload; 320 px and keyboard path |
| 2 / 05 | Template manifest and campaign draft creation | 04 | Three-panel flow, recoverable drafts, slug conflicts, limits, back navigation |
| 2 / 06 | Page/form builder, revision autosave, preview | 05 | Undo/redo, keyboard reorder, upload safety, conflict recovery |
| 2 / 07 | Hosted rendering, publish/unpublish, legacy URL adapter | 06 | Draft never leaks; public snapshot stable; pause and rollback work |
| 3 / 08 | Unified signup service, uniqueness, verification and outbox | 07 | Duplicate/concurrent/replay tests, verified token lifecycle, legacy API contracts |
| 3 / 09 | Audience table/profile/filter/export | 08 | Server pagination, campaign/workspace boundaries, CSV injection prevention |
| 4 / 10 | Verified referrals and position service | 09 | Eligibility, tie/concurrency rules, no whole-audience write fanout |
| 4 / 11 | Referral codes, settings, and public sharing | 10 | Unique links; accurate live position; verified-only credit; legacy codes remain supported |
| 4 / 12 | Isolated launch rehearsal and referral review | 11 | Test activity never reaches real signups, outbox, or reports; review has reason and resolution |
| 5 / 13 | Events, metric definitions, aggregates | 12 | Dedupe, timezone/denominator cases, historical-data caveats |
| 5 / 14 | Waitlist Overview analytics with Evil Charts | 13 | Real values, tabular alternative, nonanimated keyboard use, both themes |
| 6 / 15 | Transactional delivery and sending diagnostics | 14 | Signed callbacks, retries, suppression, failure visibility |
| 6 / 16 | Broadcast drafts/templates/recipient preview | 15 | Explicit send, consent checks, retry/cancel, no duplicate delivery |
| 6 / 17 | Three automation recipes and run history | 16 | Versioned runs, pause/cancel, delayed suppression and idempotency tests |
| 7 / 18 | Scoped API/webhooks, connection/delivery settings | 17 | Secret rotation, signatures, SSRF, retry/replay and tenant tests |
| 7 / 19 | Resend/Slack adapters; optional analytics setup | 18 | Split into stacked 19A Resend, 19B Slack, and consent-gated 19C analytics slices; only expose working connect/test/revoke flows |
| 7 / 20 | Custom domains, ownership/DNS/TLS state | 19 | Verified binding, takeover prevention, failed DNS fallback, cert lifecycle |
| 8 / 21 | Invitations, recipient snapshots, release waves | 20 | Expiring tokens, idempotent acceptance, stop wave, audit trail |
| 8 / 22 | Account/team/billing/privacy completeness and release hardening | 21 | Entitlements, deletion/export, production observability, restore rehearsal |

Basic account preferences, team access, and privacy handling ship in the phases where they become necessary; PR 22 closes remaining coverage. Billing limits are enforced server-side from campaign creation onward. Do not display invented pricing or a working upgrade path before the billing integration exists.

The referral sharing UI and isolated rehearsal are separate vertical slices: rehearsal gets dedicated storage and explicit test/live boundaries instead of tagging production signup rows. V1 beta release gate is PR 16 plus essential workspace/account/privacy/entitlement coverage. V1.5 adds recipes, connections and domains; V2 adds release waves. Postpone points/rewards, arbitrary branching, cohorts, AI drafting and extensive template catalogs until the core gates pass and users ask for them.

## 12. Validation and rollout gates

For each UI slice: inspect normal, empty, loading, error, narrow, read-only states; keyboard-only completion; accessibility names/roles; VoiceOver walk; automated accessibility audit; 320/375/768/1280/1440 px, 200% zoom, reduced motion, forced colors, RTL/pseudo-localized content, both themes. Report every unrun check. Findings use one severity-ranked Before/After/Why table with file/line evidence. Do not approve uninspected surfaces.

For service slices: meaningful integration tests against disposable PostgreSQL; multi-tenant isolation, concurrency, migration/backfill reruns, provider failure and event replay. CI never sends to real subscribers or migrates production from a PR preview. Secret-dependent smoke tests report missing credentials as pending, not passed. Build with the repository-supported Next command; no unnecessary bundler override.

Performance targets (proposed budgets, not measured results): public p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; app local selection feedback ≤100 ms; navigation remains usable while data refreshes. Measure production-like previews and real-user telemetry separately. Test 10k/100k campaign memberships with generated nonpersonal data; validate signup latency and database query count do not grow linearly with audience size.

Before broad rollout: end-to-end publish → signup → verification → referral → chart → message smoke, plus old links/embeds/API contracts, backup restore, feature-flag rollback, and worker retry visibility. Define alerts for ingestion failures, queue age, verification/send failure, webhook exhaustion, and domain/cert problems. No deployment is called production-ready solely because build passed.

Founder validation: observe five representative founders attempting first publication and one invitation/broadcast preview. Target median first functional publish under three minutes; track abandonment and errors by stage. Product metrics: first published campaign + first real signup within seven days, weekly active live campaigns, verified signup share, and successful launch communications. Establish a baseline before choosing improvement targets. Do not optimize vanity signup volume at the cost of consent or audience quality.

## 13. Research and limits

Official sources consulted on 2026-09-27; recommendations above are our synthesis:

- [LaunchList](https://getlaunchlist.com/): referral-oriented pre-launch workflow supports treating campaign growth as one loop.
- [Prefinery](https://www.prefinery.com/): referrals and beta invitation workflows reinforce extending beyond collection once the core works.
- [shadcn installation](https://ui.shadcn.com/docs/installation) and [changelog](https://ui.shadcn.com/docs/changelog): validate the current preset/API when implementation begins.
- [Base UI quick start](https://base-ui.com/react/overview/quick-start): `@base-ui/react`, unstyled primitives, and portal stacking require deliberate integration.
- [shadcn lint](https://github.com/shadcn-ui/lint) and [setup](https://github.com/shadcn-ui/lint/blob/main/SETUP.md): Tailwind 4 design contracts; setup and enforcement are separate steps.
- [Evil Charts](https://evilcharts.com/): chosen chart source; detailed registry/source/license compatibility remains an implementation spike.
- [DiceBear JavaScript integration](https://www.dicebear.com/integrations/javascript/): local generation is the planned privacy-conscious integration.
- [Linear Method](https://linear.app/method), [Raycast](https://www.raycast.com/), [Stripe docs](https://docs.stripe.com/): workflow/information references, not a comparative dashboard audit.

GetWaitlist homepage yielded no readable content in this pass; its blueprint claims were not independently verified. No competitor pricing or usability benchmark was verified. The later supplied authenticated GetWaitlist table was inspected within the limits recorded in section 4. Notion and Plivo are user-supplied aesthetic/workflow references, not independently inspected here. Avoid presenting inspiration as a measured competitive advantage.

## 14. Execution ledger

| Item | Status | Evidence / next action |
| --- | --- | --- |
| Source blueprint | Read | All 53 sections considered |
| Repository recon | Complete for stated scope | Clean main, schema/routes/tooling/service inspection |
| Roadmap | Maintained | This file; phase 11 is split so test activity gets explicit storage and isolation |
| Phase 1 tooling | Ready PR #37; CI passed | Quality run 36329189223 on 367d9bb, rebased on main ef2f54a |
| Phase 1 foundation | Ready PR #38; CI passed | Quality run 36329187786 on bef3c407; 17 browser tests and scoped theme verified |
| Workspace expansion (03) | Ready PR #40; CI passed | Quality run 36330542670 on 2eccf2e; 19 real database/HTTP tests; no production backfill |
| Two-destination shell (04) | Ready PR #41; quality CI passed | Real Waitlists/Settings, contextual tabs, profile/workspace selection, adopted private permissions; 26 database/authenticated-browser and 17 public/foundation tests pass. See REVAMP_SHELL.md |
| Templates and draft creation (05) | Ready PR #42; quality CI passed | Quality run 36383385552 on fc38cef; lint, unit, migration, build, browser and database jobs passed. Seven versioned starters, recoverable creation, workspace authorization and private-draft rejection. See REVAMP_TEMPLATES.md |
| Editable page builder and draft revisions (06) | Ready PR #43; quality CI passed | Quality run 36387775763 on 462b502; lint, unit, migration, build, browser and database jobs passed. Fresh review passed. See REVAMP_BUILDER.md |
| Hosted rendering and immutable publishing (07) | Ready PR #44; Quality passed | #44 is based on #43. Hosted pages use frozen publication snapshots; pause and rollback preserve prior versions. Vercel preview failed during integration provisioning; no deployment was produced. The current failure detail is generic, so Neon capacity is not confirmed for this deployment. |
| Unified signup, verification and outbox (08) | Ready PR #45; Quality run 36412846351 passed | `docs/REVAMP_SIGNUPS.md`. Fresh disposable PostgreSQL: all seven migrations applied; three integration tests pass, including concurrent case variants, token replay/expiry, public response compatibility and verification endpoint behavior. GitHub passed lint, unit, build, browser and database suites. Local production fixture build stalled without emitting a result. Vercel preview failed during deployment provisioning; cause not confirmed. Transactional email delivery is advanced in Phase 15 (`docs/REVAMP_DELIVERY.md`). |
| Audience table/profile/filter/export (09) | Ready PR #46; Quality run 36418446355 passed | `docs/REVAMP_AUDIENCE.md`. Server-paginated 25-row cursor API scoped to the active workspace and waitlist; email/status filters, profile, referral counts, bounded CSV streaming and formula neutralization. GitHub passed lint, production build, browser, and database HTTP suites; authenticated browser coverage checks filters, profile keyboard flow, CSV download, 320 px layout, and axe. Local visual rendering remains unavailable because Turbopack rejects this worktree's external dependency symlink. Vercel preview failed during provisioning; cause is unconfirmed. |
| Public Dodo brand (parallel) | Ready PR #47; Quality run 36527199955 passed | Marketing page uses the cool ink/lime direction. Playwright covers conversion controls, responsive layouts and normal-text contrast. Branch is based on #37; Vercel resource checks are separate. |
| Verified referrals and position service (10) | Ready PR #48; Quality run 36529824549 passed | Verified-only referral scoring, deterministic public positions, eligible profile counts, additive indexes, and no per-signup rank rewrites. Database tests passed on disposable PostgreSQL. Vercel preview could not provision a Neon branch because the plan's branch limit was reached; owner asked to leave that resource limit alone. No deployment was produced. |
| Referral codes and public sharing (11) | Ready PR #49; Quality run 36534462473 passed | Stable per-signup referral codes, waitlist-scoped opt-in, post-signup share link and current position. Existing API GET response and legacy referral identifiers remain compatible. Browser and database coverage passed in GitHub CI. |
| Isolated launch rehearsal and referral review (12) | Open PR #50; Quality run 36559713316 passed | Saves page/form preflight checks only in `launch_rehearsal_runs`; flags same-browser referral credit for a workspace-scoped approve/exclude decision with a required note. No test signup, verification, outbox, or report rows are created. |
| Events and waitlist aggregates (13) | Open PR #51; Quality run 36563970109 passed | Workspace-authorized aggregate endpoint returns local-day visitors, signup and currently verified cohorts, linked visitor conversion, and eligible referrals without exposing subscriber records. Metric definitions and historical-data caveats travel with the response; zero denominators are unavailable rather than zero. GitHub passed lint, unit, build, browser and disposable-PostgreSQL database tests. Vercel preview provisioning failed; no deployment was produced or retried. |
| Waitlist Overview analytics UI (14) | Ready PR #52; Quality run 36568996870 passed | Real 7/30/90-day campaign aggregates, timezone-aware metric definitions, accessible chart and table alternative. CI lint/build/smoke passed; Vercel preview provisioning failed without a confirmed cause. No deployment was produced. |
| Transactional delivery and diagnostics (15) | Ready PR #53; Quality run 36677305395 passed | `docs/REVAMP_DELIVERY.md`. Durable verification dispatch uses bounded retries/idempotency; signed callbacks deduplicate, permanent bounces/complaints suppress, and referral sharing waits for explicit verification. GitHub passed lint, 20 browser tests, migration/build and the PostgreSQL suite. Vercel preview failed during provisioning; no preview or production send was verified. |
| Consent-aware broadcasts (16) | Open PR #54; GitHub Quality passed | `docs/REVAMP_BROADCASTS.md`. Optional explicit consent, verified eligible audience snapshots, draft and masked preview, deliberate send confirmation, cancellable idempotent outbox delivery and unsubscribe handling. GitHub passed lint, browser and PostgreSQL suites; Vercel preview failed during provisioning. No external email was sent. |
| Consent-aware automations (17) | Open PR #55; Quality run 36706755154 passed | `docs/REVAMP_AUTOMATIONS.md`. Three disabled-by-default, editable, versioned recipes for verified opt-in welcome, one referral reminder, and verified referral milestones. Trigger idempotency, immutable config snapshots, pause/cancel, unsubscribe/suppression rechecks and run history. GitHub passed lint, unit, build, browser and PostgreSQL suites. Vercel preview failed during provisioning; no live scheduler or production email was verified. |
| Scoped signup API keys (18A) | Open PR #56; Quality run 36712885617 passed | `docs/REVAMP_INTEGRATIONS.md`. Settings → Developers issues one-time, expiring, waitlist-bound signup keys; legacy account-wide tokens remain labeled and compatible. Workspace admins share key visibility/revocation; creation and legacy linking serialize the one-active-key check. GitHub passed lint, unit, migration/build, browser, and PostgreSQL suites. Vercel reported a preview error; no deployment was produced or retried. |
| Signed outbound webhooks (18B) | Open PR #57; Quality passed | Waitlist Settings configures up to five HTTPS endpoints, event selection, test sends, pause/resume, one-time secret rotation, recent deliveries and failed replay. Signup and verification events enter a transactional outbox with minimal payloads, encrypted signing secrets, stable event IDs, bounded retries and public-IP/DNS-pinned delivery. Independent review completed. GitHub passed lint, browser and PostgreSQL suites; local Prisma validation, all 19 unit tests, lint and production build also pass. Production key/scheduler remain unverified. |
| Workspace Resend connection (19A) | Ready PR #58; Quality run 36850141588 passed | Workspace Settings stores an encrypted sending key, tests it by emailing the signed-in admin on request, uses only tested connections for waitlist delivery, preserves deployment fallback, and supports disconnect. Local lint, all 24 unit tests, Prisma validation/generation, and fixture production build passed; latest GitHub Quality passed lint, build/smoke, browser, and PostgreSQL suites. Independent review approved. Vercel preview provisioning failed and was left untouched. Slack and optional analytics remain separate 19B/19C slices. |
| App interaction targets and Dodo design contract | Ready PR #59; Quality run 36854152247 passed | Global navigation, waitlist tabs, account access, builder controls and analytics selectors now share 44px targets across desktop/mobile. The product context keeps lime/ink styling on authenticated pages and reserves atmospheric gradient/dot treatment for the landing page. Lint, all 24 unit tests, browser and PostgreSQL suites passed. |
| Nested waitlist navigation | Ready PR #60; Quality run 36856473221 passed | Broadcasts and Automations keep the parent Emails tab selected. The shell browser test covers both nested routes. Local ESLint and all 24 unit tests passed; GitHub Quality passed lint, build/smoke, Playwright and PostgreSQL. PR #60 is stacked directly on #59. |
| Custom domains (20) | Open PR #61, stacked on #60; Quality run 36862405082 passed | Waitlist Settings provisions a Vercel project domain, persists globally unique hostname ownership, shows provider verification and DNS/TLS readiness separately, and routes only ready hostnames to the published snapshot. Domain normalization rejects app-owned, reserved and malformed hostnames; all management requires workspace owner/admin access. GitHub passed lint, unit, migration/build fixture, Playwright and PostgreSQL, including hostname uniqueness/role coverage. Local provider tests, ESLint, Prisma validation and diff checks pass. Live Vercel credentials and a disposable database are not configured locally. Vercel preview failed and was left untouched; no live domain connection or production deployment was verified. |
| Wizard keyboard focus | Open PR #62, stacked on #61; Quality run 36983292656 passed | Step changes retain a visible focus indicator for keyboard users. Authenticated browser coverage verifies focus moves to the new step heading and its 2px outline. GitHub passed lint, unit, build, Playwright and PostgreSQL. Vercel preview failed and was left untouched. |
| Actionable launch readiness | Open PR #63, stacked on #62; Quality run 36985928632 passed | Read-only Overview checklist derives page structure, signup form, publication freshness and optional custom-domain readiness from authorized waitlist data. Every action links to the relevant editor/settings section; it adds no score, provider call, write or email send. GitHub passed lint, 31 unit tests, fixture build, Playwright (including keyboard/axe/320px coverage), and PostgreSQL database tests. Vercel preview failed and was left untouched. |
| Mobile Settings section index | Open PR #64, stacked on #63; Quality run 36987351224 passed after fixing a test-only viewport assertion | Settings section links wrap at narrow widths, retain 44px touch targets, stay within the viewport, and navigate to their section anchors. GitHub passed lint, unit, build, Playwright and PostgreSQL suites. |
| Scoped Waitlists search | Open PR #65, stacked on #64; Quality run 36988873706 passed | Bounded case-insensitive search filters names only inside the active workspace campaign scope. Empty-workspace and no-match states stay distinct, with a clear-search action. Cross-workspace browser coverage, lint, unit, build and PostgreSQL tests passed; independent review found no actionable issue. |
| Mobile creation action | Open PR #66, based on #65; Quality run 36993357238 passed | Keeps the primary creation-wizard action visible on narrow screens, respects the device safe area, and preserves space after the preview. Browser coverage checks keyboard focus, action reachability, 320px layout, and axe. |
| Waitlist status filters | Open PR #67, based on #65; Quality run 36995568671 in progress | All, Draft, Published, and Paused filters preserve search and remain scoped to the selected workspace. Local lint, 34 unit tests and the GitHub lint/build/browser jobs passed; the PostgreSQL suite is still running. Vercel preview failed during provisioning and was left untouched. |
| Waitlist sorting | PR #68 branch, stacked on #67 | Adds URL-driven database sorting by name and subscriber count. Default stays name A–Z; search/status persist through sorting; server queries stay workspace-scoped and ties resolve deterministically. Keyboard, `aria-sort`, mobile, tie, zero-count, and workspace-isolation coverage are included. |
| GitHub PR publication | Product stack through Waitlist sorting | #36 → #37 → #38 → #40 → #41 → #42 → #43 → #44 → #45 → #46 → #48 → #49 → #50 → #51 → #52 → #53 → #54 → #55 → #56 → #57 → #58 → #59 → #60 → #61 → #62 → #63 → #64 → #65 → #67 → #68. Mobile creation PR #66 is a sibling of #67 on #65; parallel public brand #47 is based on #37. Product stack ancestors include latest main ef2f54a. No merges performed. |
| Runtime visual/a11y baseline | Verified for shell scope | Desktop waitlist table and mobile Settings inspected; Settings axe passes. Shell navigation, waitlist tabs, builder and analytics controls use 44px minimum targets. Legacy builder/chart/audience full audits remain pending. |
| Production migrations/deployment | Pending | No production backfill; Neon preview branch limit left untouched at owner request |

Next: continue the remaining workspace, privacy, and release-readiness work without expanding global navigation. Release-wave email dispatch is awaiting explicit approval of its exact payload and Resend destination; no subscriber email has been sent. Keep connections inside Settings and event selection inside the relevant waitlist. Use the existing lime/ink product tokens across the authenticated shell, with the Dodo-inspired atmospheric treatment reserved for the public landing page. Configure the production scheduler and encryption key before claiming delivery is live. The stack still awaits bottom-up merges; its base is latest main ef2f54a, and child branches target their immediate parent PRs. The overall revamp and production deployment remain unfinished.
