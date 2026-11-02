import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { getPageImageUrl, getPageMarkdownUrl, gitConfig, docsRoute } from "@/lib/docs-shared";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";
import { source } from "@/lib/source";

import { getMDXComponents } from "../../../../mdx-components";

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  return {
    title: { absolute: `${page.data.title} | Waitlyze Docs` },
    description: page.data.description,
    alternates: {
      canonical: `${SITE_URL}${docsRoute}${page.slugs.length ? `/${page.slugs.join("/")}` : ""}`,
      types: {
        "text/markdown": [
          {
            url: `${docsRoute}${page.slugs.length ? `/${page.slugs.join("/")}` : ""}.md`,
            title: `${page.data.title} (Markdown)`,
          },
        ],
      },
    },
    openGraph: {
      type: "article",
      url: `${docsRoute}${page.slugs.length ? `/${page.slugs.join("/")}` : ""}`,
      title: `${page.data.title} | Waitlyze Docs`,
      description: page.data.description,
      images: [{ url: getPageImageUrl(page).url, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.data.title} | Waitlyze Docs`,
      description: page.data.description,
      images: [getPageImageUrl(page).url],
    },
  };
}

export default async function Page({ params }) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const pagePath = `${docsRoute}${page.slugs.length ? `/${page.slugs.join("/")}` : ""}`;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <JsonLd
        data={[
          {
            "@type": "TechArticle",
            headline: page.data.title,
            description: page.data.description,
            url: absoluteUrl(pagePath),
            image: absoluteUrl(getPageImageUrl(page).url),
            inLanguage: "en",
            isPartOf: { "@id": absoluteUrl("/#website") },
            publisher: { "@id": absoluteUrl("/#organization") },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Docs", path: docsRoute },
            ...(page.slugs.length ? [{ name: page.data.title, path: pagePath }] : []),
          ]),
        ]}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}
