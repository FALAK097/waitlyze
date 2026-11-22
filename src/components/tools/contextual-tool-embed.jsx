import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { ViralGrowthWidget } from "@/components/tools/widgets/viral-growth-widget";
import { getToolsForBlogSlug } from "@/lib/tools/registry.mjs";

/**
 * Renders 1–2 contextually matched Launch Lab tools inside a blog post.
 * Avoids cluttered sitewide link walls while embedding a compact live
 * simulator where the article discusses viral/referral math.
 */
export function ContextualToolEmbed({ blogSlug }) {
  const tools = getToolsForBlogSlug(blogSlug);
  if (!tools.length) return null;

  const showCompactViral =
    blogSlug === "waitlist-metrics-that-matter" || blogSlug === "referral-waitlist-guide";

  return (
    <aside
      aria-label="Related interactive Waitlyze Launch Lab tools"
      className="my-10 grid gap-4 border-y border-product-border-subtle py-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-product-mono text-micro font-semibold text-product-success-text">
            WAITLYZE LAUNCH LAB
          </p>
          <h2 className="mt-1 font-product-display text-xl font-semibold tracking-tight text-product-text-primary">
            Try this interactively (free, no login)
          </h2>
        </div>
        <Link
          href="/tools"
          className="text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
        >
          All 14 free tools
        </Link>
      </div>

      {showCompactViral ? <ViralGrowthWidget compact entrySurface={`blog:${blogSlug}`} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.path}
            className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-inset/45 p-4 transition-colors duration-150 hover:border-product-text-secondary"
          >
            <div>
              <p className="font-product-mono text-micro text-product-text-muted">Free tool</p>
              <h3 className="mt-1 font-product-display text-body font-semibold text-product-text-primary group-hover:underline">
                {tool.title}
              </h3>
              <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                {tool.targetJob}
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-product-text-primary">
              Open {tool.shortTitle}
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
