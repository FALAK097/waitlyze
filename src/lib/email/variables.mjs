// Canonical founder→list template variables (Phase 7b).
//
// Every founder-composed send (templates, automations, broadcasts) resolves
// through here so {{name}} {{position}} {{referral_link}} {{points}}
// {{rewards}} behave identically everywhere. Unknown placeholders are left
// untouched so typos stay visible instead of silently blanking.

import { escapeHtmlText } from "../email-markdown.mjs";

export const VARIABLE_KEYS = [
  "name",
  "position",
  "referral_link",
  "referral_count",
  "points",
  "rewards",
  "waitlist",
  "waitlist_url",
  "email",
];

// Legacy keys still honored by older saved templates and the offboard flow.
export const LEGACY_VARIABLE_KEYS = ["expiry_time", "reason", "feedback_link", "total_signups"];

export function nameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "";
  // Strip plus-tags (john+promo → john) before humanizing.
  const cleaned = local
    .split("+")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!cleaned) return "there";
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pageUrl(waitlist) {
  const base = String(process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  if (!base || !waitlist?.publicSlug) return "";
  return `${base}/w/${encodeURIComponent(waitlist.publicSlug)}`;
}

// Build the full variable map for one subscriber. Anything the caller does
// not know (position, referralCount) falls back to a sensible default:
// position "" (hidden), referral_count "0", points "0", rewards "".
export function resolveSubscriberVars({ waitlist = {}, signup = {}, position, referralCount }) {
  const url = pageUrl(waitlist);
  const referralLink =
    url && waitlist.showReferrals !== false && signup.referralCode
      ? `${url}?r=${encodeURIComponent(signup.referralCode)}`
      : "";
  return {
    name: nameFromEmail(signup.email),
    email: signup.email || "",
    position: position == null ? "" : String(position),
    referral_link: referralLink,
    referral_count: String(referralCount ?? 0),
    points: String(signup.points ?? 0),
    rewards: "",
    waitlist: waitlist.name || "the waitlist",
    waitlist_url: url,
    expiry_time: "",
    reason: "",
    feedback_link: "",
    total_signups: "",
  };
}

// Seed values used for test sends and editor previews. They deliberately look
// like real data so founders can judge the layout before sending.
export function seedPreviewVars(waitlistName = "Acme") {
  return {
    name: "Ada",
    email: "ada@example.com",
    position: "42",
    referral_link: "https://example.com/w/acme?r=demo123",
    referral_count: "5",
    points: "230",
    rewards: "Early access",
    waitlist: waitlistName,
    waitlist_url: "https://example.com/w/acme",
    expiry_time: "24 hours",
    reason: "an update about your place",
    feedback_link: "https://example.com/feedback",
    total_signups: "1,248",
  };
}

const PLACEHOLDER = /\{\{\s*([a-z_]+)\s*\}\}/gi;

// Plain-text interpolation: known keys fall back to their default ("" when
// unknown to the sender), unknown keys are preserved verbatim.
export function interpolateVars(value, vars) {
  return String(value || "").replace(PLACEHOLDER, (match, name) => {
    const key = String(name).toLowerCase();
    if (Object.hasOwn(vars || {}, key)) return String(vars[key] ?? "");
    return match;
  });
}

// HTML-safe interpolation: same fallback rules, values escaped.
export function interpolateVarsHtml(value, vars) {
  return String(value || "").replace(PLACEHOLDER, (match, name) => {
    const key = String(name).toLowerCase();
    if (Object.hasOwn(vars || {}, key)) return escapeHtmlText(vars[key] ?? "");
    return match;
  });
}

// Cheap pre-send spam-signal hint (heuristic, not a real spam score).
// Returns { level: "low"|"medium"|"high", issues: string[] }.
export function spamHint({ subject = "", previewText = "", text = "", html = "" } = {}) {
  const issues = [];
  const subjectText = String(subject || "");
  const bodyText = String(text || "");
  const body = `${subjectText}\n${bodyText}`;

  if (!String(previewText || "").trim())
    issues.push("Add preview text — empty previews look bulk-sent in inboxes.");
  if (subjectText.length > 78)
    issues.push("Subject is long — keep it under ~78 characters so it isn't clipped.");
  if (subjectText && subjectText === subjectText.toUpperCase() && /[A-Z]{4,}/.test(subjectText))
    issues.push("Subject is all caps — inbox filters flag shouting.");
  const bangs = (subjectText.match(/!/g) || []).length;
  if (bangs >= 2) issues.push("Subject has multiple exclamation marks — one is plenty.");
  const spamWords = [
    "free money",
    "guaranteed",
    "no risk",
    "act now",
    "limited time",
    "winner",
    "congratulations you won",
    "double your",
    "$$$",
    "100% free",
  ];
  const hits = spamWords.filter((word) => body.toLowerCase().includes(word));
  if (hits.length) issues.push(`Avoid spam-trigger phrasing: ${hits.slice(0, 3).join(", ")}.`);
  const words = bodyText.split(/\s+/).filter(Boolean).length;
  const links = (String(html || "").match(/<a[\s>]/gi) || []).length;
  if (words > 0 && words < 30 && links > 3)
    issues.push("Very short message with many links — filters read that as spammy.");
  if (words > 0 && words < 30 && !links)
    issues.push("Very short message — add a sentence so it doesn't look like a probe.");

  const level = issues.length === 0 ? "low" : issues.length <= 2 ? "medium" : "high";
  return { level, issues };
}
