import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

/**
 * Contextual mid-article callout that routes readers from informational posts
 * into the matching Waitlyze comparison, template, or pricing page.
 */
export function ProductCallout({ title, description, href, cta }) {
  return (
    <aside className="not-prose my-8 rounded-xl border border-product-border-subtle bg-product-bg-inset p-5 sm:p-6">
      <p className="font-product-display text-lg leading-snug font-semibold tracking-tight text-product-text-primary">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-product-text-secondary">
        {description}
      </p>
      <Link
        href={href}
        className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-product-success-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
      >
        <span>{cta}</span>
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
      </Link>
    </aside>
  );
}
