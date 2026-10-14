# Waitlyze — Product Direction & Build Roadmap

> Fresh rewrite (Oct 2026). Old checklist archived — everything below is the
> current plan. Phases are in **build order**: each phase is shippable on its
> own and unlocks the next one. Work top-to-bottom, don't skip ahead.

## 1. Product direction (read this first)

- **One-liner:** Waitlyze is the viral waitlist platform for founders and creators — launch page + referral loop + email automation + analytics from a single list.
- **Who it's for:** indie founders / creators pre-launch (primary), startups running betas and early-access waves (secondary).
- **The loop we sell:** create a beautiful page in minutes → visitors join → thank-you page turns them into referrers → automated emails keep the list warm → founder launches to a primed audience with analytics to prove it.
- **How we win:** easiest referral cockpit + best free-tier value (generous signup limits) + BYOK email deliverability + embed-anywhere + painless switching (imports that preserve referral history). Compete on loop quality and simplicity, not feature count.
- **Guiding principles for every phase:**
  - Thank-you page is a product, not a dead end (every join must feed the loop).
  - Every email carries the personal referral link + position.
  - Founder can do the core job (launch → invite → launch day) without leaving Waitlyze.
  - Marketing surface (templates, use-cases, comparisons) is part of the product, not an afterthought.

## 2. Phase 0 — Stabilize & restore regressions (DO FIRST) — DONE Oct 2026, verified in headless browser

- [X] Audit the public join flow end-to-end on current `main`: confirm geo capture (ip, city, country, timezone, device, lat/long) fires for **both** signups and impressions (schema + utils exist — verify the revamped forms flow actually calls them, restore what the revamp PR broke).
  - Found + fixed: new `/w/[slug]` flow never recorded impressions (only legacy `preview.jsx` did) → added `ImpressionTracker`, visitor counts + `impressionId` linkage restored.
  - Found + fixed: StrictMode/retries raced duplicate impressions → `@@unique([waitListId, uniqueUserId])` + P2002-tolerant `createImpression`.
- [X] Audit referral rank-up on the live flow: join via `?r=` link → rank/position changes for the referrer, referral preview shows correct rank + total (this worked pre-revamp — restore it).
  - Server rank-up works (verified-only scoring via `getCampaignPosition`); restored minimal post-signup panel (position + personal `/w/{slug}?r={referralCode}` link + copy) and same on the verify page. Full share cockpit stays Phase-3.
- [X] Fix email validation on join (format + disposable-domain block) as part of the same audit.
  - `validateSignupEmail` (strict format + ~60-domain disposable list), enforced in `validateRequest` → 400 before any DB work.
- [X] Decide data-model gaps now (points column? reward tiers? slug field? UTM fields?) so later phases don't re-migrate — write the decisions down, migrate once.
  - Decided + migrated (`phase0_attribution_points`): `referrer/landingPage/utmSource/utmMedium/utmCampaign/utmTerm/utmContent` on both Impression and SignUp; `points Int @default(0)` on SignUp (Phase-4 builds on it, behavior unchanged). Slug already existed (`publicSlug`) — no change. Reward tiers deferred to Phase-4 design.
- [X] Note: `tests/security/` removed (Oct 2026) — public signup/impression APIs currently have no rate limiting (only upload is limited). Proper limits ship in Phase 9; until then do not expose new public endpoints without a limit.
  - Public signup/impression already behind `consumePublicBudget` rate limiting — verified in code (not load-tested).

## 3. Phase 1 — Waitlist creation flow + detail view UX rework (foundation) — SHIPPED (builder-first rebuild, calm/breathable)

- [X] Kill the creation wizard: New waitlist instantly creates a private draft (`Untitled waitlist` + unique `untitled-xxxxxx` slug, no snapshot) and drops straight into the Builder.
- [X] Builder tab (first): legacy full editor — center live preview, right-side option tabs (General/Input/Presets/Social: colors, bg, fonts, referral toggle, share platforms, OG), name/slug/description editing, Save, status-aware Publish/Pause (revision-free legacy path), Embed modal + slug share link. Lives at `/waitlists/{id}` (no `/edit` route, no redirect shim).
- [X] Public loop: `/w/{slug}` serves snapshot lists as before, snapshot-less published lists via the classic form + referral loop (`/forms/{id}` unchanged).
- [X] Detail tabs cut to five: Builder | Signups | Emails | Analytics | Settings (Overview → redirects to Builder; Referrals folded into Signups; route URLs unchanged).
- [X] Signups v2: Email | Country | Position (referrals on) | Joined-ago | Status (emails on); row click opens a right sheet (details + referral link + copy); Import sheet (template CSV, validation, counts) + Export sheet (column picker); import creates unverified rows, no emails.
- [ ] Bulk offboard/delete (deferred — destructive ops need their own design + live test).

## 4. Phase 2 — Templates (acquisition + activation)

- [ ] Promote the 4 hardcoded style presets into real named templates with previews (thumbnail + live demo page per template).
- [ ] Ship a template gallery (aim 10+): SaaS, AI product, mobile app, creator/course, ecommerce drop, event, community, dev tool, game, newsletter — each with tuned copy placeholders, not just colors.
- [ ] One-click apply from gallery during creation and from the Design tab; switching templates never loses content/settings.
- [ ] Add Brand Kit per waitlist (logo, colors, fonts, favicon) applied across page + emails + OG cards.
- [ ] Mobile-first pass on every template (most joins come from shared links on phones).
- [ ] Public template gallery on the marketing site doubles as SEO/acquisition (each template = indexed page).

## 5. Phase 3 — Public signup experience = referral cockpit (virality)

- [ ] Rebuild the post-join screen as a referral cockpit: position in line (`#214`), referrals count, progress to next reward ("1 more to unlock beta"), copyable personal link (`?r=` code).
- [ ] 1-click share buttons: X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Email — with prefilled copy + personal link (respect per-waitlist toggles).
- [ ] Social-follow tasks on the cockpit (follow on X/IG → earns points when Phase 4 lands; UI ships here).
- [ ] OG share cards per waitlist (title, description, image) so shared links look premium on socials.
- [ ] Mini-leaderboard / neighborhood view ("#47 of 2,847 — 20 pts to #46") on the cockpit, privacy-masked by default (`b***@g***`).
- [ ] Join form hardening: double opt-in option, per-form allow/block rules (domains, countries), CAPTCHA/Turnstile option, duplicate handling (return existing position instead of erroring).
- [ ] Custom fields + phone capture with country validation; custom redirect-after-signup option.

## 6. Phase 4 — Referral system v2 (growth engine)

- [ ] Move from raw referral counts to configurable **points**: defaults signup = 50, referral = 30, social-follow = 5, custom events via API (e.g. survey, Discord join); zero-config defaults so it works out of the box.
- [ ] Tiered rewards/milestones ladder (refer 1 = move up X spots, 3 = beta access, 10 = founding member…) with "X more to unlock" progress everywhere.
- [ ] Position inflation option (start at #847 to avoid empty-list shame) + hide-counts stealth mode for private/B2B launches.
- [ ] Fraud basics: device fingerprint + IP velocity checks, Gmail dot/`+` normalization, 140+ disposable-domain list, silent mode (fake success, no points) with Standard/Strict toggle.
- [ ] Standalone embeddable leaderboard widget (any site) + live counter widget ("2,418 waiting") served as embed or JSON.
- [ ] Public API referral support: `POST /signup {email, referral_code}` → `{position, referral_code, referral_link}` + status lookup + `spots_to_advance` + idempotency keys (unblocks custom frontends and the "Handle Referral System" gap).
- [ ] `milestone_reached` / `referral_completed` webhooks for custom reward fulfillment.

## 7. Phase 5 — Geo / device / impression data (restore + expand)

- [ ] Guarantee capture on both funnels: page view → impression (ip, city, country, timezone, device, referrer, UTM) and join → signup (same + linkage to impression).
- [ ] Backfill/verify city + timezone end-to-end (open item from the old list) including the Vercel-header vs GeoIP fallback path.
- [ ] Capture landing page + referring site + UTM params per signup (hidden fields, zero founder effort).
- [ ] Expose the data where it matters: signups table columns + filters, geo map + device breakdown in Analytics (Phase 6), CSV export includes all fields.
- [ ] Bot filtering for impressions so stats stay honest.

## 8. Phase 6 — Analytics v2 (retention + upsell)

- [ ] Dedicated Analytics page per waitlist (open item from the old list): signups-over-time, views→signups conversion funnel, sources/referrers, geo map, devices/browsers, referral analytics (who-referred-whom, K-factor), email delivery per send.
- [ ] Summary sentence + benchmarks ("conversion 14% vs median ~11%") so founders instantly know if they're healthy.
- [ ] Replace all mock chart data with real queries; kill the commented-out placeholders.
- [ ] Dashboard home rework: cross-waitlist overview (the "Improve the UI" item) + referral-data filters (the "filter referral data" item).
- [ ] History windows by plan (e.g. free 28d → paid all-time) as a natural upgrade lever.
- [ ] Funnel pipeline stages (Waitlist → Invited → Joined → Converted, renameable) feeding the launch-day flow in Phase 8.

## 9. Phase 7 — Email platform (biggest epic — split into 3)

### 7a. Platform emails (us → our users) — audit first

- [ ] List every occasion we must email founders: welcome, email verification, waitlist published, first signup, milestones (10/100/1000 signups), broadcast/invite summaries, billing + limits, re-engagement, changelog digests.
- [ ] Template + tone audit: consistent brand, Reply-To set, plain-text fallbacks; verify sends are retried (outbox dispatcher exists — confirm coverage for all occasions).

### 7b. Founder → their list (builder, automations, testing)

- [ ] Rebuild the email builder: visual block editor (keep markdown as a mode, add HTML mode) with live preview + test-send + inbox previews.
- [ ] Variables everywhere: `{{name}} {{position}} {{referral_link}} {{points}} {{rewards}}` with sensible fallback defaults.
- [ ] Template set per waitlist: welcome, verification, referral-congrats (new), launch/invite (new), offboard (exists — add bulk offboard send, open item), broadcast/newsletter.
- [ ] Automations v1: welcome series, referral nudge (joined but 0 referrals after N days), launch countdown, milestone-celebration to referrers; segment targeting (all / top referrers / unverified / inactive).
- [ ] Broadcasts: send-now + schedule, per-send delivery report (delivered/bounced/spam/unsub).
- [ ] Make creation + testing effortless: 1-click test send, seed preview data, spam-score hint, mobile preview.

### 7c. BYOK + integrations (deliverability + distribution)

- [ ] BYOK Resend: founder connects their own Resend account, we list their domains, they send through it (open item from the old list) — per-waitlist sender identity + custom sending domain.
- [ ] More channels in order: webhooks (signed, retried, replayable logs) → Slack/Discord notifications → Zapier → Klaviyo/Mailchimp/Kit sync. REST API docs + guides for each.
- [ ] API keys that work on all plans (great activation lever) with scopes + per-key rate limits.

## 10. Phase 8 — Growth & marketing surface (platform marketing POV)

- [ ] Landing page: replace blog-templates angle with **use-cases** (pre-launch SaaS, beta invites, creator drops, mobile app, community, event) — each use-case = page with template CTA.
- [ ] Publish comparison pages (`/alternatives/*`), live leaderboard mock, transparent pricing table.
- [ ] Demo video + fresh screenshots of the reworked UI (open items from the old list); avatars for "joining N+ creators" social proof.
- [ ] Free SEO tools (waitlist name/headline generator) + growth hub/case studies for acquisition.
- [ ] Early-access invites: single + bulk invite (up to 1,000 filtered), personal expiring codes, claim via cockpit or API, per-batch redemption analytics (justifies higher tiers).
- [ ] Updates feed per waitlist (mini changelog + RSS, surfaces on cockpit, 1-click to email draft) to keep lists warm pre-launch.
- [ ] Import that preserves the referral graph (auto-map imports from other waitlist tools: codes, referrers, points, join dates) + always-free CSV export — lowers switching cost to us.
- [ ] Custom domains (1 DNS record, auto SSL) + hosted `*.waitlyze` subdomain + short share URLs.

## 11. Phase 9 — Trust, hardening & scale (last, protects everything above)

- [ ] Rate limits on all public endpoints (signup, impression, status, API) + abuse dashboards; per-key + per-IP budgets.
- [ ] Trust verdicts per contact (Verified/Valid/Unknown/Risky/Fake) + Held-for-review queue that doesn't count toward list/billing/leaderboard; referral credit reversible.
- [ ] Privacy/GDPR: data-export + erasure per subscriber, retention controls, DPA-friendly posture.
- [ ] Roles & teams (owner/admin/viewer), audit log for destructive actions.
- [ ] Billing + plan limits wired to real usage (contacts held, emails sent, history windows, domains, seats) — overflow held, never silently deleted.
- [ ] Docs + API reference + machine-readable integration guide so AI tools and developers integrate without support load.

## 12. Why this order (don't reorder without a reason)

- [ ] Phase 0 first — building on broken capture/referral poisons every later metric.
- [ ] Phase 1 before templates — a gallery bolted onto the current editor flow inherits its UX debt.
- [ ] Phases 2–3 before referral v2 — templates + cockpit are what make the loop visible; points/rewards need a cockpit to live in.
- [ ] Phase 5 data before Phase 6 analytics — obvious dependency.
- [ ] Email (Phase 7) after the loop works — automations are multipliers on an existing loop, not a fix for a missing one; and 7a/7b/7c can parallelize once 7a's audit is done.
- [ ] Marketing surface (Phase 8) after the product is worth marketing — except cheap SEO pages, which can go anytime.
- [ ] Hardening (Phase 9) last — but rate-limit the new public endpoints as you build them (see Phase 0 note).

## 13. Explicitly later (not in scope above)

- [ ] Native mobile apps, white-label enterprise, multi-language UI (30+ translations), AI page builder, surveys engine, ad-pixel integrations, team SSO — revisit only when Phases 0–7 are shipped and measured.
