import { notFound } from "next/navigation";
import { source } from "@/lib/source";
import { getMDXComponents } from "../../../../mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsPage, DocsBody, DocsDescription, DocsTitle, MarkdownCopyButton, ViewOptionsPopover } from "fumadocs-ui/layouts/docs/page";
import { getPageImageUrl, getPageMarkdownUrl, gitConfig, docsRoute } from "@/lib/docs-shared";
import { SITE_URL } from "@/lib/site-metadata";

export function generateStaticParams() { return source.generateParams(); }

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  return {
    title: `${page.data.title} | Waitlyze Docs`,
    description: page.data.description,
    alternates: { canonical: `${SITE_URL}${docsRoute}${page.slugs.length ? `/${page.slugs.join("/")}` : ""}` },
    openGraph: { images: getPageImageUrl(page).url },
  };
}

export default async function Page({ params }) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  return <DocsPage toc={page.data.toc} full={page.data.full}>
    <DocsTitle>{page.data.title}</DocsTitle>
    <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
    <div className="flex flex-row gap-2 items-center border-b pb-6">
      <MarkdownCopyButton markdownUrl={markdownUrl} />
      <ViewOptionsPopover
        markdownUrl={markdownUrl}
        githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
      />
    </div>
    <DocsBody>
      <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
    </DocsBody>
  </DocsPage>;
}
