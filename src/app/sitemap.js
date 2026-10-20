import { SITE_URL } from "@/lib/site-metadata";

// Editorial update date, not the time a crawler requests this file.
const lastModified = "2026-10-11";
export default function sitemap() {
  return [
    { url: SITE_URL, lastModified, priority: 1, changeFrequency: "monthly" },
    { url: `${SITE_URL}/privacy`, lastModified, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, priority: 0.3 },
    ...["", "/api", "/embed", "/webhooks", "/resend"].map((path) => ({
      url: `${SITE_URL}/docs${path}`,
      lastModified,
      priority: 0.5,
    })),
  ];
}
