import Link from "next/link";

import {
  Breadcrumbs,
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  FeatureLegend,
  FeatureValue,
  HowWeChecked,
  PrimaryLink,
  ResearchNote,
  StructuredData,
  ToolLogo,
} from "@/components/comparison/comparison-shell";
import {
  breadcrumbSchema,
  competitors,
  featureRows,
  pairwiseMatchups,
  pricingRows,
  RESEARCHED_ON,
  waitlyze,
} from "@/lib/comparison-data";

export const metadata = {
  title: { absolute: "Waitlist Software Comparison: 7 Tools Side by Side (2026)" },
  description:
    "Compare Waitlyze, GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister on pricing, free plans, referrals, email, analytics, and API access.",
  alternates: {
    canonical: "/compare",
    types: {
      "text/markdown": [{ url: "/compare.md", title: "Waitlist Software Comparison (Markdown)" }],
    },
  },
  openGraph: {
    type: "website",
    url: "/compare",
    title: "Waitlist Software Comparison: 7 Tools Side by Side (2026)",
    description: "Seven dedicated waitlist platforms compared on pricing and launch features.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waitlist Software Comparison: 7 Tools Side by Side (2026)",
    description: "Seven dedicated waitlist platforms compared on pricing and launch features.",
    images: ["/opengraph-image"],
  },
};

const crumbs = [
  { label: "Home", href: "/" },
  { label: "Compare", href: "/compare" },
];

export default function ComparePage() {
  const tools = [waitlyze, ...competitors];
  return (
    <ComparisonShell>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbSchema(crumbs),
            {
              "@type": "FAQPage",
              mainEntity: pairwiseMatchups.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.summary },
              })),
            },
          ],
        }}
      />
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Breadcrumbs items={crumbs} />
            <Eyebrow>Side-by-side comparison</Eyebrow>
            <h1 className="compare-title">Compare waitlist tools side by side.</h1>
            <p className="compare-lede">
              See how seven dedicated platforms price growth and which plans include essential
              launch features. Open a focused guide when the workflow matters as much as the
              checklist.
            </p>
            <div className="compare-hero-actions">
              <PrimaryLink href="/alternatives">Read the focused guides</PrimaryLink>
              <Link className="compare-text-link" href="/#features">
                See Waitlyze in action
              </Link>
            </div>
            <ResearchNote date={RESEARCHED_ON} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="quick-read">
          <div className="compare-section-heading">
            <h2 id="quick-read">The quick read</h2>
            <p>
              The best choice depends less on the longest feature list and more on how each tool
              counts growth.
            </p>
          </div>
          <dl className="compare-snapshot">
            <div>
              <dt>Lowest entry price</dt>
              <dd>LaunchList ($9/mo)</dd>
            </div>
            <div>
              <dt>Flat paid pricing</dt>
              <dd>Waitlyze, GetWaitlist, Waitlister</dd>
            </div>
            <div>
              <dt>Referral specialists</dt>
              <dd>Prefinery, KickoffLabs, Viral Loops</dd>
            </div>
            <div>
              <dt>Annual workspace price</dt>
              <dd>Waitlyze Pro ({WAITLYZE_PRICING.pro.annual.formatted}/yr)</dd>
            </div>
          </dl>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="comparison-table">
          <div className="compare-section-heading compare-heading-row">
            <div>
              <h2 id="comparison-table">Feature and pricing snapshot</h2>
              <p>
                Prices are in USD on monthly billing unless noted. On smaller screens, scroll the
                table sideways to see every tool.
              </p>
            </div>
            <FeatureLegend />
          </div>
          <div
            className="compare-table-wrap"
            role="region"
            aria-label="Scrollable comparison table"
            tabIndex={0}
          >
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">What to compare</th>
                  {tools.map((tool, index) => (
                    <th
                      className={index === 0 ? "is-waitlyze" : undefined}
                      scope="col"
                      key={tool.slug}
                    >
                      {index === 0 ? (
                        <span className="compare-table-tool">
                          <ToolLogo tool={tool} size={20} />
                          {tool.name}
                        </span>
                      ) : (
                        <Link className="compare-table-tool" href={`/alternatives/${tool.slug}`}>
                          <ToolLogo tool={tool} size={20} />
                          {tool.name}
                        </Link>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingRows.map(({ key, label }) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {tools.map((tool, index) => (
                      <td className={index === 0 ? "is-waitlyze" : undefined} key={tool.slug}>
                        {tool[key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {featureRows.map(({ key, label }) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {tools.map((tool, index) => (
                      <td className={index === 0 ? "is-waitlyze" : undefined} key={tool.slug}>
                        <FeatureValue value={tool.features[key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="compare-research-note mt-4">
            Similar names don&apos;t always mean similar depth. Open a focused guide for the
            tradeoffs behind each row.
          </p>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="head-to-head">
          <div className="compare-section-heading">
            <h2 id="head-to-head">Common head-to-head comparisons</h2>
            <p>
              Quick answers to the most frequent two-tool matchups founders compare before picking a
              waitlist platform.
            </p>
          </div>
          <div className="compare-prose-grid">
            {pairwiseMatchups.map((matchup) => (
              <article key={matchup.pair}>
                <h3>{matchup.pair}</h3>
                <p>{matchup.summary}</p>
                <p className="mt-3 flex flex-wrap gap-4">
                  {matchup.links.map((link) => (
                    <Link key={link.href} className="compare-text-link" href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </p>
              </article>
            ))}
          </div>
        </section>

        <HowWeChecked date={RESEARCHED_ON} />

        <ComparisonCta
          title="Keep the launch in one place."
          copy="Design the page, protect the list, grow through verified referrals, and learn what is converting without stitching five tools together."
          secondary={{ href: "/alternatives", label: "Read the focused guides" }}
        />
      </main>
    </ComparisonShell>
  );
}
