# Waitlyze Master SEO, AEO, GEO, Marketing & GTM Agent Playbook

> **Canonical Entry Point for AI Agents**
> Last updated: 2026-11-22 | Maintained on `main`
> Give this file to any future AI agent before asking it to work on Waitlyze growth, SEO, AEO, GEO, content, pricing promos, directories, or GTM outreach. It consolidates every decision, tool, MCP server, brand rule, audit finding, merged change, and open backlog item from the November 22, 2026 growth sprint so nothing has to be repeated.

---

## 1. Companion Files in This Repo (Read Before Acting)

| File                                                                                                                                | Purpose                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`seo/kb/brand-ssot.md`](/Users/falakgala/projects/waitlyze/seo/kb/brand-ssot.md)                                                   | Canonical product mechanics, exact pricing, and explicit non-capabilities                 |
| [`seo/kb/pages-index.md`](/Users/falakgala/projects/waitlyze/seo/kb/pages-index.md)                                                 | Primary keyword-to-URL mapping for core pages                                             |
| [`seo/kb/competitors/claims-to-beat.md`](/Users/falakgala/projects/waitlyze/seo/kb/competitors/claims-to-beat.md)                   | Competitive positioning angles (`GetWaitlist`, `LaunchList`, `Waitlister`)                |
| [`seo/ai-prompts.md`](/Users/falakgala/projects/waitlyze/seo/ai-prompts.md)                                                         | 22-prompt monthly AI visibility benchmark across 5 engines                                |
| [`seo/internal-links-report.md`](/Users/falakgala/projects/waitlyze/seo/internal-links-report.md)                                   | Blog-to-money-page contextual link coverage report                                        |
| [`seo/roast-roadmap.md`](/Users/falakgala/projects/waitlyze/seo/roast-roadmap.md)                                                   | Prioritized Fatal / Revenue / Compounding SEO fixes                                       |
| [`seo/reddit-serp-queue.md`](/Users/falakgala/projects/waitlyze/seo/reddit-serp-queue.md)                                           | Pre-drafted compliant Reddit replies for ranking threads                                  |
| [`seo/outreach-batch-2026-11-22.md`](/Users/falakgala/projects/waitlyze/seo/outreach-batch-2026-11-22.md)                           | Evaluated backlink outreach targets (`4 SEND` / `1 CUT`) + email drafts                   |
| [`notes/seowins-zero-to-first-users-playbook.md`](/Users/falakgala/projects/waitlyze/notes/seowins-zero-to-first-users-playbook.md) | 30-day zero-to-first-users activation plan + 40-tactic filter + Launch Lab release gate   |
| [`notes/gtm-launch-directory-seo-playbook.md`](/Users/falakgala/projects/waitlyze/notes/gtm-launch-directory-seo-playbook.md)       | 5-wave directory, MCP registry, Product Hunt, HN, and programmatic SEO plan (Epic `#255`) |
| [`notes/free-tools-seo-aeo-geo-growth-plan.md`](/Users/falakgala/projects/waitlyze/notes/free-tools-seo-aeo-geo-growth-plan.md)     | Waitlyze Launch Lab strategy (`PR #253`, `/tools/*`, Blueprint OAuth handoff)             |
| [`submission-manifest.json`](/Users/falakgala/projects/waitlyze/submission-manifest.json)                                           | Canonical directory submission copy, tags, assets, and MCP metadata                       |
| [`submissions-log.json`](/Users/falakgala/projects/waitlyze/submissions-log.json)                                                   | Tracker of 18 BFCM 2026 directory & GitHub PR submissions                                 |
| [`SKILL.md`](/Users/falakgala/projects/waitlyze/SKILL.md) & [`server.json`](/Users/falakgala/projects/waitlyze/server.json)         | Waitlyze's installable agent skill and Official MCP Registry descriptor                   |

---

## 2. Brand Single Source of Truth (SSOT) & Non-Negotiable Rules

### Identity & Canonical URLs

- **Product:** Waitlyze (`https://waitlyze.com`), open-source waitlist and pre-launch audience platform.
- **Repository:** `https://github.com/FALAK097/waitlyze`
- **Support / Submissions Email:** `support@waitlyze.com` (legal pages: `/privacy`, `/terms`, `/support`, `/refund-policy`)
- **Founder:** Falak Gala (`https://falakgala.dev`, X: `https://x.com/FalakGala097`)

### Pricing SSOT (Verified from [`src/lib/billing/pricing.mjs`](/Users/falakgala/projects/waitlyze/src/lib/billing/pricing.mjs))

> **Rule:** Never cite `$19/month` or `$180/year` anywhere (stale old pricing). Always verify against `src/lib/billing/pricing.mjs`.

- **Free Plan (`$0`):** 1 workspace, 1 waitlist, 1 member, **100 cumulative signups per Free workspace** (does **not** reset monthly and does **not** reset if a waitlist is deleted). Includes hosted waitlist pages (`/w/[slug]`), 14 templates, embeddable widget (`/js/embed.js`), double opt-in verified referrals, and REST API access.
- **Pro Plan (`$15/month` or `$119/year`, `~$9.92/mo` equivalent, flat per workspace):** Unlimited workspaces, waitlists, signups, and workspace members, plus custom domains (1 per waitlist), branding removal, email broadcasts, automated welcome/reminder/milestone sequences, and advanced analytics.
- **Regional PPP:** Enabled via Dodo Payments (`getRegionalPricing` in [`src/lib/billing/regional-pricing.mjs`](/Users/falakgala/projects/waitlyze/src/lib/billing/regional-pricing.mjs)).
- **BFCM 2026 Promo (`BFCM2026`):**
  - **40% off Pro Annual first year only:** `~~$119~~ -> $71.40/year` (`$5.95/mo` equiv; 60% off `$180` monthly-annualized). Renews at `$119/yr`.
  - **Active window:** `2026-11-22T00:00:00.000Z` through `2026-12-03T23:59:59.999Z` (`isBfcmPromoActive()`).
  - **Why Annual Only:** Monthly (`$15/mo`) is intentionally NOT discounted because waitlists are campaign-driven; a `$9` monthly promo would invite 1-month launch churn.
  - **Checkout behavior:** `createProCheckout` in [`src/app/actions/billing.js`](/Users/falakgala/projects/waitlyze/src/app/actions/billing.js) auto-applies `discount_codes: ["BFCM2026"]` on annual checkouts while active. Note `reserveCheckoutIntent` caches active `checkoutUrl`s for 24h, so the UI also displays the copyable `BFCM2026` code.

### Product Boundaries (Never Overclaim)

- **What Waitlyze ships:** Visual page builder + 14 templates, custom domains (Pro), 2-line embed widget (`/js/embed.js`), double opt-in confirmation (24h token expiry; only confirmed signups earn referral credit and marketing sends), IP-velocity limits, self-referral/duplicate blocking, optional Cloudflare Turnstile, manual referral review queue, BYO verified Resend sender, REST API (`/api/waitlist`, `/api/waitlist/points`), OpenAPI 3.1.0 (`/openapi.json`), signed webhooks (`referral.completed`, milestones), CSV export, and Streamable HTTP MCP server (`/mcp`).
- **What Waitlyze does NOT do:**
  - Does **not** ship physical rewards, issue gift cards, or automatically fulfill referral rewards.
  - Does **not** provide a built-in shared broadcast sender without connecting the user's own verified Resend domain/sender.
  - Open-source repo does **not** imply free managed self-hosting support.

### Engineering, UI, & PR Rules Learned From Today's Threads

1. **Preserve Landing Anchor Navigation:** Keep the homepage header/footer section anchors (`/#features`, `/#pricing`, etc.) intact on the landing page while maintaining dedicated indexable routes (`/features`, `/pricing`, `/about`, `/compare`, `/alternatives`, `/templates`) for search engines and sitelinks.
2. **Light-Only Editorial Brand System:** White surfaces (`bg-product-bg-surface`), near-black ink (`#00160d`), fine neutral dividers, tabular numerals, and electric lime (`#c6fe1e`) reserved strictly for primary CTAs and active accents. Never introduce dark-mode drift or dashboard clutter on public pages.
3. **Zero Screenshot Files in PR Diffs:** When capturing verification screenshots for UI PRs, upload them via `gh_attach` or an orphan attachment branch (e.g., `attach/...`) and link them in the PR description. **Never commit `.png` files onto the feature branch.**
4. **No Stranded Working Notes in Feature PRs:** Keep working audit logs/backlogs out of feature code PRs unless explicitly asked (`seo/` and `notes/` belong in dedicated docs commits/PRs).
5. **Prose & Code Gates (`AGENTS.md` + CI):**
   - Do **not** write unit test files (`*.test.*`).
   - Run `pnpm check` (`oxlint` + `oxfmt --check`), `pnpm build` (with CI fixture env vars if needed), and live server HTTP checks after edits.
   - Any PR touching `content/**/*.mdx`, `.vale.ini`, `styles/**`, or `README.md` triggers `.github/workflows/prose.yml` (`Lint Prose` via Vale + reviewdog). Always run `vale --minAlertLevel=error content/` (or `pnpm lint:prose`) before pushing MDX edits! Watch for `Google.WordListCase` (`email` not `Email` in headings/titles if flagged), `Google.We`, `Google.FirstPerson`, `Google.Contractions`, `Google.Parens`, and banned AI-slop words like `"unlock"` (`seo lint`). Add legitimate product terms to `styles/config/vocabularies/Waitlyze/accept.txt`.
   - Pushing to `main` automatically deploys to Cloudflare Workers and triggers `.github/workflows/seo-indexnow.yml` (`scripts/indexnow.mjs` after a 6-minute wait). **Do not run manual `wrangler deploy` after pushing to `main` unless explicitly asked.**

---

## 3. Configured Tools, CLI, MCP Servers & Global Skills

### Search Console & Multi-Engine Indexing

| Surface                                          | Tool / Config                                                                                                                                                                                                                                                        | Key Commands / Notes                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Search Console**                        | `gscServer` MCP (`uvx mcp-search-console` in `~/.mcp.json`, OAuth `galafalak09@gmail.com`) + `seo` CLI (`v0.25.0`, `/opt/homebrew/bin/seo`)                                                                                                                          | Property: **`sc-domain:waitlyze.com`** (`siteOwner`). Business context saved in `~/.config/seo/context.json` (updated `$15/mo or $119/yr`). **Google does NOT support IndexNow**; use GSC URL Inspection **Request Indexing** manually when launching major new URLs. |
| **Bing / ChatGPT Search / Copilot / DuckDuckGo** | `bing-webmaster` MCP (`~/.local/bin/mcp-server-bing-webmaster`, `mcp>=1.10.0,<2`, env `BING_WEBMASTER_API_KEY`) configured in `.mcp.json`, `~/.config/opencode/opencode.json`, `~/.codex/config.toml`, Antigravity `mcp_config.json` + automated `IndexNow` workflow | **60 MCP tools** (`submit_sitemap`, `submit_url_batch`, `get_feeds`, `get_query_stats`, `get_page_stats`, `get_crawl_stats`, `get_url_info`, etc.). Bing Webmaster AI Performance report tracks Copilot/partner citations & grounding queries.                        |
| **Brave Search (Claude's web backend)**          | Manual submission (`https://search.brave.com/submit-url`)                                                                                                                                                                                                            | No public API; SvelteKit UI. Submit priority URLs manually or via browser so Claude's web search discovers `waitlyze.com`.                                                                                                                                            |
| **Local Audits & Link Graph**                    | `seo` CLI (`seo report`, `seo data`, `seo index --max-urls 150`, `seo crawl --url https://waitlyze.com`, `seo internal-links`, `seo lint`, `seo next`), `npx -y is-agentic waitlyze.com`, `node scripts/internal-link-graph.mjs`                                     | Note: `is-agentic` CLI caches recent scans unless a new scan is triggered. `seo crawl` verifies `Vary: Accept`, HSTS, Markdown alternates, `og:image`, and broken links.                                                                                              |
| **Other Free MCPs Configured**                   | `awesome-tools` (`https://awesome.tools/mcp`), `scribiz` (`https://scribiz.com/mcp`) in `~/.codex/config.toml`                                                                                                                                                       | `awesome-tools` free listing requires `DR >= 20`, `30+` RDs, `200+` monthly visits + reciprocal link (defer until Wave 1–2 DR lifts). `scribiz` provides free YouTube/video transcripts & chapters.                                                                   |

### Installed Global Agent Skills

- **Ian Nuttall (`seoskill.dev`):** `seo`, `writing-how-id-grow-posts` (installed in `~/.agents/skills/`, `~/.codex/skills/`, `~/.gemini/config/skills/`).
- **Ilias Ism (`Illyism/seo-skills`, 30 skills):** `seo-autopilot`, `internal-linking`, `directory-submissions`, `proof-kb`, `unslop-seo`, `blog-refresher`, `seo-title-optimization`, `vs-and-alternatives`, `customer-journey`, `seo-roast`, `ai-seo-report`, `diff-marketing`, `awesome-tools`, `youtube-seo`, `scribiz`, `honest-link-outreach`, `reddit-serp`, etc. (plus `seo-audit`, `ai-seo`, `cro`, `copywriting`, `pricing`, `launch`, `onboarding`, `signup`, `ab-testing`).
- **Paid Upsells to Skip Unless Authorized:** `linkdr` (paid backlink marketplace) and `aiseotracker` (requires paid bearer token; run `seo/ai-prompts.md` manually instead).

---

## 4. Current Production State on `main` & Baseline Metrics (2026-11-22)

### Technical SEO, AEO & GEO Infrastructure Live on `main`

- **Canonical Transport & Security (`cloudflare-worker.js`):**
  - `301`/`308` permanent redirects from `http://` -> `https://` and from `www.waitlyze.com` / `*.workers.dev` -> `https://waitlyze.com`.
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` on HTTPS responses.
  - `Vary: Accept` appended on HTML and Markdown responses (`cloudflare-worker.js`, `src/lib/edge-public-page-cache.mjs`, `src/app/api/md/route.js`) so edge caches never mix `text/html` and `text/markdown`.
  - **Note on WAF:** `Googlebot`, `bingbot`, `DuckDuckBot`, `Bravebot`, `OAI-SearchBot`, `Claude-SearchBot`, and `PerplexityBot` all get `HTTP 200`; generic `Python-urllib/3.11` gets Cloudflare `403` on `/sitemap.xml`.
- **Indexable Public Pages:**
  - Core commercial pages: `/`, `/features`, `/pricing`, `/about`, `/compare`, `/alternatives`, 6 `/alternatives/[slug]` pages (`getwaitlist`, `launchlist`, `waitlister`, `viral-loops`, `kickofflabs`, `prefinery`), `/templates`, 14 `/templates/[id]` pages.
  - Blog: **21 MDX posts** in `content/blog/`, consolidated from 23 fragmented tags into **8 indexable topic hubs** (`Waitlist basics`, `Growth`, `Launch`, `Email`, `Referrals`, `Conversion`, `SEO & AEO`, `Analytics`, each with `>= 3` posts) + **15 permanent redirects** in `next.config.mjs` for retired tag slugs.
  - Docs & Legal: `/docs/*`, `/docs/changelog` (with `WebPage` + `BreadcrumbList` JSON-LD), `/privacy`, `/terms`, `/support`, `/refund-policy`.
- **AI / Agent Discovery:**
  - `/robots.txt` (`src/app/robots.js`): allows 15 search/AI answer bots + `GPTBot`/`ClaudeBot`, blocks 16 pure training/freeloading scrapers, disallows private routes (`/api/`, `/dashboard`, `/waitlists`, `/settings`, `/forms/`, etc.).
  - `/sitemap.xml` (`src/app/sitemap.js`): clean canonical URLs (`87` URLs verified in Bing `get_feeds`).
  - `/llms.txt`, `/llms-full.txt`, `/ai.txt`, `/agent-instructions.md`, `/llms.mdx/docs/[[...slug]]`: **All emit `X-Robots-Tag: noindex`** so GSC stops reporting machine endpoints as indexing clutter, while `/llms.txt` lists `/pricing`, `/features`, `/about`, `/compare`, `/alternatives/*`, `/templates/*`, `/openapi.json`, and `/mcp`.
  - `/openapi.json`: OpenAPI 3.1.0 spec for `POST /api/waitlist`, `GET /api/waitlist`, `POST /api/waitlist/points`.
  - Footer links in `public-shell.jsx` expose `/llms.txt` and `/openapi.json`.
  - `SoftwareApplication` JSON-LD (`src/components/seo/structured-data.jsx`) includes `isAccessibleForFree: true`, `keywords`, `featureList` (Turnstile, analytics, custom domains, MCP server, open-source, Slack/Discord); `WebSite` JSON-LD includes `alternateName: ["waitlyze.com", "Waitlyze App"]`.
- **PostHog Attribution (`src/lib/posthog/events.mjs`, `provider.jsx`):**
  - Cookieless memory mode on public pages; tracks `marketing:page_viewed` (including `/compare`, `/alternatives`, `/pricing`), `marketing:pricing_viewed`, `marketing:signup_started` with `page_path`, `cta_placement`, and `cta_label`.

### Baseline Metrics Captured Today (2026-11-22)

- **Google Search Console (`sc-domain:waitlyze.com`):**
  - Early domain stage (~95–183 impressions, 1 click). Why 197 URLs showed "Not indexed" earlier: ~90 old `http://`/`www.` duplicates (now 308 redirected), ~80 machine/Markdown routes (now `X-Robots-Tag: noindex`), 18 thin tag archives (now consolidated + redirected), and 3 brand-new pages (`/features`, `/pricing`, `/about`).
  - Striking-distance queries to monitor/push: `"waitlist email template"` (pos ~21.1–21.8), `"waitlist landing page examples"` (pos ~20.8–23), `"join the waitlist landing page"` (pos ~11–18), `"milestone referral program"` (pos ~24–31), `"waitlist management fitness"` (pos 47), `"waitlist software"` (pos 77.6).
  - Brand search `"waitlyze"`: `peerlist.io` currently outranks `waitlyze.com` on Google due to domain age (1 week indexed) and low external RDs (`DR 1.3`).
- **Bing Webmaster Tools:** `https://waitlyze.com/sitemap.xml` submitted (`Status: Success`, `87` URLs) + `87` sitemap URLs + `9` priority URLs submitted via `submit_url_batch`. Stats empty while initial crawl populates.
- **Live `seo crawl`:** `95` pages, `0` High, `3` Medium, `16` Low, `0` failed fetches (`83/91` HTML pages link to Markdown copies; remaining 8 are `/blog/tag/*`).
- **Live 4-Model AI Visibility Audit (Incognito / Temp Chat):**
  - Unbranded `"best waitlist software for startup founders"` & `"under $20/mo"`: **0/4** (ChatGPT, Claude, Gemini, Perplexity all shortlisted Waitlister, LaunchList, GetWaitlist, Prefinery, KickoffLabs from third-party listicles like `dev.to`, `guideflow.com`, `capterra.com`, `softwareadvice.com`).
  - Branded `"What is Waitlyze?"`: ChatGPT and Perplexity accurate (`$0` Free / `$15/mo` / `$119/yr`); **Claude missed `waitlyze.com` completely** and returned Product Hunt's `Waitlyzt` (Brave Search indexation gap).
  - **Published today to close Dev.to/Brave gap:** [`dev.to/falakgala/best-waitlist-software-getwaitlist-alternatives-for-startup-founders-2026-1jmk`](https://dev.to/falakgala/best-waitlist-software-getwaitlist-alternatives-for-startup-founders-2026-1jmk) (canonical -> `https://waitlyze.com/blog/best-waitlist-software-for-startup-founders`).

---

## 5. Core Strategic Learnings Synthesized From Today's Research

1. **North Star Metric (`seowins.io` + `spreadjam`):** Do **not** optimize for publishing volume or raw traffic. The #1 goal right now is **one real founder creating an account, publishing a real waitlist, and collecting a verified non-test signup** (`qualified visit → signup started → account created → waitlist created → waitlist published → first verified subscriber → checkout → paid`).
2. **Buyer-Intent First, Not Content Calendars:** Replace arbitrary weekly posting with a scored buyer-question backlog (`buying intent 35% + ICP fit 25% + unique evidence 20% + Google/AI gap 15% + effort 5%`). Organize into 5 clusters: (a) Choose the right solution, (b) Build & integrate, (c) Grow via verified referrals, (d) Nurture & launch, (e) Measure quality & ROI.
3. **TypingMind Teardown Playbook:**
   - Title & open comparison/template pages with the **searcher's exact query** (`"<Competitor> Alternative & Pricing"`, `"Free <Category> Waitlist Template"`), not internal brand phrasing.
   - Always expose pricing, comparison, and template URLs in `llms.txt` and `llms-full.txt`.
   - Build product-adjacent free tools that complete the job **ungated** and hand off state into a prefilled campaign draft.
   - Only publish original benchmark data once cohort size is defensible (`N >= 30` campaigns).
4. **GEO & Semantic SEO Rules (KDD 2024 + 2026 Audit Principles):**
   - Put all main text, headings, tables, and links in **server-rendered HTML** (many AI crawlers do not execute JS).
   - Lead every section with a standalone **1–2 sentence direct answer** with concrete numbers/prices before elaborating.
   - Back claims with quotes (+43% AI visibility), statistics (+33%), clear fluency (+29%), and cited sources (+28%, and +115% for #5-ranked underdog pages).
   - Fix **cannibalization** before creating new URLs (`waitlist-email-templates` vs `waitlist-email-sequence`; `waitlist-landing-page-examples` vs `waitlist-landing-page-checklist`).
   - Keep money pages within 2–3 clicks of `/` and `>= 4` contextual body links from blog posts.
   - Never bump `dateModified` / `"2026"` without real factual updates.
5. **AI Visibility Testing Protocol (`seo/ai-prompts.md`):**
   - Always test in **Temporary Chat / Incognito**, web search ON, **without mentioning Waitlyze** in unbranded prompts (`#1–15`). Run twice across ChatGPT, Claude, Gemini, Perplexity monthly and after major site/pricing changes.
6. **Consensus Is Now the Main Bottleneck:** On-site HTML, JSON-LD, `llms.txt`, and `robots.txt` are already strong. Winning unbranded AI shortlists and beating `peerlist.io` on `"waitlyze"` now requires **external referring domains & third-party listicles** (MCP registries, AlternativeTo, OpenAlternative, SaaSHub, G2, Capterra, Peerlist, Product Hunt, Dev.to, founder outreach, and compliant Reddit replies).

---

## 6. Complete Status Audit: What Is Merged to `main` vs. Open / Remaining

### A. Merged & Live on `main` (Verified 2026-11-22)

| PR / Commit                           | Branch / Scope                                       | What Shipped                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `7511c58`                             | Direct commit to `main`                              | Added `notes/gtm-launch-directory-seo-playbook.md` & `notes/free-tools-seo-aeo-geo-growth-plan.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **PR `#277`** (`1d28bbf`)             | `fix/waitlyze-brand-search-sitelinks`                | Added `/features`, `/about`, HTTP->HTTPS worker redirect, sitelink/entity metadata, preserved landing section anchors; filed Issue `#254`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **PR `#278`** (`90f3390`)             | `t3/buyer-focused-content-strategy`                  | Added `/pricing`, `308` apex/HTTPS redirects, `.md` routes for `/pricing`, `/compare`, `/alternatives/*`, `Offer` JSON-LD, PostHog CTA attribution (`page_path`, `cta_placement`, `cta_label`), clarified 100-signup Free limit per workspace                                                                                                                                                                                                                                                                                                             |
| **PR `#279`** (`1308add`)             | `feat/bfcm-2026-sale`                                | Implemented `BFCM2026` 40% off Pro Annual (`$71.40/yr`), public `PromoBanner`, Pricing card BFCM badge + PPP messaging, in-app Free-owner banner, auto-apply `discount_codes: ["BFCM2026"]` in `createProCheckout`                                                                                                                                                                                                                                                                                                                                        |
| **PR `#281`** (`92b982d`)             | `feat/seo-autopilot-internal-linking-mcp-registries` | Added `server.json`, root `SKILL.md`, `<ProductCallout>` MDX component, blog product callouts, `scripts/internal-link-graph.mjs`, expanded `llms.txt` & `llms-full.txt`                                                                                                                                                                                                                                                                                                                                                                                   |
| **PR `#280`** (`b6fde76`)             | `feat/seoskill-teardown-seo-fixes`                   | Retitled `/alternatives/[slug]` to `<Competitor> Alternative & Pricing`, thickened `/templates/[id]` pages, updated `/compare` + `llms.txt`                                                                                                                                                                                                                                                                                                                                                                                                               |
| **PR `#282`** (`fce95f8`) + `40365b4` | `fix/gsc-indexing-and-search-performance`            | Added `X-Robots-Tag: noindex` on machine routes, consolidated 23->8 blog tags + 15 redirects in `next.config.mjs`, fixed email/examples cannibalization, added `"Waitlyze"` above-the-fold + `WebSite.alternateName` + enriched `SoftwareApplication` JSON-LD, published `/blog/best-waitlist-software-for-startup-founders`, added `/openapi.json`, `Vary: Accept`, HSTS, 11-post internal linking pass, `seo/` KB files, `submission-manifest.json`, `submissions-log.json`, `notes/seowins-zero-to-first-users-playbook.md`, Vale fixes + `accept.txt` |
| `ca2a244`                             | Direct commit to `main`                              | Added `seo/reddit-serp-queue.md` and `seo/outreach-batch-2026-11-22.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### B. NOT Merged to `main` Yet / Unfinished Items

1. **`PR #253` (`feat/waitlyze-launch-lab-tools`): OPEN, NOT MERGED**
   - **What it is:** 14 free Launch Lab tools (`/tools`, `/tools/[slug]`, `/research/waitlist-benchmarks`), `ToolBlueprint` DB model (`0002_tool_blueprints.sql` + `0003_tool_blueprint_creation_key.sql`), Google OAuth blueprint handoff, blog/template embeds, 5 read-only MCP tools, and in-product tool drawers (`#201`, `#235–#252`).
   - **Current state:** `mergeable` on GitHub (`8/8` checks passing at `a2a7b2a`), **4 commits behind `main`** (due to PR `#282` / `40365b4` / `ca2a244`), and has **2 unresolved Greptile review threads**:
     1. **P1 (`src/lib/tools/engines/email-sequence.mjs:172`):** Milestone preset subject can exceed the blueprint's 160-character subject limit (`referralIncentive` is 140 chars + prefix, merge tag, and suffix). Clamp/fit generated subjects and apply matching limits to edited bodies.
     2. **P2 (`src/components/tools/widgets/health-auditor-widget.jsx:325`):** When every CSV row is flagged (`activeAudit.cleanRows.length === 0`), both download buttons are hidden instead of keeping the full tagged report downloadable.
   - **D1 Migration Requirement:** Before or upon merging `PR #253`, run `pnpm run migrate:deploy` so `migrations/0002_tool_blueprints.sql` and `migrations/0003_tool_blueprint_creation_key.sql` exist in production Cloudflare D1.
   - **Strategic Release Gate (`notes/seowins-zero-to-first-users-playbook.md`):** Before loudly promoting all 14 tools, validate the Template Finder + Viral Waitlist Growth Calculator OAuth->Draft->Publish loop with real founders first (and verify `/research/waitlist-benchmarks` does not present modeled numbers as real customer data until `N >= 30` real campaigns exist).

2. **`PR #282` Minor Follow-Up (1 Unresolved CodeRabbit Thread on `main`)**
   - `next.config.mjs:114`: The 15 retired tag redirects cover HTML paths (`/blog/tag/launch-strategy` -> `/blog/tag/launch`) but not their `.md` equivalents (`/blog/tag/launch-strategy.md` -> `/blog/tag/launch.md`). Add the `.md` redirect rules or explicit documented handling in `next.config.mjs` / `md-registry.js`.

3. **Unshipped Agent/MCP Discovery Manifests (Planned in failed thread, never committed to `main`)**
   - `server.json` and root `SKILL.md` **are** on `main`.
   - Still **not** in repo: `glama.json`, `.cursor-plugin/plugin.json`, `.claude-plugin/plugin.json`, `gemini-extension.json`. Add these in a small PR when ready for Wave 1 MCP/plugin directory submissions.

4. **Open GitHub Issues Backlog**
   - **`#254`:** Establish Waitlyze brand entity & earn organized branded sitelinks (tracking ongoing Google recrawl & branded authority).
   - **`#255` + `#256–#276` (22 open issues):** Master GTM Launch Epic:
     - **Wave 1 (`#256–#260`):** Docker MCP Catalog, Official MCP Registry, Claude Plugin/MCP Directory, Smithery/Glama/PulseMCP/Cursor Directory, GitHub repo README/topics optimization.
     - **Wave 2 (`#261–#266`):** SourceForge, Capterra/GetApp, G2 (+5 verified reviews), AlternativeTo & SaaSHub, Zumvu/Findly.tools/ToolPilot/Dang.ai, TinyShelf (`tinyshelf.co`).
     - **Wave 3 (`#267–#271`):** DevHunt, Peerlist Launchpad, Uneed, PeerPush, Fazier/Startup Fame/Turbo0/BetaList.
     - **Wave 4 (`#272–#274`):** Product Hunt warmup + launch day + Show HN / Reddit technical launch.
     - **Wave 5 (`#275–#276`):** Interactive `/directories` & launch checklists hub + platform integration landing pages (Framer, Webflow, Next.js, Carrd, WordPress).
   - **`#235–#252` (18 open issues):** Launch Lab epic & tools (closed by `PR #253` once merged).

5. **BFCM 2026 External Directory Status (`submissions-log.json`, 18 Submissions)**
   - **Merged (2):** `dqhieu/black-friday-deals#311`, `twf-nikhila/Awesome-Black-Friday-Cyber-Monday-deals#825`.
   - **Closed / Not Accepted (1):** `trungdq88/Awesome-Black-Friday-Cyber-Monday#3037` (closed by `tonyminibot`: _"waitlyze.com went up this month, so the $119 price is too new to compare a sale against"_; revisit next year).
   - **Open GitHub PRs (5):** `carmentune/best-black-friday-saas-deals#70`, `Shashankt255/black-friday-deals-2026#86`, `Pimjo/black-friday-deals#306`, `danmindru/rare-big-deal#1177`, `onmyway133/blackfriday#276`.
   - **Pending Web Forms (10):** SaaS Friday, Superframeworks, DealHunt, SaaSPirate, Draftss, BFCM Sales 2026, Tulvo (`BF26-0096`), Voibe, DidYouSEO, Black Friday 2026 SaaS Deals.
   - **Intentionally Skipped (Auth/CAPTCHA/Email):** `blackfriday.tools/submit`, `blackfridaydeals.dev/submit-resource`, `saas.blackfriday` (`info@saas.blackfriday`).

6. **Manual / Off-Site Actions Pending**
   - **Brave Search:** Submit `https://waitlyze.com/sitemap.xml` and priority URLs at `https://search.brave.com/submit-url` (unblocks Claude Search).
   - **Reddit & Outreach Execution:** Post approved replies from [`seo/reddit-serp-queue.md`](/Users/falakgala/projects/waitlyze/seo/reddit-serp-queue.md) (verify thread isn't archived, max 2/day, no bare links, disclose affiliation) and send outreach emails from [`seo/outreach-batch-2026-11-22.md`](/Users/falakgala/projects/waitlyze/seo/outreach-batch-2026-11-22.md) after verifying author contact emails.
   - **Founder Concierge Cohort:** Recruit 20 upcoming founders for free 20-min setup calls to hit the first real self-serve + verified-signup activation loop (`notes/seowins-zero-to-first-users-playbook.md`).
   - **Cloudflare Bot Rule Check (Optional):** Verify whether `Python-urllib` `403` on `/sitemap.xml` should stay or be relaxed.
   - **2–4 Week Re-Audit:** Re-run `seo report` / `seo crawl`, Bing Webmaster MCP stats (`get_query_stats`, `get_page_stats`, `get_crawl_stats`), `npx -y is-agentic waitlyze.com`, and the 22-prompt audit in [`seo/ai-prompts.md`](/Users/falakgala/projects/waitlyze/seo/ai-prompts.md).

---

## 7. Standard Operating Procedures (SOPs) for Future AI Agents

### SOP 1: Weekly SEO + Bing + AI Visibility Health Check

1. Pull GSC (`sc-domain:waitlyze.com`) via `gscServer` MCP or `seo report` / `seo data`: separate **brand vs. non-brand clicks**, inspect pages in **positions 8–20**, check `Not indexed` categories, and inspect `/`, `/features`, `/pricing`, `/about`, `/tools` (once merged).
2. Pull Bing Webmaster via `bing-webmaster` MCP: `get_feeds`, `get_crawl_stats`, `get_query_stats`, `get_page_stats`. Submit any new URLs via `submit_url_batch`.
3. Run `seo crawl --url https://waitlyze.com` and `node scripts/internal-link-graph.mjs` to ensure zero orphan money pages and zero broken Markdown alternates.
4. Update [`seo/ai-prompts.md`](/Users/falakgala/projects/waitlyze/seo/ai-prompts.md) monthly using incognito/temp-chat runs across ChatGPT, Claude, Gemini, Perplexity.

### SOP 2: Writing or Refreshing Any Blog Post or Money Page

1. Read [`seo/kb/brand-ssot.md`](/Users/falakgala/projects/waitlyze/seo/kb/brand-ssot.md) and [`src/lib/billing/pricing.mjs`](/Users/falakgala/projects/waitlyze/src/lib/billing/pricing.mjs) first for zero pricing/limit hallucinations.
2. Assign **one** distinct search intent per URL; verify no cannibalization against [`content/blog/`](/Users/falakgala/projects/waitlyze/content/blog) and [`seo/kb/pages-index.md`](/Users/falakgala/projects/waitlyze/seo/kb/pages-index.md).
3. Use only the **8 consolidated blog tags** (`Waitlist basics`, `Growth`, `Launch`, `Email`, `Referrals`, `Conversion`, `SEO & AEO`, `Analytics`) so no thin `noindex` tag pages are created.
4. Lead every H2 with a direct 1–2 sentence answer + concrete numbers; add contextual links in the upper 40% of the body + `<ProductCallout>` to relevant money pages (`/pricing`, `/features`, `/compare`, `/alternatives/*`, `/templates/*`).
5. Ensure new pages expose `alternates.types["text/markdown"]`, `og:image: ["/opengraph-image"]`, JSON-LD, `sitemap.js` entry, and `llms.txt` / `md-registry.js` registration.
6. Run `pnpm check`, `vale --minAlertLevel=error content/`, `pnpm build`, and `node scripts/internal-link-graph.mjs` before opening a PR.

### SOP 3: Preparing PR #253 (Launch Lab) for Merge

1. Merge latest `origin/main` into `feat/waitlyze-launch-lab-tools` (resolving any conflicts in `llms.txt`, `llms-full.txt`, `sitemap.js`, `md-registry.js`, `auth-modal*`, `edge-public-page-cache.mjs`).
2. Fix Greptile P1 (`src/lib/tools/engines/email-sequence.mjs:172` subject length cap) and P2 (`src/components/tools/widgets/health-auditor-widget.jsx:325` tagged CSV export when `cleanRows.length === 0`) and reply/resolve both threads.
3. Run `pnpm check`, `node scripts/check-migration.mjs`, `pnpm build`, and `pnpm build:worker`.
4. Run `pnpm run migrate:deploy` on production D1 (`0002_tool_blueprints.sql` and `0003_tool_blueprint_creation_key.sql`) before/with merge, then verify `/tools`, `/tools/viral-coefficient-calculator`, and OAuth blueprint handoff on production.
