import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost } from "@/lib/blog-source";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";
import { getRelatedTools, getToolBySlug, TOOL_CATEGORIES } from "@/lib/tools/registry.mjs";

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
      title: `${tool.title} | Waitlyze Launch Lab`,
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
 * Standardized 9-part SEO / AEO / GEO server-rendered page shell for Launch Lab tools:
 * 1. Job-matched H1 + breadcrumb
 * 2. Direct 40–60 word plain-language answer
 * 3. Working interactive tool workspace
 * 4. "How it works" with explicit formula or rubric
 * 5. Worked example with real arithmetic / sample launch
 * 6. "How to interpret your result" including failure modes
 * 7. Methodology, author/reviewer, sources, updated date, privacy notice
 * 8. 3–6 visible practitioner FAQs
 * 9. Related Waitlyze guides, matching template preview, and next-tool links
 */
export function ToolPageShell({ slug, children, extraJsonLd = [] }) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const category = TOOL_CATEGORIES.find((item) => item.id === tool.category);
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
      { name: "Launch Lab", path: "/tools" },
      { name: tool.shortTitle, path: tool.path },
    ]),
    ...extraJsonLd,
  ];

  return (
    <PublicShell>
      <JsonLd data={structuredData} />
      <ToolAnalyticsTracker toolSlug={tool.slug} toolVersion={tool.version} />
      <main id="main-content" className="scroll-mt-24 pb-20">
        {/* 1. Header & Breadcrumb */}
        <header className={`${CONTAINER} pt-10 pb-6 md:pt-14`}>
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-caption text-product-text-secondary"
          >
            <Link
              href="/tools"
              className="font-medium text-product-text-primary underline-offset-4 hover:underline"
            >
              Launch Lab
            </Link>
            <span aria-hidden="true" className="text-product-text-muted">
              /
            </span>
            <span>{category?.label || "Tools"}</span>
          </nav>

          <h1 className="mt-5 max-w-4xl font-product-display text-3xl leading-tight font-semibold tracking-tight text-balance text-product-text-primary sm:text-4xl lg:text-5xl">
            {tool.title}
          </h1>

          {/* 2. Direct 40–60 word plain-language answer */}
          <div className="mt-5 max-w-3xl rounded-xl border border-product-border-subtle bg-product-bg-inset/70 px-5 py-4">
            <p className="text-body leading-relaxed text-pretty text-product-text-primary">
              {tool.directAnswer}
            </p>
          </div>
        </header>

        {/* 3. Working Interactive Tool */}
        <section className={`${CONTAINER} pb-14`} aria-label={`${tool.title} workspace`}>
          {children}
        </section>

        {/* 4. How It Works & Formula / Rubric */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-12`}
          aria-labelledby="how-it-works-heading"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
            <div>
              <h2
                id="how-it-works-heading"
                className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
              >
                {tool.howItWorks.heading}
              </h2>
              <p className="mt-3 text-body leading-relaxed text-product-text-secondary">
                {tool.howItWorks.summary}
              </p>
            </div>
            <div className="grid gap-5">
              <div className="rounded-lg border border-product-border-subtle bg-product-bg-inset/60 px-4 py-3.5">
                <p className="font-product-mono text-micro font-semibold text-product-text-secondary">
                  Formula & scoring model
                </p>
                <p className="mt-1.5 font-product-mono text-caption leading-relaxed text-product-text-primary">
                  {tool.howItWorks.formula}
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {tool.howItWorks.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-product-border-subtle bg-product-bg-surface p-4"
                  >
                    <dt className="text-body font-semibold text-product-text-primary">
                      {item.label}
                    </dt>
                    <dd className="mt-1.5 text-caption leading-relaxed text-product-text-secondary">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 5. Worked Example */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-12`}
          aria-labelledby="worked-example-heading"
        >
          <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/45 p-6 sm:p-7">
            <p className="font-product-mono text-micro font-semibold text-product-success-text">
              Worked example
            </p>
            <h2
              id="worked-example-heading"
              className="mt-2 font-product-display text-xl font-semibold tracking-tight text-product-text-primary sm:text-2xl"
            >
              {tool.workedExample.title}
            </h2>
            <p className="mt-2 max-w-3xl text-body leading-relaxed text-product-text-secondary">
              {tool.workedExample.summary}
            </p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tool.workedExample.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-product-border-subtle bg-product-bg-surface p-3.5"
                >
                  <dt className="text-micro font-medium text-product-text-secondary">
                    {metric.label}
                  </dt>
                  <dd className="mt-1 text-caption font-semibold text-product-text-primary tabular-nums">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 6. How to Interpret Your Result */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-12`}
          aria-labelledby="interpret-heading"
        >
          <h2
            id="interpret-heading"
            className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
          >
            How to interpret your result
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tool.interpretationGuide.map((entry) => (
              <div
                key={entry.band}
                className="rounded-lg border border-product-border-subtle bg-product-bg-surface p-4"
              >
                <h3 className="text-body font-semibold text-product-text-primary">{entry.band}</h3>
                <p className="mt-1.5 text-caption leading-relaxed text-product-text-secondary">
                  {entry.guidance}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Methodology, Privacy & Changelog */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-12`}
          aria-labelledby="methodology-heading"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2
                id="methodology-heading"
                className="font-product-display text-xl font-semibold tracking-tight text-product-text-primary"
              >
                Methodology & privacy
              </h2>
              <p className="mt-2.5 text-caption leading-relaxed text-product-text-secondary">
                {tool.privacyNotice}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-caption">
                <div>
                  <dt className="text-micro text-product-text-muted">Author</dt>
                  <dd className="font-medium text-product-text-primary">
                    {tool.methodology.author}
                  </dd>
                </div>
                <div>
                  <dt className="text-micro text-product-text-muted">Reviewed by</dt>
                  <dd className="font-medium text-product-text-primary">
                    {tool.methodology.reviewer}
                  </dd>
                </div>
                <div>
                  <dt className="text-micro text-product-text-muted">Last materially updated</dt>
                  <dd className="font-product-mono text-product-text-primary">
                    <time dateTime={tool.methodology.updatedAt}>{tool.methodology.updatedAt}</time>
                  </dd>
                </div>
                <div>
                  <dt className="text-micro text-product-text-muted">Version</dt>
                  <dd className="font-product-mono text-product-text-primary">v{tool.version}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-product-border-subtle bg-product-bg-inset/50 p-5">
              <p className="text-caption font-semibold text-product-text-primary">
                Sources & changelog
              </p>
              <ul className="mt-2.5 grid list-disc gap-1.5 pl-4 text-caption text-product-text-secondary">
                {tool.methodology.sources.map((src) => (
                  <li key={src}>{src}</li>
                ))}
              </ul>
              <p className="mt-3.5 border-t border-product-border-subtle pt-3 font-product-mono text-micro text-product-text-secondary">
                {tool.methodology.changelog}
              </p>
            </div>
          </div>
        </section>

        {/* 8. Visible Practitioner FAQs */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-12`}
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
          >
            Frequently asked questions
          </h2>
          <div className="mt-6 divide-y divide-product-border-subtle border-y border-product-border-subtle">
            {tool.faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-body font-semibold text-product-text-primary">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-product-mono text-caption text-product-text-muted transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2.5 max-w-3xl text-body leading-relaxed text-product-text-secondary">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* 9. Related Guides, Matching Template & Next Tools */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle pt-12`}
          aria-labelledby="next-steps-heading"
        >
          <h2
            id="next-steps-heading"
            className="font-product-display text-xl font-semibold tracking-tight text-product-text-primary"
          >
            Continue your launch setup
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedPosts.map((post) => (
              <Link
                key={post.url}
                href={post.url}
                className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 transition-colors duration-150 hover:border-product-text-secondary"
              >
                <div>
                  <p className="font-product-mono text-micro text-product-success-text">Guide</p>
                  <h3 className="mt-1.5 text-body font-semibold text-product-text-primary group-hover:underline">
                    {post.data.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-caption text-product-text-secondary">
                    {post.data.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-product-text-primary">
                  Read guide
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}

            {templateMeta && (
              <Link
                href={`/templates/${tool.recommendedTemplateId}`}
                className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 transition-colors duration-150 hover:border-product-text-secondary"
              >
                <div>
                  <p className="font-product-mono text-micro text-product-success-text">
                    Recommended template
                  </p>
                  <h3 className="mt-1.5 text-body font-semibold text-product-text-primary group-hover:underline">
                    {templateMeta.seoTitle}
                  </h3>
                  <p className="mt-1.5 text-caption text-product-text-secondary">
                    {templateMeta.useCase}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-product-text-primary">
                  Preview template
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
                </span>
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-product-border-subtle pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-medium text-product-text-secondary">
                Related tools:
              </span>
              {relatedTools.map((nextTool) => (
                <Link
                  key={nextTool.slug}
                  href={nextTool.path}
                  className="inline-flex min-h-9 items-center rounded-full border border-product-border-subtle bg-product-bg-surface px-3 py-1 text-caption font-medium text-product-text-primary transition-colors duration-150 hover:bg-product-bg-inset"
                >
                  {nextTool.shortTitle}
                </Link>
              ))}
            </div>
            <Link
              href="/tools"
              className="inline-flex min-h-9 items-center gap-1 text-caption font-semibold text-product-success-text hover:underline"
            >
              Explore all 14 Launch Lab tools
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
