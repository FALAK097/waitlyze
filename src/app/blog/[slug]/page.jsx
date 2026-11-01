import { createRelativeLink } from "fumadocs-ui/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCta } from "@/components/blog/blog-cta";
import { PostCard, PostMeta } from "@/components/blog/post-card";
import { PostFaq } from "@/components/blog/post-faq";
import { PostToc } from "@/components/blog/post-toc";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import {
  blogSource,
  formatPostDate,
  getPost,
  getPosts,
  getReadingMinutes,
  getRelatedPosts,
  slugifyTag,
} from "@/lib/blog-source";
import { absoluteUrl, breadcrumbNode, faqNode } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";

import { getMDXComponents } from "../../../../mdx-components";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slugs[0] }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  const { title, description, date, updated, tags } = post.data;
  const image = { url: `/og/blog/${slug}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description,
    authors: [{ name: post.data.author }],
    alternates: {
      canonical: post.url,
      types: { "text/markdown": [{ url: `${post.url}.md`, title: `${title} (Markdown)` }] },
    },
    openGraph: {
      type: "article",
      url: post.url,
      title,
      description,
      publishedTime: date.toISOString(),
      modifiedTime: (updated ?? date).toISOString(),
      authors: [post.data.author],
      tags,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

const containerClasses = "mx-auto w-full max-w-6xl px-4 sm:px-5 md:px-8 lg:px-12";

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const MDX = post.data.body;
  const minutes = await getReadingMinutes(post);
  const related = getRelatedPosts(post);
  const relatedMinutes = new Map(
    await Promise.all(related.map(async (entry) => [entry.url, await getReadingMinutes(entry)])),
  );
  const { title, description, date, updated, tags, tldr, faqs, author } = post.data;
  const isTeam = author === "Waitlyze Team";
  const primaryTag = tags[0];

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "BlogPosting",
            "@id": `${absoluteUrl(post.url)}#article`,
            headline: title,
            description,
            image: absoluteUrl(`/og/blog/${slug}`),
            datePublished: date.toISOString(),
            dateModified: (updated ?? date).toISOString(),
            inLanguage: "en",
            keywords: tags.join(", "),
            mainEntityOfPage: absoluteUrl(post.url),
            author: isTeam
              ? { "@id": `${SITE_URL}/#organization` }
              : { "@type": "Person", name: author },
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: title, path: post.url },
          ]),
          ...(faqs.length ? [faqNode(faqs)] : []),
        ]}
      />
      <main id="main-content" className="scroll-mt-28">
        <article>
          <header className={`${containerClasses} pt-12 pb-8 md:pt-16`}>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                href="/blog"
                className="font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                ← Blog
              </Link>
              {primaryTag && (
                <>
                  <span aria-hidden="true" className="text-product-text-muted">
                    /
                  </span>
                  <Link
                    href={`/blog/tag/${slugifyTag(primaryTag)}`}
                    className="text-product-text-secondary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
                  >
                    {primaryTag}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="mt-8 max-w-4xl font-product-display text-4xl leading-tight font-medium tracking-tighter text-balance md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-normal text-pretty text-product-text-secondary">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-product-text-secondary">
              <span className="font-semibold text-product-text-primary">By {author}</span>
              <PostMeta post={post} minutes={minutes} />
              {updated && updated.getTime() > date.getTime() && (
                <span>
                  Updated <time dateTime={updated.toISOString()}>{formatPostDate(updated)}</time>
                </span>
              )}
            </div>
          </header>

          <div
            className={`${containerClasses} grid grid-cols-1 gap-12 pb-16 lg:grid-cols-[minmax(0,44rem)_16rem] lg:justify-between`}
          >
            <div className="min-w-0">
              <aside
                aria-label="Key takeaways"
                className="mb-10 rounded-xl border border-l-[3px] border-product-border-subtle border-l-product-accent-solid bg-product-bg-inset p-5"
              >
                <p className="text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
                  The short answer
                </p>
                <p className="mt-2 text-base leading-relaxed font-medium text-pretty">{tldr}</p>
              </aside>
              <div className="wl-prose">
                <MDX components={getMDXComponents({ a: createRelativeLink(blogSource, post) })} />
              </div>
              <PostFaq faqs={faqs} />
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-28">
                <PostToc toc={post.data.toc} />
              </div>
            </div>
          </div>
        </article>

        <section className={`${containerClasses} pb-16`}>
          <BlogCta />
        </section>

        {related.length > 0 && (
          <section className={`${containerClasses} pb-18`} aria-labelledby="related-title">
            <h2
              id="related-title"
              className="font-product-display text-3xl leading-tight font-semibold tracking-tight"
            >
              Keep reading
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <PostCard
                  key={entry.url}
                  post={entry}
                  minutes={relatedMinutes.get(entry.url)}
                  headingAs="h3"
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </PublicShell>
  );
}
