// Server-side attribution sanitizer for public signup/impression payloads.
// Mirrors the client collector: caps lengths, drops non-strings.

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "t.co",
  "reddit.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
];
const SEARCH_HOST_PATTERN =
  /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|brave)(\.[a-z]{2,3})?\.[a-z]{2,}$/;
const SOCIAL_SOURCES = new Set([
  "twitter",
  "x",
  "x.com",
  "t.co",
  "reddit",
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
]);

const clean = (value, max) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
};

function normalizeReferrerHost(referrer) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function channelFor({ utmMedium, utmSource, referrerHost }) {
  const medium = String(utmMedium || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const source = String(utmSource || "")
    .trim()
    .toLowerCase();

  if (["cpc", "ppc", "paid_search", "paidsearch", "sem"].includes(medium)) return "Paid search";
  if (["paid_social", "paidsocial", "social_paid"].includes(medium)) return "Paid social";
  if (["email", "newsletter"].includes(medium)) return "Email";
  if (["affiliate", "partner"].includes(medium)) return "Affiliate";
  if (["display", "banner", "cpm", "programmatic"].includes(medium)) return "Display";
  if (["social", "social_network", "social_media", "organic_social"].includes(medium))
    return "Organic social";
  if (["organic", "organic_search", "seo"].includes(medium)) return "Organic search";
  if (
    SOCIAL_SOURCES.has(source) ||
    SOCIAL_HOSTS.some((domain) => hostMatches(referrerHost || "", domain))
  )
    return "Organic social";
  if (SEARCH_HOST_PATTERN.test(referrerHost || "")) return "Organic search";
  if (referrerHost) return "Referral";
  if (medium || source) return "Other";
  return "Direct";
}

export function getCanonicalAttribution({ utmMedium, utmSource, referrer } = {}) {
  const referrerHost = normalizeReferrerHost(clean(referrer, 2048));
  return {
    attributionChannel: channelFor({
      utmMedium: clean(utmMedium, 256),
      utmSource: clean(utmSource, 256),
      referrerHost,
    }),
    referrerHost,
  };
}

export function pickAttribution(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    referrer: clean(source.referrer, 2048),
    landingPage: clean(source.landingPage, 2048),
    utmSource: clean(source.utmSource, 256),
    utmMedium: clean(source.utmMedium, 256),
    utmCampaign: clean(source.utmCampaign, 256),
    utmTerm: clean(source.utmTerm, 256),
    utmContent: clean(source.utmContent, 256),
  };
}
