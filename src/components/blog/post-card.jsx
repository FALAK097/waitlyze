import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { formatPostDate } from "@/lib/blog-source";
import { cn } from "@/lib/utils";

/** Use the same image on the blog card and in the article's social preview. */
export function PostCover({ slug, featured = false, compact = false }) {
  return (
    <Image
      src={`/og/blog/${slug}`}
      alt=""
      width={1200}
      height={630}
      unoptimized
      loading={featured ? "eager" : "lazy"}
      className={cn(
        "block h-auto w-full rounded-lg bg-product-bg-inset",
        compact && "aspect-[16/6] object-cover",
      )}
    />
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

export function PostCard({
  post,
  minutes,
  featured = false,
  compact = false,
  headingAs: Heading = "h2",
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-product-border-subtle bg-product-bg-surface p-3 transition-colors duration-150 hover:border-product-border-control",
        featured && "lg:grid lg:grid-cols-2 lg:items-center lg:gap-8 lg:p-4",
        compact && "gap-3 rounded-md p-2",
      )}
    >
      <PostCover slug={post.slugs[0]} featured={featured} compact={compact} />
      <div className={cn("flex flex-1 flex-col gap-2 px-2 pb-2", featured && "lg:pr-6")}>
        <PostMeta post={post} minutes={minutes} className={compact ? "text-xs" : undefined} />
        <Heading
          className={cn(
            "font-product-display leading-snug font-semibold tracking-tight text-balance",
            featured ? "text-3xl lg:text-4xl" : compact ? "line-clamp-2 text-lg" : "text-section",
          )}
        >
          <Link
            href={post.url}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {post.data.title}
          </Link>
        </Heading>
        <p
          className={cn(
            "text-sm leading-relaxed text-pretty text-product-text-secondary",
            compact && "line-clamp-2",
          )}
        >
          {post.data.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-caption font-semibold text-product-success-text">
          Read the guide <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
