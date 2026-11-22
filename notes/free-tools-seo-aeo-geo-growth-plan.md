# Waitlyze Free Tools Growth Plan

**Prepared:** November 19, 2026  
**Scope:** SEO, AEO, GEO, free-tool portfolio, anonymous-to-product conversion, activation, and measurement  
**Confidence:** High on product fit and journey design; medium on search-demand ordering until Waitlyze Search Console access is restored

## Executive decision

Waitlyze should not build a miscellaneous library of generic startup calculators. Many software directories and launch products already offer broad, unintegrated collections of generic SaaS calculators, AI copy widgets, and basic SEO utilities.

The winning strategy is a focused **Launch Lab**: a set of free, no-login tools that solve the jobs immediately before someone needs Waitlyze, then carry the visitor's completed work into a live campaign. The core promise should be:

> Plan it, calculate it, write it, and audit it for free. When you are ready, turn the result into a working waitlist without rebuilding it.

Build four flagship public tools first:

1. **Waitlist Landing Page Grader**: the flagship, high-intent diagnostic.
2. **Viral Waitlist Growth Calculator**: a transparent K-factor and list-growth model.
3. **Waitlist Landing Page Copy Builder**: waitlist-specific copy that can populate the page builder.
4. **Product Launch Readiness Planner**: a personalized timeline and checklist that starts with creating the waitlist.

Then expand across referral economics, queue/leaderboard simulation, intake/beta qualification forms, email sequencing and deliverability, UTM planning, embed snippet configuration, and template selection. The long-term moat is not a generator; it is a public, privacy-safe **Waitlist Benchmark Explorer** based on aggregated Waitlyze campaign data with a disclosed methodology and minimum sample sizes.

## Why this strategy fits Waitlyze

Waitlyze already has the product surface needed to complete the journey: a visual page builder and 14 templates, hosted pages and embeds, verified referrals, email broadcasts and automations, source/device/geography analytics, API/webhooks, and a free plan with one waitlist and 100 lifetime signups (`README.md`, `src/lib/templates/gallery.mjs`, `src/lib/billing/plans.mjs`).

Its current public acquisition foundation is also unusually strong:

- Server-rendered marketing, template, comparison, blog, and docs pages.
- A sitemap that includes templates, comparisons, blog posts, and docs (`src/app/sitemap.js`).
- Deliberate access for Google, Bing, OAI-SearchBot, ChatGPT-User, Claude, and Perplexity (`src/app/robots.js`). OpenAI explicitly separates OAI-SearchBot for search visibility from GPTBot for training, matching Waitlyze's current policy ([OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)).
- `llms.txt`, `llms-full.txt`, Markdown routes, agent instructions, and an MCP server.
- Explicit PostHog events and UTM/referrer preservation.

The missing layer is a public `/tools` acquisition surface and the stateful bridge from an anonymous result to a preconfigured campaign.

## Research findings

### Search-intent signals

Google autocomplete was sampled on November 19, 2026. It is directional evidence of query language, not search-volume data.

- `waitlist landing page` expands to **design, examples, template, builder, inspiration, Framer, Shopify, and UI**. This supports a page grader, copy builder, templates, and platform-specific implementation content ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=waitlist%20landing%20page)).
- `waitlist template` expands to **Google Sheets, Excel, Framer, free, website, PDF, and Next.js**. Existing Waitlyze templates cover part of this demand; the tools should link to and reuse them ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=waitlist%20template)).
- `waitlist email` expands to **template, example, collector, design, service, and marketing**. Waitlyze already has email-sequence and template articles, creating a natural tool cluster ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=waitlist%20email)).
- `product launch checklist` expands to **template, Excel, PDF, release checklist, readiness checklist, and Product Hunt checklist**. This is broad top-of-funnel demand that still leads naturally to starting a waitlist ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=product%20launch%20checklist)).
- `viral coefficient calculator` is itself a suggested phrase, supporting a deterministic calculator with a clear formula ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=viral%20coefficient%20calculator)).
- The generic phrase `waitlist calculator` is dominated by unrelated travel, college, watch, and prediction meanings. Waitlyze should avoid making that the primary title or slug; use **viral waitlist growth calculator** or **waitlist conversion calculator** instead ([autocomplete sample](https://suggestqueries.google.com/complete/search?client=firefox&q=waitlist%20calculator)).

No numeric search-volume claim is made here. The connected Search Console service could not be queried because its configured OAuth client-secrets file is missing. Restoring that integration is a Phase 0 gate before finalizing the release order.

### Market gap across existing launch tool hubs

| Existing market pattern              | Common free-tool approach                                                                                                                                                                    | What it teaches Waitlyze                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch & giveaway tool suites        | Medium-sized libraries (~10–12 tools) covering launch planners, calendars, referral ROI and reward calculators, giveaway grading, and copy generators that prompt users to start a campaign. | A tool library is category table stakes, but static outputs that require re-entering data into a blank dashboard create friction.                         |
| Broad startup & SEO tool directories | Large libraries (20+ tools) spanning generic SaaS metrics (MRR, CAC), generic AI text generators, SEO tag utilities, and simple checklists.                                                  | Broad volume dilutes topical authority. Generic MRR, CAC, name, slogan, bio, and `robots.txt` tools attract low-intent traffic with weak product fit.     |
| Single-utility lead magnets          | A standalone embeddable referral widget or a downloadable static PDF/checklist supported by blog content.                                                                                    | Small, product-adjacent utilities convert well when the bridge to the live product is immediate and stateful.                                             |
| Documentation-led waitlist platforms | Public surfaces focused on product features, API docs, guides, and integrations without an interactive diagnostic or planning hub.                                                           | There is clear room for an interactive, waitlist-specific diagnostic, simulation, and benchmark suite that hands off directly into a configured campaign. |

### SEO, AEO, and GEO implications

Google's current guidance says generative Search uses core ranking and quality systems, query fan-out, and retrieval from its index. It recommends unique, non-commodity, people-first content and explicitly says there is no special AI schema or required AI file for Google ([Google generative AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). Google's people-first guidance also treats genuinely useful interactive tools as main content and asks whether a page provides original value rather than mass-produced summaries ([Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

Therefore:

- The interactive tool must be the page's main value, not a thin widget wrapped in SEO copy.
- Build one strong page per distinct job. Do not produce city, industry, or wording variants that only swap keywords.
- Publish formulas, methodology, assumptions, examples, and limitations. These are the passages answer engines can cite.
- Use normal semantic HTML and server-render the explanatory content. Add Markdown mirrors and `llms.txt` links as a non-Google accessibility layer, not as a ranking promise.
- Treat a citation, a recommendation, a signup, and an activated campaign as separate outcomes.

## Recommended tool portfolio (14 tools)

Scores are strategic judgments from 1 (low) to 5 (high), not keyword-volume estimates. Every tool maps to an actual Waitlyze capability so its output can prefill a campaign blueprint. Tracked under Epic [#235](https://github.com/FALAK097/waitlyze/issues/235) (with shared `/tools` foundation [#236](https://github.com/FALAK097/waitlyze/issues/236), `ToolBlueprint` OAuth handoff [#237](https://github.com/FALAK097/waitlyze/issues/237), and omni-surface distribution [#252](https://github.com/FALAK097/waitlyze/issues/252)).

| Priority     | Issue                                                   | Tool and canonical path                                                                | Search / user job                                                              | Product fit | Conversion leverage |                 Defensibility | Effort | Primary handoff                                                      |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------: | ------------------: | ----------------------------: | -----: | -------------------------------------------------------------------- |
| P0 quick win | [#238](https://github.com/FALAK097/waitlyze/issues/238) | **Waitlist Template Finder** `/tools/waitlist-template-finder`                         | Pick the right page structure and layout for a launch use case                 |           5 |                   5 |                             2 |      1 | Open `/waitlists/new?blueprint=...` with template & preset chosen    |
| P0 flagship  | [#242](https://github.com/FALAK097/waitlyze/issues/242) | **Waitlist Landing Page Grader** `/tools/waitlist-landing-page-grader`                 | “Why is my waitlist page not converting?”                                      |           5 |                   5 |                             4 |      5 | Create a corrected page in the visual builder from the audit         |
| P0           | [#239](https://github.com/FALAK097/waitlyze/issues/239) | **Viral Waitlist Growth Calculator** `/tools/viral-coefficient-calculator`             | Forecast organic and referred list growth (`K`-factor)                         |           5 |                   4 | 3 now, 5 with real benchmarks |      2 | Apply referral settings and target goals to a campaign               |
| P0           | [#240](https://github.com/FALAK097/waitlyze/issues/240) | **Waitlist Landing Page Copy Builder** `/tools/waitlist-landing-page-generator`        | Generate waitlist-specific hero, benefits, FAQ, and post-signup copy           |           5 |                   5 |                             3 |      3 | Populate a selected Waitlyze template with draft copy                |
| P0           | [#241](https://github.com/FALAK097/waitlyze/issues/241) | **Product Launch Readiness Planner** `/tools/product-launch-checklist`                 | Build a dated launch plan and identify critical pre-launch gaps                |           5 |                   4 |                             3 |      3 | Create the first task: a working waitlist with timeline milestones   |
| P1           | [#243](https://github.com/FALAK097/waitlyze/issues/243) | **Referral Reward Tier & ROI Designer** `/tools/referral-reward-calculator`            | Choose milestones, rewards, unit costs, budget caps, and fraud controls        |           5 |                   5 |                             3 |      3 | Save reward tiers, point rules, and verification requirements        |
| P1           | [#244](https://github.com/FALAK097/waitlyze/issues/244) | **Waitlist Queue & Leaderboard Points Simulator** `/tools/waitlist-queue-simulator`    | Model how signup points, referral bonuses, and actions move users up the list  |           5 |                   5 |                             4 |      2 | Configure campaign point rules, position display, and leaderboard    |
| P1           | [#245](https://github.com/FALAK097/waitlyze/issues/245) | **Beta Intake & Lead Qualification Form Designer** `/tools/beta-application-questions` | Design high-signal intake questions and VIP scoring rules without drop-off     |           5 |                   5 |                             4 |      3 | Populate custom intake form fields and qualification rules           |
| P1           | [#246](https://github.com/FALAK097/waitlyze/issues/246) | **Waitlist Email Sequence Builder** `/tools/waitlist-email-generator`                  | Write and schedule verification, welcome, milestone, and launch-day emails     |           5 |           5 for Pro |                             3 |      3 | Save email drafts; clearly disclose that automated sequences are Pro |
| P1           | [#247](https://github.com/FALAK097/waitlyze/issues/247) | **Launch Channel & UTM Link Builder** `/tools/waitlist-utm-builder`                    | Create consistent tracking links and channel plan for Product Hunt, X, etc.    |           4 |                   4 |                             2 |      2 | Open campaign with expected UTM sources and launch checklist         |
| P1           | [#248](https://github.com/FALAK097/waitlyze/issues/248) | **Waitlist Embed & Widget Configurator** `/tools/waitlist-embed-generator`             | Preview and configure inline, modal, or drawer waitlist forms for any stack    |           5 |                   5 |                             3 |      2 | Claim the live embed snippet backed by a hosted Waitlyze campaign    |
| P2           | [#249](https://github.com/FALAK097/waitlyze/issues/249) | **Waitlist Health & Fraud Risk Auditor** `/tools/waitlist-health-check`                | Diagnose disposable domains, unverified decay, and referral loops from CSV     |           5 |                   5 |                             4 |      4 | Import cleaned audience into Waitlyze with anti-abuse protections    |
| P2           | [#250](https://github.com/FALAK097/waitlyze/issues/250) | **Waitlist Email Deliverability & DNS Checker** `/tools/email-deliverability-checker`  | Verify SPF, DKIM, DMARC, and domain readiness before sending launch broadcasts |           4 |           5 for Pro |                             3 |      2 | Connect custom sending domain in Waitlyze Email settings             |
| P2 moat      | [#251](https://github.com/FALAK097/waitlyze/issues/251) | **Waitlist Benchmark Explorer** `/research/waitlist-benchmarks`                        | Compare conversion, verification, share rate, K-factor, and channel mix        |           5 |                   4 |                             5 |      5 | Benchmark a campaign against live cohorts in product analytics       |

### Do not build now

- Generic MRR, ARR, CAC, runway, churn, name, domain, slogan, bio, or meta-description tools. They have weak product adjacency and are already saturated in generic tool directories.
- A generic “AI startup idea generator.” It attracts ideation traffic far before waitlist intent and produces a poor activation cohort.
- A generic “waitlist calculator” page. The query is ambiguous and likely to attract railway, college, ticketing, or luxury-watch traffic.
- Dozens of thin industry versions of the same calculator or generator. Google explicitly warns against scaled query-variant content.
- Email gating before showing a result. The product should earn the signup by delivering value first.

## P0 product specifications

### 1. Waitlist Landing Page Grader

**Positioning:** “Paste your public waitlist URL. Get a transparent score, the highest-impact fixes, and corrected copy.”

**Inputs**

- Public HTTPS URL.
- Optional launch type: SaaS, AI, mobile app, creator/newsletter, event, preorder, developer tool, or other.
- Optional primary goal: signups, referrals, reservations, beta applications, or event registrations.

**Checks and output**

- Value proposition clarity: audience, outcome, differentiation, and message match.
- CTA clarity and placement.
- Form friction: field count, labels, validation, privacy copy, mobile input types.
- Proof and objection handling: product visual, concrete proof, FAQ, risk reversal.
- Waitlist mechanics: clear post-signup state, referral explanation, queue/reward transparency.
- Search and answer readiness: indexability, canonical, title, description, one H1, semantic sections, visible text, crawlable links, structured data parity, and AI-bot access.
- Technical basics: HTTPS, status code, response size, mobile viewport, image alt text, and a bounded performance check.
- Results: overall grade, category scores, top three fixes by expected impact, corrected hero/CTA copy, suitable Waitlyze template, and an implementation checklist.

**Conversion bridge**

Primary CTA: **“Build the corrected version in Waitlyze.”** The CTA creates a versioned blueprint containing the recommended template, proposed hero/CTA, fields, sections, and referral setting. After Google authentication, the new-waitlist dialog is prefilled and the builder opens with the proposed edits applied as a draft.

Secondary CTA: **“Recheck this page later.”** Allow a shareable private audit link only after the user explicitly chooses to save it.

**Safety and configuration**

- Prevent SSRF: HTTPS only, DNS/IP validation before and after redirects, block private/link-local/loopback ranges, limit redirects, time, bytes, and content types.
- Never execute fetched JavaScript or submit forms.
- Do not retain page content by default. Retain only derived scores for aggregate reporting; disclose retention.
- Rate-limit anonymous scans and cache a normalized URL result briefly.
- Explain every score and publish the rubric. Do not claim a score predicts conversion.

### 2. Viral Waitlist Growth Calculator

**Positioning:** “Model how signups, shares, invitations, and verification compound your pre-launch list.”

**Inputs**

- Starting list size.
- Monthly or weekly visitors.
- Landing-page conversion rate.
- Verification rate.
- Share rate among verified subscribers.
- Invitations or clicks per sharer.
- Referred-visitor conversion rate.
- Period length and optional reward cost.

**Outputs**

- Direct verified signups.
- Referral signups and total signups.
- Viral coefficient: `K = share rate × invitations per sharer × referred conversion rate`.
- Projected list growth by cycle with a chart and a plain-language interpretation.
- Sensitivity analysis showing which single input has the highest leverage.
- Optional cost per verified referral and reward-budget projection.
- Assumptions, formula, worked example, and limitations.

**Conversion bridge**

Primary CTA: **“Launch this referral model.”** Carry the chosen referral on/off state, reward thresholds, verification recommendation, and campaign goal into the builder. If the modeled K-factor is low, recommend improving landing-page conversion before adding incentives rather than forcing a referral CTA.

**Configuration**

- Compute locally or deterministically on the server; no LLM is needed.
- Do not label arbitrary ranges as industry benchmarks. Until Waitlyze has adequate data, call them scenarios.
- Make the result linkable without indexing every query-string combination. All variants canonicalize to the tool page.
- Offer CSV and PNG export; exports include the formula and date.

### 3. Waitlist Landing Page Copy Builder

**Positioning:** "Generate a complete waitlist page, not just a headline, from your product, audience, proof, and launch goal."

**Inputs**

- Product name and one-sentence description.
- Audience and problem.
- Primary outcome / unique advantage.
- Launch type and desired action.
- Available proof: demo, screenshot, beta quote, founder credibility, number, or none.
- Tone and template preference.

**Outputs**

- Three hero directions, each with headline, supporting copy, and CTA.
- Recommended page outline with benefits, how it works, proof, FAQ, and form microcopy.
- Post-signup confirmation and referral-share copy.
- Honest placeholders when proof is absent; never invent testimonials, customer counts, or metrics.
- A selected Waitlyze template and preview.

**Conversion bridge**

Primary CTA: **“Use this page in Waitlyze.”** Apply the selected copy to a draft snapshot and open the visual builder. A visitor may copy all text without signing up; signup is for saving, editing, publishing, and collecting subscribers.

**Configuration**

- Begin with a deterministic framework and optional LLM enhancement. This lowers cost and avoids an empty experience during provider failure.
- Validate and cap every field. Rate-limit generation. Do not place raw prompts or outputs in analytics.
- Disclose AI assistance when used and provide edit/regenerate controls by section.
- Make the page's public explanatory content useful even when the generation endpoint is unavailable.

### 4. Product Launch Readiness Planner

**Positioning:** “Enter your launch date and context. Get a dated, prioritized plan from validation through the first post-launch week.”

**Inputs**

- Product and launch type.
- Planned launch date or “not decided.”
- Team size, current audience size, and available weekly time.
- What already exists: product demo, domain, page, email list, proof, analytics, launch channel, referral reward.
- Primary launch channel and target.

**Outputs**

- Readiness score by product, page, audience, messaging, distribution, operations, and measurement.
- Critical path with dated tasks and dependencies.
- A 14-, 30-, 60-, or 90-day plan based on available time.
- Recommended template, email sequence, referral strategy, UTM plan, and launch rehearsal.
- Export to calendar (`.ics`), CSV, and printable checklist.

**Conversion bridge**

The first incomplete audience task becomes **“Create your waitlist now”** and carries the relevant blueprint into Waitlyze. After signup, show the plan inside the campaign as an optional checklist; do not drop the user into a generic dashboard.

## P1 & P2 tool specifications

### 5. Waitlist Template Finder (`/tools/waitlist-template-finder`)

- **Job:** Match a founder's product type, brand tone, visual assets, and referral strategy to the best-fit Waitlyze template among the 14 available templates (`src/lib/templates/gallery.mjs`).
- **Inputs:** Product category (SaaS, AI, Mobile, DevTool, Creator, Event, Preorder), primary conversion action, available assets (video, product screenshot, minimal text-only), and referral emphasis (leaderboard, milestone tiers, simple queue, or none).
- **Outputs:** Top 3 ranked template recommendations with live interactive previews, explanation of why the layout fits, recommended section checklist, and pre-selected color/typography pairing.
- **Conversion bridge:** **“Start with this template”** creates a `ToolBlueprint` with the chosen template, layout options, and starter section configuration, redirecting through auth into `/waitlists/new?blueprint=<id>`.

### 6. Referral Reward Tier & ROI Designer (`/tools/referral-reward-calculator`)

- **Job:** Design sustainable milestone tiers (e.g., 3, 5, 10, 25 verified referrals) without blowing unit economics or inviting referral fraud.
- **Inputs:** Product price or LTV, reward types (early access, discount, credits, swag, lifetime deal), marginal cost per reward, expected share rate, and target campaign size.
- **Outputs:** Recommended 3-to-4-tier milestone structure, projected reward fulfillment cost at 25th/50th/90th percentile viral growth, effective customer acquisition cost per referred user, ready-to-use tier descriptions, and recommended anti-fraud rules (email verification, disposable-domain blocking, velocity limits).
- **Conversion bridge:** **“Apply these reward tiers in Waitlyze”** prefills the campaign's referral milestone settings, point values, and verification enforcement.

### 7. Waitlist Queue & Leaderboard Points Simulator (`/tools/waitlist-queue-simulator`)

- **Job:** Model how base signup points, verified referral bonuses, and custom qualification actions move subscribers up the waitlist queue or leaderboard.
- **Inputs:** Expected total signups, base signup points, points per verified referral, optional VIP/qualification bonus points, and share distribution assumptions.
- **Outputs:** Simulated queue jump curve (e.g., “1 verified referral moves a new subscriber from #1,000 to #210”), top-10 leaderboard threshold estimation, tie-breaking rules explanation, and recommendations for displaying exact position vs percentile band.
- **Conversion bridge:** **“Configure this queue model in Waitlyze”** prefills the campaign's referral point rules, queue rank display mode, and leaderboard settings.

### 8. Beta Intake & Lead Qualification Form Designer (`/tools/beta-application-questions`)

- **Job:** Generate high-signal beta application or B2B intake questions and VIP qualification rules without causing form abandonment.
- **Inputs:** Target customer profile (B2B SaaS, Developer Tool, Consumer AI, Design Partner, Community), primary qualification criteria (role, team size, use case, stack, urgency), and maximum acceptable form friction (2–5 fields).
- **Outputs:** Recommended field set with input types (single-select, multi-select, short text), field microcopy, estimated completion impact, and VIP scoring/tagging rules to prioritize high-intent applicants.
- **Conversion bridge:** **“Build this intake form in Waitlyze”** prefills the campaign's custom form schema and lead qualification rules.

### 9. Waitlist Email Sequence Builder (`/tools/waitlist-email-generator`)

- **Job:** Draft and schedule the core pre-launch lifecycle emails: verification, welcome + referral link, milestone unlocked, pre-launch warm-up, and launch-day access.
- **Inputs:** Product name, core value proposition, launch timeline, referral reward summary, and brand voice.
- **Outputs:** Complete 5-email sequence with subject lines, preview text, Markdown body copy, merge-tag placeholders (`{{position}}`, `{{referral_link}}`, `{{referrals_count}}`), and recommended send triggers.
- **Conversion bridge:** **“Save this email sequence to Waitlyze”** stores the email templates in the campaign's blueprint (clearly noting which automated triggers require Pro while allowing manual broadcast setup and draft editing immediately).

### 10. Launch Channel & UTM Link Builder (`/tools/waitlist-utm-builder`)

- **Job:** Generate standardized, typo-free UTM tracking links across all launch surfaces (Product Hunt, Hacker News, X/Twitter, LinkedIn, Reddit, newsletters, creator sponsorships) so Waitlyze source analytics remain clean.
- **Inputs:** Base waitlist URL (or planned domain), launch channels selected, campaign name, and content variants.
- **Outputs:** Channel-by-channel tracking table with copyable URLs, QR code export where relevant, naming convention guide, and expected attribution mapping in Waitlyze Analytics.
- **Conversion bridge:** **“Track these channels in Waitlyze”** passes the channel plan and campaign slug into a new or existing Waitlyze campaign checklist.

### 11. Waitlist Embed & Widget Configurator (`/tools/waitlist-embed-generator`)

- **Job:** Interactively design and preview an inline, modal, or drawer waitlist signup widget and inspect the exact integration snippet for Next.js, React, Framer, Webflow, Shopify, or plain HTML.
- **Inputs:** Layout mode (inline, compact pill, popup modal, slide-over drawer), theme (light, dark, custom brand accent), fields shown, and target framework.
- **Outputs:** Live interactive widget preview, responsive breakpoint test, copyable framework-specific embed guide, and performance/CSP checklist.
- **Conversion bridge:** **“Connect this widget to a live waitlist”** creates the matching campaign theme and opens the Waitlyze Embeds tab with the user's real campaign ID wired in.

### 12. Waitlist Health & Fraud Risk Auditor (`/tools/waitlist-health-check`)

- **Job:** Audit an existing email list (via client-side CSV inspection or aggregate metrics) for disposable email domains, role accounts, unverified decay, suspicious signup velocity clusters, and self-referral patterns.
- **Inputs:** Aggregate list metrics or a locally parsed CSV (processed in-browser by default so raw emails never leave the visitor's device unless they explicitly import into an account).
- **Outputs:** List quality score, estimated deliverable vs risky breakdown, disposable/role-account percentage, referral abuse risk assessment, and cleanup recommendations.
- **Conversion bridge:** **“Import cleaned audience into Waitlyze”** carries the validated configuration into a new Waitlyze campaign with strict email verification and fraud protection enabled.

### 13. Waitlist Email Deliverability & DNS Checker (`/tools/email-deliverability-checker`)

- **Job:** Check a launch domain's public DNS records (SPF, DKIM selector presence, DMARC policy, MX records) before sending launch broadcasts.
- **Inputs:** Domain name (e.g., `acme.com`) and optional DKIM selector.
- **Outputs:** Pass/warn/fail scorecard for SPF, DKIM, DMARC, and MX; plain-language remediation steps; copyable DNS record syntax; and pre-launch sending warm-up checklist.
- **Conversion bridge:** **“Connect this sending domain in Waitlyze”** carries the domain into Waitlyze Email Domain settings after signup.

### 14. Waitlist Benchmark Explorer (`/research/waitlist-benchmarks`)

- **Job:** Provide original, citable benchmark data on waitlist conversion rates, email verification rates, referral share rates, and viral coefficients (`K`-factor) segmented by launch category and traffic source.
- **Inputs:** Filter by product category, launch stage, referral incentive type, and traffic channel.
- **Outputs:** Median and interquartile ranges (`P25`, `P50`, `P75`), sample size (`N`), methodology disclosure, downloadable aggregate CSV, and chart export.
- **Conversion bridge:** **“Compare your live campaign against these benchmarks”** opens a preconfigured Waitlyze campaign or links into the Analytics dashboard.

## Customer product journey

```text
Search / AI answer / shared result
          ↓
Public tool page: useful with no login
          ↓
Immediate personalized result + explanation
          ↓
Value-matched CTA: build, apply, save, or track this result
          ↓
Google auth with blueprint and attribution preserved
          ↓
Prefilled campaign → visual builder → publish
          ↓
First verified signup → referral share → first referred signup
          ↓
Upgrade when the user needs analytics, email automation, custom domain,
more than 100 signups, more campaigns, or team collaboration
```

### Stage-by-stage experience

| Stage                 | Visitor experience                                               | Required product behavior                                         | Success event                                      |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| Discover              | Query-specific title and snippet; AI answer can quote the method | Canonical, indexable, server-rendered tool page                   | Qualified non-brand visit                          |
| Engage                | Complete tool without account or email                           | Fast, accessible inputs; example data; no forced modal            | `tool:started`                                     |
| Receive value         | Full result, assumptions, and next actions                       | Do not blur or gate the useful result                             | `tool:completed`                                   |
| Convert               | CTA names the exact saved value: “Build the corrected version”   | Preserve a validated blueprint and the originating tool           | `tool:signup_clicked`                              |
| Authenticate          | Google signup, free/no-card promise                              | Return to the blueprint, not `/waitlists` generically             | `marketing:signup_completed` with tool attribution |
| Configure             | Name, slug, template, copy, referral/email settings prefilled    | User reviews before creation; never silently publish              | `tool:blueprint_applied`                           |
| Activate              | Preview, publish, share, and collect first verified signup       | Contextual checklist and one next best action                     | `waitlist:published`, then first verified signup   |
| Experience core value | See signups and referral behavior                                | Celebrate real progress; recommend next action from actual state  | First referred verified signup                     |
| Monetize              | Limits or advanced workflow become relevant                      | Upgrade message tied to the blocked job, with exact feature/price | `billing:subscription_created`                     |

### The blueprint handoff

This is the differentiator and should be built as shared infrastructure before scaling the library.

- Define a versioned `ToolBlueprint` schema with a tool type, sanitized inputs, derived recommendations, template ID, source metadata, creation time, and short expiry.
- Anonymous completion may stay in the browser. When the visitor clicks a save/build CTA, validate it server-side and create a short-lived blueprint token.
- Preserve the token through Google OAuth using a signed, same-site cookie or server-side state. Do not put private URLs, copy, or campaign inputs directly in query parameters.
- After auth, claim the blueprint once, associate it with the user/workspace, and redirect to `/waitlists/new?blueprint=<opaque-id>`.
- Extend the current new-waitlist flow, which only accepts `template`, to prefill name, description, template, and draft content after explicit review (`src/app/(app)/waitlists/new/page.jsx`, `src/components/product/create-waitlist-dialog.jsx`).
- Keep the original generated result accessible from the campaign so the user can compare the recommendation with the final implementation.

## Where the tools should be available

### 1. Public website

- A crawlable `/tools` hub named **Waitlyze Launch Lab**, linked from the main header/footer under Resources.
- One canonical page per tool under `/tools/[slug]`.
- Add all released tools to the sitemap and IndexNow submission. IndexNow recommends notifying participating engines as soon as a URL is added, updated, or deleted ([IndexNow documentation](https://www.indexnow.org/documentation)).
- Add tools to `llms.txt`, `llms-full.txt`, the Markdown route catalog, and `agent-instructions.md`.

### 2. Contextual owned distribution

- Embed the viral calculator and queue simulator in “Waitlist Metrics,” “Referral Waitlist,” and referral-reward articles.
- Embed the copy builder and intake form designer in landing-page examples/checklist articles and template pages.
- Embed the planner in launch-day, validation, and “first 1,000 signups” articles.
- Show the template finder on `/templates`, not as an intrusive popup.
- Link each tool to one or two relevant guides and each guide back to the tool. Avoid sitewide blocks of 14 tool links.

### 3. Inside Waitlyze

- Make the same tools available in context: grader and copy builder in Builder, viral calculator and queue/reward designers in Referrals/Analytics, email builder and DNS checker in Emails, embed configurator in Embeds, and planner in campaign overview.
- Logged-in users can apply results directly. Anonymous users can copy/export before signing up.
- The public and in-product versions should share calculation and schema code to prevent conflicting answers.

### 4. AI agents and MCP

- Expose deterministic, read-only versions of `calculate_viral_growth`, `simulate_waitlist_queue`, `recommend_waitlist_template`, `design_referral_rewards`, and `plan_launch_timeline` through the existing MCP server.
- Return the method, assumptions, and a prefilled Waitlyze URL, not a forced recommendation.
- Link these tools from `llms.txt` and the MCP docs. Keep pricing and plan limits visible as text.
- Do not make Google visibility claims for `llms.txt`; Google says it is not required. This surface serves non-Google agents and user-triggered workflows.

### 5. Share and embed distribution

- Every result can export a clean PNG/CSV/ICS where appropriate, with a small Waitlyze source line.
- Offer embeddable versions of the calculator and template finder to relevant publishers after the owned pages are stable.
- Any default widget attribution link should be optional and use `rel="nofollow"`; earn editorial backlinks through the tool's usefulness, not a forced widget-link scheme.

## Page and technical configuration

Every tool page should ship with the same quality contract.

### Indexing and rendering

- Return a useful server-rendered page with the title, definition, method, default example, FAQ, and limitations in the initial HTML.
- The calculator/generator interface may hydrate on the client, but its labels and explanation must remain understandable without JavaScript.
- One self-canonical. Query-string result variants and share parameters canonicalize to the base tool URL and are not added to the sitemap.
- Correct 404/429/5xx status codes. Anonymous rate limits should return `429` with `Retry-After`.
- Add the new routes to the existing public-page PostHog classification so tools retain cookieless public analytics (`src/lib/posthog/client.js`).

### On-page structure for SEO, AEO, and GEO

1. H1 matching the job, not a stuffed list of synonyms.
2. A direct 40–60 word answer explaining what the tool does and how the result is calculated.
3. The working tool.
4. “How it works” with formula or rubric.
5. A worked example with real arithmetic or an explicitly fictional launch.
6. “How to interpret your result,” including failure cases.
7. Methodology, author/reviewer, sources, last materially updated date, and changelog.
8. Three to six visible FAQs based on real user questions.
9. Related guide, relevant template, and value-matched signup CTA.

Avoid a generic 2,000-word article beneath every tool. The useful interface, transparent method, and original example are the main content.

### Structured data

- `WebApplication` / `SoftwareApplication` describing the free tool, operating system `Web`, and `offers.price = 0` where the visible page says it is free.
- `BreadcrumbList` for Tools → Tool.
- `Article` only for a distinct methodology/research page with a real author and dates.
- Keep every structured-data fact visible on the page and validate it. Structured data aids understanding and rich-result eligibility but is not required for generative AI search.
- Do not promise FAQ rich results. Google limits FAQ rich-result eligibility mainly to authoritative government and health sites; visible FAQs can still help users and extraction ([Google FAQ structured data guidance](https://developers.google.com/search/docs/appearance/structured-data/faqpage)).

### Performance, accessibility, and privacy

- Keep deterministic calculations client-side or in small server functions; do not call an LLM for arithmetic.
- Lazy-load charts and export code. Avoid large animation dependencies.
- Every input has a persistent label, description, inline error, keyboard access, and appropriate mobile input mode.
- Results use text plus color, never color alone.
- Do not send raw product descriptions, pasted URLs, generated copy, email addresses, or CSV contents to PostHog.
- State clearly what is processed, stored, retained, and sent to an AI provider.
- Provide deletion for saved audits/blueprints and an expiry for anonymous data.

## Content cluster and internal linking

Do not create a separate article when a strong Waitlyze article already owns the explanation. Upgrade and interlink the existing cluster.

| Tool                         | Existing supporting content                                            | New content only if a real gap remains                                      |
| ---------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Template Finder              | `/templates` gallery, landing page examples                            | No new article needed                                                       |
| Landing Page Grader          | Landing page checklist, examples, SEO guide, Next.js SEO guide         | Public grading rubric and one anonymized before/after teardown              |
| Viral Growth Calculator      | Waitlist metrics, referral waitlist, referral tiers, milestone rewards | Formula/methodology page and periodic benchmark report                      |
| Copy Builder                 | Landing page examples/checklist, templates                             | A guide to evidence/proof on pre-launch pages if user research shows demand |
| Launch Planner               | Launch day playbook, validation guide, first 1,000 signups             | A dated launch-calendar methodology                                         |
| Reward Designer              | Referral tiers and milestone guides                                    | Reward-cost methodology and fraud-risk model                                |
| Queue & Points Simulator     | Referral waitlist and milestone guides                                 | Queue psychology and fairness guide                                         |
| Beta Intake Form Designer    | Pre-launch validation and B2B beta guides                              | High-signal beta qualification question bank                                |
| Email Sequence Builder       | Email sequence and email templates                                     | Deliverability/setup guide if not already covered in docs                   |
| UTM Builder                  | UTM tracking guide                                                     | No new article initially                                                    |
| Embed & Widget Configurator  | Docs embed installation guides, Next.js / Framer integration guides    | Framework-specific embed performance checklist                              |
| Health & Fraud Risk Auditor  | Referral fraud and verification docs                                   | Pre-launch list hygiene and migration guide                                 |
| Email Deliverability Checker | Custom sending domain docs                                             | SPF/DKIM/DMARC quick-reference for product launches                         |

## AEO/GEO distribution and monitoring

### Stable prompt portfolio

Track a small revenue-linked set across Google AI features, ChatGPT, and Perplexity. Run each prompt 3–5 times per platform and record citation, mention, recommendation, and framing separately.

- How do I calculate the viral coefficient of a waitlist?
- How can I estimate referrals from a pre-launch waitlist?
- What is a good waitlist conversion rate for a SaaS launch?
- How do I audit a waitlist landing page?
- What should a waitlist landing page include?
- How do I write landing-page copy for a product waitlist?
- How should I structure referral rewards for a waitlist?
- How do waitlist queue points and referral leaderboards work?
- What questions should I ask on a beta waitlist application form?
- What emails should I send before a product launch?
- Give me a product launch readiness checklist.
- What free tool can help me build and grow a referral waitlist?
- Best free waitlist builder for a solo founder / SaaS / mobile app.

Add diagnostic controls: “Waitlyze pricing” should reliably surface Waitlyze, while an unrelated category should not. Version the prompt set and do not compare periods with materially different prompts.

### Presence beyond Waitlyze.com

- Launch each genuinely useful tool with a worked example on founder and product communities where the team already participates. Do not seed fake recommendations.
- Seek inclusion in real startup-resource and calculator directories after the tool has user proof.
- Publish original benchmark findings with a reproducible methodology, then pitch the data (not the product) to newsletters, podcasts, and launch/growth publications.
- Keep category and segment wording consistent across GitHub, LinkedIn, product directories, review profiles, and partner pages: **waitlist builder for founders and marketing teams, with hosted pages, verified referrals, email, and launch analytics**.

## Measurement plan

### Event taxonomy

Add these explicit events to the existing PostHog taxonomy:

- `tool:viewed`
- `tool:started`
- `tool:completed`
- `tool:result_exported`
- `tool:result_shared`
- `tool:signup_clicked`
- `tool:blueprint_created`
- `tool:blueprint_applied`
- `tool:recheck_completed`

Safe properties: `tool_slug`, `tool_version`, `entry_surface`, `result_band`, `template_id`, `authenticated`, and opaque `blueprint_id`. Never capture raw inputs or outputs.

### Funnel

Measure by originating tool and cohort:

1. Organic/AI landing visit.
2. Tool start.
3. Tool completion.
4. Signup CTA click.
5. Auth completed.
6. Blueprint applied / waitlist created.
7. Waitlist published within 7 days.
8. First verified signup within 14 days.
9. First verified referral within 30 days.
10. Pro upgrade and 90-day retention.

Do not optimize only for tool completions or email leads. The north-star acquisition metric should be **activated waitlists per 1,000 qualified tool visitors**, with activation defined as a published page plus at least one verified signup.

### Channel metrics

- **SEO:** indexed pages, non-brand impressions/clicks, query families, position, CTR, backlinks, and tool-assisted signups.
- **AEO/GEO:** mention rate, citation rate, recommendation rate, source URL, framing, and share of voice for the stable prompt portfolio.
- **Product:** tool-to-account, account-to-campaign, publish rate, time to publish, first verified signup, first referral, and upgrade.
- **Quality guardrails:** completion error rate, anonymous compute cost, p95 response time, abuse blocks, Core Web Vitals, and support complaints.
- **Delayed AI attribution:** group known AI referrers, monitor branded search/direct visits after citation changes, and add an optional “How did you hear about Waitlyze?” answer with an AI-assistant option.

## Benchmark Explorer data policy

This is the highest-value GEO asset but should launch only when it can be trustworthy.

- Publish only aggregated, de-identified data.
- Define every metric precisely: visitor, signup, verified signup, share, referral visit, verified referral, and K-factor.
- Exclude bot/velocity-filtered activity and internal/test campaigns.
- Show date range, sample size, inclusion/exclusion criteria, median, quartiles, and segment definitions.
- Suppress segments below a privacy/reliability threshold set with legal and statistical review. Do not invent a threshold merely for marketing.
- Separate correlation from causation. For example, campaigns with referrals enabled may differ from campaigns without referrals for many reasons.
- Give each benchmark one canonical research page and a downloadable CSV of only safe aggregate values.
- Update the visible “last materially updated” date only when data or methodology changes.

## 90-day execution roadmap

### Days 1–14: foundation and quick validation

- Restore Search Console access and export the last 12–16 months of non-brand queries/pages.
- Create `/tools`, shared page components, structured data, tool registry, sitemap integration, Markdown rendering, and PostHog events.
- Build the versioned blueprint handoff and preserve it through OAuth.
- Ship the Template Finder as the low-risk end-to-end test.
- Run 8–12 founder interviews or usability sessions focused on pre-launch planning, referral math, and page review.

### Days 15–35: first acquisition cluster

- Ship the Viral Waitlist Growth Calculator.
- Ship the Waitlist Landing Page Copy Builder.
- Ship the Product Launch Readiness Planner.
- Add contextual placements to existing articles and templates.
- Verify indexability, sitemap discovery, IndexNow submission, analytics, and the anonymous → auth → prefilled campaign flow.

### Days 36–55: flagship diagnostic

- Ship the Landing Page Grader with a public rubric and secure fetch pipeline.
- Add “Build the corrected version” blueprint application.
- Publish one transparent before/after example without fabricated lift claims.
- Add in-product recheck after publish.

### Days 56–75: high-intent expansion

- Ship Referral Reward Tier & ROI Designer, Waitlist Queue & Leaderboard Points Simulator, Beta Intake & Lead Qualification Form Designer, and Waitlist Email Sequence Builder.
- Ship Launch Channel & UTM Link Builder and Waitlist Embed & Widget Configurator.
- Expose safe deterministic tools through MCP.
- Start outreach based on actual tool use and examples, not a generic launch announcement.

### Days 76–90: diagnostics, hygiene, and benchmark moat

- Review the full activation funnel by tool and improve the weakest handoff before scaling further.
- Ship Waitlist Health & Fraud Risk Auditor and Waitlist Email Deliverability & DNS Checker.
- Refresh titles, examples, and internal links from real queries.
- Establish the benchmark dataset and methodology; publish the Waitlist Benchmark Explorer when sample quality passes the stated policy.

## Release gates for every tool

A tool is not ready merely because its form works. It ships only when:

- It provides meaningful value without login.
- It has one clear product-adjacent job and a transparent method.
- The base page is server-rendered, canonical, in the sitemap, and present in Markdown/LLM discovery surfaces.
- The result can be copied/exported without signup.
- Its primary CTA preserves the result and returns from auth to a prefilled campaign.
- Analytics capture the funnel without raw user input or PII.
- Accessibility, mobile UX, rate limiting, errors, and empty states are complete.
- Claims and benchmarks are sourced, dated, and qualified.
- `oxlint`, `oxfmt --check`, production `pnpm build`, and live dev-server checks pass, matching the repository's `AGENTS.md` conventions.

## Immediate next decision

Approve the focused Launch Lab strategy and build the shared `/tools` + blueprint infrastructure first. Then ship the Template Finder as a thin end-to-end proof and the Viral Waitlist Growth Calculator as the first indexable acquisition tool. Start the Landing Page Grader in parallel at the design/security level because it is the flagship but has the highest implementation risk.

Do not begin all 14 tools at once. The first milestone is not “four pages published”; it is **one organic visitor completing a tool, signing up, receiving a correctly prefilled campaign, publishing it, and collecting a verified signup with attribution intact**.

## Methodology and sources

Research covered:

- Waitlyze's current routes, templates, free-plan entitlements, analytics events, attribution, auth callback, sitemap, crawler policy, AI discovery files, docs, comparison data, and 20 existing articles.
- Google autocomplete samples for 10 relevant seed queries on November 19, 2026.
- Public sitemaps and free-tool patterns across the pre-launch, referral, and SaaS marketing landscape.
- Official Google guidance for generative AI search, people-first content, and structured data.
- Official OpenAI crawler documentation and IndexNow documentation.

Primary sources:

1. [Google: optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
2. [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
3. [Google: structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
4. [Google: FAQ structured data eligibility](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
5. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)
6. [IndexNow documentation](https://www.indexnow.org/documentation)

**Research limitation:** Current Waitlyze Search Console performance data was not available because the configured OAuth client-secrets file path does not exist. Market analysis examined public tool libraries and structures across the category to identify gaps without relying on third-party performance claims.
