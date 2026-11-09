import { SITE_URL } from "@/lib/site-metadata";

export function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ label, href }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: label,
      item: `${SITE_URL}${href}`,
    })),
  };
}
export const RESEARCHED_ON = "November 9, 2026";

/**
 * Feature levels drive the status marker shown beside every value.
 * - included: available on the free or entry plan
 * - paid: available, but only on a paid tier
 * - limited: available in a reduced form
 * - none: not offered for this use case
 */
export const FEATURE_LEVELS = {
  included: "Included",
  paid: "Paid plan",
  limited: "Limited",
  none: "Not offered",
};

export const featureRows = [
  {
    key: "pageBuilder",
    label: "Hosted page builder",
    hint: "Design and publish a page without your own site.",
  },
  {
    key: "referrals",
    label: "Referral program",
    hint: "Personal share links that move people up the list.",
  },
  {
    key: "email",
    label: "Audience email",
    hint: "Broadcasts and follow-ups to your list.",
  },
  {
    key: "analytics",
    label: "Launch analytics",
    hint: "Visitors, signups, conversion, and sources.",
  },
  {
    key: "customDomain",
    label: "Custom domain",
    hint: "Serve the hosted page from your own domain.",
  },
  {
    key: "api",
    label: "API access",
    hint: "Collect signups or sync data from your own stack.",
  },
];

export const pricingRows = [
  { key: "freePlan", label: "Free starting point" },
  { key: "price", label: "Lowest paid plan" },
  { key: "model", label: "Pricing model" },
];

export const waitlyze = {
  name: "Waitlyze",
  slug: "waitlyze",
  logo: "/web-app-manifest-192x192.png",
  price: "$15/mo or $50/yr",
  freePlan: "1 waitlist, 100 signups",
  model: "Flat price per workspace",
  entryMonthly: 15,
  entryAnnual: 50,
  features: {
    pageBuilder: { level: "included", label: "Every plan" },
    referrals: { level: "included", label: "Every plan" },
    email: { level: "paid", label: "Pro" },
    analytics: { level: "paid", label: "Pro" },
    customDomain: { level: "paid", label: "Pro" },
    api: { level: "included", label: "Every plan" },
  },
  plans: [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      items: [
        "1 waitlist and 100 signups",
        "Hosted page, templates, and embed",
        "Verified referrals and API access",
      ],
    },
    {
      name: "Pro",
      price: "$15",
      cadence: "per month, or $50 per year",
      items: [
        "Unlimited waitlists, signups, and teammates",
        "Email broadcasts, analytics, and custom domains",
        "Remove Waitlyze branding",
      ],
    },
  ],
};

export const waitlyzeHighlights = [
  {
    icon: "page",
    title: "A hosted page, not just a form",
    copy: "Start from a template, edit in a live preview, and publish to a hosted link or embed. Drafts stay private until you publish, and you can roll back.",
  },
  {
    icon: "shield",
    title: "Referrals that only count real people",
    copy: "Referred signups must confirm their email before they earn credit, and Cloudflare Turnstile keeps bots off the form.",
  },
  {
    icon: "mail",
    title: "Email to people who asked for it",
    copy: "Welcome messages, reminders, and broadcasts go only to verified subscribers who opted in, from your own verified sender.",
  },
  {
    icon: "analytics",
    title: "Analytics that explain the launch",
    copy: "Visitors, signups, conversion, and verification, with breakdowns by source, device, geography, and landing page.",
  },
  {
    icon: "code",
    title: "Fits into your stack",
    copy: "Scoped API keys for server-side signups, signed webhooks, and Slack or Discord notifications.",
  },
  {
    icon: "source",
    title: "Open source, and your list stays yours",
    copy: "Read the code on GitHub, import an existing list, and export subscribers to CSV whenever you need.",
  },
];

export const competitors = [
  {
    name: "GetWaitlist",
    whereTheyWinToday:
      "If you already have a mature website and solely need a drop-in widget with unlimited signups on an entry plan, GetWaitlist does that better than we do today. Their entry tier ($15/mo) gives you unlimited leads without workspace boundaries, making it very cost-effective if you will never need a hosted page builder.",
    whoShouldPickThemSummary:
      "Teams that already built their own marketing pages and just need a drop-in widget with referral leaderboards and custom questions.",
    slug: "getwaitlist",
    logo: "/competitors/getwaitlist.png",
    category: "Signup widget",
    price: "$15/mo",
    freePlan: "None for new accounts",
    freePlanAnswer:
      "GetWaitlist no longer offers a free plan to new accounts; paid plans start at $15 a month.",
    model: "Flat feature tiers",
    entryMonthly: 15,
    features: {
      pageBuilder: { level: "limited", label: "Widget only" },
      referrals: { level: "paid", label: "Basic · $15/mo" },
      email: { level: "paid", label: "Basic · $15/mo" },
      analytics: { level: "paid", label: "Advanced on Pro · $250/mo" },
      customDomain: { level: "none", label: "Not for hosted pages" },
      api: { level: "paid", label: "Basic · $15/mo" },
    },
    summary:
      "GetWaitlist is built around a signup widget that you place on a site you already have. Waitlyze gives you the hosted page as well as the list, with a free plan to start and analytics included in Pro.",
    pricingStory:
      "Flat tiers with unlimited signups on the entry plan. There is no free plan for new accounts, and advanced analytics sit on a much higher tier.",
    bestFor: "Teams that already have a site and mainly need a capable signup widget.",
    verdict:
      "Choose Waitlyze when the hosted page and the launch workspace matter as much as the form.",
    chooseWaitlyze: [
      "You don’t have a site yet and want a polished hosted page today",
      "You want to start free and only pay once the launch is working",
      "You want launch analytics without jumping to a high tier",
    ],
    chooseThem: [
      "Your marketing site already exists and you only need a widget",
      "You want unlimited signups on the first paid plan",
      "Your team is comfortable wiring the widget into its own pages",
    ],
    strengths: [
      "Unlimited signups on its entry paid plan",
      "Referral leaderboards and custom questions",
      "API and webhook access on Basic",
    ],
    tradeoffs: [
      "No free plan for new accounts",
      "The hosted experience centers on its widget",
      "Custom email branding and advanced analytics sit on higher tiers",
    ],
  },
  {
    name: "LaunchList",
    whereTheyWinToday:
      "If your launch relies on complex referral scoring, fraud risk checks, or connecting with dozens of third-party tools via pre-built integrations, LaunchList offers a broader referral toolkit today. Their entry tier ($9/mo) is cheaper for small contact lists, and they have built-in trust scoring that flags suspicious referral activity.",
    whoShouldPickThemSummary:
      "Growth marketers and campaign organizers who want detailed referral mechanics, gamified rewards, and integrations with their existing automation stack.",
    slug: "launchlist",
    logo: "/competitors/launchlist.png",
    category: "Waitlist and referral builder",
    price: "$9/mo",
    freePlan: "100 contacts",
    freePlanAnswer: "Yes. LaunchList’s free plan covers up to 100 contacts.",
    model: "Priced by contacts",
    entryMonthly: 9,
    features: {
      pageBuilder: { level: "included", label: "Free plan" },
      referrals: { level: "included", label: "Free plan" },
      email: { level: "paid", label: "Collect · $9/mo" },
      analytics: { level: "included", label: "Included" },
      customDomain: { level: "paid", label: "Collect · $9/mo" },
      api: { level: "included", label: "Every plan" },
    },
    summary:
      "LaunchList is a broad waitlist builder with deep referral mechanics and many integrations. Waitlyze trades some of that breadth for a calmer workflow and a flat workspace price that doesn’t climb with every new contact.",
    pricingStory:
      "The cheapest entry price in this group, but plans are sized by contact count, so the bill steps up as the list grows.",
    bestFor:
      "Launches that need deep referral mechanics, trust scoring, and many integration options.",
    verdict:
      "Choose Waitlyze when predictable workspace pricing and a focused launch workflow matter more than the broadest referral toolkit.",
    chooseWaitlyze: [
      "You expect the list to grow and want the price to stay flat",
      "You prefer a focused workflow over a long settings list",
      "You want teammates, analytics, and email under one simple plan",
    ],
    chooseThem: [
      "You need advanced referral rewards and trust scoring",
      "You rely on a wide range of ready-made integrations",
      "Your list will stay small enough for the lower contact tiers",
    ],
    strengths: [
      "Strong page and form builder",
      "Referral rewards and trust checks",
      "Broad developer and automation surface",
    ],
    tradeoffs: [
      "Price grows with contact count",
      "Email and branding depend on plan",
      "Its larger feature surface can be more than a simple launch needs",
    ],
  },
  {
    name: "Prefinery",
    whereTheyWinToday:
      "If you are an established brand running a large-scale referral program with sophisticated rule-based email automations, webhook payloads, and multi-tier rewards, Prefinery has over a decade of dedicated campaign infrastructure. They offer deeper enterprise campaign configuration and unlimited email sends on published plans.",
    whoShouldPickThemSummary:
      "Established teams and marketing departments with the budget ($49 to $249+/mo) for a dedicated referral marketing platform with enterprise campaign controls.",
    slug: "prefinery",
    logo: "/competitors/prefinery.png",
    category: "Referral campaign platform",
    price: "$49/mo",
    freePlan: "14-day trial",
    freePlanAnswer: "No. Prefinery offers a 14-day trial, then paid plans start at $49 a month.",
    model: "Plan plus additional users",
    entryMonthly: 49,
    features: {
      pageBuilder: { level: "limited", label: "Embedded form only" },
      referrals: { level: "paid", label: "Lite · $49/mo" },
      email: { level: "paid", label: "Lite · $49/mo" },
      analytics: { level: "limited", label: "Basic on Lite" },
      customDomain: { level: "none", label: "Not for hosted pages" },
      api: { level: "paid", label: "Essentials · $249/mo" },
    },
    summary:
      "Prefinery is a mature referral campaign platform aimed at established teams with larger budgets. Waitlyze is built for founders who want a complete hosted launch page and a meaningful free plan.",
    pricingStory:
      "No permanent free plan, a $49 monthly starting point, and API access reserved for a much higher tier. Extra users add to the bill.",
    bestFor: "Established teams running referral-first campaigns with larger budgets.",
    verdict:
      "Choose Waitlyze when you need a complete hosted launch page and a meaningful free starting point.",
    chooseWaitlyze: [
      "You need a hosted page, not just a form to embed",
      "You want API access without a $249 plan",
      "You’re validating an idea and want to start free",
    ],
    chooseThem: [
      "Referral campaigns are the core of your growth plan",
      "You have the budget for a dedicated campaign platform",
      "You need mature campaign controls for a large audience",
    ],
    strengths: [
      "Mature referral campaign controls",
      "Unlimited emails on published plans",
      "API, webhooks, and integrations on Essentials and above",
    ],
    tradeoffs: [
      "No permanent free plan",
      "Starts at $49 per month",
      "Hosted landing-page design is not the core product",
    ],
  },
  {
    name: "KickoffLabs",
    whereTheyWinToday:
      "If you are running viral giveaways, contests, sweepstakes, or need multi-variant A/B split testing to optimize landing page conversion, KickoffLabs is specialized for contest mechanics in ways Waitlyze is not designed to be. Their platform supports reward tiers, instant-win contests, and leaderboard scoring.",
    whoShouldPickThemSummary:
      "Campaign managers and event organizers running gamified giveaways, sweepstakes, or viral contests that need A/B testing and reward levels.",
    slug: "kickofflabs",
    logo: "/competitors/kickofflabs.png",
    category: "Viral campaign builder",
    price: "$49/mo billed monthly",
    freePlan: "50 new leads per month",
    freePlanAnswer: "Yes. KickoffLabs’ free plan allows 50 new leads per month.",
    model: "Priced by new monthly leads",
    entryMonthly: 49,
    features: {
      pageBuilder: { level: "included", label: "Included" },
      referrals: { level: "included", label: "Free plan" },
      email: { level: "paid", label: "Starter · $49/mo" },
      analytics: { level: "paid", label: "Paid plans" },
      customDomain: { level: "paid", label: "Starter · $49/mo" },
      api: { level: "paid", label: "Paid plans" },
    },
    summary:
      "KickoffLabs is a campaign builder for giveaways, contests, and viral launches, with scoring and experimentation. Waitlyze is a simpler, product-first waitlist with lower, predictable workspace pricing.",
    pricingStory:
      "Plans are sized by new leads each month, so a successful week can push you up a tier. Paid plans begin at $49 on monthly billing.",
    bestFor: "Giveaways, contests, and campaign teams that need scoring and experimentation.",
    verdict:
      "Choose Waitlyze for a simpler product waitlist with lower, predictable workspace pricing.",
    chooseWaitlyze: [
      "You’re launching a product, not running a contest",
      "You want a price that doesn’t move with monthly signup spikes",
      "You want email and analytics for $15 a month",
    ],
    chooseThem: [
      "You run giveaways or contests alongside your launch",
      "You want A/B testing and lead scoring built in",
      "You need several campaign types under one account",
    ],
    strengths: [
      "Campaign and landing-page tooling",
      "Reward levels and referral scoring",
      "A/B testing on Growth",
    ],
    tradeoffs: [
      "Paid plans begin at $49 monthly",
      "Allowance is based on new leads each month",
      "Removing branding requires a higher plan",
    ],
  },
  {
    name: "Viral Loops",
    whereTheyWinToday:
      "If you are looking beyond a pre-launch waitlist to an ongoing, multi-program referral engine (like a newsletter milestone program or in-app invite-a-friend loop), Viral Loops is built for that broader lifecycle. They offer battle-tested templates inspired by Dropbox and Robinhood for various post-launch growth stages.",
    whoShouldPickThemSummary:
      "Companies wanting a single referral platform for both pre-launch buzz and permanent post-launch customer referral programs.",
    slug: "viral-loops",
    logo: "/competitors/viral-loops.png",
    category: "Referral marketing suite",
    price: "$49/mo",
    freePlan: "14-day trial, up to 10 participants",
    freePlanAnswer:
      "No. Viral Loops offers a 14-day trial limited to 10 participants, then paid plans start at $49 a month.",
    model: "Priced by participants",
    entryMonthly: 49,
    features: {
      pageBuilder: { level: "limited", label: "Template-based" },
      referrals: { level: "paid", label: "Start-up · $49/mo" },
      email: { level: "limited", label: "Notifications" },
      analytics: { level: "paid", label: "All paid plans" },
      customDomain: { level: "paid", label: "Plus plan" },
      api: { level: "paid", label: "Plus plan" },
    },
    summary:
      "Viral Loops is a referral marketing suite that covers customer referrals and lead generation as well as pre-launch waitlists. Waitlyze keeps the waitlist itself at the center of the launch.",
    pricingStory:
      "No permanent free plan, a short trial capped at 10 participants, and pricing that grows with total participants. Several developer features need higher tiers.",
    bestFor: "Companies running several types of referral program beyond a pre-launch waitlist.",
    verdict:
      "Choose Waitlyze when the waitlist itself—not a general referral program—is the center of your launch.",
    chooseWaitlyze: [
      "Your goal is a pre-launch waitlist, not an ongoing referral program",
      "You want broadcasts and follow-ups, not just notification emails",
      "You want API access and a custom domain without a top-tier plan",
    ],
    chooseThem: [
      "You plan to run customer referral programs after launch",
      "You want many referral campaign templates in one tool",
      "Fraud controls across several programs matter to you",
    ],
    strengths: [
      "Multiple referral campaign templates",
      "Rewards and fraud controls",
      "Customer and lead-generation referral programs",
    ],
    tradeoffs: [
      "No permanent free plan",
      "Pricing grows with total participants",
      "Several developer features require higher tiers",
    ],
  },
  {
    name: "Waitlister",
    whereTheyWinToday:
      "If you want unlimited subscribers immediately from the first paid tier ($19/mo) and prefer their curated visual themes and straightforward setup, Waitlister delivers a clean, focused experience. Their pricing is tied directly to subscriber limits without workspace tiering.",
    whoShouldPickThemSummary:
      "Founders who want an established all-in-one waitlist product with pre-set templates and unlimited subscribers on the entry plan.",
    slug: "waitlister",
    logo: "/competitors/waitlister.png",
    category: "All-in-one waitlist",
    price: "$19/mo",
    freePlan: "100 subscribers",
    freePlanAnswer: "Yes. Waitlister’s free plan covers up to 100 subscribers.",
    model: "Flat feature tiers",
    entryMonthly: 19,
    features: {
      pageBuilder: { level: "included", label: "Free plan" },
      referrals: { level: "paid", label: "Launch · $19/mo" },
      email: { level: "paid", label: "Launch · $19/mo" },
      analytics: { level: "included", label: "Included" },
      customDomain: { level: "paid", label: "Pro · $29/mo" },
      api: { level: "paid", label: "Growth plan" },
    },
    summary:
      "Waitlister is a polished all-in-one waitlist with a page builder, referrals, and email. Waitlyze is the closest match in shape, with referrals and API access on the free plan, team controls, and a lower annual price.",
    pricingStory:
      "Clear flat tiers with unlimited subscribers on paid plans. Referrals and email start at $19 a month, custom domains at $29, and API access on Growth.",
    bestFor: "Founders who want a polished all-in-one waitlist with generous subscriber limits.",
    verdict:
      "Choose Waitlyze when you want referrals and API access from day one, team controls, and a lower annual price.",
    chooseWaitlyze: [
      "You want referrals running on the free plan",
      "You want a custom domain and API access for $15 a month",
      "You want teammates with editing, publishing, and email permissions",
    ],
    chooseThem: [
      "You prefer its templates and editor",
      "You want unlimited subscribers on the first paid plan",
      "You don’t need referrals until you’re ready to pay",
    ],
    strengths: [
      "Unlimited subscribers on paid plans",
      "Page builder, referrals, and email in one product",
      "Clear flat plan pricing",
    ],
    tradeoffs: [
      "Referrals and email begin on a paid plan",
      "Custom domains need the $29 plan",
      "API access requires the Growth plan",
    ],
  },
];

export function getCompetitor(slug) {
  return competitors.find((competitor) => competitor.slug === slug);
}

export function getRelatedCompetitors(slug) {
  return competitors.filter((competitor) => competitor.slug !== slug);
}

/** Twelve months at list price, so the difference in billing models is visible. */
export function getFirstYearCost(competitor) {
  return {
    waitlyzeAnnual: waitlyze.entryAnnual,
    waitlyzeMonthly: waitlyze.entryMonthly * 12,
    competitor: competitor.entryMonthly * 12,
  };
}

export function getCompetitorFaqs(competitor) {
  const cost = getFirstYearCost(competitor);
  const referrals = competitor.features.referrals;
  const referralCopy =
    referrals.level === "included"
      ? `${competitor.name} includes referrals on its free plan.`
      : `${competitor.name} offers referrals on ${referrals.label}.`;

  return [
    [
      `Is Waitlyze cheaper than ${competitor.name}?`,
      `Waitlyze Pro is $15 a month or $50 a year for the whole workspace, so twelve months costs $${cost.waitlyzeAnnual} on annual billing. ${competitor.name}’s lowest paid plan is ${competitor.price} (${competitor.model.toLowerCase()}), or about $${cost.competitor} a year at its monthly list price. Waitlyze also has a free plan for your first 100 signups.`,
    ],
    [
      `Does ${competitor.name} have a free plan?`,
      `${competitor.freePlanAnswer} Waitlyze is free for one waitlist and 100 signups, with no credit card required.`,
    ],
    [
      `Which is better for referrals, Waitlyze or ${competitor.name}?`,
      `${referralCopy} Waitlyze includes referrals on every plan: verified subscribers get a personal link, and referred signups only count after they confirm their email, which keeps the leaderboard honest.`,
    ],
    [
      `Can I move my waitlist from ${competitor.name} to Waitlyze?`,
      `Yes. Export your subscribers from ${competitor.name} as a CSV, import them into a Waitlyze waitlist, then update your launch links to your new hosted page or embed. Most launches can switch in an afternoon.`,
    ],
    [
      `Is Waitlyze open source?`,
      "Yes. Waitlyze is developed in the open on GitHub, so you can read the code, follow the changelog, and see exactly how your audience data is handled.",
    ],
  ];
}
