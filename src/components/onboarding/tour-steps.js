/**
 * Waitlyze Product Tour chapters & slides.
 *
 * Each chapter maps to a real area of the Waitlyze dashboard captured from the
 * "Nova Studio" sample workspace at 1280×800 (2560×1600 @2x retina).
 */

export const TOUR_SHOTS = [
  "/images/onboarding/01-waitlists.png",
  "/images/onboarding/02-builder.png",
  "/images/onboarding/02a-after-signup.png",
  "/images/onboarding/02b-embed.png",
  "/images/onboarding/03-subscribers.png",
  "/images/onboarding/04-broadcasts.png",
  "/images/onboarding/05-automations.png",
  "/images/onboarding/06-analytics.png",
  "/images/onboarding/07-webhooks.png",
  "/images/onboarding/08-workspace.png",
];

export const TOUR_CHAPTERS = [
  {
    id: "overview",
    name: "Overview",
    slides: [
      {
        id: "overview",
        scene: "overview",
        lead: "Welcome to Waitlyze.",
        title: "Every launch in one place.",
        body: "Track visitors, verified subscribers, and conversion rates across all your waitlists from a single dashboard.",
        points: [
          "Live visitors, signups, and conversion rate",
          "Filter by Draft, Published, or Paused",
          "Create a new waitlist in seconds",
        ],
      },
    ],
  },
  {
    id: "builder",
    name: "Page builder",
    slides: [
      {
        id: "hosted-page",
        scene: "builderHosted",
        lead: "Hosted page.",
        title: "Design your waitlist with live blocks.",
        body: "Reorder sections on the left, preview desktop and mobile in the center, and customize copy and styling on the right.",
        points: [
          "Pre-built Hero, Benefits, FAQ, and Form blocks",
          "Custom signup questions to qualify leads",
          "Private draft autosave until you publish",
        ],
      },
      {
        id: "after-signup",
        scene: "builderAfterSignup",
        lead: "After signup.",
        title: "Turn signups into a referral loop.",
        body: "Show subscribers their live queue position, referral points, and personal share link right after they join.",
        points: [
          "Confirmed, Pending, and Returning states",
          "Live queue rank and referral points",
          "Optional redirect to your own URL",
        ],
      },
      {
        id: "publish-embed",
        scene: "builderEmbed",
        lead: "Publish & share.",
        title: "Host on Waitlyze or embed anywhere.",
        body: "Publish to a hosted URL, connect a custom domain, or paste the two-line widget onto your own site.",
        points: [
          "Auto-resizing two-line embed snippet",
          "Automatic UTM and referral (?r=) forwarding",
          "Built-in SEO and Open Graph settings",
        ],
      },
    ],
  },
  {
    id: "signups",
    name: "Signups & referrals",
    slides: [
      {
        id: "subscribers",
        scene: "signups",
        lead: "Signups.",
        title: "Inspect every subscriber and referral.",
        body: "View location, acquisition source, queue rank, points, and verification status for everyone on your list.",
        points: [
          "Audit flagged signups in Referral review",
          "Bulk CSV import and filtered export",
          "Search and filter by verification status",
        ],
      },
    ],
  },
  {
    id: "broadcasts",
    name: "Broadcasts",
    slides: [
      {
        id: "broadcasts",
        scene: "broadcasts",
        lead: "Broadcasts.",
        title: "Send cohort updates and beta invites.",
        body: "Compose announcements with the visual editor or HTML, preview the email, and confirm your recipient list before sending.",
        points: [
          "Saved templates for updates and rollouts",
          "Visual block editor and raw HTML mode",
          "Sends from your connected Resend domain",
        ],
      },
    ],
  },
  {
    id: "automations",
    name: "Automations",
    slides: [
      {
        id: "automations",
        scene: "automations",
        lead: "Automations.",
        title: "Trigger emails on signup and milestones.",
        body: "Run automatic welcome emails, referral nudges, and milestone rewards as subscribers move up the queue.",
        points: [
          "5 built-in lifecycle email recipes",
          "Configurable delay in hours or days",
          "Dynamic variables like {{waitlist}}",
        ],
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    slides: [
      {
        id: "analytics",
        scene: "analytics",
        lead: "Analytics.",
        title: "Measure conversion and viral K-factor.",
        body: "Compare your conversion and verification rates against launch benchmarks and see which channels drive growth.",
        points: [
          "Conversion, verification, and K-factor KPIs",
          "Benchmark comparison badges",
          "Traffic sources, UTM, country, and device breakdown",
        ],
      },
    ],
  },
  {
    id: "webhooks",
    name: "Webhooks & domains",
    slides: [
      {
        id: "webhooks",
        scene: "webhooks",
        lead: "Waitlist settings.",
        title: "Stream signed events to your stack.",
        body: "Configure referral rules, custom domains, Slack or Discord notifications, and signed webhook endpoints per waitlist.",
        points: [
          "HMAC-SHA256 signed webhook payloads",
          "Custom domains with automatic SSL",
          "Real-time Slack and Discord signup alerts",
        ],
      },
    ],
  },
  {
    id: "workspace",
    name: "Workspace & API",
    slides: [
      {
        id: "workspace",
        scene: "workspace",
        lead: "Workspace & API.",
        title: "Manage your team, billing, and API keys.",
        body: "Invite teammates, connect Resend once for all waitlists, and generate scoped API keys for custom server-side flows.",
        points: [
          "Waitlist- or workspace-scoped API keys",
          "Role-based team access and audit logs",
          "One-click Resend email integration",
        ],
      },
    ],
  },
];

export const TOUR_SLIDES = TOUR_CHAPTERS.flatMap((chapter, ci) =>
  chapter.slides.map((slide, si) => ({
    ...slide,
    chapter,
    ci,
    si,
  })),
);
