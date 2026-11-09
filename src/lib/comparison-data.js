export const RESEARCHED_ON = "November 9, 2026";

export const waitlyze = {
  name: "Waitlyze",
  slug: "waitlyze",
  price: "Free; Pro $15/mo or $50/yr",
  freePlan: "100 total signups and 1 waitlist",
  model: "Flat workspace plan",
  pageBuilder: "Free",
  referrals: "Free",
  email: "Pro · planned",
  analytics: "Pro · planned",
  customDomain: "Pro · planned",
  api: "Available",
  bestFor:
    "Founders who want the page, audience, referrals, email, and analytics in one calm workspace.",
  note: "Pro pricing and entitlements are part of the open billing work and may change before release.",
};

export const competitors = [
  {
    name: "GetWaitlist",
    slug: "getwaitlist",
    mark: "GW",
    price: "From $15/mo",
    freePlan: "Not available to new accounts",
    model: "Flat feature tiers",
    pageBuilder: "Widget only",
    referrals: "Basic · $15",
    email: "Basic · $15",
    analytics: "Pro · $250",
    customDomain: "Not for hosted pages",
    api: "Basic · $15",
    bestFor: "Teams that already have a site and mainly need a capable signup widget.",
    verdict:
      "Choose Waitlyze when the hosted page and the launch workspace matter as much as the form.",
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
    source: "https://getwaitlist.com/pricing",
  },
  {
    name: "LaunchList",
    slug: "launchlist",
    mark: "LL",
    price: "From $9/mo",
    freePlan: "100 contacts",
    model: "Priced by contacts",
    pageBuilder: "Free",
    referrals: "Free",
    email: "Collect · $9",
    analytics: "Available",
    customDomain: "Collect · $9",
    api: "Every plan",
    bestFor:
      "Launches that need deep referral mechanics, trust scoring, and many integration options.",
    verdict:
      "Choose Waitlyze when predictable workspace pricing and a focused launch workflow matter more than the broadest referral toolkit.",
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
    source: "https://getlaunchlist.com/compare",
  },
  {
    name: "Prefinery",
    slug: "prefinery",
    mark: "PF",
    price: "From $49/mo",
    freePlan: "14-day trial",
    model: "Plan plus additional users",
    pageBuilder: "Embed form only",
    referrals: "Lite · $49",
    email: "Lite · $49",
    analytics: "Basic on Lite",
    customDomain: "Not for hosted pages",
    api: "Essentials · $249",
    bestFor: "Established teams running referral-first campaigns with larger budgets.",
    verdict:
      "Choose Waitlyze when you need a complete hosted launch page and a meaningful free starting point.",
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
    source: "https://www.prefinery.com/pricing",
  },
  {
    name: "KickoffLabs",
    slug: "kickofflabs",
    mark: "KL",
    price: "From $49/mo monthly",
    freePlan: "50 new leads per month",
    model: "Priced by new monthly leads",
    pageBuilder: "Available",
    referrals: "Free",
    email: "Starter · $49",
    analytics: "Paid plans",
    customDomain: "Starter · $49",
    api: "Paid plans",
    bestFor: "Giveaways, contests, and campaign teams that need scoring and experimentation.",
    verdict:
      "Choose Waitlyze for a simpler product waitlist with lower, predictable workspace pricing.",
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
    source: "https://kickofflabs.com/pricing/",
  },
  {
    name: "Viral Loops",
    slug: "viral-loops",
    mark: "VL",
    price: "From $49/mo",
    freePlan: "14-day trial, limited to 10 participants",
    model: "Priced by participants",
    pageBuilder: "Template-based",
    referrals: "Start-up · $49",
    email: "Notifications",
    analytics: "Available",
    customDomain: "Plus plan",
    api: "Plus plan",
    bestFor: "Companies running several types of referral program beyond a pre-launch waitlist.",
    verdict:
      "Choose Waitlyze when the waitlist itself—not a general referral program—is the center of your launch.",
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
    source: "https://viral-loops.com/pricing",
  },
  {
    name: "Waitlister",
    slug: "waitlister",
    mark: "WL",
    price: "From $19/mo",
    freePlan: "100 subscribers",
    model: "Flat feature tiers",
    pageBuilder: "Free",
    referrals: "Launch · $19",
    email: "Launch · $19",
    analytics: "Available",
    customDomain: "Pro · $29",
    api: "Growth plan",
    bestFor: "Founders who want a polished all-in-one waitlist with generous subscriber limits.",
    verdict:
      "Choose Waitlyze when you prefer a workspace-first product with team controls and a lower planned annual price.",
    strengths: [
      "Unlimited subscribers on paid plans",
      "Page builder, referrals, and email in one product",
      "Clear flat plan pricing",
    ],
    tradeoffs: [
      "Referrals and email begin on a paid plan",
      "Some advanced features require Growth",
      "Waitlyze’s billing is workspace-based rather than subscriber-based",
    ],
    source: "https://waitlister.me/pricing",
  },
];

export const adjacentTools = [
  {
    name: "Kit",
    fit: "Email-first audience building",
    gap: "Not a purpose-built queue or referral waitlist",
  },
  {
    name: "Mailchimp",
    fit: "Broad email marketing",
    gap: "No native referral position or launch workflow",
  },
  {
    name: "Tally",
    fit: "Flexible forms",
    gap: "Needs other tools for referrals, queue position, and launch analytics",
  },
  {
    name: "Google Forms",
    fit: "Basic zero-cost collection",
    gap: "No branded page, referral loop, or launch operations",
  },
];

export const featureRows = [
  ["Free starting point", "freePlan"],
  ["Lowest paid plan", "price"],
  ["Pricing model", "model"],
  ["Hosted page builder", "pageBuilder"],
  ["Referral program", "referrals"],
  ["Audience email", "email"],
  ["Launch analytics", "analytics"],
  ["Custom domain", "customDomain"],
  ["API access", "api"],
];

export function getCompetitor(slug) {
  return competitors.find((competitor) => competitor.slug === slug);
}
