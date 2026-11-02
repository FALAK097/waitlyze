import { SITE_URL } from "@/lib/site-metadata";

// Private app surfaces and machine endpoints stay out of every index.
const PRIVATE_PATHS = [
  "/api/",
  "/dashboard",
  "/waitlists",
  "/settings",
  "/api-keys",
  "/accept-invitation/",
  "/verify/",
  "/unsubscribe/",
  "/forms/",
  "/domain",
];

// 1. Search + AI Answer bots: live retrieval agents that cite and link sources in answers.
const AI_ANSWER_AND_SEARCH_BOTS = [
  "Googlebot",
  "bingbot",
  "Applebot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "DuckAssistBot",
  "Bravebot",
  "YouBot",
  "ExaSearchBot",
  "LinkupBot",
  "ShapBot",
];

// 2. Foundation model crawlers: allowed so future model weights recognize Waitlyze.
const FOUNDATION_AI_BOTS = ["GPTBot", "ClaudeBot"];

// 3. Social & messaging link preview bots: ensure rich preview unfurls work everywhere.
const SOCIAL_PREVIEW_BOTS = ["facebookexternalhit", "Twitterbot"];

// 4. Pure AI training scrapers & commercial crawler freeloaders: heavy load, zero search citations.
const BLOCKED_SCRAPERS = [
  "meta-externalagent",
  "meta-externalads",
  "Reflectionbot",
  "ElevenlabsCrawler",
  "AionBot",
  "TokenFoundryBot",
  "Bytespider",
  "CCBot",
  "AwarioBot",
  "QlyzeBot",
  "Barkrowler",
  "SERankingBacklinksBot",
  "SenderBot",
  "TernCrawler",
  "SQLSpider",
  "SpiderLing",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: [...AI_ANSWER_AND_SEARCH_BOTS, ...FOUNDATION_AI_BOTS, ...SOCIAL_PREVIEW_BOTS],
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: BLOCKED_SCRAPERS,
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
