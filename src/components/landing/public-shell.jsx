import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { publicFontClasses } from "@/lib/public-fonts";

import CopyrightYear from "./copyright-year";
import Header from "./header";
import Wordmark from "./wordmark";

export default function PublicShell({ children }) {
  return (
    <div
      className={`bg-product-bg-page font-product-sans text-base leading-relaxed text-product-text-primary antialiased selection:bg-product-accent-solid/40 ${publicFontClasses}`}
    >
      <a
        href="#main-content"
        className="fixed -top-24 left-4 z-100 rounded-md bg-product-text-primary px-5 py-3 text-product-bg-page focus-visible:top-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
      >
        Skip to content
      </a>
      <Header />
      {children}
      <footer className="bg-product-bg-page pt-12 pb-6 text-product-text-primary">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12">
          <div className="relative grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-10">
            <div className="col-span-2">
              <Link
                href="/"
                aria-label="Waitlyze home"
                className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                <Wordmark />
              </Link>
              <p className="mt-5 max-w-49 text-caption leading-relaxed text-product-text-secondary">
                Made for the quiet work that comes before a big launch.
              </p>
            </div>
            <nav
              aria-label="Product"
              className="flex flex-col items-start gap-3 text-xs text-product-text-primary"
            >
              <span className="mb-2 flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
                Explore
              </span>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                How it works
              </Link>
              <Link
                href="/#features"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Features
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Templates
              </Link>
              <Link
                href="/#faq"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                FAQs
              </Link>
              <Link
                href="/docs/changelog"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Changelog
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Developer docs
              </Link>
            </nav>
            <nav
              aria-label="Company"
              className="flex flex-col items-start gap-3 text-xs text-product-text-primary"
            >
              <span className="mb-2 flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
                Good to know
              </span>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Privacy policy
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Terms of service
              </Link>
              <a
                href="mailto:hi@falakgala.dev"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Get in touch{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
              </a>
            </nav>
          </div>
          <div className="relative mt-12 flex flex-wrap justify-between gap-4 pt-6 text-micro text-product-text-secondary">
            <span>
              © <CopyrightYear initialYear={new Date().getFullYear()} /> Waitlyze
            </span>
            <a
              href="https://falakgala.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              Made by Falak Gala{" "}
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
