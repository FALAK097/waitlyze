import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import FinalCta from "@/components/landing/final-cta";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { getToolsByCategory, listTools, TOOL_CATEGORIES } from "@/lib/tools/registry.mjs";

export const metadata = {
  title: "Waitlyze Launch Lab — Free Pre-Launch Waitlist Tools",
  description:
    "Fourteen free, no-login pre-launch tools for founders: grade your waitlist landing page, model viral K-factor growth, write launch copy, design referral tiers, and audit list health.",
  alternates: {
    canonical: "/tools",
    types: {
      "text/markdown": [{ url: "/tools.md", title: "Waitlyze Launch Lab (Markdown)" }],
    },
  },
  openGraph: {
    type: "website",
    url: "/tools",
    title: "Waitlyze Launch Lab — Free Pre-Launch Waitlist Tools",
    description:
      "Plan it, calculate it, write it, and audit it for free—then carry the finished result straight into a working Waitlyze waitlist.",
    images: [{ url: "/og/tools", width: 1200, height: 630, alt: "Waitlyze Launch Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waitlyze Launch Lab — Free Pre-Launch Tools",
    description:
      "14 free no-login waitlist calculators, graders, copy builders, and DNS/health diagnostics.",
    images: ["/og/tools"],
  },
};

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 sm:px-6";

export default function LaunchLabHubPage() {
  const allTools = listTools();

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "CollectionPage",
            name: "Waitlyze Launch Lab — Free Pre-Launch Waitlist Tools",
            url: absoluteUrl("/tools"),
            description:
              "Fourteen free, no-login waitlist tools that hand off directly into a configured Waitlyze campaign.",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: allTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.title,
                url: absoluteUrl(tool.path),
              })),
            },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Launch Lab", path: "/tools" },
          ]),
        ]}
      />

      <main id="main-content" className="scroll-mt-24">
        {/* Editorial Hero */}
        <section className={`${CONTAINER} pt-14 pb-10 md:pt-18`} aria-labelledby="tools-hub-title">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 font-product-mono text-caption font-medium text-product-success-text">
              <span className="inline-block size-2 rounded-full bg-product-accent-solid ring-1 ring-product-text-primary/20" />
              Waitlyze Launch Lab · 14 free tools
            </p>
            <h1
              id="tools-hub-title"
              className="mt-4 font-product-display text-4xl leading-[1.06] font-semibold tracking-tight text-balance text-product-text-primary sm:text-5xl lg:text-[3.5rem]"
            >
              Plan, grade, and model your waitlist before launch day.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-product-text-secondary sm:text-lg">
              Use every calculator, diagnostic, and copy builder with zero login or email gate. When
              you are ready, carry your finished plan straight into a prefilled Waitlyze draft
              without rebuilding it.
            </p>

            {/* Category Jump Links */}
            <nav aria-label="Tool categories" className="mt-7 flex flex-wrap items-center gap-2">
              {TOOL_CATEGORIES.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-product-border-subtle bg-product-bg-surface px-4 py-1.5 text-caption font-medium text-product-text-primary transition-colors duration-150 hover:border-product-text-secondary hover:bg-product-bg-inset"
                >
                  {category.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Flagship Spotlight Strip */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              href="/tools/waitlist-landing-page-grader"
              className="group flex flex-col justify-between rounded-xl border border-product-text-primary/15 bg-product-bg-inset/60 p-6 transition-colors duration-150 hover:border-product-text-primary/40"
            >
              <div>
                <span className="inline-flex items-center rounded-full bg-product-accent-solid px-2.5 py-0.5 font-product-mono text-micro font-semibold text-product-accent-label">
                  Flagship diagnostic
                </span>
                <h2 className="mt-3 font-product-display text-2xl font-semibold tracking-tight text-product-text-primary group-hover:underline">
                  Waitlist Landing Page Grader
                </h2>
                <p className="mt-2 text-body leading-relaxed text-product-text-secondary">
                  Paste any public waitlist URL or HTML draft to score conversion clarity, form
                  friction, referral mechanics, and SEO/AEO readiness—with rewritten hero copy.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-body font-semibold text-product-text-primary">
                Audit a waitlist page
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/tools/viral-coefficient-calculator"
              className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-surface p-6 transition-colors duration-150 hover:border-product-text-secondary"
            >
              <div>
                <span className="inline-flex items-center rounded-full border border-product-border-subtle bg-product-bg-inset px-2.5 py-0.5 font-product-mono text-micro font-medium text-product-text-secondary">
                  Interactive simulator
                </span>
                <h2 className="mt-3 font-product-display text-2xl font-semibold tracking-tight text-product-text-primary group-hover:underline">
                  Viral Waitlist Growth Calculator
                </h2>
                <p className="mt-2 text-body leading-relaxed text-product-text-secondary">
                  Model weekly direct visitors, email verification drop-off, K-factor compounding,
                  and +10% highest-leverage sensitivity—with ungated CSV and PNG export.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-body font-semibold text-product-text-primary">
                Run the K-factor simulator
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>

        {/* Categorized Tool Directory */}
        <div className={`${CONTAINER} divide-y divide-product-border-subtle pb-16`}>
          {TOOL_CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category.id);
            return (
              <section
                key={category.id}
                id={category.id}
                className="scroll-mt-24 py-12"
                aria-labelledby={`cat-${category.id}`}
              >
                <div className="max-w-2xl">
                  <h2
                    id={`cat-${category.id}`}
                    className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary sm:text-3xl"
                  >
                    {category.label}
                  </h2>
                  <p className="mt-2 text-body text-product-text-secondary">
                    {category.description}
                  </p>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={tool.path}
                      className="group flex flex-col justify-between rounded-xl border border-product-border-subtle bg-product-bg-surface p-5 transition-colors duration-150 hover:border-product-text-secondary"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-product-mono text-micro text-product-success-text">
                            {tool.path.startsWith("/research/") ? "Research" : "Free tool"}
                          </span>
                          <span className="font-product-mono text-micro text-product-text-muted">
                            No login
                          </span>
                        </div>
                        <h3 className="mt-2.5 font-product-display text-lg leading-snug font-semibold tracking-tight text-product-text-primary group-hover:underline">
                          {tool.title}
                        </h3>
                        <p className="mt-2 text-caption leading-relaxed text-product-text-secondary">
                          {tool.targetJob}
                        </p>
                      </div>
                      <span className="mt-5 inline-flex items-center gap-1 text-caption font-semibold text-product-text-primary">
                        Open tool
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          aria-hidden="true"
                          className="transition-transform duration-150 group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* How Blueprint Handoff Works */}
        <section
          className={`${CONTAINER} border-t border-product-border-subtle py-14`}
          aria-labelledby="handoff-overview-title"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
            <div>
              <h2
                id="handoff-overview-title"
                className="font-product-display text-2xl font-semibold tracking-tight text-product-text-primary"
              >
                Zero-rebuild blueprint handoff
              </h2>
              <p className="mt-3 text-body leading-relaxed text-product-text-secondary">
                Every Launch Lab tool gives full results and exports without an account. If you
                choose to build in Waitlyze, your output travels straight into your draft campaign.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              <li className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
                <p className="font-product-mono text-micro font-semibold text-product-success-text">
                  Step 1
                </p>
                <h3 className="mt-1.5 text-body font-semibold text-product-text-primary">
                  Run any tool ungated
                </h3>
                <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                  See full calculations, audit checks, and copy exports immediately—no email wall.
                </p>
              </li>
              <li className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
                <p className="font-product-mono text-micro font-semibold text-product-success-text">
                  Step 2
                </p>
                <h3 className="mt-1.5 text-body font-semibold text-product-text-primary">
                  Carry a versioned blueprint
                </h3>
                <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                  Clicking the CTA saves a short-lived blueprint token preserved cleanly across
                  Google sign-in.
                </p>
              </li>
              <li className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
                <p className="font-product-mono text-micro font-semibold text-product-success-text">
                  Step 3
                </p>
                <h3 className="mt-1.5 text-body font-semibold text-product-text-primary">
                  Review and publish
                </h3>
                <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                  Your template, copy, form fields, and referral rules open as a private draft you
                  confirm before publishing.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <div className={`${CONTAINER} pb-18`}>
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
