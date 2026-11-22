import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { ViralGrowthWidget } from "@/components/tools/widgets/viral-growth-widget";
import { getToolsForBlogSlug } from "@/lib/tools/registry.mjs";

/**
 * Renders 1–2 contextually matched Launch Lab tools inside a blog post.
 */
export function ContextualToolEmbed({ blogSlug }) {
  const tools = getToolsForBlogSlug(blogSlug);
  if (!tools.length) return null;

  const showCompactViral =
    blogSlug === "waitlist-metrics-that-matter" || blogSlug === "referral-waitlist-guide";

  return (
    <aside aria-label="Related interactive Waitlyze tools" className="my-10 grid gap-5 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-product-display text-xl font-semibold tracking-tight text-product-text-primary">
          Try it interactively
        </h2>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
        >
          All 14 free tools
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
        </Link>
      </div>

      {showCompactViral ? <ViralGrowthWidget compact entrySurface={`blog:${blogSlug}`} /> : null}

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.slug} href={tool.path} className="group block py-1 transition-colors">
            <h3 className="font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
              {tool.title}
            </h3>
            <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
              {tool.targetJob}
            </p>
          </Link>
        ))}
      </div>
    </aside>
  );
}
