import { SITE_URL, SITE_DESCRIPTION, SITE_SUPPORT_EMAIL } from "@/lib/site-metadata";

const GITHUB_URL = "https://github.com/FALAK097/waitlyze";

const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Waitlyze",
      url: SITE_URL,
      logo: `${SITE_URL}/web-app-manifest-512x512.png`,
      description: SITE_DESCRIPTION,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_SUPPORT_EMAIL,
      },
      sameAs: [GITHUB_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Waitlyze",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Waitlyze",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Waitlist and pre-launch marketing software",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "Hosted waitlist pages",
        "Embeddable signup forms",
        "Fourteen waitlist templates",
        "Referral tracking with verified credit",
        "Email broadcasts and automations",
        "Audience analytics",
        "Public API and webhooks",
        "Subscriber CSV export",
      ],
    },
  ],
};

export function SiteStructuredData({ faqs = [] }) {
  const graph = faqs.length
    ? {
        ...siteGraph,
        "@graph": [
          ...siteGraph["@graph"],
          {
            "@type": "FAQPage",
            mainEntity: faqs.map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
        ],
      }
    : siteGraph;
  // Escape markup characters even when future content comes from an editor.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
