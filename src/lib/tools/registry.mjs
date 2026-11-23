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
      heading: "How your page score is calculated",
      summary:
        "We score your page out of 100 across six practical checks that directly affect whether visitors understand your offer and leave their email.",
      formula:
        "100 points total: Headline & Clarity (22) + Button & Focus (18) + Form Simplicity (18) + Waitlist Info (14) + Search Basics (16) + Mobile & Speed (12).",
      items: [
        {
          label: "Clear Headline & Offer (22 pts)",
          detail:
            "Checks that you have one clear main headline (4–14 words) and plain copy explaining who the product is for.",
        },
        {
          label: "Action Button & Low Distraction (18 pts)",
          detail:
            "Rewards specific buttons like 'Request early access' over vague 'Submit' buttons, and checks that top nav links aren't pulling visitors away.",
        },
        {
          label: "Short, Trustworthy Form (18 pts)",
          detail:
            "Checks for 1–2 simple fields, proper email autofill support, and a short 'no spam' note near the button.",
        },
        {
          label: "What Happens Next (14 pts)",
          detail:
            "Looks for clear info on when invites roll out, plus whether visitors can move up the line by referring friends.",
        },
        {
          label: "Google & AI Search Basics (16 pts)",
          detail:
            "Checks that search engines can index the page and find a proper page title, description, and canonical link.",
        },
        {
          label: "Mobile & Image Basics (12 pts)",
          detail:
            "Confirms the page uses HTTPS, scales properly on phones, has image descriptions, and loads a lean HTML page.",
        },
      ],
    },
    workedExample: {
      title: "Example audit: Early SaaS waitlist",
      summary:
        "A page with a good headline and email form, but a generic 'Submit' button, missing description, and no explanation of what happens after signup.",
      metrics: [
        { label: "Starting score", value: "64 / 100 (C)" },
        { label: "Quick win #1", value: "Change 'Submit' to 'Request early access' (+6 pts)" },
        { label: "Quick win #2", value: "Explain queue or referral perks (+8 pts)" },
        { label: "Quick win #3", value: "Add a page description & canonical tag (+6 pts)" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100 · Strong",
        guidance:
          "Your page fundamentals are in great shape. Focus next on sending targeted traffic and encouraging referrals after signup.",
      },
      {
        band: "65–84 · Good, with easy fixes",
        guidance:
          "Fix the top three flagged items before launching on Product Hunt or running ads—small copy or form fixes lift signups fast.",
      },
      {
        band: "Below 65 · Needs clarity",
        guidance:
          "Visitors may not see who this is for or why they should sign up today. Start with the suggested headline rewrite and a single email field.",
      },
      {
        band: "Good to know",
        guidance:
          "Live URL checks inspect the HTML your server sends first. If your site loads everything via JavaScript, paste your page copy in the second tab instead.",
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
      heading: "How your best templates are picked",
      summary:
        "We score all 14 Waitlyze templates out of 100 based on your four answers so you get a layout that fits your product and the assets you already have.",
      formula:
        "Match score (out of 100): Product Type (40) + Visuals You Have (25) + Signup Goal (20) + Style (15).",
      items: [
        {
          label: "Product Type (40 pts)",
          detail:
            "Matches page sections to what you are launching, like workflow steps for developer tools or schedule blocks for events.",
        },
        {
          label: "Visuals You Have (25 pts)",
          detail:
            "Avoids awkward empty image boxes by prioritizing clean, text-led layouts when you don't have screenshots or a demo video yet.",
        },
        {
          label: "Signup Goal (20 pts)",
          detail:
            "Pre-configures referral queues, milestone reward blocks, or extra beta intake questions based on how you want to grow.",
        },
        {
          label: "Look & Feel (15 pts)",
          detail:
            "Matches your preferred vibe—clean editorial, dark technical, high-contrast bold, or warm consumer.",
        },
      ],
    },
    workedExample: {
      title: "Example match: Text-only developer tool",
      summary:
        "A solo founder launching a developer API without screenshots yet, using a referral queue to reward early sharers.",
      metrics: [
        { label: "Top pick (#1)", value: "Developer (94% match)" },
        { label: "Runner-up (#2)", value: "Simple (82% match)" },
        { label: "Auto-adjustment", value: "Hides empty media block, turns on referrals" },
        { label: "Suggested form", value: "Email + 1 quick dropdown" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–99% · Best match",
        guidance:
          "Ready to use right out of the box. Just swap in your product name, headline, and FAQs before publishing.",
      },
      {
        band: "70–84% · Great backup",
        guidance:
          "A solid option if you like its visual style more—simply hide any section you don't need yet.",
      },
      {
        band: "Launching with zero visuals?",
        guidance:
          "Pick Simple or Blank. A clean, focused headline and email box converts much better than a long page with missing images.",
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
      heading: "How your waitlist growth is forecast",
      summary:
        "Each week, your page brings in direct signups—and a share of those confirmed subscribers invite friends who bring in even more. We only count confirmed emails so your forecast reflects real people you can actually reach.",
      formula:
        "Referral multiplier (K) = Share rate × Clicks per sharer × Friend signup rate × Email confirmation rate.",
      items: [
        {
          label: "1. Weekly Direct Signups",
          detail:
            "Multiplies your weekly visitors by your signup rate and email confirmation rate to get real new subscribers each week.",
        },
        {
          label: "2. Referral Multiplier (K-Factor)",
          detail:
            "Shows how many extra confirmed signups each subscriber brings in on average (for example, K = 0.20 means 100 signups bring 20 more).",
        },
        {
          label: "3. Week-by-Week Compounding",
          detail:
            "New referrals from this week share with their friends next week, with gentle natural slowdown over longer launches so estimates stay realistic.",
        },
        {
          label: "4. Biggest Growth Lever",
          detail:
            "Tests bumping each metric up by 10% one at a time to show which single improvement adds the most signups.",
        },
      ],
    },
    workedExample: {
      title: "Example forecast: 8-week SaaS launch",
      summary:
        "Starting with 100 subscribers, 1,200 weekly visitors, 18% signup rate, 78% email confirmation, 22% sharing, 4 clicks per sharer, and 28% friend signup rate.",
      metrics: [
        { label: "Direct signups / week", value: "168 confirmed" },
        { label: "Referral multiplier (K)", value: "0.19" },
        { label: "Total after 8 weeks", value: "~1,761 subscribers" },
        { label: "Extra from referrals", value: "+317 signups (+22%)" },
      ],
    },
    interpretationGuide: [
      {
        band: "K below 0.15 · Focus on the page first",
        guidance:
          "Referrals are a small bonus right now. Improving your landing page headline or email confirmation rate will grow your list much faster than tweaking rewards.",
      },
      {
        band: "K between 0.15 and 0.45 · Healthy loop",
        guidance:
          "Great range for a pre-launch waitlist. Every 100 direct signups brings roughly 18 to 80 extra subscribers for free.",
      },
      {
        band: "K above 0.60 · Double-check numbers",
        guidance:
          "Very rare outside big consumer giveaways. Make sure your share rate and click estimates still hold true after week 2.",
      },
      {
        band: "Good to know",
        guidance:
          "Sharing naturally slows down as a campaign runs longer. Treat these presets as planning estimates rather than guaranteed results.",
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
      heading: "How your waitlist copy is built",
      summary:
        "We turn your product summary, audience, and core problem into a complete waitlist page—headline, benefits, honest proof, FAQs, and share copy—without buzzwords or fake testimonials.",
      formula:
        "Complete draft: 3 Headline Angles + 3 Benefit Cards + Honest Proof + 4 FAQs + Post-Signup Share Copy.",
      items: [
        {
          label: "Three Headline Angles",
          detail:
            "Gives you a Value-led (outcome), Problem-first (pain point), and Mechanism-led (how it works) headline so you can pick what fits best.",
        },
        {
          label: "No Fake Social Proof",
          detail:
            "If you don't have customer quotes or metrics yet, it writes an honest founder note instead of inventing fake user counts.",
        },
        {
          label: "Built-in FAQs & Privacy Note",
          detail:
            "Answers the questions visitors ask before leaving an email—when access opens, who it's for, and a promise not to spam.",
        },
        {
          label: "Post-Signup Share Prompt",
          detail:
            "Writes the confirmation screen message and a ready-to-share social post so signups know how to invite friends right away.",
        },
      ],
    },
    workedExample: {
      title: "Example draft: Remote team standup tool",
      summary:
        "Built for 10–50 person engineering teams tired of daily status meetings, using an honest founder note instead of fake quotes.",
      metrics: [
        { label: "Headline", value: "Async standups from merged PRs." },
        { label: "Button text", value: "Request early access" },
        { label: "Proof section", value: "Honest founder note (0 fake quotes)" },
        { label: "After signup", value: "Prompt to share with 2 teammates" },
      ],
    },
    interpretationGuide: [
      {
        band: "Which headline angle to pick",
        guidance:
          "Pick Value-led for Google search traffic, Problem-first for X/LinkedIn posts to stop the scroll, or Mechanism-led for technical buyers.",
      },
      {
        band: "Keep the top screen punchy",
        guidance:
          "Try to keep your headline under 11 words so both the headline and email box fit on a phone screen without scrolling.",
      },
      {
        band: "Make it sound like you",
        guidance:
          "You can edit any field inline. Swap in the exact words your early users or customers use when describing the problem.",
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
      heading: "How your readiness score and dates are built",
      summary:
        "Check off what you already have ready to see your score out of 100. Every remaining task is then scheduled backward from your target launch date in the right order.",
      formula:
        "Readiness (0–100): Page & Offer (20) + Waitlist Setup (20) + Email & DNS (18) + Visuals (16) + Channels (14) + Tracking (12).",
      items: [
        {
          label: "Phase 1 · Get Your Waitlist Live",
          detail:
            "Set up your domain, signup form, and confirmation email first so you never lose early visitors.",
        },
        {
          label: "Phase 2 · Warm Up & Share",
          detail:
            "Add product screenshots, turn on referral rewards, create tracking links, and invite your first 25–50 contacts.",
        },
        {
          label: "Phase 3 · Launch Week Check",
          detail:
            "Finish your launch emails, send a quick behind-the-scenes note, and test a real signup from start to finish.",
        },
        {
          label: "Phase 4 · Launch Day & Follow-Up",
          detail:
            "Go live across your channels, send invites in waves, and check which channels brought the best signups.",
        },
      ],
    },
    workedExample: {
      title: "Example plan: 30-day solo beta launch",
      summary:
        "Domain and screenshots are ready, while the waitlist page, welcome emails, tracking links, and email DNS still need setup.",
      metrics: [
        { label: "Starting score", value: "36 / 100" },
        { label: "First step", value: "Publish waitlist & confirmation (Day 1)" },
        { label: "Timeline", value: "30 days · 13 dated tasks" },
        { label: "Exports", value: "Calendar (.ics), CSV, or Markdown" },
      ],
    },
    interpretationGuide: [
      {
        band: "75–100 · Ready to launch",
        guidance:
          "Do one quick test signup with your own inbox, check your email DNS records, and you're ready for launch day.",
      },
      {
        band: "45–74 · On track",
        guidance:
          "Finish your waitlist form and email DNS setup before posting publicly so signups confirm smoothly and don't land in spam.",
      },
      {
        band: "Below 45 · Early setup",
        guidance:
          "Don't wait for everything to be perfect—publish a simple waitlist page today so you can start collecting emails right away.",
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
      heading: "How reward budgets and fraud risk are estimated",
      summary:
        "On most waitlists, most people refer 0 or 1 friend while a small group unlocks bigger prizes. We estimate how many people will hit each tier in a slow, normal, or viral launch so you never get surprised by the bill.",
      formula:
        "Cost per referred signup = Total expected reward budget ÷ Total expected referrals.",
      items: [
        {
          label: "How Many People Unlock Each Tier",
          detail:
            "Higher milestones are unlocked by fewer people. Raising your share rate or lowering a threshold increases how many rewards you'll owe.",
        },
        {
          label: "Slow vs. Viral Stress Test",
          detail:
            "Shows Conservative (P25), Typical (P50), and Breakout (P90, 1.75× baseline) estimates to help you plan for higher-than-usual sharing—not a hard spending cap.",
        },
        {
          label: "Cost vs. Customer Value",
          detail:
            "Compares your cost per referred signup against your product profit (LTV × margin) so rewards stay profitable.",
        },
        {
          label: "Abuse & Gaming Warning",
          detail:
            "Flags physical swag or lifetime deals placed at low thresholds (5 referrals or less), which attract fake-email signups.",
        },
      ],
    },
    workedExample: {
      title: "Example budget: 5,000-person SaaS waitlist",
      summary:
        "Product value $120. Tier 1 (3 refs): priority access ($0). Tier 2 (5 refs): 1 free month ($6 cost). Tier 3 (15 refs): swag ($22).",
      metrics: [
        { label: "Typical budget (P50)", value: "~$1,157 total" },
        { label: "Breakout estimate (P90)", value: "~$2,024 estimate" },
        { label: "Cost per referral", value: "~$0.91 each" },
        { label: "Safety setting", value: "Double opt-in + Strict fraud mode" },
      ],
    },
    interpretationGuide: [
      {
        band: "Cost under 15% of profit",
        guidance:
          "Healthy unit economics—you still come out well ahead even if only some waitlist signups convert into paying customers.",
      },
      {
        band: "High fraud risk warning",
        guidance:
          "Move expensive or physical prizes to higher referral counts (10–15+) and turn on Strict fraud protection + email confirmation.",
      },
      {
        band: "Keep Tier 1 free to fulfill",
        guidance:
          "Use early access or a queue jump for your first milestone (1–3 referrals) so you aren't paying cash costs for small favors.",
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
      heading: "How queue position and jumps are calculated",
      summary:
        "Everyone is ranked by total points from highest to lowest. When two people have the exact same points, whoever signed up earlier stays ahead.",
      formula:
        "Points = Signup points (default 50) + (Confirmed referrals × Referral points [default 30]) + Bonus points.",
      items: [
        {
          label: "Why 1 Referral Makes a Big Jump",
          detail:
            "Around 75% of waitlist signups never refer anyone. As soon as a new joiner gets 1 confirmed referral, they jump ahead of everyone sitting at 0 referrals.",
        },
        {
          label: "Fair Tie-Breaking",
          detail:
            "If two people both have 0 referrals (50 points), the person who joined earlier keeps the better spot.",
        },
        {
          label: "Keeping Points Balanced",
          detail:
            "Warns you if referral points are too small compared to signup points (making sharing feel pointless) or if reaching the Top 10 takes too many referrals.",
        },
      ],
    },
    workedExample: {
      title: "Example: 2,500-person list (50 signup + 30 per referral)",
      summary:
        "Someone joins at the back (#2,500) with 50 points. Each friend who confirms their email adds +30 points.",
      metrics: [
        { label: "After 1 referral", value: "Jumps #2,500 → ~#238" },
        { label: "After 3 referrals", value: "Jumps into Top 5%" },
        { label: "After 5 referrals", value: "Jumps into Top 3%" },
        { label: "Display tip", value: "Show exact # under 5,000 signups" },
      ],
    },
    interpretationGuide: [
      {
        band: "Exact rank (#142) vs. Top %",
        guidance:
          "Show exact spots (#142) when your list is under ~5,000 people. On larger lists, switch to 'Top 5%' bands so late joiners don't feel discouraged by #42,810.",
      },
      {
        band: "Best points balance",
        guidance:
          "Make each referral worth about half or more of your base signup points (like 30 vs 50) so one referral creates a noticeable jump.",
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
      heading: "How form friction and question picks work",
      summary:
        "Every question you add gives you better lead details, but makes a few more visitors drop off. Quick dropdowns keep signups high, while typing-heavy text boxes add friction.",
      formula:
        "Friction score (0–100): Email starts at 10, dropdowns/checkboxes add a little (8–12), and typing fields add more (16–30).",
      items: [
        {
          label: "1 Field · Ultra-Fast",
          detail:
            "Email plus one quick dropdown (like role or device). Best when you want maximum signups from social or consumer traffic.",
        },
        {
          label: "2–3 Fields · Balanced",
          detail:
            "Sweet spot for B2B and developer tools: captures role, team size, or stack with fast taps instead of typing.",
        },
        {
          label: "4–5 Fields · Selective Application",
          detail:
            "Best for enterprise pilots or small cohorts where you want fewer, deeply qualified applicants.",
        },
        {
          label: "VIP Fast-Track Points",
          detail:
            "Flags answers that identify your ideal buyers so you can automatically award them bonus queue points.",
        },
      ],
    },
    workedExample: {
      title: "Example form: B2B developer beta",
      summary:
        "Email + Role dropdown + Stack dropdown + Monthly volume (optional), keeping friction low while surfacing top leads.",
      metrics: [
        { label: "Total fields", value: "Email + 3 quick dropdowns" },
        { label: "Friction score", value: "Low–Balanced (tappable)" },
        { label: "VIP boost", value: "+50 pts for production workloads" },
        { label: "Exports", value: "JSON Schema, Markdown, or Waitlyze" },
      ],
    },
    interpretationGuide: [
      {
        band: "Skip big text boxes on the first screen",
        guidance:
          "Replacing an open 'Tell us about your project' box with a 4-option dropdown gets noticeably more people to finish signing up on mobile.",
      },
      {
        band: "Make nice-to-have fields optional",
        guidance:
          "Only mark a question Required if you truly can't decide who to invite without that answer.",
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
      heading: "How the 5-email sequence works",
      summary:
        "If subscribers sign up and hear nothing for weeks, they forget why they joined and mark launch day as spam. These 5 short emails keep them engaged from signup to invite day.",
      formula:
        "5 stages: 1. Confirm email → 2. Welcome & share link → 3. Milestone unlocked → 4. Pre-launch update → 5. Launch invite.",
      items: [
        {
          label: "Personal Tags Auto-Filled",
          detail:
            "Drops in {{position}}, {{referral_link}}, and {{referral_count}} so every subscriber sees their real queue spot and share link.",
        },
        {
          label: "Live Spam-Word Check",
          detail:
            "Flags ALL-CAPS words, too many exclamation marks, and pushy sales phrases that can send new domains to spam.",
        },
        {
          label: "Two Voices Built In",
          detail:
            "Switch between a personal founder note (plain text, great for replies) and a crisp product update style.",
        },
        {
          label: "Free Drafts vs. Pro Sending",
          detail:
            "Save and export all 5 drafts free, send confirmation emails via your Resend sender, and unlock automated drips & broadcasts on Pro.",
        },
      ],
    },
    workedExample: {
      title: "Example sequence: Founder beta launch",
      summary:
        "Short, human emails (85–130 words) with one clear next step and zero spam triggers.",
      metrics: [
        { label: "Emails included", value: "5 launch lifecycle stages" },
        { label: "Personal tags", value: "{{position}}, {{referral_link}}, {{referral_count}}" },
        { label: "Spam check", value: "0 warnings" },
        { label: "Exports", value: "Copy Markdown, HTML, or JSON" },
      ],
    },
    interpretationGuide: [
      {
        band: "Plain-text beats heavy HTML early on",
        guidance:
          "Short emails that look like a real note from a founder land in the Primary inbox far more reliably than image-heavy newsletters.",
      },
      {
        band: "Keep Email #1 ultra short",
        guidance:
          "Put the confirmation link right at the top of Email #1, and save your referral pitch for Email #2 once they've confirmed.",
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
      heading: "How your tracking links and QR codes are built",
      summary:
        "Inconsistent tags like 'Twitter' vs 'twitter' split your analytics into messy duplicate rows. This tool formats every link cleanly, keeps personal data out, and builds ready-to-print QR codes locally.",
      formula:
        "Format: your-url?utm_source=channel&utm_medium=type&utm_campaign=launch&utm_content=variant.",
      items: [
        {
          label: "Clean, Consistent Naming",
          detail:
            "Automatically converts spaces and uppercase letters into clean lowercase-with-hyphens tags so every channel groups properly in analytics.",
        },
        {
          label: "Protects Referral Tracking",
          detail:
            "Warns and strips out any accidental ?r= parameter, which Waitlyze reserves for each user's personal referral link.",
        },
        {
          label: "Privacy Guard",
          detail:
            "Checks for accidentally pasted emails or phone numbers in your campaign tags and strips them so private info never leaks into URLs.",
        },
        {
          label: "Instant QR Downloads (SVG, PNG, JPG)",
          detail:
            "Generates a permanent QR code right in your browser—no link shorteners, no tracking redirects, and no expiration.",
        },
      ],
    },
    workedExample: {
      title: "Example links: Private beta launch",
      summary:
        "Campaign 'private-beta' across Product Hunt, Show HN, X, and LinkedIn with a slide-deck QR code.",
      metrics: [
        { label: "Product Hunt", value: "source=producthunt · medium=launch" },
        { label: "Hacker News", value: "source=hackernews · medium=community" },
        { label: "X Launch", value: "source=x · medium=social" },
        { label: "QR download", value: "SVG, PNG, or JPG (1024px)" },
      ],
    },
    interpretationGuide: [
      {
        band: "How Waitlyze tracks channels",
        guidance:
          "Waitlyze saves the utm_* tags from a visitor's first click and attaches them to their signup so you know which post drove verified users.",
      },
      {
        band: "Track verified signups, not just clicks",
        guidance:
          "Some channels send lots of curious clicks that don't confirm their email. Compare confirmed signups per link to find your best channel.",
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
      heading: "How the embed widget works on your site",
      summary:
        "Pick your layout, colors, and framework on the left, test the signup and post-signup screens in the preview, and copy one short snippet to drop onto your website.",
      formula:
        "Safe drop-in: Uses only your public waitlist ID, loads after your page renders, and auto-resizes to fit.",
      items: [
        {
          label: "Four Flexible Layouts",
          detail:
            "Choose an Inline form or Compact pill right inside your hero, or a Popup modal / Slide-over drawer triggered by a button.",
        },
        {
          label: "Forwards Referrals & UTMs Automatically",
          detail:
            "Passes ?r= referral codes and utm_* campaign tags from your website URL straight into the Waitlyze form.",
        },
        {
          label: "Zero Slowdown & Zero Exposed Keys",
          detail:
            "Loads in the background without blocking your headline, and never puts secret API keys into your frontend code.",
        },
        {
          label: "Works With Your Stack",
          detail:
            "Generates copy-ready code for Next.js, React, Framer, Webflow, Shopify, and plain HTML.",
        },
      ],
    },
    workedExample: {
      title: "Example setup: Next.js hero signup pill",
      summary:
        "A compact email + button bar placed right in a Next.js hero section using lazy loading.",
      metrics: [
        { label: "Layout", value: "Compact inline pill" },
        { label: "Page speed impact", value: "Non-blocking (lazy loaded)" },
        { label: "Referral tracking", value: "Automatic (?r= & UTMs)" },
        { label: "Supported platforms", value: "Next.js, React, Framer, Webflow, Shopify, HTML" },
      ],
    },
    interpretationGuide: [
      {
        band: "Inline / Pill vs. Modal / Drawer",
        guidance:
          "Put an Inline or Compact pill form right in your hero section so visitors see it immediately. Use a Modal or Drawer button in your navbar or docs.",
      },
      {
        band: "Keep button text readable",
        guidance:
          "Make sure your button text color has strong contrast against your button background (like dark text on bright lime).",
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
      heading: "How your list health score is calculated",
      summary:
        "Your list starts at 100 points. We scan every email right inside your browser (nothing is uploaded) and subtract points for risky, fake, or duplicate entries so you know how safe your list is before sending.",
      formula:
        "Starts at 100, then deducts points based on the % of typos, burner domains, duplicate aliases, role addresses, and signup bursts.",
      items: [
        {
          label: "1. Typos & Bad Emails",
          detail:
            "Finds malformed addresses (like missing '@' or '.com') that would immediately bounce when you send launch emails.",
        },
        {
          label: "2. Temporary / Burner Domains",
          detail:
            "Spots disposable inbox sites like Mailinator, Yopmail, and 10MinuteMail that people use to farm referral rewards.",
        },
        {
          label: "3. Gmail Dot & '+alias' Duplicates",
          detail:
            "Catches when one person signs up multiple times using variations like alex+1@gmail.com and a.lex@gmail.com.",
        },
        {
          label: "4. Generic Inboxes & Spam Bursts",
          detail:
            "Flags shared addresses (like info@ or admin@) and rapid bursts of 4+ signups using the same referral code within 5 minutes.",
        },
      ],
    },
    workedExample: {
      title: "Example audit: 25-row sample waitlist",
      summary:
        "A mixed waitlist export containing real subscribers alongside burner emails, Gmail '+1' duplicates, and a typo.",
      metrics: [
        { label: "Clean deliverable rows", value: "13–15 clean contacts" },
        { label: "Disposable domains", value: "4 temporary inboxes caught" },
        { label: "Alias & burst flags", value: "7 suspicious rows flagged" },
        { label: "Download", value: "Cleaned CSV or Full tagged CSV" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100 · Healthy list",
        guidance:
          "Your list is clean and safe to email. Keep email confirmation turned on as new people join.",
      },
      {
        band: "60–84 · Needs a quick cleanup",
        guidance:
          "Download the Cleaned CSV above (which removes disposable and duplicate rows) before sending your launch email so your sender reputation stays protected.",
      },
      {
        band: "Below 60 · High bounce & spam risk",
        guidance:
          "Do not email the whole list at once. Export the cleaned rows first, turn on Strict fraud mode, and warm up with a smaller batch.",
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
      heading: "What each email DNS check means (in plain English)",
      summary:
        "Gmail, Outlook, and Yahoo check four public records on your domain before letting your launch emails into the inbox. We score your setup out of 100 and give you copy-paste fixes for anything missing.",
      formula: "Readiness (0–100): SPF (30) + DMARC (30) + MX Routing (20) + DKIM Signature (20).",
      items: [
        {
          label: "SPF · Approved Senders List (30 pts)",
          detail:
            "Lists which email services are allowed to send on behalf of your domain. Having two separate SPF records breaks it—merge them into one.",
        },
        {
          label: "DMARC · Spoof Protection Rule (30 pts)",
          detail:
            "Tells Gmail and Yahoo what to do if an email fails SPF or DKIM (quarantine or reject fakes) and where to send reports.",
        },
        {
          label: "MX · Active Mailbox Routing (20 pts)",
          detail:
            "Shows that your domain can receive replies and bounce notices—domains without MX records often look suspicious to spam filters.",
        },
        {
          label: "DKIM · Digital Signature Key (20 pts)",
          detail:
            "Checks your email provider's selector (like resend, google, or s1) for a public key that proves your emails weren't altered in transit.",
        },
      ],
    },
    workedExample: {
      title: "Example check: acme.example",
      summary: "SPF, MX, and Resend DKIM are set up properly, but the DMARC record is missing.",
      metrics: [
        { label: "SPF", value: "Pass (30 / 30)" },
        { label: "DMARC", value: "Missing _dmarc record (0 / 30)" },
        { label: "MX", value: "Pass (20 / 20)" },
        { label: "DKIM (resend)", value: "Pass (20 / 20)" },
      ],
    },
    interpretationGuide: [
      {
        band: "85–100 · Ready to send",
        guidance:
          "Your domain authentication is solid. Connect it in Waitlyze and send a quick test email to your own inbox to verify.",
      },
      {
        band: "60–84 · Fix missing records first",
        guidance:
          "Publish the suggested DNS TXT record above—usually DMARC or a single merged SPF record—and re-check in a few minutes.",
      },
      {
        band: "Below 60 · High spam-folder risk",
        guidance:
          "Launching without SPF and DMARC sends most emails straight to spam. Add the copyable DNS records above before inviting your waitlist.",
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
      heading: "How to read these waitlist benchmarks",
      summary:
        "Instead of a single average that gets skewed by one huge viral launch, we show the middle typical range (P25 to P75) so you can see honestly where your waitlist stands.",
      formula:
        "Signup rate = Signups ÷ Visitors | Confirmation rate = Confirmed ÷ Signups | Share rate = Sharers ÷ Confirmed.",
      items: [
        {
          label: "P25 · Bottom Quarter",
          detail:
            "If your number is below P25, there is usually an easy fix on your landing page, form length, or email setup.",
        },
        {
          label: "P50 · Typical Launch (Median)",
          detail: "Right in the middle of healthy launches in that category and traffic channel.",
        },
        {
          label: "P75 · Top Quarter",
          detail:
            "Strong performance—your headline, form, or referral incentive is resonating unusually well.",
        },
        {
          label: "30-Campaign Privacy Rule",
          detail:
            "We show planning ranges until at least 30 live, non-test campaigns exist in a segment so numbers are never guessed from tiny samples.",
        },
      ],
    },
    workedExample: {
      title: "Example: Reading a SaaS benchmark",
      summary:
        "If SaaS landing-page conversion ranges from 11% (P25) to 19% (Median) to 29% (P75), a page converting at 24% is comfortably above typical.",
      metrics: [
        { label: "P25 (Bottom quarter)", value: "11% — check page clarity" },
        { label: "P50 (Typical)", value: "19% — healthy baseline" },
        { label: "P75 (Top quarter)", value: "29% — strong execution" },
        { label: "Live data rule", value: "Requires 30+ campaigns per group" },
      ],
    },
    interpretationGuide: [
      {
        band: "Below P25 on Signup Rate",
        guidance:
          "Run the Waitlist Landing Page Grader. Usually the headline isn't specific enough, the form asks too much, or the link text didn't match the page.",
      },
      {
        band: "Below P25 on Email Confirmation",
        guidance:
          "Run the Email Deliverability Checker to fix missing SPF/DMARC records and move the confirm button to the top of Email #1.",
      },
      {
        band: "High Signups, Low Sharing",
        guidance:
          "People want your product, they just need a nudge—add a clear post-signup share card and a small Tier 1 reward for 1–3 referrals.",
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
