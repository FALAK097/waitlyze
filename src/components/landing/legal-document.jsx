import { ArrowLeft01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import LegalTOC from "./legal-toc";
import PublicShell from "./public-shell";

export default function LegalDocument({ title, description, sections, children }) {
  return (
    <PublicShell>
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-4 pt-12 pb-18 sm:px-5 md:px-8 lg:px-12"
      >
        <Link
          prefetch={false}
          href="/"
          className="group inline-flex items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={15}
            aria-hidden="true"
            className="shrink-0 transition-transform duration-180 group-hover:-translate-x-0.5"
          />
          Back to Waitlyze
        </Link>
        <header className="py-12">
          <p className="flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
            The important details
          </p>
          <h1 className="mt-5 font-product-display text-5xl leading-tight font-semibold tracking-tighter text-balance lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-116 text-product-text-secondary">{description}</p>
          <span className="mt-5 block text-xs text-product-text-secondary">
            Last updated · October 11, 2026
          </span>
        </header>
        <div className="flex flex-col gap-8 py-12 lg:flex-row lg:gap-22">
          <aside className="min-w-0 self-start lg:sticky lg:top-30">
            <LegalTOC sections={sections} />
            <a
              className="group inline-flex items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              href="mailto:hi@falakgala.dev"
            >
              Have a question?{" "}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                aria-hidden="true"
                className="shrink-0 transition-transform duration-180 group-hover:translate-x-0.5"
              />
            </a>
          </aside>
          <article className="min-w-0 text-base leading-loose break-words text-product-text-secondary [&_a]:text-product-text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-product-success-text [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-28 [&_h2]:font-product-display [&_h2]:text-section [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-product-text-primary max-md:[&_h2]:scroll-mt-45 [&_li+li]:mt-2.5 [&_p+p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
            {children}
          </article>
        </div>
        <nav
          className="flex gap-8 border-t border-product-border-subtle pt-7 text-caption"
          aria-label="Related policies"
        >
          <Link
            prefetch={false}
            href="/privacy"
            className="inline-flex items-center gap-2 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            Privacy policy <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
          <Link
            prefetch={false}
            href="/terms"
            className="inline-flex items-center gap-2 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            Terms of service{" "}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
        </nav>
      </main>
    </PublicShell>
  );
}
