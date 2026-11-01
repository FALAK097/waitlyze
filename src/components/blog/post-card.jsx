import Link from "next/link";

import { formatPostDate } from "@/lib/blog-source";
import { cn } from "@/lib/utils";

const covers = [
  { panel: "bg-product-accent-solid text-product-ink", bar: "bg-product-ink/90" },
  { panel: "bg-product-neutral-900 text-white", bar: "bg-product-accent-solid" },
  { panel: "bg-product-green-300 text-product-ink", bar: "bg-product-ink/90" },
  { panel: "bg-product-bg-inset text-product-ink", bar: "bg-product-accent-solid" },
];

function hash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/** A typographic cover built from the brand mark, so posts need no image assets. */
export function PostCover({ title, tag, slug, className }) {
  const style = covers[hash(slug) % covers.length];
  return (
    <div
      className={cn(
        "relative flex aspect-video flex-col justify-between overflow-hidden rounded-lg p-5",
        style.panel,
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-micro font-semibold tracking-widest uppercase opacity-80">{tag}</span>
      <span className="line-clamp-3 max-w-[85%] font-product-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
        {title}
      </span>
      <span className="absolute right-5 bottom-5 inline-flex h-9 -skew-x-12 items-center gap-1">
        <i className={cn("block h-5 w-1.5 rounded-sm", style.bar)} />
        <i className={cn("block h-8 w-1.5 rounded-sm", style.bar)} />
        <i className={cn("block h-6 w-1.5 rounded-sm", style.bar)} />
      </span>
    </div>
  );
}

export function PostMeta({ post, minutes, className }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 text-caption text-product-text-secondary",
        className,
      )}
    >
      <time dateTime={post.data.date.toISOString()}>{formatPostDate(post.data.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{minutes} min read</span>
    </p>
  );
}

export function PostCard({ post, minutes, featured = false, headingAs: Heading = "h2" }) {
  const tag = post.data.tags[0] ?? "Guide";
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-product-border-subtle bg-product-bg-surface p-3 transition-colors duration-150 hover:border-product-border-control",
        featured && "lg:grid lg:grid-cols-2 lg:items-center lg:gap-8 lg:p-4",
      )}
    >
      <PostCover title={post.data.title} tag={tag} slug={post.slugs[0]} />
      <div className={cn("flex flex-1 flex-col gap-2 px-2 pb-2", featured && "lg:pr-6")}>
        <PostMeta post={post} minutes={minutes} />
        <Heading
          className={cn(
            "font-product-display leading-snug font-semibold tracking-tight text-balance",
            featured ? "text-3xl lg:text-4xl" : "text-section",
          )}
        >
          <Link
            href={post.url}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {post.data.title}
          </Link>
        </Heading>
        <p className="text-sm leading-relaxed text-pretty text-product-text-secondary">
          {post.data.description}
        </p>
        <span className="mt-auto pt-2 text-caption font-semibold text-product-success-text">
          Read the guide <span aria-hidden="true">→</span>
        </span>
      </div>
    </article>
  );
}
