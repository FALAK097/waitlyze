import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { competitors } from "@/lib/comparison-data";
import { publicFontClasses } from "@/lib/public-fonts";

import CopyrightYear from "./copyright-year";
import GitHubMark from "./github-mark";
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
          <div className="relative grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-10 lg:grid-cols-6">
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
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
                href="/#features"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Features
              </Link>
              <Link
                href="/#steps"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                How it works
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
            </nav>
            <nav
              aria-label="Alternatives"
              className="flex flex-col items-start gap-3 text-xs text-product-text-primary"
            >
              <span className="mb-2 flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
                Alternatives
              </span>
              {[
                { name: "Prefinery", slug: "prefinery" },
                { name: "GetWaitlist", slug: "getwaitlist" },
                { name: "Viral Loops", slug: "viral-loops" },
                { name: "KickoffLabs", slug: "kickofflabs" },
                { name: "LaunchList", slug: "launchlist" },
                ...competitors.filter(
                  (c) =>
                    ![
                      "prefinery",
                      "getwaitlist",
                      "viral-loops",
                      "kickofflabs",
                      "launchlist",
                    ].includes(c.slug),
                ),
              ].map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/alternatives/${slug}`}
                  title={`Waitlyze vs ${name}`}
                  className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
                >
                  {name}
                </Link>
              ))}
              <Link
                href="/alternatives"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                All alternatives
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Compare tools
              </Link>
            </nav>
            <nav
              aria-label="Resources"
              className="flex flex-col items-start gap-3 text-xs text-product-text-primary"
            >
              <span className="mb-2 flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
                Resources
              </span>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Blog
              </Link>
              <Link
                href="/rss.xml"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                RSS feed
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
              <Link
                href="/agent-instructions.md"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                AI Agent instructions
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
              <Link
                href="/refund-policy"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Refund policy
              </Link>
              <a
                href="mailto:support@waitlyze.com"
                className="inline-flex items-center gap-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Get in touch{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
              </a>
            </nav>
          </div>
          <div className="relative mt-12 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 pt-6 text-micro text-product-text-secondary sm:grid-cols-[1fr_auto_1fr]">
            <span className="whitespace-nowrap">
              © <CopyrightYear initialYear={new Date().getFullYear()} /> Waitlyze
            </span>
            <div className="flex items-center gap-1 max-sm:justify-self-end">
              <a
                href="https://github.com/FALAK097/waitlyze"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Waitlyze on GitHub"
                className="inline-flex min-h-10 min-w-10 items-center justify-center text-product-text-primary transition-colors hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                <GitHubMark size={18} />
              </a>
              <a
                href="https://x.com/FalakGala097"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falak Gala on X"
                className="inline-flex min-h-10 min-w-10 items-center justify-center text-product-text-primary transition-colors hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                <svg
                  viewBox="0 0 1200 1227"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
                </svg>
              </a>
            </div>
            <a
              href="https://falakgala.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 inline-flex items-center gap-1.5 whitespace-nowrap hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 sm:col-span-1 sm:justify-self-end"
            >
              Made by Falak Gala
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
