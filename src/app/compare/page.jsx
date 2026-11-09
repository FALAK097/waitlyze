/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Safari does not focus scroll regions automatically; keyboard users need access to later columns. */
import Link from "next/link";

import {
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  PrimaryLink,
  ResearchNote,
} from "@/components/comparison/comparison-shell";
import { competitors, featureRows, RESEARCHED_ON, waitlyze } from "@/lib/comparison-data";

export const metadata = {
  title: { absolute: "Waitlist Software Comparison: 7 Tools Side by Side | Waitlyze" },
  description:
    "Compare Waitlyze, GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister on pricing and launch features.",
  alternates: { canonical: "/compare" },
  openGraph: {
    type: "website",
    url: "/compare",
    title: "Waitlist software compared side by side",
    description: "A source-checked comparison of seven dedicated waitlist platforms.",
  },
};

export default function ComparePage() {
  const tools = [waitlyze, ...competitors];
  return (
    <ComparisonShell>
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Eyebrow>Side-by-side comparison</Eyebrow>
            <h1 className="compare-title">Compare waitlist tools side by side.</h1>
            <p className="compare-lede">
              See how seven dedicated platforms price growth and where their essential launch
              features unlock. Use the focused guides when the workflow matters as much as the
              checklist.
            </p>
            <div className="compare-hero-actions">
              <PrimaryLink href="/alternatives">Read the focused guides</PrimaryLink>
              <Link className="compare-text-link" href="/">
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
              <dd>LaunchList · $9/mo</dd>
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
              <dt>Waitlyze’s angle</dt>
              <dd>One calm workspace for the whole launch</dd>
            </div>
          </dl>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="comparison-table">
          <div className="compare-section-heading">
            <h2 id="comparison-table">Feature and pricing snapshot</h2>
            <p>
              Prices are listed in USD and billed monthly unless noted. Scroll horizontally on
              smaller screens; the first column stays descriptive and every focused guide links back
              to the vendor source.
            </p>
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
                      {tool.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map(([label, key]) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {tools.map((tool, index) => (
                      <td className={index === 0 ? "is-waitlyze" : undefined} key={tool.slug}>
                        {tool[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <p className="compare-research-note mt-4">
            Waitlyze Pro details reflect the open billing implementation and may change before it
            ships. Boolean rows deliberately avoid implying that every implementation is equal.
          </p>
        </section>

        <ComparisonCta
          title="Keep the launch in one place."
          copy="Design the page, protect the list, grow through verified referrals, and learn what is converting—without stitching five tools together."
          href="/"
          label="Start with Waitlyze"
        />
      </main>
    </ComparisonShell>
  );
}
