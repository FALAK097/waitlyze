import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import FAQAccordion from "@/components/landing/faq-accordion";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost } from "@/lib/blog-source";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";
import { getRelatedTools, getToolBySlug } from "@/lib/tools/registry.mjs";

import { ToolAnalyticsTracker } from "./tool-analytics-tracker";

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 sm:px-6";

/**
 * Generates self-canonical Next.js metadata for any Launch Lab tool page.
 * Query-string share variants always canonicalize back to the base tool route.
 */
export function buildToolMetadata(slug) {
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool not found" };

  const ogUrl = `/og/tools/${tool.slug}`;
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: {
      canonical: tool.path,
      types: {
        "text/markdown": [{ url: `${tool.path}.md`, title: `${tool.title} (Markdown)` }],
      },
    },
    openGraph: {
      type: "website",
      url: tool.path,
      title: `${tool.title} | Waitlyze`,
      description: tool.seoDescription,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: tool.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} | Waitlyze`,
      description: tool.seoDescription,
      images: [ogUrl],
    },
  };
}

/**
 * Clean, unboxed tool page shell preserving full SEO / AEO / GEO structured data
 * while keeping the interactive workspace front-and-center and visual chrome minimal.
 */
export function ToolPageShell({ slug, children, extraJsonLd = [] }) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const relatedPosts = tool.relatedBlogSlugs.map((blogSlug) => getPost(blogSlug)).filter(Boolean);
  const templateMeta = getGalleryMeta(tool.recommendedTemplateId);
  const relatedTools = getRelatedTools(slug, 3);

  const structuredData = [
    {
      "@type": "WebApplication",
      "@id": `${absoluteUrl(tool.path)}#webapp`,
      name: tool.title,
      description: tool.seoDescription,
      url: absoluteUrl(tool.path),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: tool.methodology.updatedAt,
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Free tools", path: "/tools" },
      { name: tool.shortTitle, path: tool.path },
    ]),
    ...(tool.faqs?.length
      ? [
          {
            "@type": "FAQPage",
            mainEntity: tool.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          },
        ]
      : []),
    ...extraJsonLd,
  ];

  return (
    <PublicShell>
      <JsonLd data={structuredData} />
      <ToolAnalyticsTracker toolSlug={tool.slug} toolVersion={tool.version} />
      <main id="main-content" className="scroll-mt-24 pb-20">
        {/* 1. Compact Header */}
        <header className={`${CONTAINER} pt-8 pb-6 md:pt-12`}>
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-caption font-medium text-product-text-secondary transition-colors hover:text-product-text-primary"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} aria-hidden="true" />
            All free tools
          </Link>

          <div className="mt-4 max-w-2xl">
            <h1 className="font-product-display text-3xl leading-tight font-semibold tracking-tight text-balance text-product-text-primary sm:text-4xl">
              {tool.title}
            </h1>
            <p className="mt-2 text-body leading-relaxed text-pretty text-product-text-secondary sm:text-base">
              {tool.targetJob}
            </p>
          </div>
        </header>

        {/* 2. Interactive Tool Workspace */}
        <section className={`${CONTAINER} pb-14`} aria-label={`${tool.title} workspace`}>
          {children}
        </section>

        {/* 3. Plain-English Reference (How it works, What goes in, Example) */}
        <section
          className={`${CONTAINER} grid gap-12 border-t border-product-border-subtle py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]`}
          aria-labelledby="how-it-works-heading"
        >
          <div className="grid content-start gap-7">
            <div>
              <h2
                id="how-it-works-heading"
                className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
              >
                {tool.howItWorks.heading}
              </h2>
              <p className="mt-2.5 max-w-2xl text-body leading-relaxed text-product-text-secondary">
                {tool.howItWorks.summary}
              </p>
            </div>

            {tool.howItWorks.items?.length ? (
              <ol className="grid gap-4 sm:grid-cols-2">
                {tool.howItWorks.items.map((item, idx) => (
                  <li key={item.label} className="rounded-lg bg-product-bg-inset/50 p-4">
                    <p className="text-caption font-semibold text-product-text-primary">
                      <span className="mr-1.5 font-product-mono text-micro text-product-text-muted">
                        {idx + 1}.
                      </span>
                      {item.label}
                    </p>
                    <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}

            {tool.interpretationGuide?.length ? (
              <div className="grid gap-3">
                <h3 className="font-product-display text-base font-semibold text-product-text-primary">
                  What your result means
                </h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {tool.interpretationGuide.slice(0, 4).map((entry) => (
                    <div key={entry.band}>
                      <dt className="text-caption font-semibold text-product-text-primary">
                        {entry.band}
                      </dt>
                      <dd className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                        {entry.guidance}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {tool.howItWorks.formula ? (
              <p className="rounded-md bg-product-bg-inset/40 px-3.5 py-2.5 text-caption leading-relaxed text-product-text-secondary">
                <span className="font-semibold text-product-text-primary">In short: </span>
                {tool.howItWorks.formula}
              </p>
            ) : null}
          </div>

          <aside className="grid content-start gap-4 pt-2 lg:border-l lg:border-product-border-subtle lg:pt-0 lg:pl-8">
            <h3 className="font-product-display text-base font-semibold text-product-text-primary">
              {tool.workedExample.title}
            </h3>
            <p className="text-caption leading-relaxed text-product-text-secondary">
              {tool.workedExample.summary}
            </p>
            <dl className="grid divide-y divide-product-border-subtle">
              {tool.workedExample.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-baseline justify-between gap-4 py-2.5 text-caption"
                >
                  <dt className="text-product-text-secondary">{metric.label}</dt>
                  <dd className="text-right font-medium text-product-text-primary tabular-nums">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-micro leading-relaxed text-product-text-muted">
              {tool.privacyNotice} Updated{" "}
              <time dateTime={tool.methodology.updatedAt}>{tool.methodology.updatedAt}</time>.
            </p>
          </aside>
        </section>

        {/* 4. FAQs (Waitlyze Base UI Accordion) */}
        {tool.faqs?.length ? (
          <section className={`${CONTAINER} py-12`} aria-labelledby="faq-heading">
            <div className="max-w-3xl">
              <h2
                id="faq-heading"
                className="mb-4 font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
              >
                Frequently asked questions
              </h2>
              <FAQAccordion items={tool.faqs.map((f) => [f.question, f.answer])} />
            </div>
          </section>
        ) : null}

        {/* 5. Quiet Related Links */}
        <section className={`${CONTAINER} pt-12`} aria-labelledby="next-steps-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2
              id="next-steps-heading"
              className="font-product-display text-lg font-semibold tracking-tight text-product-text-primary"
            >
              More tools and guides
            </h2>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-caption font-medium text-product-text-primary underline-offset-4 hover:underline"
            >
              All 14 free tools
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((nextTool) => (
              <li key={nextTool.slug}>
                <Link href={nextTool.path} className="group block py-1 transition-colors">
                  <p className="font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
                    {nextTool.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-caption text-product-text-secondary">
                    {nextTool.targetJob}
                  </p>
                </Link>
              </li>
            ))}
            {relatedPosts.slice(0, 2).map((post) => (
              <li key={post.url}>
                <Link href={post.url} className="group block py-1 transition-colors">
                  <p className="font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
                    {post.data.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-caption text-product-text-secondary">
                    {post.data.description}
                  </p>
                </Link>
              </li>
            ))}
            {templateMeta ? (
              <li>
                <Link
                  href={`/templates/${tool.recommendedTemplateId}`}
                  className="group block py-1 transition-colors"
                >
                  <p className="font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
                    {templateMeta.seoTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-caption text-product-text-secondary">
                    {templateMeta.useCase}
                  </p>
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      </main>
    </PublicShell>
  );
}
