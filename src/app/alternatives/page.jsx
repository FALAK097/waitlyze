import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import {
  Breadcrumbs,
  breadcrumbSchema,
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  HowWeChecked,
  PrimaryLink,
  ResearchNote,
  StructuredData,
} from "@/components/comparison/comparison-shell";
import { competitors, RESEARCHED_ON } from "@/lib/comparison-data";
import { SITE_URL } from "@/lib/site-metadata";

const crumbs = [
  { label: "Home", href: "/" },
  { label: "Alternatives", href: "/alternatives" },
];

export const metadata = {
  title: { absolute: "Best Waitlist Software Alternatives (2026) | Waitlyze" },
  description:
    "Compare Waitlyze with GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, Waitlister, and adjacent launch tools.",
  alternates: { canonical: "/alternatives" },
  openGraph: {
    type: "website",
    url: "/alternatives",
    title: "Waitlist software alternatives, without the sales fog",
    description: "A practical guide to choosing the right waitlist platform for your launch.",
  },
};

export default function AlternativesPage() {
  return (
    <ComparisonShell>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbSchema(crumbs),
            {
              "@type": "ItemList",
              name: "Waitlist software alternatives",
              itemListElement: competitors.map((competitor, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: `Waitlyze vs ${competitor.name}`,
                url: `${SITE_URL}/alternatives/${competitor.slug}`,
              })),
            },
          ],
        }}
      />
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Breadcrumbs items={crumbs} />
            <Eyebrow>Waitlist alternatives</Eyebrow>
            <h1 className="compare-title">Find the right waitlist tool.</h1>
            <p className="compare-lede">
              Compare dedicated platforms by the parts that shape a real launch: page design,
              verification, referrals, email, analytics, and how the bill changes as your audience
              grows.
            </p>
            <div className="compare-hero-actions">
              <PrimaryLink href="/compare">Compare every tool</PrimaryLink>
              <Link className="compare-text-link" href="/#features">
                Explore Waitlyze
              </Link>
            </div>
            <ResearchNote date={RESEARCHED_ON} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="dedicated-tools">
          <div className="compare-section-heading">
            <h2 id="dedicated-tools">Dedicated waitlist platforms</h2>
            <p>
              Six serious alternatives, each useful for a different launch shape. No universal
              winner—just clearer tradeoffs.
            </p>
          </div>
          <div className="compare-tool-list">
            {competitors.map((competitor) => (
              <Link
                className="compare-tool-link"
                href={`/alternatives/${competitor.slug}`}
                key={competitor.slug}
              >
                <span className="compare-tool-mark" aria-hidden="true">
                  <Image
                    src={competitor.logo}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                </span>
                <span className="compare-tool-copy">
                  <h3>Waitlyze vs {competitor.name}</h3>
                  <p>
                    <span className="compare-tool-category">{competitor.category}</span>
                    {competitor.bestFor}
                  </p>
                </span>
                <span className="compare-tool-meta">
                  From {competitor.price}
                  <HugeiconsIcon className="ml-2 inline" icon={ArrowRight02Icon} size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <HowWeChecked date={RESEARCHED_ON} />

        <ComparisonCta
          title="Start with the launch, not the feature checklist."
          copy="Waitlyze keeps your page, verified audience, referrals, email, and launch signals together—without making the setup feel like a growth-ops project."
          secondary={{ href: "/compare", label: "Compare every tool" }}
        />
      </main>
    </ComparisonShell>
  );
}
