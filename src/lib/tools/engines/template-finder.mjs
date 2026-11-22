import { getGalleryMeta, TEMPLATE_IDS } from "@/lib/templates/gallery.mjs";

export const TEMPLATE_FINDER_OPTIONS = Object.freeze({
  categories: [
    { value: "saas", label: "B2B SaaS / Web App" },
    { value: "ai", label: "AI Product / Research Preview" },
    { value: "developer", label: "Developer Tool / API / CLI" },
    { value: "mobile", label: "Mobile App (iOS / Android)" },
    { value: "creator", label: "Newsletter / Creator Launch" },
    { value: "community", label: "Private Community / Membership" },
    { value: "event", label: "Live Event / Cohort / Workshop" },
    { value: "commerce", label: "Hardware / Pre-order / Drop" },
    { value: "other", label: "Other / Early Validation" },
  ],
  motions: [
    { value: "email_only", label: "Fast email capture" },
    { value: "referral_queue", label: "Verified referral queue" },
    { value: "milestone_rewards", label: "Milestone reward tiers" },
    { value: "beta_application", label: "Qualified beta application" },
  ],
  assets: [
    { value: "screenshots", label: "UI screenshots or mockups" },
    { value: "demo_video", label: "Product demo or walkthrough" },
    { value: "text_only", label: "Text-only stealth launch" },
  ],
  aesthetics: [
    { value: "clean_editorial", label: "Clean editorial light" },
    { value: "dark_technical", label: "Dark technical" },
    { value: "bold_contrast", label: "High-contrast bold" },
    { value: "warm_consumer", label: "Warm consumer" },
  ],
});

const TEMPLATE_PROFILES = Object.freeze({
  simple: {
    name: "Simple",
    categories: ["other", "saas", "creator", "developer"],
    assets: ["text_only", "screenshots"],
    motions: ["email_only", "referral_queue"],
    aesthetics: ["clean_editorial", "bold_contrast"],
    hasMedia: false,
  },
  saas: {
    name: "SaaS Beta",
    categories: ["saas", "ai", "developer"],
    assets: ["screenshots", "demo_video"],
    motions: ["email_only", "beta_application", "referral_queue"],
    aesthetics: ["clean_editorial", "bold_contrast"],
    hasMedia: true,
  },
  ai: {
    name: "AI Launch",
    categories: ["ai", "developer", "saas"],
    assets: ["demo_video", "screenshots"],
    motions: ["referral_queue", "beta_application", "email_only"],
    aesthetics: ["dark_technical", "bold_contrast"],
    hasMedia: true,
  },
  mobile: {
    name: "Mobile App",
    categories: ["mobile", "commerce"],
    assets: ["screenshots", "demo_video"],
    motions: ["referral_queue", "milestone_rewards", "email_only"],
    aesthetics: ["warm_consumer", "bold_contrast"],
    hasMedia: true,
  },
  creator: {
    name: "Newsletter & Creator",
    categories: ["creator", "community"],
    assets: ["text_only", "screenshots"],
    motions: ["email_only", "referral_queue"],
    aesthetics: ["clean_editorial", "warm_consumer"],
    hasMedia: false,
  },
  community: {
    name: "Private Community",
    categories: ["community", "creator", "saas"],
    assets: ["text_only", "screenshots"],
    motions: ["milestone_rewards", "referral_queue", "beta_application"],
    aesthetics: ["clean_editorial", "warm_consumer"],
    hasMedia: false,
  },
  event: {
    name: "Event & Cohort",
    categories: ["event", "community"],
    assets: ["text_only", "screenshots", "demo_video"],
    motions: ["email_only", "beta_application"],
    aesthetics: ["bold_contrast", "clean_editorial"],
    hasMedia: false,
  },
  commerce: {
    name: "Pre-order & Drop",
    categories: ["commerce", "mobile"],
    assets: ["screenshots", "demo_video"],
    motions: ["milestone_rewards", "referral_queue", "email_only"],
    aesthetics: ["warm_consumer", "clean_editorial"],
    hasMedia: true,
  },
  developer: {
    name: "Developer Tool",
    categories: ["developer", "ai", "saas"],
    assets: ["text_only", "screenshots", "demo_video"],
    motions: ["beta_application", "referral_queue", "email_only"],
    aesthetics: ["dark_technical", "clean_editorial"],
    hasMedia: false,
  },
  podcast: {
    name: "Podcast",
    categories: ["creator", "event"],
    assets: ["demo_video", "text_only"],
    motions: ["email_only", "referral_queue"],
    aesthetics: ["warm_consumer", "bold_contrast"],
    hasMedia: true,
  },
  restaurant: {
    name: "Restaurant Opening",
    categories: ["commerce", "event"],
    assets: ["screenshots", "text_only"],
    motions: ["email_only"],
    aesthetics: ["warm_consumer", "clean_editorial"],
    hasMedia: true,
  },
  fitness: {
    name: "Fitness Cohort",
    categories: ["event", "mobile", "community"],
    assets: ["demo_video", "screenshots"],
    motions: ["milestone_rewards", "referral_queue"],
    aesthetics: ["bold_contrast", "warm_consumer"],
    hasMedia: true,
  },
  nonprofit: {
    name: "Nonprofit & Cause",
    categories: ["community", "other"],
    assets: ["text_only", "screenshots"],
    motions: ["referral_queue", "email_only"],
    aesthetics: ["clean_editorial", "warm_consumer"],
    hasMedia: false,
  },
  blank: {
    name: "Blank Canvas",
    categories: ["other", "saas", "developer"],
    assets: ["text_only"],
    motions: ["email_only"],
    aesthetics: ["clean_editorial", "bold_contrast"],
    hasMedia: false,
  },
});

export function recommendTemplates({
  category = "saas",
  motion = "referral_queue",
  assets = "screenshots",
  aesthetic = "clean_editorial",
} = {}) {
  const scored = TEMPLATE_IDS.map((templateId) => {
    const profile = TEMPLATE_PROFILES[templateId];
    const galleryMeta = getGalleryMeta(templateId);

    // 1. Category fit (40 pts)
    let categoryScore = 10;
    const catIdx = profile.categories.indexOf(category);
    if (catIdx === 0) categoryScore = 40;
    else if (catIdx === 1) categoryScore = 30;
    else if (catIdx >= 2) categoryScore = 22;

    // 2. Asset readiness (25 pts)
    let assetScore = 12;
    const assetIdx = profile.assets.indexOf(assets);
    if (assetIdx === 0) assetScore = 25;
    else if (assetIdx >= 1) assetScore = 19;
    if (assets === "text_only" && profile.hasMedia) {
      assetScore = 8;
    }

    // 3. Conversion motion (20 pts)
    let motionScore = 9;
    const motionIdx = profile.motions.indexOf(motion);
    if (motionIdx === 0) motionScore = 20;
    else if (motionIdx === 1) motionScore = 16;
    else if (motionIdx >= 2) motionScore = 13;

    // 4. Aesthetic alignment (15 pts)
    let aestheticScore = 6;
    const aesIdx = profile.aesthetics.indexOf(aesthetic);
    if (aesIdx === 0) aestheticScore = 15;
    else if (aesIdx >= 1) aestheticScore = 11;

    const total = Math.min(99, categoryScore + assetScore + motionScore + aestheticScore);

    const whyItFits = [];
    const categoryOption = TEMPLATE_FINDER_OPTIONS.categories.find((c) => c.value === category);
    const categoryLabel = categoryOption?.label || category;
    const rawBestFor = galleryMeta?.bestFor?.[0] || "this launch type";
    const formattedBestFor = /^[A-Z0-9]{2,}|^SaaS|^iOS/.test(rawBestFor)
      ? rawBestFor
      : rawBestFor.charAt(0).toLowerCase() + rawBestFor.slice(1);
    if (catIdx === 0) {
      whyItFits.push(`Built specifically for ${formattedBestFor}.`);
    } else if (catIdx > 0) {
      whyItFits.push(`Adapts cleanly to ${categoryLabel} messaging with minimal section edits.`);
    }
    if (assets === "text_only" && !profile.hasMedia) {
      whyItFits.push("Leads with typography and structure—no empty screenshot slots to fill.");
    } else if (assets !== "text_only" && profile.hasMedia) {
      whyItFits.push("Includes a dedicated visual showcase area for your product preview.");
    }
    if (motion === "milestone_rewards" || motion === "referral_queue") {
      whyItFits.push("Pairs smoothly with Waitlyze verified referral links and queue updates.");
    } else if (motion === "beta_application") {
      whyItFits.push(
        "Leaves clean vertical rhythm for 2–3 structured intake qualification fields.",
      );
    } else {
      whyItFits.push("Keeps the email signup form immediately visible above the fold.");
    }

    const recommendedSections = [];
    if (assets === "text_only" && profile.hasMedia) {
      recommendedSections.push("Hide the media block until you have a live screenshot");
    }
    if (motion === "milestone_rewards") {
      recommendedSections.push(
        "Enable Referral Rewards ladder block (3, 5, 10 verified referrals)",
      );
    } else if (motion === "referral_queue") {
      recommendedSections.push("Enable post-signup referral share link & live queue points");
    } else if (motion === "beta_application") {
      recommendedSections.push("Add 2 structured select fields (Role + Use case) for VIP triage");
    } else {
      recommendedSections.push("Keep email-only form + double opt-in verification enabled");
    }
    recommendedSections.push("Replace starter FAQ answers with your real launch timeline");

    const formGuidance =
      motion === "beta_application"
        ? "Use email + 2–3 tappable select fields; avoid long open textareas."
        : motion === "email_only"
          ? "Single email field with clear privacy microcopy maximizes conversion."
          : "Keep signup to email-only, then show the referral link immediately after submit.";

    return {
      templateId,
      name: profile.name,
      useCase: galleryMeta?.useCase || "",
      bestFor: galleryMeta?.bestFor || [],
      score: total,
      matchLabel: total >= 88 ? "Best match" : total >= 76 ? "Strong fit" : "Workable option",
      whyItFits: whyItFits.slice(0, 3),
      recommendedSections,
      formGuidance,
      blueprintPreset: {
        templateId,
        showReferrals: motion === "referral_queue" || motion === "milestone_rewards",
        sectionsPatch: {
          hideMedia: assets === "text_only",
        },
        referralConfig:
          motion === "milestone_rewards"
            ? {
                enabled: true,
                rewardTiers: [
                  { referrals: 3, reward: "Priority beta queue jump" },
                  { referrals: 5, reward: "Early founder access invite" },
                  { referrals: 10, reward: "Founding supporter perk" },
                ],
              }
            : { enabled: motion === "referral_queue" },
        summaryBullets: [
          `Template matched: ${profile.name} (${total}% fit score)`,
          `Conversion motion: ${motion.replaceAll("_", " ")}`,
          assets === "text_only"
            ? "Empty media slots hidden automatically for stealth launch"
            : "Visual media block kept visible for product proof",
        ],
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    inputs: { category, motion, assets, aesthetic },
    recommendations: scored.slice(0, 3),
    formula:
      "Match Score = Category Fit (40) + Asset Readiness (25) + Conversion Motion (20) + Aesthetic Alignment (15)",
  };
}
