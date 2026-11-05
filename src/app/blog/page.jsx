import { BlogCta } from "@/components/blog/blog-cta";
import { PostCard } from "@/components/blog/post-card";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getPosts, getReadingMinutes } from "@/lib/blog-source";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";

export const revalidate = 3600;

const title = "Waitlyze Blog: waitlist guides for launching with an audience";
const description =
  "Practical guides on building a waitlist, running referral campaigns, writing launch emails, and turning early interest into your first customers.";

export const metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "Waitlyze Blog" }] },
  },
  openGraph: { type: "website", url: "/blog", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const containerClasses = "mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12";
const eyebrowClasses =
  "flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase";

export default async function BlogIndexPage() {
  const posts = getPosts();
  const minutes = new Map(
    await Promise.all(posts.map(async (post) => [post.url, await getReadingMinutes(post)])),
  );
  const featured = posts.find((post) => post.data.featured) ?? posts[0];
  const rest = posts.filter((post) => post !== featured);

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "Blog",
            "@id": `${SITE_URL}/blog#blog`,
            name: "Waitlyze Blog",
            description,
            url: absoluteUrl("/blog"),
            publisher: { "@id": `${SITE_URL}/#organization` },
            blogPost: posts.map((post) => ({
              "@type": "BlogPosting",
              headline: post.data.title,
              url: absoluteUrl(post.url),
              datePublished: post.data.date.toISOString(),
            })),
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <main id="main-content" className="scroll-mt-28">
        <section
          className={`${containerClasses} pt-14 pb-10 md:pt-18`}
          aria-labelledby="blog-title"
        >
          <p className={eyebrowClasses}>
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-product-accent-solid" />{" "}
            Blog
          </p>
          <h1
            id="blog-title"
            className="mt-5 max-w-3xl font-product-display text-5xl leading-tight font-medium tracking-tighter text-balance lg:text-6xl"
          >
            Launch with an audience, not a guess.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-normal text-product-text-secondary">
            {description}
          </p>
        </section>

        <section className={`${containerClasses} pb-18`} aria-label="Latest articles">
          {featured && <PostCard post={featured} minutes={minutes.get(featured.url)} featured />}
          {rest.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.url} post={post} minutes={minutes.get(post.url)} />
              ))}
            </div>
          )}
        </section>

        <section className={`${containerClasses} pb-18`}>
          <BlogCta />
        </section>
      </main>
    </PublicShell>
  );
}
