# Waitlyze: launch-product research and backlog

Researched 11 October 2026. Implementation baseline: PR #89, `codex/waitlyze-product-review`, `8566562`. This is a product/code assessment, not customer acceptance or proof of deployed integrations. Competitor features below are vendor claims unless identified as source inspection. No competitor account was created, paid plan purchased, or private dashboard tested.

## Direction

Make the product visible before explaining every feature. Keep the centered hero, white canvas and lime actions. Replace the text-heavy narrative with a selectable product walkthrough, six short capability summaries and a compact planned-features list. Use whitespace rather than section borders. Remove the audience strip and separate founder/team narratives. No invented customers or performance claims.

Waitlyze's opportunity is a simple launch workspace: design → publish → collect verified interest → understand it → invite people. Integrations, templates and automation should support that loop inside Waitlists and Settings, rather than become additional global destinations.

## Competitor workflows

| Product | Observed public workflow and emphasis | What to take into Waitlyze |
| --- | --- | --- |
| [LaunchList](https://getlaunchlist.com/) | Its homepage now distinguishes v1 from v2. v2 brings pages, forms, contact verification, referrals, email, release waves, REST API and signed webhooks into a single launch workflow. v1 retains the original embedded/hosted referral experience. | Connect acquisition to actual release: verified referral credit, milestones, access invitations and useful delivery history. Do not copy scope wholesale. |
| [GetWaitlist](https://getwaitlist.com/docs) | Customize a widget, publish a hosted page or integrate a signup API; use referrals/leaderboards; add verification, email rules, CAPTCHA and integrations. Official documentation separates website-builder installation from service integrations. | Treat embed compatibility and native tool sync as different features. Explain both clearly. Provide developer docs, not just an API-key screen. |
| [WaitForIt](https://waitforit.me/) | Presents branded hosted/embedded forms, referral growth, email verification, analytics and integrations. Its public site is broad; the specific integration reliability and private implementation were not tested. | Pair each claim with a visible example and a direct setup path. Quality controls belong beside growth controls. |
| [WaitlistNow](https://www.waitlistsnow.com/) | Create a branded URL, choose among four templates, customize, collect signups and review analytics. Its site also lists Resend email and an interactive demo. | Templates should help a founder publish a credible page quickly. Show actual setup stages instead of only describing convenience. |
| [Prefinery](https://www.prefinery.com/) | Emphasizes referral rewards, triggered communication, integrations and controlled beta access. | Add launch waves and incentives after verification and delivery reliability are proven. |
| [KickoffLabs](https://kickofflabs.com/) | A broader lead-generation/referral-campaign reference. The homepage was reviewed; private flows were not tested. | Keep experiments and reward systems optional. Preserve Waitlyze's smaller product model. |

The four requested commercial competitors did not expose a verified full-product open-source repository in the reviewed sites/search results. That is a research limitation, not a claim that no repository exists. API snippets, widgets and SDKs should not be mistaken for source access to a hosted product.

## Primary documentation examined

- [GetWaitlist API: signup management](https://getwaitlist.com/docs/api-docs/waiter): integration contract and signup operations.
- [Webhooks](https://getwaitlist.com/docs/integrations/webhooks): event-driven integration rather than periodic CSV transfer.
- [Email rules](https://getwaitlist.com/docs/special-features/email-rules): audience restrictions.
- [CAPTCHA](https://getwaitlist.com/docs/special-features/captcha): abuse prevention separate from verification.
- [Dodo Payments](https://dodopayments.com/): inspected in the built-in browser. The useful pattern is a clear hero, capability selection, and prominent product demonstrations. Its testimonial density and payments-specific content do not belong in Waitlyze.

## Public-source inspection

### EarlyPass

Reviewed [repository](https://github.com/earlypass/earlypass) at `9a26007062f21b5a58f6dc7cb752d7a93d173d9f`.

- [Signup persistence](https://github.com/earlypass/earlypass/blob/9a26007062f21b5a58f6dc7cb752d7a93d173d9f/internal/store/postgres/signup.go) separates verification, referral metadata, position and invite state. This is a useful domain separation for future launch waves.
- The insert calculates position with `MAX(base_position) + 1`. Its comment calls this atomic; that statement alone does not prove concurrent uniqueness. Waitlyze should use an explicit serialized allocation or unique constraint/retry and a concurrency test.
- Its [license](https://github.com/earlypass/earlypass/blob/9a26007062f21b5a58f6dc7cb752d7a93d173d9f/LICENSE) is Business Source License 1.1, with a restriction on competing hosted/embedded offerings. This is source-available, not currently permissive open source. No implementation was copied.
- README features and package comments are not execution evidence; an almost-empty webhook package does not prove production delivery reliability.

### OpenLaunch

Reviewed [repository](https://github.com/frockett/OpenLaunch) at `318af332b886ac9fe9aaf904bed17f5812042db2`; [MIT license](https://github.com/frockett/OpenLaunch/blob/318af332b886ac9fe9aaf904bed17f5812042db2/LICENSE).

- [BounceService](https://github.com/frockett/OpenLaunch/blob/318af332b886ac9fe9aaf904bed17f5812042db2/src/OpenLaunch/Services/Shared/BounceService.cs) stores bounce records and offers quarantine recovery. Delivery management should be a first-class audience operation.
- [AWS email service](https://github.com/frockett/OpenLaunch/blob/318af332b886ac9fe9aaf904bed17f5812042db2/src/OpenLaunch/Services/AWS/AWSEmailService.cs) builds unsubscribe links/headers. Its loop also uses blocking sleeps and later sets all recipient addresses on a request; do not treat it as a ready-made sending architecture.
- Carry the ideas into Waitlyze's existing outbox/suppression model, with isolated recipients and explicit provider responses. No implementation was copied or executed.

## Waitlyze capability audit

Paths refer to the PR #89 checkout. “Implemented” means code is present; deployment, worker scheduling and provider acceptance still need their own evidence.

| Capability | Evidence | Status and landing treatment |
| --- | --- | --- |
| Reusable launch templates | `src/lib/templates/catalog.mjs`, `src/components/product/snapshot-page-builder.jsx` | Implemented; describe template-led setup. |
| Private draft, publish/pause/rollback | `src/lib/campaigns/publication.mjs` | Implemented; demonstrate draft → publish without implying automatic launch success. |
| Hosted form / embed | `src/components/product/waitlist-page-content.jsx`, `public/js/embed.js` | Implemented; preview remains an explicit example. |
| Signup API and API keys | `src/app/api/v1/sign_up/route.js`, `src/utils/api-key-auth.js` | Implemented; do not promise comprehensive public docs/SDKs yet. |
| Analytics | `src/lib/analytics/waitlist-analytics.mjs`, `src/components/product/waitlist-analytics.jsx` | Implemented; visitors, signups, conversion and verification. Illustrated charts use example data. |
| Verification and duplicate handling | `src/lib/campaigns/signups.mjs`, `src/lib/rate-limit.js` | Foundation exists; do not market a complete spam/fraud detection system. |
| Referrals | `src/lib/campaigns/signups.mjs` | Foundation exists; independently validate verification-qualified credit and race behavior before rewards. |
| Welcome email / broadcasts / automation | `src/app/actions/emails.js`, `src/lib/email/outbox.mjs`, `src/lib/email/automations.mjs` | Implemented; provider credentials, consent and workers are runtime gates. |
| Email suppression / unsubscribe | `src/lib/email/suppression.mjs`, `src/lib/email/unsubscribe.mjs` | Implemented foundation; validate provider bounce/complaint ingestion. |
| Resend and generic webhooks | `src/lib/integrations/resend-sender.mjs`, `src/lib/webhooks/delivery.mjs`, webhook API routes | Implemented; generic webhooks do not mean native Slack/Zapier/HubSpot integrations exist. |
| Custom domains | Domain API routes and domain configuration code | Foundation exists; confirm DNS/provider provisioning before promoting broadly. |
| Subscriber export | Subscriber/export implementation | Existing capability; no claim that export equals a native integration. |

## Dependency-aware backlog

### 1. Prove the existing loop

- [ ] Run a fresh workspace through template selection → edit → preview → publish → hosted signup → verification → analytics → export.
- [ ] Exercise embed parity on a plain HTML site and React/Next.js, including mobile sizing and duplicate signup feedback.
- [ ] Validate signed webhook delivery with a real receiver: success, timeout, retry, disabled endpoint, replay and key rotation.
- [ ] Validate Resend sending-domain setup, worker execution, unsubscribe, suppression, bounce and complaint behavior.
- [ ] Verify referral credit only rewards the intended qualified signup, including self-referral, duplicates, concurrent verification and retries.
- [ ] Check custom-domain provisioning, DNS readiness and paused-page behavior.

Acceptance: a full customer journey works with persisted state, and every asynchronous job has a visible state/failure path. Code and CI alone do not close these items.

### 2. Make publishing faster

- [ ] Polish SaaS, AI, mobile, community, consumer and newsletter starter templates; preview before selection.
- [ ] Add useful template variations rather than a large decorative gallery.
- [ ] Provide copy hints for value proposition, expected emails and joining benefit.
- [ ] Add an end-to-end launch checklist that reads actual readiness state.

Acceptance: a founder publishes without needing to discover unrelated settings or replace hidden placeholder copy.

### 3. Developer experience and integrations

- [ ] Publish an API reference with authentication, key scope, sample requests/responses, error codes, rate limits and idempotency semantics.
- [ ] Document client/server integration boundaries; never place privileged API keys in public browser snippets.
- [ ] Add HTML, React/Next.js, Framer and Webflow installation guides with minimal runnable examples.
- [ ] Document webhook events, HMAC verification, timestamp/replay policy and delivery retries.
- [ ] Build TypeScript SDK only after the contract is stable; include typed errors and safe retry rules.
- [ ] Add native Slack notifications and Zapier/Make triggers first; evaluate HubSpot, Airtable and Sheets from actual demand.
- [ ] Give integrations connection tests, event history and actionable errors.

Depends on phase 1 delivery evidence. Acceptance: an unfamiliar developer can integrate using only the published docs.

### 4. Signup quality and referral trust

- [ ] Add honeypot and configurable challenge protection at the public signup boundary.
- [ ] Add optional disposable-email and domain rules, with understandable rejection copy and review/recovery.
- [ ] Separate spam suspicion, verified status and referral eligibility; avoid deleting an audience based on a opaque score.
- [ ] Add abuse-event visibility with false-positive review and retention limits.
- [ ] Test traffic bursts, proxy IP handling, cross-waitlist abuse and verification-token reuse.

Depends on stable signup identity and referral credit. Acceptance: automated abuse is reduced while legitimate users can recover.

### 5. Turn interest into a launch

- [ ] Add consent-aware audience segments using signup source, verification, referral activity and engagement.
- [ ] Add documented automation recipes: welcome, verification follow-up, referral milestone and launch announcement.
- [ ] Show which subscribers are eligible for each message and why others are excluded.
- [ ] Add referral rewards with auditable qualification and fulfillment state.
- [ ] Add controlled invitation waves with idempotent invite tokens and redemption state.
- [ ] Track invited → redeemed → activated separately from visitor → signup conversion.

Depends on phases 1 and 4. Acceptance: a team can release to a small verified group without duplicate messages or access grants.

### 6. Measure what matters

- [ ] Add channel/UTM conversion breakdowns with clearly defined denominators.
- [ ] Distinguish unique visitors, duplicate attempts, unverified signups and verified subscribers.
- [ ] Add verification/referral funnels and attribution limits in the UI.
- [ ] Add automation and webhook delivery metrics beside acquisition metrics.
- [ ] Add a table/export alternative for every chart and sensible zero-data states.

Depends on trustworthy event capture. Acceptance: founders can identify which channel brings qualified interest, not just more traffic.

## Landing claims policy

Current feature summaries describe PR #89 code: templates, hosted/embed/API collection, analytics, email, webhooks and verification. Native integrations, advanced spam detection, SDK/docs and referral rewards are explicitly planned. Do not remove a planned marker merely because infrastructure exists. Promote it only after its customer-facing workflow and documentation are verified.

The product walkthrough uses browser captures of the actual `SnapshotPageBuilder`, publication review dialog, and `WaitlistAnalytics` components, rendered locally with a fictional Weekend project. Analytics sample data totals 3,855 visitors, 1,230 signups and 735 verified signups. These are sample figures, not customer or production results. A temporary capture route and analytics response were removed after capture; no authentication bypass or fixture endpoint ships. The initial screenshots were superseded by 1280 × 720 poster images and short MP4 sequences captured from actual component interactions. The sequence contains three captured states per view: design edits/mobile preview; hosted link/embed copy; analytics range/chart-table selection. These are composed walkthrough clips, not continuous screen recordings or live customer data. The hero example uses a fixed sample address and never submits data.

## UI polish decisions

| Before | After | Why |
| --- | --- | --- |
| Different section backgrounds and dark CTA | White canvas throughout, lime actions | Preserve the requested brand and reduce visual interruption. |
| Multiple nested preview frames | One borderless sample form | Show the form with less framing and repeated text. |
| Long narrative sections | Three selectable product views and compact features | Demonstrate the workflow before adding detail. |
| Static FAQ disclosure | One open answer, short expansion/collapse, no background | Clear state with gentler transitions and reduced-motion support. |
| Theme provider and dark branches | Light-only tokens and components | Remove unused behavior and keep the requested white product canvas. |

## Demo and tour follow-up (October 11, 2026)

- LaunchList exposes editable email inputs and join actions on its marketing page. Its hosted example includes a success state, retry action, and leaderboard. This establishes an interactive surface; a real submission was not performed. [Source](https://getlaunchlist.com/)
- WaitForIt links to a public editor demo, with Edit / Preview / Share, templates, undo, redo, reset and save controls. [Source](https://app.waitforit.me/demo)
- WaitlistNow embeds an Arcade guided interactive walkthrough. This is a different model from a working signup form. [Source](https://www.waitlistsnow.com/)
- GetWaitlist homepage extraction was empty; do not infer its form submission behavior from that limitation.
- Fieldnote was only fictional branding to make examples consistent. It has been replaced by Weekend.
- The tour now follows the user-approved Dodo reference: completion-driven auto-advance, manual tabs, a progress bar and a distinct soft color per view. There is no visible Pause button; hover/focus, keyboard navigation, reduced motion, offscreen placement and hidden tabs stop playback.
- Next useful sections: a small visual template gallery; a signup → confirmation → referral walkthrough. Add a short integrations strip as native connectors become available. Avoid testimonials or customer logos until real evidence exists.
- [ ] Replace the static hero form with a local-only interactive demo, showing a truthful simulated success/referral state without sending email or persisting subscribers.

| Before | After | Why |
| --- | --- | --- |
| Custom HTML illustrations | Real product component screenshots with dummy data | Show the product visitors will use |
| Fieldnote branding repeated throughout | One fictional Weekend project | Give examples context without implying a customer |
| Side-by-side narrow illustration and copy | Full-width product clip beneath a short copy row | Make real interface details easier to see |
| Caption below every view | Caption removed; sample context retained in documentation and analytics image alt text | Follow the requested visual cleanup while preserving proof boundaries |
