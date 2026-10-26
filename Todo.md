# Waitlyze - Product Direction & Build Roadmap

> Refreshed after the v0.10.0 release (Oct 2026). Phases 0–5 and 7 are shipped;
> Phase 6 is partially shipped. Phases 8–9 and the explicitly-later items remain
> the current plan. Phases are in **build order** and unlock the next.

## 1. Product direction (read this first)

- **One-liner:** Waitlyze is the viral waitlist platform for founders and creators - launch page + referral loop + email automation + analytics from a single list.
- **Who it's for:** indie founders / creators pre-launch (primary), startups running betas and early-access waves (secondary).
- **The loop we sell:** create a beautiful page in minutes → visitors join → thank-you page turns them into referrers → automated emails keep the list warm → founder launches to a primed audience with analytics to prove it.
- **How we win:** easiest referral cockpit + best free-tier value (generous signup limits) + BYOK email deliverability + embed-anywhere + painless switching (imports that preserve referral history). Compete on loop quality and simplicity, not feature count.
- **Guiding principles for every phase:**
  - Thank-you page is a product, not a dead end (every join must feed the loop).
  - Every email carries the personal referral link + position.
  - Founder can do the core job (launch → invite → launch day) without leaving Waitlyze.
  - Marketing surface (templates, use-cases, comparisons) is part of the product, not an afterthought.

### Release and delivery notes - DONE Oct 2026

- [x] Released v0.10.0 with the referral cockpit, rewards and fraud controls, attribution and analytics, email platform, BYOK integrations, widgets, and opt-in Turnstile. See `CHANGELOG.md` for release notes.
- [x] Removed Tegami; releases are now versioned manually in `package.json` and `CHANGELOG.md`.
- [x] Fixed the Waitlyze outbox Worker's Cloudflare build by giving it a workspace package, pinning pnpm to 11.5.0, and using the local Wrangler dependency. Production build verified Ready.
- [x] Verified the separate DMS Worker already has a valid pnpm workspace/package-manager setup; keep its required `pnpm run build:cf` command.
- [ ] Revisit Neon Native Integration preview-branch policy if desired. It currently creates branches for Vercel preview deployments; the Vercel production failure was a Prisma migration advisory-lock timeout, and redeploy succeeded.

## 2. Phase 0 - Stabilize & restore regressions (DO FIRST) - DONE Oct 2026, verified in headless browser

- [x] Audit the public join flow end-to-end on current `main`: confirm geo capture (ip, city, country, timezone, device, lat/long) fires for **both** signups and impressions (schema + utils exist - verify the revamped forms flow actually calls them, restore what the revamp PR broke).
  - Found + fixed: new `/w/[slug]` flow never recorded impressions (only legacy `preview.jsx` did) → added `ImpressionTracker`, visitor counts + `impressionId` linkage restored.
  - Found + fixed: StrictMode/retries raced duplicate impressions → `@@unique([waitListId, uniqueUserId])` + P2002-tolerant `createImpression`.
- [x] Audit referral rank-up on the live flow: join via `?r=` link → rank/position changes for the referrer, referral preview shows correct rank + total (this worked pre-revamp - restore it).
  - Server rank-up works (verified-only scoring via `getCampaignPosition`); restored minimal post-signup panel (position + personal `/w/{slug}?r={referralCode}` link + copy) and same on the verify page. Full share cockpit stays Phase-3.
- [x] Fix email validation on join (format + disposable-domain block) as part of the same audit.
  - `validateSignupEmail` (strict format + ~60-domain disposable list), enforced in `validateRequest` → 400 before any DB work.
- [x] Decide data-model gaps now (points column? reward tiers? slug field? UTM fields?) so later phases don't re-migrate - write the decisions down, migrate once.
  - Decided + migrated (`phase0_attribution_points`): `referrer/landingPage/utmSource/utmMedium/utmCampaign/utmTerm/utmContent` on both Impression and SignUp; `points Int @default(0)` on SignUp (Phase-4 builds on it, behavior unchanged). Slug already existed (`publicSlug`) - no change. Reward tiers deferred to Phase-4 design.
- [x] Note: `tests/security/` was removed (Oct 2026). Public signup and impression paths have `consumePublicBudget` limits; later phases added budgets for referral/API and widget surfaces. This is code-verified, not load-tested; Phase 9 still needs a full endpoint audit and abuse dashboards.

## 3. Phase 1 - Waitlist creation flow + detail view UX rework (foundation) - SHIPPED (builder-first rebuild, calm/breathable)

- [x] Kill the creation wizard: New waitlist instantly creates a private draft (`Untitled waitlist` + unique `untitled-xxxxxx` slug, no snapshot) and drops straight into the Builder.
- [x] Builder tab (first): legacy full editor - center live preview, right-side option tabs (General/Input/Presets/Social: colors, bg, fonts, referral toggle, share platforms, OG), name/slug/description editing, Save, status-aware Publish/Pause (revision-free legacy path), Embed modal + slug share link. Lives at `/waitlists/{id}` (no `/edit` route, no redirect shim).
- [x] Public loop: `/w/{slug}` serves snapshot lists as before, snapshot-less published lists via the classic form + referral loop (`/forms/{id}` unchanged).
- [x] Detail tabs cut to five: Builder | Signups | Emails | Analytics | Settings (Overview → redirects to Builder; Referrals folded into Signups; route URLs unchanged).
- [x] Signups v2: Email | Country | Position (referrals on) | Joined-ago | Status (emails on); row click opens a right sheet (details + referral link + copy); Import sheet (template CSV, validation, counts) + Export sheet (column picker); import creates unverified rows, no emails.
- [x] Bulk offboard/delete.
  - PR #109 merged: transactional batch endpoint (offboard/resubscribe/delete, owner/admin, 1–1000 ids), goodbye-email queueing, 30s undo, typed-count delete confirm, referral edges severed + counted, audit events. Live-verified headless (offboard → undo toast, DB-checked).

## 4. Phase 2 - Templates (acquisition + activation) - MERGED Oct 2026 (PRs #110/#111; live-verified headless)

- [x] Promote the 4 hardcoded style presets into real named templates with previews (thumbnail + live demo page per template).
  - Covered by the gallery below: 14 named templates, each with a live demo page.
- [x] Ship a template gallery (aim 10+): SaaS, AI product, mobile app, creator/course, ecommerce drop, event, community, dev tool, game, newsletter - each with tuned copy placeholders, not just colors.
  - [x] Builder-side gallery: 14 named templates with previews, one-click apply, style-preserving "Use style" vs confirming "Replace page" (builder-v2, Oct 2026).
  - [x] Public gallery shipped PR #110: `/templates` + `/templates/[id]` (SSG, canonical, unique title/desc, OG), sitemap entries, CTA into creation with preselected template.
- [x] One-click apply from gallery during creation and from the Design tab; switching templates never loses content/settings.
  - PR #110: `?template=` preselect in creation dialog (name/slug untouched); builder switch paths verified lossless.
- [x] Add Brand Kit per waitlist (logo, colors, fonts, favicon) applied across page + emails + OG cards.
  - [x] Builder brand kit: logo upload, colors, Google Fonts picker + px type scale, corners, contrast check.
  - [x] PR #111: favicon upload (rate-limited path) + page icon, OG title/desc/image wired to head metadata, brand applied to list emails.
- [x] Mobile-first pass on every template (most joins come from shared links on phones).
  - PR #111: type clamp ≤640px, ≥44px targets, stacked-input floor fix; measured 0px overflow at 390px.
- [x] Public template gallery on the marketing site doubles as SEO/acquisition (each template = indexed page).
  - PR #110 (see above).

## 5. Phase 3 - Public signup experience = referral cockpit (virality) - SHIPPED Oct 2026 (PRs #107/#112/#113/#128/#129 merged)

- [x] Rebuild the post-join screen as a referral cockpit: position in line (`#214`), referrals count, progress to next reward ("1 more to unlock beta"), copyable personal link (`?r=` code).
  - [x] Builder + public result parity: position, referral count, copyable personal link, and per-waitlist share controls. PR #113 added masked leaderboard/neighborhood and reward progress (`next_reward`, `spots_to_advance`) across cockpit, verification, and API. PR #107 added the opt-in simple-confirmation preset; PR #128 removed the redundant mode toggle and preserves the page after signup.
- [x] 1-click share buttons: X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Email - with prefilled copy + personal link (respect per-waitlist toggles).
  - PR #113 (merged): Facebook/Telegram/Reddit intents with encoded copy + personal link (8 channels total).
- [x] Social-follow tasks on the cockpit (follow on X/IG → earns points once Phase 4 merges; UI ships here).
  - PR #113 (merged): follow links + no-points note; points earning shipped in PR #116.
- [x] OG share cards per waitlist (title, description, image) so shared links look premium on socials.
  - PR #111 (merged, page-level OG) + PR #113 (merged: absolute images, `og:url`/siteName, `summary_large_image`).
- [x] Mini-leaderboard / neighborhood view ("#47 of 2,847 - 20 pts to #46") on the cockpit, privacy-masked by default (`b***@g***`).
  - PR #113 (merged): rate-limited endpoint, server-side masking, own row = you.
- [x] Join form hardening: double opt-in option, per-form allow/block rules (domains, countries), CAPTCHA/Turnstile option, duplicate handling (return existing position instead of erroring).
  - PR #112 (merged): cross-browser duplicates → 200 with position + link; `doubleOptIn`; domain/country allow-block. PR #129 (merged) added opt-in Turnstile, server-side Siteverify, and publish-time key pairing. The widget allowlist must include each form-serving hostname.
- [x] Custom fields + phone capture with country validation; custom redirect-after-signup option.
  - PR #112 (merged): typed custom fields, E.164 phone + searchable dial-code picker, phone disclosure, allowlisted redirect (server-vetted echo). PR #128 (merged) adds the no-post-submit-change behavior.
- [ ] Popup capture + own-form wrap (competitor gap, Oct 2026): timer/link-triggered popup template and AnyForm-style mode making any existing site form viral after signup (props: KickoffLabs, LaunchList).
- [ ] Advanced form fields (competitor gap): multi-step forms, conditional logic, rating/NPS + consent-checkbox field types (props: LaunchList 20 field types).

## 6. Phase 4 - Referral system v2 (growth engine) - SHIPPED Oct 2026 (PRs #108/#116/#117/#125 merged)

- [x] Move from raw referral counts to configurable **points**: defaults signup = 50, referral = 30, social-follow = 5, custom events via API (e.g. survey, Discord join); zero-config defaults so it works out of the box.
  - PR #116 (merged): rewards config, idempotent ledger keys, published-snapshot amounts; verified 50+30 loop and convergent replays.
- [x] Tiered rewards/milestones ladder (refer 1 = move up X spots, 3 = beta access, 10 = founding member…) with "X more to unlock" progress everywhere.
  - PR #116 (merged): tiers from `referralRewards` blocks, `milestone.reached` on crossing, progress on cockpit/verify/API.
- [x] Position inflation option (start at #847 to avoid empty-list shame) + hide-counts stealth mode for private/B2B launches.
  - PR #116 (merged): display-only offset + `counts_hidden` contract (verified live).
- [x] Fraud basics: device fingerprint + IP velocity checks, Gmail dot/`+` normalization, 140+ disposable-domain list, silent mode (fake success, no points) with Standard/Strict toggle.
  - PR #117 (merged): gates, canonical Gmail, ~220-domain list, silent fakes byte-identical to real joins (live key-diff, zero rows).
- [x] Standalone embeddable leaderboard widget (any site) + live counter widget ("2,418 waiting") served as embed or JSON.
  - PR #117 (merged): masked JSON + HTML snippets, `widget` budget, CDN cache headers (live-verified).
- [x] Public API referral support: `POST /signup {email, referral_code}` → `{position, referral_code, referral_link}` + status lookup + `spots_to_advance` + idempotency keys (unblocks custom frontends and the "Handle Referral System" gap).
  - PR #108 (merged): header auth, canonical contract, idempotency replays, GET lookup, per-key budgets + docs; PR #125 (merged): `marketingConsent` passthrough so API signups can enter consent-gated automations.
- [ ] `milestone_reached` / `referral_completed` webhooks for custom reward fulfillment.

## 7. Phase 5 - Geo / device / impression data (restore + expand) - SHIPPED Oct 2026 (PRs #118/#119 merged; no historical backfill)

- [x] Guarantee capture on both funnels: page view → impression (ip, city, country, timezone, device, referrer, UTM) and join → signup (same + linkage to impression).
  - PR #118 (merged): embed-tracker gap + API attribution/mirroring fixed; P2002 back-link when a view predates the join (live exact-match proof).
- [x] Verify city + timezone capture end-to-end, including the Vercel-header vs GeoIP fallback path.
  - Capture verified forward-only (Vercel-decode + GeoIP fallback + derivation, all exercised live); no historical backfill was performed.
- [x] Capture landing page + referring site + UTM params per signup (hidden fields, zero founder effort).
  - PR #118 (merged): first-touch sessionStorage snapshot on all funnels (live row proof).
- [x] Expose the data where it matters: signups table columns + filters, geo map + device breakdown in Analytics (Phase 6), CSV export includes all fields.
  - [x] Shipped evidence (builder-v2, Oct 2026): analytics geo map renders with empty state; subscriber drawer shows traffic Source plus Referred-by (click opens the referrer); CSV export includes referral_code/referred_by.
  - [x] PR #119 (merged): Source/Device columns, server-side Country/City/Source/Landing/UTM/Device filters, full drawer, 20-column CSV (live: `IN` → 2 rows, filtered export exact).
- [x] Bot filtering for impressions so stats stay honest.
  - PR #118 (merged): fail-open heuristics, `filtered:true` + no row + no budget burn (Googlebot filtered, curl kept - live).

## 8. Phase 6 - Analytics v2 (retention + upsell) - PARTIALLY SHIPPED Oct 2026 (PR #120 merged; PR #121 closed without merge)

- [x] Dedicated Analytics page per waitlist (open item from the old list): signups-over-time, views→signups conversion funnel, sources/referrers, geo map, devices/browsers, referral analytics (who-referred-whom, K-factor), email delivery per send.
  - PR #120 (merged): explicit Bklit-style funnel (Visited → Signed up → Verified, first-stage percentages and hover details), summary sentence + named medians, stat-value help, and stacked email-delivery visualization; all panels on bounded real queries (12→8→6 funnel reconciles).
- [x] Summary sentence + benchmarks ("conversion 14% vs median ~11%") so founders instantly know if they're healthy.
  - PR #120 (merged; desktop and 390px screenshots captured with synthetic data).
- [x] Replace all mock chart data with real queries; kill the commented-out placeholders.
  - Verified: zero mock/sample/faker hits in analytics paths.
- [ ] Dashboard home rework: cross-waitlist overview (the "Improve the UI" item) + referral-data filters (the "filter referral data" item).
  - PR #121 proposed WorkspaceOverview (totals, recent, per-list health, ref filters) but closed without merging; not shipped.
- [ ] History windows by plan (e.g. free 28d → paid all-time) as a natural upgrade lever.
  - PR #121 proposed server-side clamp + window metadata + free-plan messaging but closed without merging; not shipped.
- [ ] Funnel pipeline stages (Waitlist → Invited → Joined → Converted, renameable) feeding the launch-day flow in Phase 8.
  - PR #121 proposed fixed keys, rename form, board + movers, and a manage-gated API but closed without merging; not shipped.
- [ ] Page-level A/B testing (competitor gap): variant pages per waitlist with conversion-scored winner (props: KickoffLabs Premium+, Prefinery).
- [ ] Post-signup conversion tracking (competitor gap): referral → customer journey + referral-revenue attribution, optional purchase-gated credit via Stripe (props: Viral Loops).

## 9. Phase 7 - Email platform (biggest epic - split into 3) - SHIPPED Oct 2026 (PRs #122/#123/#124 merged; live-verified)

### 7a. Platform emails (us → our users) - audit first

- [x] List every occasion we must email founders: welcome, email verification, waitlist published, first signup, milestones (10/100/1000 signups), broadcast/invite summaries, billing + limits, re-engagement, changelog digests.
  - PR #122 (merged) matrix: welcome / published / first-signup + milestones / broadcast summaries implemented outbox-backed; verification n/a (social-only auth); invite-accepted/billing/re-engagement/changelog deferred + documented.
- [x] Template + tone audit: consistent brand, Reply-To set, plain-text fallbacks; verify sends are retried (outbox dispatcher exists - confirm coverage for all occasions).
  - PR #122 (merged): text builders for all 6, `RESEND_REPLY_TO` default, deterministic keys, live Resend-header proof.

### 7b. Founder → their list (builder, automations, testing)

- [x] Rebuild the email builder: visual block editor (keep markdown as a mode, add HTML mode) with live preview + test-send + inbox previews.
  - PR #123 (merged): Write/HTML/Preview modes, 375px frame, spam hint, test sends (live screenshots).
- [x] Variables everywhere: `{{name}} {{position}} {{referral_link}} {{points}} {{rewards}}` with sensible fallback defaults.
  - PR #123 (merged): canonical `variables.mjs`, escaped + fallbacks, snapshotted at queue time.
- [x] Template set per waitlist: welcome, verification, referral-congrats (new), launch/invite (new), offboard (exists - add bulk offboard send, open item), broadcast/newsletter.
  - PR #123 (merged): referral-congrats + launch-invite added; bulk offboard send exists.
- [x] Automations v1: welcome series, referral nudge (joined but 0 referrals after N days), launch countdown, milestone-celebration to referrers; segment targeting (all / top referrers / unverified / inactive).
  - PR #123 (merged): 5 recipes, server-side segments, full loop proven live (consent → verify → WELCOME run → step queued).
- [x] Broadcasts: send-now + schedule, per-send delivery report (delivered/bounced/spam/unsub).
  - PR #123 (merged): scheduler sweep (latency-isolated per review), UTC-explicit scheduling, reconciling reports.
- [x] Make creation + testing effortless: 1-click test send, seed preview data, spam-score hint, mobile preview.
  - PR #123 (merged; see builder shot).
- [ ] Automation branching + A/B split step (competitor gap): waits, tags, stage-change and webhook steps plus split-test paths (props: LaunchList).

### 7c. BYOK + integrations (deliverability + distribution)

- [x] BYOK Resend: founder connects their own Resend account, we list their domains, they send through it (open item from the old list) - per-waitlist sender identity + custom sending domain.
  - PR #124 (merged): encrypted connect, domain list, waitlist→workspace→default resolution (fail-closed), test-to-activate (live: 401s, defaults, ciphertext-only storage).
- [x] More channels in order: webhooks (signed, retried, replayable logs) → Slack/Discord notifications → Zapier → Klaviyo/Mailchimp/Kit sync. REST API docs + guides for each.
  - PR #124 (merged): Slack/Discord notifiers (allowlisted, test-to-activate); Zapier/ESP docs-only; email.* webhooks recorded gap.
- [x] API keys that work on all plans (great activation lever) with scopes + per-key rate limits.
  - PR #124 (merged): zero plan gating found - docs-only; scopes + budgets intact.

## 10. Phase 8 - Growth & marketing surface (platform marketing POV)

- [ ] Landing page: replace blog-templates angle with **use-cases** (pre-launch SaaS, beta invites, creator drops, mobile app, community, event) - each use-case = page with template CTA.
- [ ] Publish comparison pages (`/alternatives/*`), live leaderboard mock, transparent pricing table.
- [ ] Demo video + fresh screenshots of the reworked UI (open items from the old list); avatars for "joining N+ creators" social proof.
- [ ] Free SEO tools (waitlist name/headline generator) + growth hub/case studies for acquisition.
- [ ] Early-access invites: single + bulk invite (up to 1,000 filtered), personal expiring codes, claim via cockpit or API, per-batch redemption analytics (justifies higher tiers).
- [ ] Updates feed per waitlist (mini changelog + RSS, surfaces on cockpit, 1-click to email draft) to keep lists warm pre-launch.
- [ ] Import that preserves the referral graph (auto-map imports from other waitlist tools: codes, referrers, points, join dates) + always-free CSV export - lowers switching cost to us.
- [ ] Custom domains (1 DNS record, auto SSL) + hosted `*.waitlyze` subdomain + short share URLs.

## 11. Phase 9 - Trust, hardening & scale (last, protects everything above)

- [ ] Complete the rate-limit audit and abuse dashboards. Signup/impression, referral/API, leaderboard, and embed-widget surfaces already have budgets; verify remaining public endpoints and add abuse visibility.
- [ ] Trust verdicts per contact (Verified/Valid/Unknown/Risky/Fake) + Held-for-review queue that doesn't count toward list/billing/leaderboard; referral credit reversible.
- [ ] Privacy/GDPR: data-export + erasure per subscriber, retention controls, DPA-friendly posture.
- [ ] Roles & teams (owner/admin/viewer), audit log for destructive actions.
- [ ] Billing + plan limits wired to real usage (contacts held, emails sent, history windows, domains, seats) - overflow held, never silently deleted.
- [ ] Docs + API reference + machine-readable integration guide so AI tools and developers integrate without support load.
- [ ] MCP server for AI agents (competitor gap, concrete form of the above): Claude/ChatGPT/Cursor tools over the public API (props: LaunchList 35 tools, GetWaitlist).

## 12. Why this order (don't reorder without a reason)

- [ ] Phase 0 first - building on broken capture/referral poisons every later metric.
- [ ] Phase 1 before templates - a gallery bolted onto the current editor flow inherits its UX debt.
- [ ] Phases 2–3 before referral v2 - templates + cockpit are what make the loop visible; points/rewards need a cockpit to live in.
- [ ] Phase 5 data before Phase 6 analytics - obvious dependency.
- [ ] Email (Phase 7) after the loop works - automations are multipliers on an existing loop, not a fix for a missing one; and 7a/7b/7c can parallelize once 7a's audit is done.
- [ ] Marketing surface (Phase 8) after the product is worth marketing - except cheap SEO pages, which can go anytime.
- [ ] Hardening (Phase 9) last - but rate-limit the new public endpoints as you build them (see Phase 0 note).

## 13. Explicitly later (not in scope above)

- [ ] Native mobile apps, white-label enterprise, multi-language UI (30+ translations), AI page builder, surveys engine, ad-pixel integrations, team SSO - revisit only when Phases 0–7 are shipped and measured.
- [ ] Native reward fulfillment (competitor gap): coupon codes, Tremendous/Stripe payouts, auto-delivery - webhooks cover v1 (props: Viral Loops, EarlyParrot).
- [ ] Giveaway/contest campaign mode + winner picker as a lightweight second campaign type; stay waitlist-first (props: KickoffLabs, UpViral).
- [ ] Post-launch customer-referral mode wrapping existing SaaS/purchase flows via JS tags (props: EarlyParrot, Viral Loops, GrowSurf).
- [ ] Per-campaign string localization, form + emails (competitor gap; full multi-language UI stays deferred) (props: LaunchList 17 languages, EarlyParrot 6).
- [ ] Explicitly NOT copying (competitor research, Oct 2026): trial-only/no-free-tier gating; auto-upgrade on overage; per-new-lead billing (punishes virality - price by contacts held); Gleam-scale giveaway scope; AI builder as priority; complex lead scoring; Megaphone lesson = keep always-free export + referral-preserving import.
