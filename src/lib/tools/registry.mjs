// Centralized Launch Lab 14-tool registry.
// Pure data + deterministic lookup helpers: safe to import from server
// components, client components, sitemap, llms.txt, md-registry, and MCP tools.

export const TOOLS_UPDATED_DATE = "2026-11-22";

export const TOOL_CATEGORIES = Object.freeze([
  {
    id: "diagnostics",
    label: "Diagnostics & Audits",
    description:
      "Inspect your live landing page, email list quality, sending DNS records, and cohort benchmarks before launch day.",
  },
  {
    id: "viral-math",
    label: "Viral & Referral Math",
    description:
      "Model K-factor compounding, reward tier unit economics, and queue rank jumps with transparent formulas.",
  },
  {
    id: "copy-forms",
    label: "Copy, Templates & Forms",
    description:
      "Match your launch to the right layout, write waitlist copy, design intake fields, and draft lifecycle emails.",
  },
  {
    id: "launch-ops",
    label: "Launch Operations & Embeds",
    description:
      "Build a dated critical-path launch calendar, normalize UTM tracking links, and configure drop-in signup widgets.",
  },
]);

export const TOOLS_REGISTRY = Object.freeze([
  {
    slug: "waitlist-landing-page-grader",
    path: "/tools/waitlist-landing-page-grader",
    title: "Waitlist Landing Page Grader",
    shortTitle: "Landing Page Grader",
    category: "diagnostics",
    priority: "P0",
    version: "1.0",
    targetJob:
      "Audit a live waitlist page for conversion clarity, form friction, referral mechanics, and SEO/AEO readiness.",
    seoTitle: "Free Waitlist Landing Page Grader & Conversion Audit",
    seoDescription:
      "Paste any public waitlist URL or HTML draft to get a transparent 6-pillar conversion score, top 3 highest-impact fixes, and rewritten hero copy.",
    directAnswer:
      "The Waitlist Landing Page Grader inspects a public HTTPS waitlist URL (or pasted page copy) across six weighted conversion and search pillars: value proposition, CTA clarity, form friction, waitlist mechanics, SEO/AEO readiness, and mobile basics. It scores each observable HTML signal transparently and generates rewritten hero copy you can open directly in Waitlyze.",
    ctaLabel: "Build the corrected version in Waitlyze",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-landing-page-checklist", "landing-page-seo-for-waitlists"],
    privacyNotice:
      "Live URL fetches validate public HTTPS addresses before and after redirects, never run JavaScript, and retain zero raw HTML after scoring.",
    howItWorks: {
      heading: "How the 6-pillar rubric is scored",
      summary:
        "Each page starts at 0 and earns up to 100 weighted points across six deterministic HTML and copy checks. No hidden black-box model is used to invent conversion predictions.",
      formula:
        "Total Score (0–100) = Value Prop (22) + CTA Focus (18) + Form Friction (18) + Waitlist Mechanics (14) + SEO/AEO Readiness (16) + Technical Basics (12)",
      items: [
        {
          label: "Value Proposition & Message Match (22 pts)",
          detail:
            "Checks for a single visible H1 (4–14 words), concrete audience or outcome language, and supporting subheadline copy.",
        },
        {
          label: "CTA & Conversion Focus (18 pts)",
          detail:
            "Evaluates action-oriented button copy (penalizing vague 'Submit' labels) and flags competing header links that pull visitors away from signing up.",
        },
        {
          label: "Form Friction & Trust (18 pts)",
          detail:
            "Counts visible input fields, checks for semantic type='email' and autocomplete='email', and looks for privacy or no-spam reassurance near the form.",
        },
        {
          label: "Waitlist & Referral Mechanics (14 pts)",
          detail:
            "Looks for post-signup expectation setting, queue or referral reward explanations, and honest proof cues.",
        },
        {
          label: "SEO & Answer-Engine Readiness (16 pts)",
          detail:
            "Verifies indexability (no accidental noindex), title and meta description bounds, canonical link, heading hierarchy, and JSON-LD structured data.",
        },
        {
          label: "Technical & Mobile Basics (12 pts)",
          detail:
            "Confirms HTTPS transport, responsive viewport meta tag, image alt text coverage, and lightweight HTML payload size.",
        },
      ],
    },
    workedExample: {
      title: "Sample audit: Pre-launch developer API page",
      summary:
        "An example stealth SaaS page with an email-only form, clear H1, missing meta description, generic 'Submit' CTA, and no explanation of what happens after joining.",
      metrics: [
        { label: "Initial score", value: "64 / 100 (C)" },
        { label: "Top fix #1", value: "Replace 'Submit' with outcome CTA (+6 pts)" },
        { label: "Top fix #2", value: "Add post-signup queue/referral note (+8 pts)" },
        { label: "Top fix #3", value: "Add canonical + meta description (+6 pts)" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100 (Strong)",
        guidance:
          "Fundamentals are solid. Focus next on traffic message-match, email verification rate, and referral share prompts.",
      },
      {
        band: "65–84 (Workable, leaky)",
        guidance:
          "Fix the top three flagged items before buying ads or launching on Product Hunt. Small friction or unclear post-signup copy costs signups immediately.",
      },
      {
        band: "Below 65 (High friction)",
        guidance:
          "Visitors likely cannot tell who the product is for or why to leave an email today. Apply the rewritten hero and single-field template before driving traffic.",
      },
      {
        band: "Failure modes & limits",
        guidance:
          "Static HTML inspection cannot execute client-rendered SPAs or measure brand reputation. Use the Paste HTML / Copy tab if your page relies on client-side hydration or sits behind a firewall.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Google Search Central: Creating helpful, reliable, people-first content",
        "W3C WCAG 2.2 form label, autocomplete, and alt-text criteria",
      ],
      changelog: "v1.0: Initial 6-pillar deterministic HTML and copy rubric with SSRF protection.",
    },
    faqs: [
      {
        question: "Does a 90+ grade guarantee a high waitlist conversion rate?",
        answer:
          "No. A high technical and copy score removes avoidable friction and search blockers, but conversion still depends heavily on audience demand, traffic source intent, and offer strength.",
      },
      {
        question: "Can I grade an unpublished or localhost landing page?",
        answer:
          "Yes. Switch to the 'Paste HTML / Copy' tab to inspect draft markup or plain landing page copy directly without making an external network request.",
      },
      {
        question: "Does Waitlyze store the HTML of the URL I inspect?",
        answer:
          "No. Fetched HTML is parsed in memory to compute the scorecard and immediately discarded. Only anonymous aggregate rate-limit counters are stored unless you click to save a blueprint.",
      },
      {
        question: "Why did my client-side React or Framer page show missing headings?",
        answer:
          "For security and speed, the grader inspects the initial server-rendered HTML without running JavaScript, which is the same view fast crawlers and many AI fetchers see first. Ensure key H1 and form copy is server-rendered.",
      },
    ],
  },
  {
    slug: "waitlist-template-finder",
    path: "/tools/waitlist-template-finder",
    title: "Waitlist Template Finder",
    shortTitle: "Template Finder",
    category: "copy-forms",
    priority: "P0",
    version: "1.0",
    targetJob:
      "Match your launch category, visual assets, and referral goal to the best-fit Waitlyze template.",
    seoTitle: "Waitlist Template Finder: Match Your Launch to the Right Layout",
    seoDescription:
      "Answer four quick questions about your product category, conversion motion, visual assets, and brand aesthetic to get ranked waitlist template recommendations.",
    directAnswer:
      "The Waitlist Template Finder scores all 14 Waitlyze templates across four launch dimensions: product category, conversion motion, visual asset readiness, and brand aesthetic. It ranks your top three layouts deterministically, explains why each section structure fits, and opens your chosen template directly in the Waitlyze builder.",
    ctaLabel: "Use this template & layout in Waitlyze",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-landing-page-examples", "how-to-build-a-waitlist"],
    privacyNotice:
      "All template matching runs deterministically in your browser with no account required.",
    howItWorks: {
      heading: "How template recommendations are ranked",
      summary:
        "Every template in the Waitlyze catalog is scored out of 100 points using weighted compatibility across your four inputs so you never pick a screenshot-heavy layout when launching text-only.",
      formula:
        "Match Score = Category Fit (40) + Asset Readiness (25) + Conversion Motion (20) + Brand Aesthetic (15)",
      items: [
        {
          label: "Category Fit (40 pts)",
          detail:
            "Aligns section order, such as API workflow steps for developer tools or agenda blocks for live cohorts, with your launch type.",
        },
        {
          label: "Asset Readiness (25 pts)",
          detail:
            "Prevents empty media slots by recommending focused typography-led templates when you do not have product screenshots or video yet.",
        },
        {
          label: "Conversion Motion (20 pts)",
          detail:
            "Turns on referral reward blocks, queue counters, or multi-field beta intake sections based on how you plan to grow.",
        },
        {
          label: "Brand Aesthetic (15 pts)",
          detail:
            "Matches dark technical, clean editorial, high-contrast bold, or warm consumer visual rhythms.",
        },
      ],
    },
    workedExample: {
      title: "Sample match: Text-only B2B developer tool with referral queue",
      summary:
        "A solo founder launching an API beta without a demo video yet, aiming for verified developer referrals.",
      metrics: [
        { label: "Top match (#1)", value: "Developer (94% match)" },
        { label: "Runner-up (#2)", value: "Simple (82% match)" },
        { label: "Recommended toggle", value: "Hide media block, enable referral rewards" },
        { label: "Form friction", value: "Email + 1 optional stack select" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100% match",
        guidance:
          "Use this layout directly and replace the starter copy with your real product outcome before publishing.",
      },
      {
        band: "70–84% match",
        guidance:
          "Strong alternative if you prefer its visual tone. Toggle off any section you do not have proof for yet.",
      },
      {
        band: "When to pick Blank or Simple",
        guidance:
          "If you are validating an idea in under 15 minutes with zero visual assets, Simple or Blank converts better than a half-filled long-form page.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: ["Waitlyze 14-template catalog schema (src/lib/templates/catalog.mjs)"],
      changelog: "v1.0: Deterministic 4-axis scoring across all 14 Waitlyze templates.",
    },
    faqs: [
      {
        question: "Can I switch templates later after creating my waitlist?",
        answer:
          "Yes. Inside the Waitlyze Builder you can swap templates, toggle individual sections on or off, and adjust colors or fonts as a private draft before publishing.",
      },
      {
        question: "Are all 14 waitlist templates free to use?",
        answer:
          "Yes. Every template is included on the Waitlyze Free plan, which supports one workspace, one waitlist, and up to 100 lifetime signups with no credit card required.",
      },
      {
        question: "Should I pick a short or long waitlist template?",
        answer:
          "Use a short single-screen template when traffic already knows you (social followers, newsletters). Use a structured template with proof and FAQs when visitors arrive cold from search or ads.",
      },
    ],
  },
  {
    slug: "viral-coefficient-calculator",
    path: "/tools/viral-coefficient-calculator",
    title: "Viral Waitlist Growth Calculator",
    shortTitle: "Viral Growth Calculator",
    category: "viral-math",
    priority: "P0",
    version: "1.0",
    targetJob:
      "Forecast direct and referred waitlist growth, K-factor, and highest-leverage conversion inputs.",
    seoTitle: "Viral Waitlist Growth & K-Factor Calculator (Free Simulator)",
    seoDescription:
      "Model how traffic, conversion rate, email verification, and referral sharing compound your pre-launch waitlist. Includes sensitivity analysis and CSV/PNG export.",
    directAnswer:
      "The Viral Waitlist Growth Calculator models how direct visitors, email verification, referral sharing, and referred conversion compound over weekly launch cycles. It computes your effective viral coefficient (K-factor), projects total verified signups, identifies the single highest-leverage metric to improve next, and exports the model as CSV or PNG.",
    ctaLabel: "Launch this referral model in Waitlyze",
    recommendedTemplateId: "community",
    relatedBlogSlugs: ["waitlist-metrics-that-matter", "referral-waitlist-guide"],
    privacyNotice:
      "All viral math runs deterministically in your browser. Scenario parameters are never sent to analytics.",
    howItWorks: {
      heading: "Exact viral waitlist formula",
      summary:
        "Unlike generic viral calculators that ignore unverified emails, Waitlyze includes email verification rate in both direct acquisition and referral compounding so your forecast reflects real, reachable subscribers.",
      formula: "K = Share Rate × Clicks per Sharer × Referred Conversion Rate × Verification Rate",
      items: [
        {
          label: "Direct Verified Signups / Cycle",
          detail:
            "Weekly Visitors × Direct Landing-Page Conversion Rate × Email Verification Rate.",
        },
        {
          label: "Effective Viral Coefficient (K)",
          detail:
            "Average number of new verified signups generated by each existing verified subscriber.",
        },
        {
          label: "Multi-Cycle Compounding",
          detail:
            "Each cycle's newly verified subscribers generate K × cohort referrals in the following cycle, capped conservatively when K approaches 1.0.",
        },
        {
          label: "Highest-Leverage Sensitivity (+10% Test)",
          detail:
            "Re-runs the full simulation five times, increasing one input by +10% relative each time to reveal which lever yields the largest signup lift.",
        },
      ],
    },
    workedExample: {
      title: "Worked example: 8-week SaaS launch scenario",
      summary:
        "Starting list: 100 verified. 1,200 weekly visitors, 18% page conversion, 78% email verification, 22% share rate, 4 clicks/sharer, 28% referred conversion.",
      metrics: [
        { label: "Direct verified / week", value: "168 signups" },
        { label: "Effective K-factor", value: "0.19 (0.22 × 4 × 0.28 × 0.78)" },
        { label: "8-week total verified", value: "~1,761 subscribers" },
        { label: "Referral lift", value: "+317 referred signups (+22%)" },
      ],
    },
    interpretationGuide: [
      {
        band: "K < 0.15 (Conversion-first)",
        guidance:
          "Referrals are a minor bonus right now. Improve landing-page conversion and email verification before spending budget on referral rewards.",
      },
      {
        band: "K = 0.15–0.45 (Healthy pre-launch amplifier)",
        guidance:
          "Strong, realistic range for verified product waitlists. Every 100 direct signups brings 18–80 extra verified signups for free.",
      },
      {
        band: "K > 0.60 (Verify assumptions carefully)",
        guidance:
          "Sustained K above 0.6 is rare outside high-reward consumer launches. Audit whether your assumed share rate or clicks per sharer holds past week 2.",
      },
      {
        band: "Failure modes & limits",
        guidance:
          "Real waitlists experience audience saturation and declining share rates over long campaigns. Treat presets as modeled scenarios, not guaranteed industry benchmarks.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Standard viral loop compounding math adjusted for double opt-in verification",
        "Waitlyze verified referral attribution model",
      ],
      changelog:
        "v1.0: Multi-cycle deterministic K-factor engine with +10% lever sensitivity and PNG/CSV export.",
    },
    faqs: [
      {
        question: "Why does email verification rate appear inside the K-factor formula?",
        answer:
          "Unverified signups cannot receive launch emails and are frequently bots or typos. Including verification rate keeps your projected list grounded in real, reachable subscribers.",
      },
      {
        question: "What is a realistic K-factor for a B2B or SaaS waitlist?",
        answer:
          "Most healthy pre-launch waitlists operate between K = 0.10 and K = 0.35, meaning referrals add 11% to 50% incremental growth on top of direct marketing without requiring exponential virality (K > 1).",
      },
      {
        question: "Can I share my modeled scenario with a co-founder?",
        answer:
          "Yes. Copy the shareable scenario link or export the CSV table and PNG summary card without creating an account.",
      },
      {
        question:
          "Why did the calculator advise fixing landing-page conversion instead of rewards?",
        answer:
          "When K is below 0.15, a 10% relative gain in landing-page conversion typically adds far more verified subscribers than tweaking referral incentives.",
      },
    ],
  },
  {
    slug: "waitlist-landing-page-generator",
    path: "/tools/waitlist-landing-page-generator",
    title: "Waitlist Landing Page Copy Builder",
    shortTitle: "Landing Page Copy Builder",
    category: "copy-forms",
    priority: "P0",
    version: "1.0",
    targetJob:
      "Generate complete waitlist hero, benefits, honest proof, FAQ, and post-signup referral copy.",
    seoTitle: "Waitlist Landing Page Copy & Headline Generator (Free)",
    seoDescription:
      "Generate three conversion-focused hero directions, benefit blocks, honest pre-launch proof sections, FAQs, and referral prompts, then open them in Waitlyze.",
    directAnswer:
      "The Waitlist Landing Page Copy Builder turns your product name, target audience, core problem, and real proof into a full pre-launch page draft. It creates three distinct hero angles, benefit cards, honest proof placeholders without fabricated testimonials, tailored FAQs, and post-signup referral copy ready for Waitlyze.",
    ctaLabel: "Open this page in Waitlyze Builder",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-landing-page-examples", "waitlist-landing-page-checklist"],
    privacyNotice:
      "Copy is generated deterministically from your structured inputs. Raw product descriptions and generated copy are never sent to analytics.",
    howItWorks: {
      heading: "How the waitlist copy framework works",
      summary:
        "Every generated page follows a tested pre-launch structure that replaces vague slogans with concrete audience, pain, mechanism, and post-signup expectations.",
      formula:
        "High-Clarity Page = Specific Audience + Pain/Outcome Hero + 3 Mechanism Benefits + Honest Proof + 4 Objection FAQs + Referral Loop Prompt",
      items: [
        {
          label: "3 Distinct Hero Directions",
          detail:
            "Compare Value-Led (direct outcome), Problem-Agitate-Solve (pain relief), and Mechanism-Led (how it works differently) headlines side by side.",
        },
        {
          label: "Zero Fabricated Proof Rule",
          detail:
            "If you select 'None yet (keep honest, no fake proof),' the builder outputs transparent founder-note or build-in-public copy instead of inventing fake testimonials or user counts.",
        },
        {
          label: "Post-Signup Referral Copy",
          detail:
            "Writes the confirmation headline and pre-filled social share prompt so momentum continues immediately after email submission.",
        },
      ],
    },
    workedExample: {
      title: "Sample output: Async standup tool for remote engineering teams",
      summary:
        "Audience: 10–50 person engineering teams. Problem: daily status meetings break deep work. Proof: founder credentials only.",
      metrics: [
        { label: "Value-led H1", value: "Ship faster without daily status meetings." },
        { label: "CTA label", value: "Request early access" },
        { label: "Proof treatment", value: "Founder note (0 fabricated quotes)" },
        { label: "Post-signup prompt", value: "Move up the beta queue with 2 teammates" },
      ],
    },
    interpretationGuide: [
      {
        band: "Choosing your hero angle",
        guidance:
          "Use Value-Led when visitors already search for your category. Use Problem-Led on social feeds where you need to stop the scroll. Use Mechanism-Led for technical or skeptical buyers.",
      },
      {
        band: "Tightening before launch",
        guidance:
          "Aim for headlines under 11 words and subheadlines under 24 words so the email input stays visible above the fold on mobile.",
      },
      {
        band: "Failure modes & limits",
        guidance:
          "Deterministic templates give you clean structure and zero fluff, but always replace generic nouns with the exact words your target customers use in interviews.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze pre-launch copywriting guidelines",
        "Conversion clarity heuristics for single-goal signup pages",
      ],
      changelog:
        "v1.0: 3-angle deterministic waitlist page copy builder with live template preview and blueprint handoff.",
    },
    faqs: [
      {
        question: "Will this tool invent fake testimonials or subscriber counts?",
        answer:
          "Never. If you have no customer quotes or metrics yet, select 'None yet (keep honest, no fake proof)' and the builder generates transparent pre-launch expectations instead of fake social proof.",
      },
      {
        question: "Can I edit the copy before opening it in Waitlyze?",
        answer:
          "Yes. Every generated headline, subheadline, benefit card, FAQ, and referral message is editable inline, copyable as Markdown, and saved into your draft blueprint when you click the CTA.",
      },
      {
        question: "Does it only generate headlines?",
        answer:
          "No. It builds the entire waitlist narrative: hero eyebrow, H1, subheadline, CTA button, privacy note, 3 benefits, proof block, 4 FAQs, confirmation message, and referral share prompt.",
      },
    ],
  },
  {
    slug: "product-launch-checklist",
    path: "/tools/product-launch-checklist",
    title: "Product Launch Readiness Planner",
    shortTitle: "Launch Readiness Planner",
    category: "launch-ops",
    priority: "P0",
    version: "1.0",
    targetJob:
      "Score launch readiness across 6 pillars and generate a dated critical-path timeline.",
    seoTitle: "Product Launch Readiness Planner & Dated Checklist (Free)",
    seoDescription:
      "Enter your target launch date, team bandwidth, and existing assets to get a 6-pillar readiness score and a dated 14, 30, 60, or 90-day plan with .ics and CSV export.",
    directAnswer:
      "The Product Launch Readiness Planner scores your launch preparation from 0 to 100 across six operational pillars and builds a dated 14-, 30-, 60-, or 90-day critical-path timeline based on your target launch date and weekly bandwidth. Export your dated tasks to Calendar (.ics), CSV, or attach them directly to a Waitlyze campaign.",
    ctaLabel: "Create your waitlist now",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-launch-day-playbook", "how-to-get-first-1000-waitlist-signups"],
    privacyNotice:
      "Launch dates, asset states, and calendar exports are calculated locally in your browser.",
    howItWorks: {
      heading: "How readiness and critical-path dates are computed",
      summary:
        "Your readiness score weights the six dependencies that most commonly derail pre-launch campaigns, then schedules every incomplete task backward from your target launch date.",
      formula:
        "Readiness (0–100) = Page & Value Prop (20) + Audience & Waitlist (20) + Email & DNS (18) + Proof & Assets (16) + Distribution & UTMs (14) + Measurement (12)",
      items: [
        {
          label: "Phase 1: Validation & Waitlist Setup",
          detail:
            "Domain, landing page, signup form, email verification, and baseline analytics live first so every outreach click is captured.",
        },
        {
          label: "Phase 2: Warm-Up & Referral Seeding",
          detail:
            "Founder network seeding, UTM-tagged channel distribution, welcome sequence, and referral reward validation.",
        },
        {
          label: "Phase 3: Launch Week Rehearsal",
          detail:
            "DNS deliverability verification, signup/referral end-to-end test, and launch-day asset staging.",
        },
        {
          label: "Phase 4: Launch Day & Rollout",
          detail:
            "Staged beta invites, broadcast send to verified opt-ins, and 7-day conversion follow-up.",
        },
      ],
    },
    workedExample: {
      title: "Worked example: 30-day private beta launch (solo founder, 8 hrs/week)",
      summary:
        "Domain and demo screenshots exist; waitlist form, welcome email, UTMs, and DNS records are still pending.",
      metrics: [
        { label: "Readiness score", value: "36 / 100" },
        { label: "First critical task", value: "Publish waitlist & verify double opt-in (Day 1)" },
        { label: "Recommended horizon", value: "30-day sprint (14 prioritized tasks)" },
        { label: "Exports", value: ".ics Calendar + CSV + Markdown" },
      ],
    },
    interpretationGuide: [
      {
        band: "80–100 (Launch ready)",
        guidance:
          "Run one full rehearsal signup using a real inbox, verify your DNS records, and schedule your launch-day rollout.",
      },
      {
        band: "45–79 (In progress)",
        guidance:
          "Prioritize Phase 1 and Email/DNS setup before announcing publicly so early traffic does not bounce or land in spam.",
      },
      {
        band: "Below 45 (Early setup)",
        guidance:
          "Start with one live waitlist page today rather than waiting for every asset. Collecting verified emails early validates demand while you build.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze Launch Day Playbook",
        "Critical-path dependency scheduling for pre-launch SaaS and consumer rollouts",
      ],
      changelog:
        "v1.0: 6-pillar readiness engine with 14/30/60/90-day backward scheduling and .ics export.",
    },
    faqs: [
      {
        question: "How far ahead of launch should I publish my waitlist?",
        answer:
          "For most indie and SaaS launches, 30 to 60 days gives enough runway to test messaging, seed referrals, and warm up your sending domain without letting early subscribers go cold.",
      },
      {
        question: "What does the .ics calendar export include?",
        answer:
          "It generates a standard RFC 5545 iCalendar file containing each incomplete task scheduled on its exact target date, importable into Apple Calendar, Google Calendar, or Outlook.",
      },
      {
        question: "Does the checklist carry over into my Waitlyze workspace?",
        answer:
          "Yes. Clicking the primary CTA saves your launch plan in a ToolBlueprint so you can review your checklist directly inside your new campaign.",
      },
    ],
  },
  {
    slug: "referral-reward-calculator",
    path: "/tools/referral-reward-calculator",
    title: "Referral Reward Tier & ROI Designer",
    shortTitle: "Referral Reward Designer",
    category: "viral-math",
    priority: "P1",
    version: "1.0",
    targetJob:
      "Design sustainable referral milestone tiers, model fulfillment budgets, and flag fraud risk.",
    seoTitle: "Referral Reward Tier & ROI Calculator for Waitlists (Free)",
    seoDescription:
      "Model 3–4 waitlist referral reward tiers across P25, P50, and P90 viral scenarios. Calculate effective CAC per referred subscriber and spot fraud-prone rewards.",
    directAnswer:
      "The Referral Reward Tier & ROI Designer models how many subscribers will unlock each milestone tier across conservative (P25), baseline (P50), and breakout (P90) viral curves. It calculates total reward budget exposure, effective acquisition cost per verified referral, and flags high-fraud-risk rewards before you promise them publicly.",
    ctaLabel: "Apply these reward tiers in Waitlyze",
    recommendedTemplateId: "community",
    relatedBlogSlugs: ["referral-reward-tiers-guide", "milestone-referral-program-guide"],
    privacyNotice:
      "Unit economics, LTV inputs, and tier designs are calculated locally in your browser.",
    howItWorks: {
      heading: "How reward fulfillment and effective CAC are modeled",
      summary:
        "Referral counts follow a heavy-tailed power-law distribution where most subscribers refer 0–1 friends and a small minority unlocks higher tiers. We model cumulative unlock rates at P25, P50, and P90 intensity.",
      formula:
        "Effective Cost per Verified Referral = Total Expected Reward Cost ÷ Total Verified Referred Signups",
      items: [
        {
          label: "Power-Law Tier Earner Distribution",
          detail:
            "Estimates the fraction of verified subscribers crossing each referral threshold (e.g., 3, 5, 10, 25) using a calibrated Pareto decay adjusted by share rate.",
        },
        {
          label: "P25 / P50 / P90 Budget Stress Test",
          detail:
            "Shows conservative, baseline, and breakout fulfillment spend so a viral spike never creates an unexpected swag or credit bill.",
        },
        {
          label: "Fraud-Risk Heuristic",
          detail:
            "Flags physical swag, cash equivalents, or lifetime deals placed at low thresholds (<=5 referrals) where disposable-email farming becomes profitable.",
        },
      ],
    },
    workedExample: {
      title: "Worked example: 5,000-subscriber SaaS waitlist ($120 LTV)",
      summary:
        "Tier 1 (3 refs): Priority access ($0). Tier 2 (5 refs): 1 month Pro credit ($8 cost). Tier 3 (15 refs): Founding badge + merch ($28 cost).",
      metrics: [
        { label: "Baseline (P50) budget", value: "$1,420 total exposure" },
        { label: "Breakout (P90) budget", value: "$2,890 max stress" },
        { label: "Effective cost / referral", value: "$1.18 per verified referral" },
        { label: "Fraud posture", value: "Low–Medium (double opt-in required)" },
      ],
    },
    interpretationGuide: [
      {
        band: "Effective cost < 15% of LTV",
        guidance:
          "Healthy unit economics with room for churn between waitlist signup and paid conversion.",
      },
      {
        band: "High Fraud Risk badge",
        guidance:
          "Raise the referral threshold, switch to product-native rewards (early access, credits), and enable Waitlyze Strict fraud mode + double opt-in.",
      },
      {
        band: "Zero-marginal-cost first tier",
        guidance:
          "Always anchor Tier 1 (1–3 referrals) with a zero-cost reward such as queue jump or early beta access to avoid rewarding low-intent referrals with cash costs.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Pareto referral unlock curves for pre-launch waitlists",
        "Waitlyze anti-abuse verification and velocity controls",
      ],
      changelog: "v1.0: 4-tier unit economics, P25/P50/P90 stress testing, and fraud risk rating.",
    },
    faqs: [
      {
        question: "How many referral reward tiers work best on a waitlist?",
        answer:
          "Three to four tiers strike the best balance: an attainable first win (1–3 referrals), a core incentive (5–10 referrals), and an aspirational top tier (15–25+ referrals).",
      },
      {
        question: "Does Waitlyze automatically ship physical rewards?",
        answer:
          "No. Waitlyze tracks verified referrals, points, and unlocked milestones automatically, while reward fulfillment remains under your control.",
      },
      {
        question: "How do I stop users from gaming my referral tiers?",
        answer:
          "Keep double opt-in email verification enabled, turn on Strict fraud mode for velocity limits, and avoid offering cash-equivalent or high-value physical items at low thresholds.",
      },
    ],
  },
  {
    slug: "waitlist-queue-simulator",
    path: "/tools/waitlist-queue-simulator",
    title: "Waitlist Queue & Leaderboard Points Simulator",
    shortTitle: "Queue & Points Simulator",
    category: "viral-math",
    priority: "P1",
    version: "1.0",
    targetJob:
      "Simulate how signup points, referral bonuses, and timestamp tie-breakers move users up the queue.",
    seoTitle: "Waitlist Queue & Leaderboard Points Simulator (Free)",
    seoDescription:
      "Simulate how Waitlyze's deterministic points-and-timestamp queue ranking moves a new subscriber after 1, 3, 5, and 10 verified referrals.",
    directAnswer:
      "The Waitlist Queue & Leaderboard Points Simulator models Waitlyze's deterministic points-and-timestamp ranking engine. Enter your projected waitlist size, base signup points, referral points, and bonus actions to see exactly how far a late joiner jumps after 1, 3, 5, or 10 verified referrals, plus Top 1% and Top 10 cutoffs.",
    ctaLabel: "Configure this queue model in Waitlyze",
    recommendedTemplateId: "community",
    relatedBlogSlugs: ["referral-waitlist-guide", "milestone-referral-program-guide"],
    privacyNotice:
      "Queue distributions and point cutoffs are simulated deterministically in your browser.",
    howItWorks: {
      heading: "Deterministic queue ranking & tie-breaking math",
      summary:
        "Waitlyze ranks every verified subscriber by total points descending, then by earliest signup timestamp ascending. There is zero randomness: every jump is predictable and auditable.",
      formula:
        "Total Points = Base Signup Points (default 50) + (Verified Referrals × Referral Points [default 30]) + Bonus Action Points",
      items: [
        {
          label: "Timestamp Tie-Breaker",
          detail:
            "Among subscribers with identical points (such as 0 referrals), earlier signups stay ahead. Earning even 1 verified referral jumps a late joiner ahead of the entire zero-referral cohort.",
        },
        {
          label: "Power-Law Sharer Simulation",
          detail:
            "Simulates realistic waitlist cohorts where ~72–85% of subscribers refer 0 people, creating an immediate motivational jump for the first verified referral.",
        },
        {
          label: "Fairness & Lock-Out Check",
          detail:
            "Detects when base signup points dwarf referral points (making referrals feel pointless) or when Top 10 cutoffs become unreachable for new joiners.",
        },
      ],
    },
    workedExample: {
      title: "Worked example: 2,500-person waitlist with Waitlyze defaults (50 / 30 pts)",
      summary:
        "A new subscriber joins at #2,500 with 50 points. Each verified referral adds +30 points.",
      metrics: [
        { label: "After 1 referral (80 pts)", value: "Jumps #2,500 → ~#450 (Top 18%)" },
        { label: "After 3 referrals (140 pts)", value: "Jumps to ~#135 (Top 6%)" },
        { label: "After 5 referrals (200 pts)", value: "Jumps to ~#55 (Top 3%)" },
        { label: "Top 10 cutoff", value: "~12 verified referrals" },
      ],
    },
    interpretationGuide: [
      {
        band: "Exact rank (#142) vs. Percentile band (Top 5%)",
        guidance:
          "Show exact rank when total signups are under ~5,000 and moving briskly. Switch to percentile bands or milestone progress when late joiners would otherwise see discouraging five-digit numbers like #42,810.",
      },
      {
        band: "Healthy referral ratio",
        guidance:
          "Keep Referral Points at 40%–100% of Base Signup Points (e.g., 30 vs 50) so one verified referral always vaults a subscriber past non-sharers.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze PointLedger engine (src/lib/referrals/points.mjs)",
        "Deterministic rank ordering: points DESC, createdAt ASC",
      ],
      changelog:
        "v1.0: Mirrors Waitlyze 50/30/5 default point rules with Pareto queue jump simulation.",
    },
    faqs: [
      {
        question: "How does Waitlyze break ties when two people have the same points?",
        answer:
          "Waitlyze orders subscribers by highest verified points first, and breaks ties by earliest signup timestamp, so early supporters keep priority over later signups at the same point tier.",
      },
      {
        question: "Should I show exact queue numbers on a brand-new waitlist?",
        answer:
          "If your list has fewer than 50 signups, consider hiding raw counts or showing point milestones until initial momentum builds, then revealing exact rank or percentile bands.",
      },
      {
        question: "Do unverified referrals move someone up the queue?",
        answer:
          "When double opt-in is enabled (recommended), referral points are only credited to the PointLedger after the invited friend confirms their email.",
      },
    ],
  },
  {
    slug: "beta-application-questions",
    path: "/tools/beta-application-questions",
    title: "Beta Intake & Lead Qualification Form Designer",
    shortTitle: "Beta Intake Form Designer",
    category: "copy-forms",
    priority: "P1",
    version: "1.0",
    targetJob:
      "Design high-signal beta application questions and VIP scoring rules without killing conversion.",
    seoTitle: "Beta Application & Waitlist Intake Form Designer (Free)",
    seoDescription:
      "Build a low-friction beta intake form tailored to B2B SaaS, DevTools, AI, or Consumer launches. Preview conversion impact, VIP point rules, and open directly in Waitlyze.",
    directAnswer:
      "The Beta Intake & Lead Qualification Form Designer recommends segment-specific waitlist questions, exact input types, and VIP fast-track point rules based on your conversion friction budget. Reorder fields, check estimated completion impact, export the schema as JSON or Markdown, and populate custom fields directly in Waitlyze.",
    ctaLabel: "Build this intake form in Waitlyze",
    recommendedTemplateId: "developer",
    relatedBlogSlugs: ["validate-startup-idea-with-waitlist", "waitlist-landing-page-checklist"],
    privacyNotice: "Form schemas and qualification rules are designed locally in your browser.",
    howItWorks: {
      heading: "Balancing lead signal against form abandonment",
      summary:
        "Every additional field trades signup volume for qualification clarity. The designer scores each field's cognitive load (tap select vs. free text) and suggests which questions belong inline vs. after email capture.",
      formula:
        "Friction Index = Email (base) + Sum(Select: +1, Multi/Checkbox: +1.2, Short Text: +2, Textarea: +3.5)",
      items: [
        {
          label: "Ultra-Fast (Email + 1 Select)",
          detail:
            "Best for broad consumer or top-of-funnel launches where one role or goal selector gives enough segmentation.",
        },
        {
          label: "Balanced (Email + 2–3 Fields)",
          detail:
            "Sweet spot for B2B SaaS and developer betas: captures role, company size or stack, and primary use case with quick dropdowns.",
        },
        {
          label: "High-Intent Application (Email + 4–5 Fields)",
          detail:
            "Built for design-partner cohorts or enterprise pilots where fewer, deeply qualified applicants outperform raw volume.",
        },
      ],
    },
    workedExample: {
      title: "Sample schema: B2B Developer API Beta (Balanced friction)",
      summary:
        "Email + Role (select) + Primary Stack (select) + Monthly Volume (select, optional) + VIP rule (+50 pts for production volume).",
      metrics: [
        { label: "Total fields", value: "Email + 3 structured selects" },
        { label: "Friction rating", value: "Low–Moderate (tappable inputs)" },
        { label: "VIP fast-track", value: "+50 queue pts for target ICP" },
        { label: "Export formats", value: "JSON Schema + Markdown + Blueprint" },
      ],
    },
    interpretationGuide: [
      {
        band: "Avoid open textareas above the fold",
        guidance:
          "Replacing one open-ended 'Tell us about your project' textarea with a 4-option dropdown typically preserves far more mobile completions.",
      },
      {
        band: "Mark nice-to-have fields optional",
        guidance:
          "Only mark fields required when you truly cannot decide who to invite without that answer.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze customFields schema (src/lib/templates/catalog.mjs)",
        "Form usability and progressive disclosure patterns",
      ],
      changelog:
        "v1.0: 6 launch segments, interactive field reordering, friction meter, and Waitlyze customFields handoff.",
    },
    faqs: [
      {
        question: "How many questions should a beta waitlist form ask?",
        answer:
          "Keep public forms to email plus 1–3 structured select fields. Only ask 4–5 questions when running an application-only design-partner or enterprise pilot.",
      },
      {
        question: "Are the generated custom fields compatible with Waitlyze Builder?",
        answer:
          "Yes. Every field maps directly to Waitlyze's native custom field types (text, textarea, number, select, checkbox) and loads into your draft when you click the primary CTA.",
      },
      {
        question: "Should I ask for phone numbers on a waitlist?",
        answer:
          "Only for high-touch local events, SMS drops, or enterprise sales demos. For most software betas, phone fields cause sharp drop-off.",
      },
    ],
  },
  {
    slug: "waitlist-email-generator",
    path: "/tools/waitlist-email-generator",
    title: "Waitlist Email Sequence Builder",
    shortTitle: "Email Sequence Builder",
    category: "copy-forms",
    priority: "P1",
    version: "1.0",
    targetJob:
      "Draft all 5 pre-launch lifecycle emails with Waitlyze merge tags and spam-trigger checks.",
    seoTitle: "Waitlist Email Sequence & Template Builder (5 Free Emails)",
    seoDescription:
      "Generate a complete 5-email pre-launch sequence (verification, welcome + referral link, milestone unlocked, warm-up, and launch day) with merge tags and spam checks.",
    directAnswer:
      "The Waitlist Email Sequence Builder generates all five essential pre-launch lifecycle emails from your product context and voice: double opt-in verification, welcome with referral link, milestone unlocked, pre-launch warm-up, and launch-day invite. Every email includes subject options, preview text, Waitlyze merge tags, and a live spam-word check.",
    ctaLabel: "Save this email sequence in Waitlyze",
    recommendedTemplateId: "creator",
    relatedBlogSlugs: ["waitlist-email-sequence", "waitlist-email-templates"],
    privacyNotice:
      "Email drafts and spam checks run locally in your browser. Draft body text is never sent to analytics.",
    howItWorks: {
      heading: "The 5-stage pre-launch email lifecycle",
      summary:
        "Subscribers who hear nothing for six weeks forget they signed up and mark your launch email as spam. This sequence keeps engagement warm with five focused touchpoints.",
      formula:
        "Lifecycle = 1. Confirm (0m) → 2. Welcome & Share (on verify) → 3. Milestone Jump (on unlock) → 4. Warm-Up (T-7d) → 5. Launch Invite (T-0)",
      items: [
        {
          label: "Waitlyze Merge Tags Included",
          detail:
            "Automatically places {{position}}, {{referral_link}}, and {{referrals_count}} where subscribers expect clear status feedback.",
        },
        {
          label: "Deterministic Spam-Trigger Scan",
          detail:
            "Flags ALL-CAPS words, excessive exclamation marks, and high-risk promotional phrases that hurt inbox placement on fresh domains.",
        },
        {
          label: "Transparent Free vs. Pro Disclosure",
          detail:
            "You can save your drafts and configure confirmation emails right away with a verified Resend sender; automated drip triggers and one-time broadcasts are Waitlyze Pro features.",
        },
      ],
    },
    workedExample: {
      title: "Sample sequence: Founder plain-text voice for a developer beta",
      summary:
        "Short, human plain-text emails averaging 85–130 words with one clear link per email.",
      metrics: [
        { label: "Emails generated", value: "5 lifecycle templates" },
        { label: "Merge tags", value: "{{position}}, {{referral_link}}, {{referrals_count}}" },
        { label: "Spam flags", value: "0 high-risk triggers" },
        { label: "Exports", value: "Copy Markdown / HTML or full JSON" },
      ],
    },
    interpretationGuide: [
      {
        band: "Plain-text founder note vs. Designed update",
        guidance:
          "Plain-text founder notes consistently avoid Promotions-tab filtering better than image-heavy HTML newsletters during early beta launches.",
      },
      {
        band: "Keep verification emails ruthlessly short",
        guidance:
          "Put the confirmation link in the first two lines and hold your referral pitch until Email #2 (after verification) so confirmation clicks stay high.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze EmailTemplate schema & consent-aware email engine",
        "Deliverability best practices for pre-launch transactional & marketing sends",
      ],
      changelog:
        "v1.0: 5-stage sequence generator with Waitlyze merge tags and deterministic spam-trigger scanner.",
    },
    faqs: [
      {
        question: "Can I use these email templates on the Waitlyze Free plan?",
        answer:
          "You can freely copy, export, and save these drafts into your campaign blueprint. Sending confirmation emails requires connecting a verified Resend sender, while automated sequences and one-time broadcasts require Waitlyze Pro.",
      },
      {
        question: "When should I send the pre-launch warm-up email?",
        answer:
          "Send a short behind-the-scenes update 7 to 14 days before launch day, especially if your waitlist has been running for more than three weeks, to re-engage early signups and invite referrals.",
      },
      {
        question: "Why should I separate marketing opt-in from transactional confirmation?",
        answer:
          "Consent-aware sending keeps complaint rates low and respects privacy rules. Waitlyze sends broadcasts and marketing automations only to verified subscribers who explicitly opted in.",
      },
    ],
  },
  {
    slug: "waitlist-utm-builder",
    path: "/tools/waitlist-utm-builder",
    title: "Launch Channel & UTM Link Builder",
    shortTitle: "UTM Link Builder",
    category: "launch-ops",
    priority: "P1",
    version: "1.0",
    targetJob: "Generate normalized UTM tracking links and QR codes across every launch channel.",
    seoTitle: "Launch Channel & Waitlist UTM Link Builder + QR Export (Free)",
    seoDescription:
      "Build clean, lowercase, hyphen-normalized UTM links and downloadable QR codes for Product Hunt, Hacker News, X, LinkedIn, Reddit, and newsletters.",
    directAnswer:
      "The Launch Channel & UTM Link Builder creates clean, lowercase, hyphen-normalized tracking URLs across Product Hunt, Hacker News, X, LinkedIn, Reddit, newsletters, and event QR codes. It catches case mismatches, PII leaks, and referral parameter collisions, and exports your full channel matrix as CSV or crisp SVG QR codes.",
    ctaLabel: "Track these launch channels in Waitlyze",
    recommendedTemplateId: "simple",
    relatedBlogSlugs: [
      "utm-tracking-for-waitlist-campaigns",
      "how-to-get-first-1000-waitlist-signups",
    ],
    privacyNotice:
      "All URLs and QR codes are generated entirely in your browser with zero third-party QR API calls.",
    howItWorks: {
      heading: "UTM hygiene rules for clean Waitlyze attribution",
      summary:
        "Mixed casing ('Twitter' vs 'twitter') and inconsistent medium names split your analytics into noisy duplicate rows. This builder enforces one strict naming schema.",
      formula:
        "https://waitlyze.com/w/<slug>?utm_source=<channel>&utm_medium=<surface>&utm_campaign=<launch>&utm_content=<variant>",
      items: [
        {
          label: "Strict Lowercase & Hyphen Normalization",
          detail:
            "Strips spaces, uppercase drift, and stray punctuation so every source groups cleanly inside Waitlyze Analytics.",
        },
        {
          label: "Referral Parameter Guard",
          detail:
            "Warns if your base URL accidentally hardcodes ?r= (which Waitlyze reserves for individual subscriber referral codes).",
        },
        {
          label: "Zero-PII Scrubbing",
          detail:
            "Detects email addresses or 10+ digit identifiers pasted into campaign or variant inputs and automatically strips them before generating URLs, CSV rows, or QR codes.",
        },
      ],
    },
    workedExample: {
      title: "Sample matrix: Private beta launch across 4 core channels",
      summary:
        "Campaign: private-beta-q4 across Product Hunt, Show HN, X Launch Thread, and Founder LinkedIn.",
      metrics: [
        { label: "Product Hunt", value: "utm_source=producthunt&utm_medium=launch" },
        { label: "Hacker News", value: "utm_source=hackernews&utm_medium=community" },
        { label: "X Thread", value: "utm_source=x&utm_medium=social&utm_content=launch-thread" },
        { label: "Event / Slides", value: "Downloadable client-side SVG QR code" },
      ],
    },
    interpretationGuide: [
      {
        band: "First-touch attribution in Waitlyze",
        guidance:
          "Waitlyze captures utm_source, utm_medium, utm_campaign, utm_term, and utm_content on the visitor's initial impression and carries them onto the verified SignUp record.",
      },
      {
        band: "Compare verified signups, not raw clicks",
        guidance:
          "Some channels send high curiosity clicks with low verification rates. Use clean UTMs to compare verified signups and downstream referrals per channel.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze Impression & SignUp UTM attribution schema",
        "Client-side deterministic QR matrix encoding",
      ],
      changelog:
        "v1.0: Multi-channel preset matrix, hygiene validator, CSV bulk export, and SVG QR export.",
    },
    faqs: [
      {
        question: "Will UTM parameters interfere with Waitlyze referral links?",
        answer:
          "No, as long as you do not include a hardcoded r= parameter in your campaign link. Waitlyze keeps utm_* attribution and ?r= referral codes cleanly separated.",
      },
      {
        question: "Do the QR codes expire or route through a redirect tracker?",
        answer:
          "Never. Each QR code encodes your exact destination URL directly as an SVG generated in your browser, so it works forever without third-party redirects.",
      },
      {
        question: "Why should I avoid putting utm_source on internal links?",
        answer:
          "Tagging links inside your own website overwrites the visitor's original external acquisition source. Use UTM links strictly on external launch channels.",
      },
    ],
  },
  {
    slug: "waitlist-embed-generator",
    path: "/tools/waitlist-embed-generator",
    title: "Waitlist Embed & Widget Configurator",
    shortTitle: "Embed & Widget Configurator",
    category: "launch-ops",
    priority: "P1",
    version: "1.0",
    targetJob:
      "Preview inline, modal, or drawer signup widgets and copy framework-specific Waitlyze embed snippets.",
    seoTitle: "Waitlist Embed & Widget Configurator (Next.js, Framer, HTML)",
    seoDescription:
      "Design and test an inline, pill, modal, or drawer waitlist widget across desktop and mobile. Copy ready-to-use snippets for Next.js, React, Framer, Webflow, Shopify, and HTML.",
    directAnswer:
      "The Waitlist Embed & Widget Configurator lets you design and test an interactive waitlist signup widget, including its post-signup referral status card, across inline, compact pill, modal, and drawer layouts. Switch between desktop and mobile previews, copy clean snippets for Next.js, React, Framer, Webflow, Shopify, or HTML, and wire them to a live Waitlyze campaign.",
    ctaLabel: "Connect this widget to a live waitlist",
    recommendedTemplateId: "simple",
    relatedBlogSlugs: ["nextjs-waitlist-seo-guide", "how-to-build-a-waitlist"],
    privacyNotice:
      "The sandbox preview runs locally in your browser; test email submissions in the preview are never transmitted or stored.",
    howItWorks: {
      heading: "How Waitlyze embeds work across any stack",
      summary:
        "Waitlyze's /js/embed.js loader mounts a sandboxed, auto-resizing widget inside your container div, forwards ?r= referral codes and UTM tags automatically, and keeps API secrets completely out of browser code.",
      formula:
        "<div class='waitlyze-widget' data-key-id='PUBLIC_ID'> + <script src='https://waitlyze.com/js/embed.js' defer>",
      items: [
        {
          label: "Zero Secret Keys in Frontend Code",
          detail:
            "Embeds use your public waitlist key ID. Secret API keys are only ever needed for custom server-side POST /api/waitlist calls.",
        },
        {
          label: "Automatic Referral & UTM Forwarding",
          detail:
            "Reads ?r= and utm_* parameters from the parent page URL and forwards them into the embedded form seamlessly.",
        },
        {
          label: "CSP & Performance Friendly",
          detail:
            "Loads deferred/lazyOnload without blocking First Contentful Paint and provides exact script-src and frame-src CSP directives.",
        },
      ],
    },
    workedExample: {
      title: "Sample setup: Next.js App Router hero inline pill widget",
      summary:
        "Compact horizontal email input + lime primary CTA using next/script strategy='lazyOnload' and a crawlable fallback link.",
      metrics: [
        { label: "Layout mode", value: "Compact inline pill" },
        { label: "Script loading", value: "Deferred / lazyOnload (0 render block)" },
        { label: "CSP directives", value: "script-src & frame-src https://waitlyze.com" },
        { label: "Frameworks", value: "Next.js, React, Framer, Webflow, Shopify, HTML" },
      ],
    },
    interpretationGuide: [
      {
        band: "Inline vs. Modal vs. Drawer",
        guidance:
          "Use inline or compact pill forms directly inside your hero section for maximum visibility. Reserve modal or slide-over drawers for navigation bar CTAs or documentation pages.",
      },
      {
        band: "Check contrast before pasting",
        guidance:
          "Ensure at least 4.5:1 contrast between your button label and button accent color, especially when using bright lime or yellow accents.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze /js/embed.js integration contract",
        "W3C WCAG 2.2 contrast and touch-target guidelines",
      ],
      changelog:
        "v1.0: Live pre-signup + post-signup sandbox across 4 layouts and 6 framework snippets.",
    },
    faqs: [
      {
        question: "Will the Waitlyze embed slow down my landing page?",
        answer:
          "No. The embed script loads with defer (or Next.js lazyOnload) so your hero headline and CSS paint first, and the iframe resizes cleanly without layout jumps.",
      },
      {
        question: "Can I style the embedded form to match my site?",
        answer:
          "Yes. When you click 'Connect this widget to a live waitlist,' your chosen accent color, border radius, and button copy are prefilled into your Waitlyze draft.",
      },
      {
        question: "Does the embed work on Framer, Webflow, and Shopify?",
        answer:
          "Yes. Select Framer, Webflow, or Shopify in the framework switcher to copy the exact drop-in embed block for that platform.",
      },
    ],
  },
  {
    slug: "waitlist-health-check",
    path: "/tools/waitlist-health-check",
    title: "Waitlist Health & Fraud Risk Auditor",
    shortTitle: "Health & Fraud Auditor",
    category: "diagnostics",
    priority: "P2",
    version: "1.0",
    targetJob:
      "Audit an existing waitlist CSV locally in the browser for disposable domains, plus-alias duplicates, and velocity spikes.",
    seoTitle: "Waitlist Health & Referral Fraud Risk Auditor (Zero-Upload CSV)",
    seoDescription:
      "Audit your waitlist CSV 100% locally in your browser with zero emails uploaded. Catch disposable domains, Gmail plus-alias self-referrals, role accounts, and velocity spikes.",
    directAnswer:
      "The Waitlist Health & Fraud Risk Auditor inspects your subscriber CSV completely inside your browser so zero raw email addresses ever leave your device, or evaluates manual aggregate metrics. It detects disposable domains, Gmail dot/plus-alias self-referral collisions, role accounts, unverified decay, and signup velocity spikes, then exports a cleaned CSV.",
    ctaLabel: "Migrate cleaned audience into Waitlyze",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["common-waitlist-mistakes", "referral-waitlist-guide"],
    privacyNotice:
      "Zero-upload guarantee: CSV files are parsed strictly in browser memory via JavaScript. No email addresses or file contents are uploaded to Waitlyze servers or analytics.",
    howItWorks: {
      heading: "How list health and fraud risk are calculated",
      summary:
        "Reuses Waitlyze's exact canonical email normalization (folding Gmail dots and +aliases) alongside disposable-provider lists, role-address checks, and timestamp velocity windows.",
      formula:
        "Health Score (0–100) = 100 − (Invalid% × 1.6) − (Disposable% × 1.8) − (Normalized Duplicates% × 1.5) − (Role% × 0.6) − Decay & Velocity Penalties",
      items: [
        {
          label: "Canonical Plus/Dot Alias Deduplication",
          detail:
            "Maps john.doe+1@gmail.com and johndoe@gmail.com to one canonical identity using the same normalization rule Waitlyze enforces at signup.",
        },
        {
          label: "Disposable & Burner Domain Detection",
          detail:
            "Flags known temporary inbox providers (mailinator, guerrillamail, yopmail, 10minutemail, tempmail, etc.) that bounce or farm rewards.",
        },
        {
          label: "Role Accounts & Velocity Spikes",
          detail:
            "Identifies generic addresses (admin@, info@, test@) and flags bursts of rapid signups sharing a referral code inside tight 2-minute windows.",
        },
      ],
    },
    workedExample: {
      title: "Sample CSV audit: 500 imported pre-launch signups",
      summary:
        "Mixed export from a legacy form without double opt-in: 412 clean, 38 disposable domains, 24 Gmail plus-alias duplicates, 16 role/invalid rows, 10 burst velocity signups.",
      metrics: [
        { label: "Waitlist Health Score", value: "74 / 100 (Needs cleanup)" },
        { label: "Safe deliverable rows", value: "412 (82.4%)" },
        { label: "Flagged risky rows", value: "88 (17.6%)" },
        { label: "Recommended Waitlyze posture", value: "STRICT fraud mode + Double Opt-In" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100 (Clean list)",
        guidance:
          "Safe to import and warm up. Maintain double opt-in verification before launching any referral reward tiers.",
      },
      {
        band: "60–84 (Moderate pollution)",
        guidance:
          "Download the cleaned CSV with disposable and duplicate alias rows stripped before sending your launch announcement to protect sender reputation.",
      },
      {
        band: "Below 60 (High bounce / abuse risk)",
        guidance:
          "Do not blast this list from your primary domain. Clean risky rows first, enable Waitlyze Strict fraud controls, and send a small re-confirmation batch.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze canonical email normalizer (src/lib/normalize-email.mjs)",
        "Waitlyze IP & velocity fraud posture rules (src/lib/fraud/gates.mjs)",
      ],
      changelog:
        "v1.0: Zero-upload browser CSV auditor with cleaned CSV download and aggregate metrics fallback.",
    },
    faqs: [
      {
        question: "Are the email addresses in my CSV uploaded to Waitlyze?",
        answer:
          "No. Parsing, deduplication, disposable-domain checks, and cleaned CSV generation run 100% locally in your browser. Zero subscriber rows leave your computer during the audit.",
      },
      {
        question: "What columns does the CSV auditor recognize?",
        answer:
          "It automatically detects email columns (email, email_address, subscriber), plus optional timestamp (created_at, date), verified status, and referral_code columns.",
      },
      {
        question: "Why are Gmail plus-aliases flagged as potential fraud?",
        answer:
          "Legitimate users occasionally use +tags for inbox filtering, but multiple +alias variations signing up on the same waitlist, especially under the same referral code, is the #1 self-referral farming pattern.",
      },
    ],
  },
  {
    slug: "email-deliverability-checker",
    path: "/tools/email-deliverability-checker",
    title: "Waitlist Email Deliverability & DNS Checker",
    shortTitle: "Email Deliverability Checker",
    category: "diagnostics",
    priority: "P2",
    version: "1.0",
    targetJob: "Verify SPF, DMARC, MX, and optional DKIM DNS records before sending launch emails.",
    seoTitle: "Email Deliverability & DNS Checker (SPF, DKIM, DMARC, MX)",
    seoDescription:
      "Check your launch domain's public SPF, DMARC, MX, and optional DKIM DNS records via DNS-over-HTTPS. Spot multi-SPF conflicts, >10 lookup limits, and get copyable fixes.",
    directAnswer:
      "The Waitlist Email Deliverability & DNS Checker queries public DNS records for your launch domain via DNS-over-HTTPS to inspect SPF syntax and lookup limits, DMARC policy enforcement, MX mail routing, and optional DKIM selectors. It returns a pass/warn/fail scorecard with copyable DNS TXT fixes before you send launch broadcasts.",
    ctaLabel: "Connect this sending domain in Waitlyze",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-email-sequence", "waitlist-email-templates"],
    privacyNotice:
      "Only public DNS records for the domain you enter are queried over HTTPS. Queries are rate-limited and not persisted beyond short-lived rate-limit counters.",
    howItWorks: {
      heading: "What each DNS authentication check verifies",
      summary:
        "Major mailbox providers (Gmail, Yahoo, Microsoft) require valid SPF, DKIM, and DMARC alignment for bulk launch broadcasts and confirmation emails.",
      formula:
        "Deliverability Readiness (0–100) = SPF (30) + DMARC (30) + MX Records (20) + DKIM Selector (20)",
      items: [
        {
          label: "SPF (Sender Policy Framework, 30 pts)",
          detail:
            "Confirms exactly one v=spf1 TXT record exists, checks mechanism lookup count (RFC 7208 max 10 DNS lookups), and validates ~all or -all qualifier.",
        },
        {
          label: "DMARC (_dmarc.domain, 30 pts)",
          detail:
            "Checks for v=DMARC1, distinguishes monitoring (p=none) from enforcement (p=quarantine / p=reject), and checks for rua aggregate reporting.",
        },
        {
          label: "MX Mail Routing (20 pts)",
          detail:
            "Verifies valid MX records exist so reply-to handling and domain legitimacy checks pass cleanly.",
        },
        {
          label: "DKIM Selector Check (20 pts)",
          detail:
            "When you enter a selector (such as resend, google, or s1), checks <selector>._domainkey.<domain> for a valid v=DKIM1 public key.",
        },
      ],
    },
    workedExample: {
      title: "Sample inspection: acme.com preparing a Resend launch broadcast",
      summary: "Valid MX + single SPF record (4 lookups, ~all), missing _dmarc record.",
      metrics: [
        { label: "SPF", value: "Pass (1 record, 4/10 lookups)" },
        { label: "DMARC", value: "Fail: missing _dmarc TXT record" },
        { label: "MX", value: "Pass (valid mail exchangers)" },
        { label: "Copyable fix", value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@acme.com" },
      ],
    },
    interpretationGuide: [
      {
        band: "Multiple SPF records detected",
        guidance:
          "Never publish two separate v=spf1 TXT records: RFC 7208 treats duplicate SPF records as a PermError. Merge all include: mechanisms into one TXT record.",
      },
      {
        band: "SPF lookup count > 10",
        guidance:
          "Remove unused email vendors from your SPF record or use a dedicated sending subdomain (e.g., mail.yourdomain.com) for launch broadcasts.",
      },
      {
        band: "Start DMARC with p=none, then tighten",
        guidance:
          "Publish p=none with a rua address first to monitor alignment, then move to p=quarantine or p=reject once your Resend sender is verified.",
      },
    ],
    methodology: {
      author: "Waitlyze Product Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "RFC 7208 (SPF), RFC 6376 (DKIM), RFC 7489 (DMARC)",
        "Cloudflare DNS-over-HTTPS JSON API (cloudflare-dns.com)",
      ],
      changelog:
        "v1.0: Public DoH inspection for SPF, DMARC, MX, and optional DKIM selectors with copyable remediation.",
    },
    faqs: [
      {
        question: "Should I send waitlist emails from my root domain or a subdomain?",
        answer:
          "Using a dedicated subdomain such as mail.yourdomain.com isolates bulk broadcast reputation from your team's corporate inbox and keeps SPF lookup counts clean.",
      },
      {
        question: "Why does DKIM require a selector name?",
        answer:
          "DNS does not allow listing all DKIM keys on a domain. Each email provider publishes its key at <selector>._domainkey.<domain> (for example, 'resend' or 'google').",
      },
      {
        question: "How long do DNS updates take to show up here?",
        answer:
          "Most modern DNS providers (Cloudflare, Route 53, Vercel DNS) propagate TXT changes within 1 to 10 minutes, though older registrars may take longer depending on TTL.",
      },
    ],
  },
  {
    slug: "waitlist-benchmarks",
    path: "/research/waitlist-benchmarks",
    title: "Waitlist Benchmark Explorer",
    shortTitle: "Benchmark Explorer",
    category: "diagnostics",
    priority: "P2",
    version: "1.0",
    targetJob:
      "Compare conversion, verification, share rate, and K-factor cohorts with explicit methodology.",
    seoTitle: "Waitlist Benchmarks: Conversion, Verification & Viral K-Factor Explorer",
    seoDescription:
      "Explore structured waitlist benchmark ranges (P25, P50 median, P75) for conversion rate, email verification, share rate, and K-factor, with transparent methodology and cohort minimums.",
    directAnswer:
      "The Waitlist Benchmark Explorer provides transparent quartile ranges (P25, P50 median, P75) for waitlist conversion rate, email verification rate, referral share rate, and effective K-factor across launch categories and channels. It enforces strict cohort minimums (N >= 30) and clearly distinguishes live aggregated cohorts from reference planning models.",
    ctaLabel: "Benchmark your waitlist in Waitlyze",
    recommendedTemplateId: "saas",
    relatedBlogSlugs: ["waitlist-metrics-that-matter", "waitlist-case-studies-famous-launches"],
    privacyNotice:
      "Only de-identified aggregate statistics passing minimum cohort thresholds are ever published. Individual campaign metrics are never exposed.",
    howItWorks: {
      heading: "Metric definitions & privacy-safe cohort policy",
      summary:
        "Every benchmark metric follows one explicit mathematical definition, excludes internal test campaigns and velocity-filtered bot traffic, and enforces a minimum cohort size of N >= 30 eligible campaigns.",
      formula:
        "Conversion = Signups ÷ Unique Visitors | Verification = Verified ÷ Signups | K = Share Rate × Clicks/Sharer × Referred Conv × Verification",
      items: [
        {
          label: "Minimum Sample Threshold (N >= 30)",
          detail:
            "Segments with fewer than 30 eligible live campaigns are never reported as live customer statistics; instead, the explorer explicitly displays Reference Planning Cohort Models until threshold maturity is reached.",
        },
        {
          label: "Correlation vs. Causation",
          detail:
            "Campaigns with referrals enabled often also invest more in landing-page polish and community seeding. Differences across cohorts are directional, not causal guarantees.",
        },
        {
          label: "Interquartile Reporting (P25 / P50 / P75)",
          detail:
            "Medians and quartiles resist distortion from single viral outlier launches far better than simple averages.",
        },
      ],
    },
    workedExample: {
      title: "How to read a benchmark quartile bar",
      summary:
        "If a SaaS beta cohort shows Conversion P25 = 12%, P50 = 21%, P75 = 32%, a page converting at 24% sits cleanly above the cohort median.",
      metrics: [
        { label: "P25 (25th percentile)", value: "Bottom quartile: inspect friction" },
        { label: "P50 (Median)", value: "Typical healthy launch baseline" },
        { label: "P75 (75th percentile)", value: "Top-quartile pre-launch execution" },
        { label: "Minimum live N", value: "30 eligible campaigns per segment" },
      ],
    },
    interpretationGuide: [
      {
        band: "Below P25 on Conversion",
        guidance:
          "Run the Waitlist Landing Page Grader first. Low conversion is usually caused by unclear positioning, excessive form fields, or mismatched ad traffic.",
      },
      {
        band: "Below P25 on Verification",
        guidance:
          "Check your sending domain SPF/DKIM/DMARC records and move your confirmation email CTA into the first two lines.",
      },
      {
        band: "Above P50 on Conversion, Low K-Factor",
        guidance:
          "Your value proposition resonates; add a clear post-signup share card and a zero-cost Tier 1 reward (1–3 referrals) to activate sharing.",
      },
    ],
    methodology: {
      author: "Waitlyze Research Team",
      reviewer: "Falak Gala",
      updatedAt: TOOLS_UPDATED_DATE,
      sources: [
        "Waitlyze Benchmark Explorer Data Policy (minimum cohort N >= 30)",
        "Waitlyze Impression, SignUp, Verification, and Referral schema definitions",
      ],
      changelog:
        "v1.0: Initial Benchmark Explorer with strict cohort-minimum gating and interactive percentile comparator.",
    },
    faqs: [
      {
        question: "Why are some cohorts labeled 'Reference Planning Model' instead of live data?",
        answer:
          "Waitlyze's data policy prohibits publishing live cohort averages until at least 30 eligible, non-test campaigns exist in that segment. Until a segment crosses N >= 30, we transparently label ranges as planning models rather than fabricating live claims.",
      },
      {
        question: "What counts as a verified signup in these definitions?",
        answer:
          "A unique normalized email address that has completed confirmation (verifiedAt is set) and was not filtered out by IP or device-fingerprint velocity guards.",
      },
      {
        question: "Can I cite or download these benchmark tables?",
        answer:
          "Yes. Use the Download Aggregate CSV button to export the clean summary table with methodology metadata and the last materially updated date.",
      },
    ],
  },
]);

const TOOL_BY_SLUG = new Map(TOOLS_REGISTRY.map((tool) => [tool.slug, tool]));

export function listTools() {
  return TOOLS_REGISTRY;
}

export function getToolBySlug(slug) {
  return TOOL_BY_SLUG.get(slug) || null;
}

export function getToolsByCategory(categoryId) {
  return TOOLS_REGISTRY.filter((tool) => tool.category === categoryId);
}

export function getRelatedTools(slug, limit = 3) {
  const current = getToolBySlug(slug);
  if (!current) return TOOLS_REGISTRY.slice(0, limit);
  const sameCategory = TOOLS_REGISTRY.filter(
    (item) => item.slug !== slug && item.category === current.category,
  );
  const others = TOOLS_REGISTRY.filter(
    (item) => item.slug !== slug && item.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/**
 * Returns 1-2 contextually matched tools for a Waitlyze blog article slug.
 * Keeps blog placements focused and relevant rather than showing a 14-link wall.
 */
const BLOG_TO_TOOLS = Object.freeze({
  "waitlist-metrics-that-matter": ["viral-coefficient-calculator", "waitlist-benchmarks"],
  "referral-waitlist-guide": ["viral-coefficient-calculator", "waitlist-queue-simulator"],
  "referral-reward-tiers-guide": ["referral-reward-calculator", "waitlist-queue-simulator"],
  "milestone-referral-program-guide": ["referral-reward-calculator", "waitlist-queue-simulator"],
  "waitlist-landing-page-checklist": [
    "waitlist-landing-page-grader",
    "waitlist-landing-page-generator",
  ],
  "waitlist-landing-page-examples": ["waitlist-landing-page-generator", "waitlist-template-finder"],
  "landing-page-seo-for-waitlists": ["waitlist-landing-page-grader"],
  "nextjs-waitlist-seo-guide": ["waitlist-embed-generator", "waitlist-landing-page-grader"],
  "waitlist-launch-day-playbook": ["product-launch-checklist", "email-deliverability-checker"],
  "how-to-get-first-1000-waitlist-signups": ["product-launch-checklist", "waitlist-utm-builder"],
  "validate-startup-idea-with-waitlist": ["beta-application-questions", "product-launch-checklist"],
  "waitlist-email-sequence": ["waitlist-email-generator", "email-deliverability-checker"],
  "waitlist-email-templates": ["waitlist-email-generator"],
  "utm-tracking-for-waitlist-campaigns": ["waitlist-utm-builder"],
  "how-to-build-a-waitlist": ["waitlist-template-finder", "waitlist-embed-generator"],
  "common-waitlist-mistakes": ["waitlist-health-check", "waitlist-landing-page-grader"],
  "how-long-should-a-waitlist-run": ["product-launch-checklist", "viral-coefficient-calculator"],
  "waitlist-case-studies-famous-launches": ["waitlist-benchmarks", "viral-coefficient-calculator"],
  "social-proof-waitlist-anticipation": [
    "waitlist-landing-page-generator",
    "waitlist-queue-simulator",
  ],
  "how-to-set-up-robots-txt-for-ai-seo": ["waitlist-landing-page-grader"],
});

export function getToolsForBlogSlug(blogSlug) {
  const slugs = BLOG_TO_TOOLS[blogSlug] || [];
  return slugs.map((slug) => getToolBySlug(slug)).filter(Boolean);
}
