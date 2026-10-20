import { SITE_URL } from "@/lib/site-metadata";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
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
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
