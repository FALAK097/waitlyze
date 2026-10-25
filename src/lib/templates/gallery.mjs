// Gallery metadata for the public template gallery (/templates).
// Pure data + helpers: safe to import from server components, the sitemap,
// and client components (no dependencies, no zod).

export const TEMPLATE_IDS = [
  "simple",
  "saas",
  "ai",
  "mobile",
  "creator",
  "community",
  "event",
  "commerce",
  "developer",
  "podcast",
  "restaurant",
  "fitness",
  "nonprofit",
  "blank",
];

export function isTemplateId(value) {
  return TEMPLATE_IDS.includes(value);
}

const gallery = {
  simple: {
    useCase: "One focused signup screen for any launch.",
    bestFor: ["Validating an idea fast", "Coming-soon pages", "Minimal first launches"],
    seoTitle: "Simple Waitlist Template",
    seoDescription:
      "A focused one-screen waitlist template. Collect emails with a clear headline and signup form. Free to use with Waitlyze.",
  },
  saas: {
    useCase: "A screenshot-led beta page with proof and answers.",
    bestFor: ["B2B beta launches", "Product-led onboarding", "Founding-team pricing"],
    seoTitle: "SaaS Beta Waitlist Template",
    seoDescription:
      "A SaaS beta waitlist template with product screenshots, social proof, stats, and FAQs. Launch your beta with Waitlyze.",
  },
  ai: {
    useCase: "A dark, demo-led page for an AI launch.",
    bestFor: ["AI product previews", "Monthly cohort access", "Research-preview signups"],
    seoTitle: "AI Product Waitlist Template",
    seoDescription:
      "A dark, demo-led AI waitlist template with workflow proof and cohort access. Collect early access signups with Waitlyze.",
  },
  mobile: {
    useCase: "A playful app launch page with tester love.",
    bestFor: ["iOS and Android launches", "Consumer app betas", "Launch-day download lists"],
    seoTitle: "Mobile App Waitlist Template",
    seoDescription:
      "A playful mobile app waitlist template with phone mock, tester quotes, and live signup count. Free with Waitlyze.",
  },
  creator: {
    useCase: "An editorial signup page with reader proof.",
    bestFor: ["Newsletters", "Creator launches", "Paid-subscriber funnels"],
    seoTitle: "Newsletter Waitlist Template",
    seoDescription:
      "An editorial newsletter waitlist template with issue previews and reader testimonials. Grow your audience with Waitlyze.",
  },
  community: {
    useCase: "An invite-only page with member proof and referrals.",
    bestFor: ["Private communities", "Membership launches", "Referral-driven growth"],
    seoTitle: "Community Waitlist Template",
    seoDescription:
      "An invite-only community waitlist template with member stories and referral rewards. Build your community with Waitlyze.",
  },
  event: {
    useCase: "A bold agenda page for a live date.",
    bestFor: ["Live workshops", "Course cohorts", "In-person sessions"],
    seoTitle: "Event Waitlist Template",
    seoDescription:
      "An event waitlist template with schedule, speaker proof, and seat registration. Fill your next session with Waitlyze.",
  },
  commerce: {
    useCase: "A slow-luxe product story with reservation intent.",
    bestFor: ["Small-batch pre-orders", "Product drops", "Batch-one reservations"],
    seoTitle: "Pre-order Waitlist Template",
    seoDescription:
      "A pre-order waitlist template with product storytelling and reservation intent. Launch your drop with Waitlyze.",
  },
  developer: {
    useCase: "A docs-first page with workflow, proof, and access contract.",
    bestFor: ["Developer tools", "API betas", "Infrastructure launches"],
    seoTitle: "Developer Tool Waitlist Template",
    seoDescription:
      "A docs-first developer tool waitlist template with workflow steps and straight answers. Launch your API beta with Waitlyze.",
  },
  podcast: {
    useCase: "A trailer-led page that turns listeners into subscribers.",
    bestFor: ["New shows", "Episode-zero launches", "Listener funnels"],
    seoTitle: "Podcast Waitlist Template",
    seoDescription:
      "A trailer-led podcast waitlist template with episode previews and listener quotes. Launch your show with Waitlyze.",
  },
  restaurant: {
    useCase: "A seasonal opening page with tastings and seats.",
    bestFor: ["Restaurant openings", "Tasting lists", "Reservation interest"],
    seoTitle: "Restaurant Opening Waitlist Template",
    seoDescription:
      "A restaurant opening waitlist template with seasonal storytelling and tasting proof. Fill your first seating with Waitlyze.",
  },
  fitness: {
    useCase: "A high-energy cohort page with proof and a start date.",
    bestFor: ["Fitness cohorts", "Challenge programs", "Coaching launches"],
    seoTitle: "Fitness Program Waitlist Template",
    seoDescription:
      "A high-energy fitness waitlist template with cohort proof and start-date urgency. Fill your next cohort with Waitlyze.",
  },
  nonprofit: {
    useCase: "A community cause page with transparent impact.",
    bestFor: ["Community projects", "Fundraising interest", "Volunteer signups"],
    seoTitle: "Nonprofit Waitlist Template",
    seoDescription:
      "A nonprofit waitlist template with transparent impact and referral rewards. Grow your cause with Waitlyze.",
  },
  blank: {
    useCase: "Only the essentials: a hero and a signup form.",
    bestFor: ["Starting from scratch", "Custom page structures", "Experienced builders"],
    seoTitle: "Blank Waitlist Template",
    seoDescription:
      "A blank waitlist template with just a hero and signup form. Build your page your way with Waitlyze.",
  },
};

export function getGalleryMeta(id) {
  return gallery[id] || null;
}
