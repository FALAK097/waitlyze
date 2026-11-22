# SEO Wins to Waitlyze: Zero-to-First-Users Playbook

**Prepared:** November 22, 2026  
**Research scope:** Every public entry in the SEO Wins Blog archive, Waitlyze's public product and acquisition surfaces, current Search Console data, and the open Launch Lab implementation  
**Primary objective:** Get the first activated Waitlyze users through a measurable activation loop

## Executive decision

Waitlyze should not execute all 40 SEO tactics at once.

The articles repeatedly point toward the same useful system:

1. Solve a specific, high-intent problem with a page or free utility.
2. Make the result useful before asking for an account.
3. Give the visitor one obvious next step into the product.
4. Distribute the asset directly to the people and publishers who already care about the problem.
5. Improve pages and channels according to activated-user outcomes.

For Waitlyze, the next milestone is:

> One founder discovers or receives a useful Waitlyze asset, creates an account, publishes a real campaign, and collects a verified non-test signup with attribution intact.

The highest-risk assumption is not whether Waitlyze can build more features. The product already has templates, hosted pages, embeds, verified referrals, email, analytics, API access, webhooks, and an MCP server. The highest-risk assumption is whether a founder with an upcoming launch can understand the promise, publish without assistance, and attract a real signup.

## What was reviewed

The archive contained 42 public entries:

- 40 editorial strategy articles.
- 2 lead-magnet landing pages: the AI SEO Guide and the 160+ SEO Checklist.

The Waitlyze review covered:

- Public homepage, pricing, features, templates, comparisons, alternatives, blog, docs, sitemap, Markdown routes, AI discovery files, and PostHog event taxonomy.
- Search Console performance and URL inspection for `sc-domain:waitlyze.com`.
- Existing acquisition plans in this repository.
- Open GitHub issues for the Waitlist Template Finder and Viral Waitlist Growth Calculator.
- Open pull request #253, which currently implements the full 14-tool Launch Lab and blueprint handoff.

The analysis applied the relevant research, product-risk, conversion, customer-journey, content-strategy, analytics, accessibility, SEO, and AI-search frameworks. Using every installed skill literally would add noise; the useful discipline is to apply the skills that change the decision.

## Current Waitlyze baseline

### Search visibility

Search Console reported the following for October 22 through November 18, 2026, compared with the preceding 28 days:

- Google Search produced 1 click from 95 impressions.
- Click-through rate was 1.05%.
- Average position was 41.8.
- Google indexed 83 of 89 known URLs.
- Six isolated URLs require review; the evidence does not indicate a sitewide technical failure.

The pages with the most new impressions were:

| Page                                        | Impressions | Average position |
| ------------------------------------------- | ----------: | ---------------: |
| `/blog/waitlist-landing-page-checklist`     |          21 |            47.29 |
| `/blog/how-to-build-a-waitlist`             |          16 |            63.50 |
| `/blog/waitlist-email-templates`            |          15 |            34.33 |
| `/blog/how-to-set-up-robots-txt-for-ai-seo` |          14 |            54.57 |
| `/blog/waitlist-email-sequence`             |          10 |            38.70 |

This is an early discovery signal, not enough data for reliable optimization by conversion rate or ranking movement.

### Indexing

Google currently knows and indexes most of the site. The six URLs to monitor were:

- `/templates/nonprofit`: crawled, currently not indexed.
- `/about`: unknown to Google.
- `/blog/tag/launch`: unknown to Google.
- `/features`: unknown to Google.
- `/pricing`: unknown to Google.
- `/refund-policy`: unknown to Google.

Indexing is not the main blocker. The stronger constraint is that there is almost no demonstrated demand or distribution yet.

### Measurement

Waitlyze already has a useful PostHog taxonomy for:

- Marketing page views.
- Signup starts and completions.
- Workspace creation.
- Waitlist creation and publication.
- Referral activity.
- Billing activity.

The connected Google account does not currently expose a Google Analytics property for `waitlyze.com`. PostHog can measure the activation funnel if campaign source and UTM properties remain intact.

### Product and acquisition readiness

The product is broad enough to support a strong demo and real campaigns. The missing public acquisition surface identified in the existing growth plan is the ungated Launch Lab and its state-preserving product handoff.

However, pull request #253 already implements all 14 proposed tools and the blueprint pipeline. On November 22, 2026, it was open, had passing checks, and was 28 commits behind `main`.

That creates a sequencing risk:

- The strategy says to prove one end-to-end tool before expanding.
- The implementation packages 14 tools, benchmark work, APIs, product embeds, MCP tools, and infrastructure into one large launch.
- A large surface increases rebase, review, security, onboarding, and measurement risk before the first user has validated the core journey.

The product decision should be to release the smallest complete acquisition loop first, even if the code remains in one branch temporarily.

## Evidence-quality warning

The SEO Wins archive is valuable as a tactic library, but most traffic, backlink, subscriber, and revenue claims are not controlled evidence.

Common limitations across the articles:

- Self-reported outcomes without raw data.
- Missing baselines or observation windows.
- Several tactics executed at the same time.
- Site-level results attributed to one technique.
- Backlink totals without unique referring domains or outreach denominators.
- Traffic outcomes without activation, retention, or revenue attribution.

Use the articles to generate hypotheses. Do not use their headline numbers as forecasts for Waitlyze.

The most decision-useful example in the archive was resource-page outreach: 27 placements from 300 emails, roughly 9%. It provides a denominator, but still does not prove downstream activation.

## The five moves that matter now

### 1. Recruit design partners before scaling distribution

The first users should be founders with a visible launch planned in the next 30 to 60 days.

Target:

- 20 highly relevant founder contacts.
- 8 meaningful replies.
- 5 setup or usability sessions.
- 3 real campaigns published.
- 1 campaign collecting a verified non-test signup.

Offer concierge setup, not a vague request to “try the product.”

Suggested message:

> I saw you are preparing to launch [product]. I built Waitlyze for the work before launch day: a branded waitlist, verified referrals, launch emails, and source analytics. I can set up your first campaign with you in 20 minutes at no cost. In return, I only want to watch where the workflow is confusing. Would that help this week?

Do not ask these founders to review an empty feature list. Help them ship a real campaign.

### 2. Release one complete free-tool-to-campaign path

The release order should be:

1. **Waitlist Template Finder** to validate the state-preserving handoff with the smallest implementation and easiest founder test.
2. **Viral Waitlist Growth Calculator** as the first search-led, citable acquisition asset.
3. Other tools only after the first two show where visitors drop out.

The minimum successful path is:

`tool completed → result understood → CTA clicked → account created → result restored → draft reviewed → waitlist published → verified signup received`

Every tool result must remain visible before login. Authentication should preserve the founder's work, not become the price of seeing the answer.

### 3. Build one buyer-intent page from observed founder language

Do not produce a large integration or comparison program before talking to founders.

Choose one page after five founder conversations and a search-results review. Current candidates:

- Waitlist for Framer.
- Waitlist for Next.js.
- Referral waitlist builder.
- Verified referral waitlist.
- Free waitlist builder for SaaS launches.

The page must include:

- A working preview or copyable integration example.
- A direct explanation of who the page is for.
- The exact setup steps.
- Honest constraints and when Waitlyze is not the right choice.
- One primary CTA to create or apply the matching campaign.

### 4. Turn one asset into multiple useful formats

The archive repeatedly recommends hooks, visual assets, original studies, videos, and repurposing. Waitlyze should use one underlying asset rather than creating unrelated content.

For the Viral Waitlist Growth Calculator, create:

- The calculator.
- A transparent formula and worked example.
- A static referral-flow diagram.
- A short founder video showing the same scenario.
- A LinkedIn and X post that explains the method natively.
- A resource-page outreach angle.
- A relevant call to action inside existing referral and metrics articles.

### 5. Measure activation before traffic scale

The primary metric is **activated campaigns**.

Use this funnel:

| Stage                   | Definition                                    | Primary question                       |
| ----------------------- | --------------------------------------------- | -------------------------------------- |
| Qualified visit         | Founder or builder with a relevant launch job | Did the right person arrive?           |
| Tool or page completion | The visitor receives the promised value       | Did the asset solve the immediate job? |
| Signup started          | Visitor opens authentication from the asset   | Was the next step compelling?          |
| Signup completed        | Account created with attribution preserved    | Did auth destroy intent?               |
| Waitlist created        | A draft campaign exists                       | Did the result survive the handoff?    |
| Waitlist published      | A public campaign is live                     | Did the founder activate?              |
| First verified signup   | A non-test subscriber confirms their email    | Did the campaign create real value?    |

Track assisted and self-serve activations separately. A founder helped on a call is valuable product evidence but should not be reported as organic activation.

## Thirty-day operating plan

### Days 1 to 3: Establish the activation baseline

- Confirm PostHog captures source, medium, campaign, page, tool, selected template, signup completion, draft creation, publication, and first verified signup.
- Create one saved funnel from marketing visit to first verified signup.
- Label internal testing, demos, and founder-assisted campaigns.
- Prepare one short usability script focused on publishing.

Exit condition: the team can trace one internal test from source link through first verified signup without inspecting the database manually.

### Days 2 to 7: Recruit the first founder cohort

- Build a list of 20 founders with a public launch signal from Product Hunt upcoming pages, X, LinkedIn, Indie Hackers, accelerators, or changelog posts.
- Personalize each message around the actual launch.
- Offer setup help and a useful artifact, such as a template recommendation or referral forecast.
- Schedule five sessions.

Exit condition: at least three founders agree to build a real campaign.

### Days 4 to 14: Prove the Template Finder handoff

- Release only the Template Finder path from the broader Launch Lab work.
- Keep the result ungated.
- Preserve the selected template and recommendations through authentication.
- Let the founder review before creating anything.
- Test cancellation, plan limits, retries, and abandoned handoffs.

Exit condition: two founders complete the flow without manual state repair and at least one publishes.

### Days 10 to 21: Release the Viral Waitlist Growth Calculator

- Show the formula and every assumption.
- Separate modeled scenarios from customer benchmarks.
- Include verification drop-off in the model.
- Provide a worked example and sensitivity analysis.
- Offer a shareable result and a clear “Launch this referral model” CTA.
- Link it from existing referral, reward-tier, waitlist metrics, and launch-planning content.

Exit condition: five relevant visitors complete the calculator and at least one starts the product handoff.

### Days 15 to 25: Publish one buying-intent page

- Choose the page from founder language and current search results.
- Reuse a real template, embed, or setup path.
- Add explicit “best for,” “not for,” and implementation sections.
- Add a dated comparison or decision table only when facts can be maintained.

Exit condition: the page is indexed, receives targeted distribution, and produces at least one qualified CTA click.

### Days 18 to 28: Run narrow distribution

- Pitch 10 to 15 maintained resource pages where the calculator, template finder, or launch checklist fills a real gap.
- Publish two founder-led LinkedIn posts and two X posts from the same worked example.
- Share one practical build or methodology post in a relevant community without leading with a product link.
- Ask one niche founder newsletter or podcast to review the method only after a real campaign exists.

Exit condition: at least three useful replies or placements and enough tagged visits to compare channel quality.

### Days 26 to 30: Review and choose the next constraint

Review:

- Founder reply rate.
- Session-to-publish rate.
- Tool completion rate.
- Tool-to-signup rate.
- Signup-to-draft rate.
- Draft-to-publish rate.
- Published-to-first-verified-signup rate.
- Qualified visits and activations by source.

Then choose exactly one next constraint:

| Signal                                        | Next action                                                  |
| --------------------------------------------- | ------------------------------------------------------------ |
| No founder replies                            | Fix targeting and outreach.                                  |
| Founders attend but do not publish            | Fix positioning or workflow.                                 |
| Tools are completed but signup is not started | Fix the result-to-product bridge.                            |
| Signup starts but drafts are not created      | Fix authentication and state restoration.                    |
| Campaigns publish but collect no signups      | Help founders with distribution and landing-page conversion. |
| One path works                                | Deepen that use case before adding more tools.               |

## Customer journey map

### Unaware

**Mindset:** “I am building something, but launch planning can wait.”

Natural prompts:

- What should I do before launching a SaaS?
- How early should I start collecting emails for a product launch?
- What should a startup do before Product Hunt?

Content and product response:

- Product launch readiness checklist.
- Founder launch timeline.
- A short example showing why collecting and verifying demand early changes launch decisions.

### Problem-aware

**Mindset:** “I need a list, but I do not know whether a simple form is enough.”

Natural prompts:

- How do I build a waitlist before my product is ready?
- Why are people joining but not confirming their email?
- How do I stop fake referrals on a waitlist?
- What is a good waitlist conversion rate?

Content and product response:

- How to build a waitlist.
- Verification and referral-quality guides.
- Landing-page checklist.
- Viral growth calculator with clear formulas and caveats.

### Solution-aware

**Mindset:** “I need waitlist software, a form, or a referral system.”

Natural prompts:

- Best free waitlist builder for a SaaS launch.
- Waitlist software with verified referrals.
- Hosted waitlist page or embedded form?
- Referral waitlist versus a normal email form.

Content and product response:

- Template Finder.
- Comparison page.
- Use-case and integration landing pages.
- Live, no-login previews.

### Product-aware

**Mindset:** “I am comparing Waitlyze with a named alternative.”

Natural prompts:

- Is Waitlyze good for a SaaS beta?
- Waitlyze versus GetWaitlist.
- Does Waitlyze support email verification and referral rewards?
- Can I use Waitlyze with Next.js or Framer?

Content and product response:

- Accurate, dated alternative pages.
- “Choose this if” recommendations.
- Integration examples.
- Clear feature, pricing, and limitation explanations.

### Most aware

**Mindset:** “I am ready to try it if the risk and effort are low.”

Natural prompts:

- Is Waitlyze free?
- How quickly can I publish a waitlist?
- Can I export my subscribers?
- Does Waitlyze keep my tool result after signup?

Content and product response:

- One obvious free-plan CTA.
- No-credit-card reassurance.
- State-preserving handoff.
- Setup support for the first campaign.

## Conversion priorities

### Value proposition

The homepage promise is broad and feature-complete. For zero-to-first-users outreach, use a narrower promise:

> Publish a branded waitlist with verified referrals and launch emails before your product is ready.

The visitor should understand the audience, the job, and the differentiator before seeing the full platform surface.

### Primary call to action

Use one primary action per acquisition page:

- Tool page: `Launch this model in Waitlyze`.
- Template page: `Use this template`.
- Integration page: `Create this setup`.
- Homepage: `Create your waitlist`.

Secondary actions should support evaluation while preserving one clear activation CTA.

### Proof

Waitlyze has no user proof yet. Do not fabricate social proof or present modeled scenarios as customer outcomes.

Use honest substitutes:

- Live interactive product preview.
- Open-source repository.
- Transparent formulas and methodology.
- Security and verification explanation.
- Founder-assisted pilot count, clearly labeled.
- A consented case study once a real campaign exists.

### Friction

The biggest likely friction points are:

- Choosing a template.
- Understanding referrals and verification.
- Losing intent during authentication.
- Configuring too many features before publishing.
- Knowing how to get the first campaign visitors.

The first-run experience should default to a publishable simple campaign and progressively reveal advanced features.

## Content strategy

### Core pillar

Own the topic **how to build, grow, and launch a verified waitlist**.

This pillar should connect:

- Waitlist setup.
- Landing-page conversion.
- Email verification.
- Referral mechanics.
- Reward design.
- Launch emails.
- Channel attribution.
- Launch-day operations.

### Highest-priority content work

| Priority | Asset                                 | Intent                            | Product bridge                    |
| -------- | ------------------------------------- | --------------------------------- | --------------------------------- |
| 1        | Viral Waitlist Growth Calculator      | Task and commercial investigation | Apply referral model              |
| 2        | Waitlist Template Finder              | Task and product evaluation       | Use selected template             |
| 3        | One platform integration page         | Buying and implementation         | Create matching campaign          |
| 4        | Verified referral waitlist guide      | Problem and solution awareness    | Enable verification and referrals |
| 5        | One maintained comparison improvement | Product evaluation                | Start with recommended setup      |
| 6        | Product launch checklist              | Early problem awareness           | Create the first campaign task    |

### Content mix for the next month

| Share | Work                                                                                                            |
| ----: | --------------------------------------------------------------------------------------------------------------- |
|   60% | Searchable work: one tool, one buying-intent page, and updates to existing pages already receiving impressions. |
|   30% | Shareable work: worked examples, diagrams, founder observations, and launch retrospectives.                     |
|   10% | Experimental work: one niche community or creator collaboration after the product path works.                   |

Do not create 30 thin pages to cover keyword variants. One page should own one distinct user job.

## Article-by-article application matrix

### Search demand and on-page strategy

|   # | SEO Wins tactic                    | Decision             | Waitlyze application                                                                                         |
| --: | ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
|   1 | VS keywords                        | Use selectively      | Publish only comparisons that represent a real founder decision and can be kept accurate.                    |
|   2 | Underserved Search Console queries | Use when data exists | Improve pages already earning impressions; do not force missing phrases into copy.                           |
|   3 | Linkable hooks                     | Use now              | Give the calculator a stable method, exportable chart, and worked example worth citing.                      |
|   4 | People Also Ask answers            | Use now              | Put direct answers below natural questions on calculator and guide pages.                                    |
|   5 | Original studies                   | Later                | Start with a disclosed public-page teardown; defer customer benchmarks until sample quality is sufficient.   |
|   6 | Ultimate guides                    | Consolidate          | Upgrade an existing guide instead of creating another broad post.                                            |
|   7 | Search intent and UX               | Use now              | Put the working task before supporting explanation and test it on mobile.                                    |
|   8 | Mixed SEO and AI hacks             | Filter heavily       | Keep useful refresh, comparison, and tool ideas; skip stunts, exact-match domains, and local-review tactics. |
|   9 | Comparison keywords                | Use selectively      | Maintain one high-value comparison with dated facts and clear use-case recommendations.                      |
|  10 | Existing-content optimization      | Use after baseline   | Refresh promising pages with query evidence and log changes separately from outreach.                        |
|  11 | Multilingual content               | Defer                | Test one native-reviewed locale page only after demand appears.                                              |
|  12 | Free-tool strategy                 | Use now              | Release a product-adjacent tool with an ungated answer and measurable handoff.                               |
|  13 | Relevant semantic keywords         | Use naturally        | Explain conversion, verification, sharing, and viral coefficient as connected concepts.                      |
|  14 | Customized and programmatic SEO    | Defer scale          | Improve existing archives; create variants only for materially different jobs.                               |
|  15 | Content refresh and sidebar links  | Use narrowly         | Update screenshots and facts; prefer contextual links over a cluttered global sidebar.                       |

### Links and authority

|   # | SEO Wins tactic               | Decision                         | Waitlyze application                                                                                |
| --: | ----------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
|  16 | Best-of-list outreach         | Use after tool release           | Pitch maintained founder and launch resources with a working asset, not the homepage.               |
|  17 | Wikipedia dead links          | Skip as acquisition              | Use dead citations to find documentation gaps, not to insert commercial replacements.               |
|  18 | Brand mentions                | Use through useful participation | Publish practical founder-led explanations and track branded search separately.                     |
|  19 | Free tools for backlinks      | Use now                          | Make the calculator reliable, stable, transparent, and easy to reference.                           |
|  20 | Wikipedia keyword discovery   | Use only for ideation            | Validate concepts with founder language and search results before creating pages.                   |
|  21 | Image backlink reclamation    | Later                            | Publish an original verified-referral diagram and reclaim attribution only after genuine reuse.     |
|  22 | 80/20 optimization            | Later                            | Optimize pages by activated campaigns once enough data exists.                                      |
|  23 | Evergreen guides and outreach | Use now                          | Turn repeated pilot-founder questions into one durable guide.                                       |
|  24 | Interactive content features  | Use now                          | Add a task-completing calculator, decision table, or copyable snippet rather than decoration.       |
|  25 | Search-traffic recovery       | Not currently needed             | No meaningful traffic decline exists; maintain crawl and indexing hygiene.                          |
|  26 | Citable content formats       | Use now                          | Repurpose one method into a diagram, short video, and article.                                      |
|  27 | Broken-link replacement       | Use opportunistically            | Offer a matching asset only when it genuinely replaces the dead resource.                           |
|  28 | Google Discover               | Defer                            | Use strong imagery for future launch stories but do not plan the acquisition model around Discover. |
|  29 | Resource-page outreach        | Use now                          | Run a small, curated batch with exact editorial fit and tagged links.                               |
|  30 | Business-keyword validation   | Use now                          | Validate one buying query and build the smallest page that completes its job.                       |
|  31 | Outdated-resource replacement | Use opportunistically            | Replace stale launch or waitlist resources only where Waitlyze has a close, current substitute.     |
|  32 | Skyscraper content            | Use carefully                    | Improve one narrow resource materially; do not compete by word count.                               |
|  33 | Build free tools              | Use now                          | Keep arithmetic deterministic, assumptions visible, and results ungated.                            |

### Distribution and capture

|   # | SEO Wins tactic            | Decision              | Waitlyze application                                                                                 |
| --: | -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
|  34 | Influencer partnerships    | Later                 | Test a niche founder newsletter or creator only after a real campaign story exists.                  |
|  35 | Podcast guesting           | Later                 | Pitch a specific lesson such as verified referral credit, not a generic founder story.               |
|  36 | Social hook, value, link   | Use now               | Explain the full method natively, then link to the working example with tagged URLs.                 |
|  37 | Referral contests          | Defer                 | An empty audience cannot seed itself; pilot a milestone reward inside a real founder campaign first. |
|  38 | Feeler outreach emails     | Test in a small batch | Compare useful replies and live placements, not reply rate alone.                                    |
|  39 | LinkedIn republishing      | Use now               | Turn one strong guide or pilot lesson into a complete native post.                                   |
|  40 | Landing-page email capture | Use with honest proof | Offer a concrete benefit, one visible CTA, and clearly labeled evidence.                             |

### Lead-magnet pages

| Entry              | Useful lesson                                                            | Waitlyze application                                                                             |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| AI SEO Guide       | One narrow promise, visual demo, explicit free CTA, and readership proof | Future launch planner or checklist can use the structure, but Waitlyze must use real proof only. |
| 160+ SEO Checklist | Specific quantity, clear coverage, demo, and free CTA                    | Product launch checklist should show immediate value without requiring email before the result.  |

## What not to do in the next 30 days

- Do not merge a 14-tool launch solely because the implementation exists.
- Do not publish fabricated benchmarks from modeled data.
- Do not translate the full site before evidence of local demand.
- Do not buy broad influencer reach.
- Do not launch a giveaway to an empty audience.
- Do not mass-email generic link requests.
- Do not change domains for keyword matching.
- Do not build thin keyword variants.
- Do not treat AI citations, links, visits, signups, and activated campaigns as the same outcome.
- Do not run a large launch before founders can publish and receive a real verified signup.

## Weekly scorecard

Use one scorecard every Friday:

| Metric                           | Week 1 target | Week 2 target | Week 3 target | Week 4 target |
| -------------------------------- | ------------: | ------------: | ------------: | ------------: |
| Personalized founder contacts    |            20 |            10 |            10 |            10 |
| Meaningful replies               |             5 |             3 |             3 |             3 |
| Founder sessions                 |             3 |             2 |             2 |             2 |
| Real drafts created              |             2 |             3 |             3 |             3 |
| Real waitlists published         |             1 |             2 |             2 |             2 |
| Campaigns with a verified signup |           0–1 |             1 |             2 |             2 |
| Tool completions                 |             0 |             5 |            10 |            15 |
| Tool-originated signup starts    |             0 |             1 |             2 |             3 |
| Relevant outreach placements     |             0 |           0–1 |             1 |             2 |

These are operating targets for planning. If the funnel breaks, stop adding volume and fix the broken stage.

## Decision gate for the Launch Lab PR

Before releasing the full Launch Lab, require evidence for these gates:

1. A founder completes the Template Finder and receives the expected draft after authentication.
2. Cancellation and abandonment do not trap the user in a handoff loop.
3. Retrying draft creation is safe and idempotent.
4. The calculator produces the same result in every surface that exposes it.
5. Tool analytics exclude raw descriptions, emails, URLs, CSV content, and other sensitive inputs.
6. At least one tool-originated campaign publishes and receives a verified signup.
7. Select the next tool because of observed founder demand or funnel evidence.

## Sources

### SEO Wins archive

- <https://seowins.io/topic/blog/>
- <https://seowins.io/topic/blog/page/2/>
- <https://seowins.io/ai-seo-guide/>
- <https://seowins.io/seo-checklist/>

### Waitlyze repository context

- `README.md`
- `notes/free-tools-seo-aeo-geo-growth-plan.md`
- `notes/gtm-launch-directory-seo-playbook.md`
- `src/app/sitemap.js`
- `src/lib/posthog/events.mjs`
- `src/lib/templates/gallery.mjs`

### Related product work

- GitHub issue #238: Waitlist Template Finder.
- GitHub issue #239: Viral Waitlist Growth Calculator.
- GitHub pull request #253: Launch Lab tool suite and blueprint handoff.

## Final recommendation

Waitlyze does not need another broad feature sprint before getting users.

It needs a narrow founder cohort, one complete ungated acquisition asset, a preserved path into a publishable campaign, and honest measurement through the first verified signup. Use the SEO Wins archive as a library of distribution and content mechanisms around that loop. Do not let the tactic library become a substitute for proving that the product creates value for one real founder.
