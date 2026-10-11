import { SITE_URL, SITE_DESCRIPTION } from "@/lib/site-metadata";

const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Waitlyze", url: SITE_URL, logo: `${SITE_URL}/web-app-manifest-512x512.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Waitlyze", url: SITE_URL, description: SITE_DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "SoftwareApplication", name: "Waitlyze", url: SITE_URL, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: SITE_DESCRIPTION, featureList: ["Hosted waitlist pages", "Embeddable signup forms", "Referral tracking", "Email automation", "Audience analytics", "Subscriber exports"] },
  ],
};

export function SiteStructuredData({ faqs = [] }) {
  const graph = faqs.length ? { ...siteGraph, "@graph": [...siteGraph["@graph"], {
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  }] } : siteGraph;
  // Escape markup characters even when future content comes from an editor.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />;
}
