// Bot-user-agent heuristics for public impression intake.
//
// Conservative by design: only explicit crawler / headless-automation /
// link-preview / uptime tokens match. A missing, empty, or unrecognized
// User-Agent is treated as human (fail-open) so legitimate trackers and
// uncommon browsers are never filtered. Used for impression rows only —
// signups require an email + verification, so they are never bot-filtered.

const BOT_TOKENS = [
  // Search + SEO crawlers
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  // Sogou crawlers spell out their spider identifiers; a bare "sogou" token
  // would also match SogouMobileBrowser, a browser real people use.
  "sogou web spider",
  "sogou inst spider",
  "sogou news spider",
  "sogou orion spider",
  "sogou push spider",
  "sogou spider",
  "exabot",
  "facebot",
  "ia_archiver",
  "alexa",
  "mj12bot",
  "ahrefsbot",
  "semrushbot",
  "dotbot",
  "petalbot",
  "bytespider",
  "tiktokspider",
  "applebot",
  "coccocbot",
  "seznambot",
  "archive.org",
  "commoncrawl",
  "ccbot",
  // AI training / assistant fetchers
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "anthropic-ai",
  "perplexitybot",
  "cohere-ai",
  "google-extended",
  "meta-webindexer",
  // Link-preview / embed fetchers (no human behind the view)
  "facebookexternalhit",
  "facebookcatalog",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "whatsapp",
  "skypeuripreview",
  "pinterestbot",
  "bingpreview",
  "google-inspectiontool",
  "adsbot-google",
  "mediapartners-google",
  "apis-google",
  "feedfetcher",
  // Headless automation / synthetic testing
  "headlesschrome",
  "phantomjs",
  "selenium",
  "webdriver",
  "playwright",
  "puppeteer",
  "cypress",
  "lighthouse",
  "pagespeed",
  "gtmetrix",
  "pingdom",
  "uptimerobot",
  "statuscake",
  "datadog",
  "newrelic",
  "site24x7",
];

const BOT_RE = new RegExp(
  BOT_TOKENS.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

const GENERIC_CRAWLER_RE =
  /\b(bot|crawler|spider|crawl|scraper|scraping|archiver|fetcher|monitor-service)\b/i;

export function isBotUserAgent(userAgent) {
  try {
    if (typeof userAgent !== "string" || !userAgent.trim()) return false;
    if (BOT_RE.test(userAgent)) return true;
    // Generic fallback only for tokens that never appear in real browsers.
    return (
      GENERIC_CRAWLER_RE.test(userAgent) &&
      !/mozilla|chrome|safari|firefox|edge|opera/i.test(userAgent)
    );
  } catch {
    return false;
  }
}

export function isBotRequest(headers) {
  try {
    const userAgent = typeof headers?.get === "function" ? headers.get("user-agent") : null;
    return isBotUserAgent(userAgent);
  } catch {
    return false;
  }
}
