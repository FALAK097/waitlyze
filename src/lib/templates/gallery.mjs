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
    seoTitle: "Free Simple Waitlist Landing Page Template",
    seoDescription:
      "Free simple one-screen waitlist landing page template with headline, single email signup form, and verified referrals. Customize and publish in minutes.",
  },
  saas: {
    useCase: "A screenshot-led beta page with proof and answers.",
    bestFor: ["B2B beta launches", "Product-led onboarding", "Founding-team pricing"],
    seoTitle: "Free SaaS Beta Waitlist Landing Page Template",
    seoDescription:
      "Free SaaS beta waitlist landing page template with product screenshots, customer logos, product benefits, and FAQs. Customize and launch your beta for $0.",
  },
  ai: {
    useCase: "A dark, demo-led page for an AI launch.",
    bestFor: ["AI product previews", "Monthly cohort access", "Research-preview signups"],
    seoTitle: "Free AI Product Waitlist Landing Page Template",
    seoDescription:
      "Free dark-mode AI product waitlist landing page template with workflow demo, cohort access rules, and verified referral queue. Publish free with Waitlyze.",
  },
  mobile: {
    useCase: "A playful app launch page with tester love.",
    bestFor: ["iOS and Android launches", "Consumer app betas", "Launch-day download lists"],
    seoTitle: "Free Mobile App Waitlist Landing Page Template",
    seoDescription:
      "Free mobile app waitlist landing page template for iOS and Android launches with phone mockup, beta tester quotes, and referral queue positions.",
  },
  creator: {
    useCase: "An editorial signup page with reader proof.",
    bestFor: ["Newsletters", "Creator launches", "Paid-subscriber funnels"],
    seoTitle: "Free Newsletter & Creator Waitlist Landing Page Template",
    seoDescription:
      "Free editorial newsletter waitlist landing page template with reader testimonials, issue highlights, and email signup. Customize your creator launch for free.",
  },
  community: {
    useCase: "An invite-only page with member proof and referrals.",
    bestFor: ["Private communities", "Membership launches", "Referral-driven growth"],
    seoTitle: "Free Community & Membership Waitlist Template",
    seoDescription:
      "Free invite-only community waitlist landing page template with member stories, queue ranking, and referral reward tiers.",
  },
  event: {
    useCase: "A bold agenda page for a live date.",
    bestFor: ["Live workshops", "Course cohorts", "In-person sessions"],
    seoTitle: "Free Event & Cohort Waitlist Landing Page Template",
    seoDescription:
      "Free event and course cohort waitlist landing page template with agenda schedule, speaker proof, and seat reservation form.",
  },
  commerce: {
    useCase: "A slow-luxe product story with reservation intent.",
    bestFor: ["Small-batch pre-orders", "Product drops", "Batch-one reservations"],
    seoTitle: "Free Pre-Order & Product Drop Waitlist Template",
    seoDescription:
      "Free e-commerce pre-order and product drop waitlist landing page template with batch reservation form and early-access referral perks.",
  },
  developer: {
    useCase: "A docs-first page with workflow, proof, and access contract.",
    bestFor: ["Developer tools", "API betas", "Infrastructure launches"],
    seoTitle: "Free Developer Tool & API Beta Waitlist Template",
    seoDescription:
      "Free docs-first developer tool and API beta waitlist landing page template with technical workflow steps, architecture proof, and early-access signup.",
  },
  podcast: {
    useCase: "A trailer-led page that turns listeners into subscribers.",
    bestFor: ["New shows", "Episode-zero launches", "Listener funnels"],
    seoTitle: "Free Podcast Launch Waitlist Landing Page Template",
    seoDescription:
      "Free podcast launch waitlist landing page template with trailer preview, episode rundown, listener testimonials, and launch-day alerts.",
  },
  restaurant: {
    useCase: "A seasonal opening page with tastings and seats.",
    bestFor: ["Restaurant openings", "Tasting lists", "Reservation interest"],
    seoTitle: "Free Restaurant Opening & Tasting Waitlist Template",
    seoDescription:
      "Free restaurant opening waitlist landing page template for soft openings, tasting menus, and first-seating reservations.",
  },
  fitness: {
    useCase: "A high-energy cohort page with proof and a start date.",
    bestFor: ["Fitness cohorts", "Challenge programs", "Coaching launches"],
    seoTitle: "Free Fitness Program & Coaching Waitlist Template",
    seoDescription:
      "Free fitness program and coaching cohort waitlist landing page template with transformation testimonials, cohort details, and a start-date signup form.",
  },
  nonprofit: {
    useCase: "A community cause page with transparent impact.",
    bestFor: ["Community projects", "Fundraising interest", "Volunteer signups"],
    seoTitle: "Free Nonprofit & Community Cause Waitlist Template",
    seoDescription:
      "Free nonprofit and community cause waitlist landing page template with impact metrics, supporter mobilization, and verified referral sharing.",
  },
  blank: {
    useCase: "Only the essentials: a hero and a signup form.",
    bestFor: ["Starting from scratch", "Custom page structures", "Experienced builders"],
    seoTitle: "Free Blank Waitlist Landing Page Template",
    seoDescription:
      "Free minimalist blank waitlist landing page template with a clean hero, email verification form, and full visual builder customization.",
  },
};

export function getGalleryMeta(id) {
  return gallery[id] || null;
}
