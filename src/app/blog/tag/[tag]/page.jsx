import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCta } from "@/components/blog/blog-cta";
import { PostCard } from "@/components/blog/post-card";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd, absoluteUrl, breadcrumbNode } from "@/components/seo/json-ld";
import { getPosts, getReadingMinutes, getTags } from "@/lib/blog-source";

export function generateStaticParams() {
  return getTags().map((tag) => ({ tag: tag.slug }));
}

function findTag(slug) {
  return getTags().find((tag) => tag.slug === slug);
}

export async function generateMetadata({ params }) {
  const { tag: slug } = await params;
  const tag = findTag(slug);
  if (!tag) return { title: "Topic not found" };
  const title = `${tag.name} guides | Waitlyze Blog`;
  const description = `Waitlyze articles about ${tag.name.toLowerCase()}: practical waitlist and launch guidance you can apply today.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    openGraph: { type: "website", url: `/blog/tag/${tag.slug}`, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

const containerClasses = "mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12";

export default async function BlogTagPage({ params }) {
  const { tag: slug } = await params;
  const tag = findTag(slug);
  if (!tag) notFound();
  const posts = getPosts().filter((post) => post.data.tags.includes(tag.name));
  const minutes = new Map(
    await Promise.all(posts.map(async (post) => [post.url, await getReadingMinutes(post)])),
  );

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "CollectionPage",
            name: `${tag.name} guides`,
            url: absoluteUrl(`/blog/tag/${tag.slug}`),
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: tag.name, path: `/blog/tag/${tag.slug}` },
          ]),
        ]}
      />
      <main id="main-content" className="scroll-mt-28">
        <section className={`${containerClasses} pt-14 pb-10 md:pt-18`} aria-labelledby="tag-title">
          <nav aria-label="Breadcrumb">
            <Link
              href="/blog"
              className="text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              ← All articles
            </Link>
          </nav>
          <h1
            id="tag-title"
            className="mt-8 max-w-3xl font-product-display text-5xl leading-tight font-medium tracking-tighter text-balance lg:text-6xl"
          >
            {tag.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-normal text-product-text-secondary">
            {posts.length} {posts.length === 1 ? "article" : "articles"} about{" "}
            {tag.name.toLowerCase()}.
          </p>
        </section>
        <section className={`${containerClasses} pb-18`} aria-label={`${tag.name} articles`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.url} post={post} minutes={minutes.get(post.url)} />
            ))}
          </div>
        </section>
        <section className={`${containerClasses} pb-18`}>
          <BlogCta />
        </section>
      </main>
    </PublicShell>
  );
}
