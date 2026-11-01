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

// Search and user-triggered AI crawlers fetch pages so answers can cite us.
// They are allowed explicitly so a future blanket rule cannot silently hide
// the site from AI search. Training crawlers (GPTBot, ClaudeBot, CCBot,
// Google-Extended, Applebot-Extended) are intentionally not listed, so the
// default rule applies and they may read the public site.
const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_SEARCH_AGENTS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
