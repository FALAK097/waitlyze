import { SITE_URL } from "@/lib/site-metadata";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

/** items: [{ name, path }] from the home page down to the current page. */
export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqNode(faqs) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
