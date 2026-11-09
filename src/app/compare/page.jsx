/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Safari does not focus scroll regions automatically; keyboard users need access to later columns. */
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
  pricingRows,
  RESEARCHED_ON,
  waitlyze,
} from "@/lib/comparison-data";

export const metadata = {
  title: { absolute: "Waitlist Software Comparison: 7 Tools Side by Side (2026) | Waitlyze" },
  description:
    "Compare Waitlyze, GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister on free plans, pricing, hosted pages, referrals, email, analytics, and API access.",
  alternates: { canonical: "/compare" },
  openGraph: {
    type: "website",
    url: "/compare",
    title: "Waitlist software compared side by side",
    description: "Seven dedicated waitlist platforms compared on pricing and launch features.",
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
        data={{ "@context": "https://schema.org", "@graph": [breadcrumbSchema(crumbs)] }}
      />
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Breadcrumbs items={crumbs} />
            <Eyebrow>Side-by-side comparison</Eyebrow>
            <h1 className="compare-title">Compare waitlist tools side by side.</h1>
            <p className="compare-lede">
              See how seven dedicated platforms price growth and where their essential launch
              features unlock. Open a focused guide when the workflow matters as much as the
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
              <dt>Lowest annual price</dt>
              <dd>Waitlyze Pro ($50/yr)</dd>
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
          <section
            className="compare-table-wrap"
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
          </section>
          <p className="compare-research-note mt-4">
            Similar names don&apos;t always mean similar depth. Open a focused guide for the
            tradeoffs behind each row.
          </p>
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
