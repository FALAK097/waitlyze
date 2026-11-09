import { notFound } from "next/navigation";

import {
  CheckList,
  ComparisonShell,
  Eyebrow,
  PrimaryLink,
  ResearchNote,
  SourceLink,
} from "@/components/comparison/comparison-shell";
import { competitors, getCompetitor, RESEARCHED_ON, waitlyze } from "@/lib/comparison-data";

export function generateStaticParams() {
  return competitors.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) return {};
  const title = `Waitlyze vs ${competitor.name}: Features & Pricing (2026)`;
  const description = `Compare Waitlyze and ${competitor.name} on pricing, pages, referrals, email, analytics, custom domains, and developer access.`;
  return {
    title: { absolute: `${title} | Waitlyze` },
    description,
    alternates: { canonical: `/alternatives/${slug}` },
    openGraph: { type: "article", url: `/alternatives/${slug}`, title, description },
  };
}

export default async function AlternativeDetailPage({ params }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  return (
    <ComparisonShell>
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Eyebrow>Waitlyze vs {competitor.name}</Eyebrow>
            <h1 className="compare-title">Two good tools. Different kinds of launch.</h1>
            <p className="compare-lede">{competitor.verdict}</p>
            <div className="compare-hero-actions">
              <PrimaryLink href="/">Try Waitlyze free</PrimaryLink>
              <SourceLink href={competitor.source} />
            </div>
          </div>
          <div className="compare-hero-aside">
            <ResearchNote date={RESEARCHED_ON} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="at-a-glance">
          <div className="compare-section-heading">
            <h2 id="at-a-glance">At a glance</h2>
            <p>
              A practical pricing snapshot—not a claim that similarly named features work the same
              way.
            </p>
          </div>
          <div className="compare-versus">
            <dl className="compare-snapshot">
              <div>
                <dt>Waitlyze</dt>
                <dd>{waitlyze.price}</dd>
              </div>
              <div>
                <dt>{competitor.name}</dt>
                <dd>{competitor.price}</dd>
              </div>
              <div>
                <dt>Waitlyze model</dt>
                <dd>{waitlyze.model}</dd>
              </div>
              <div>
                <dt>{competitor.name} model</dt>
                <dd>{competitor.model}</dd>
              </div>
            </dl>
            <p className="compare-verdict">{competitor.verdict}</p>
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="tradeoffs">
          <div className="compare-section-heading">
            <h2 id="tradeoffs">Where each choice makes sense</h2>
            <p>
              {competitor.name} can be the better fit for {competitor.bestFor.toLowerCase()} The
              decision turns on these strengths and constraints.
            </p>
          </div>
          <div className="compare-prose-grid">
            <div>
              <h2>{competitor.name} strengths</h2>
              <CheckList items={competitor.strengths} />
            </div>
            <div>
              <h2>Tradeoffs to price in</h2>
              <ul className="compare-tradeoffs">
                {competitor.tradeoffs.map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="compare-wrap compare-cta">
          <div>
            <h2>A launch workspace, not just a signup box.</h2>
            <p>
              Waitlyze is designed for the full path from page idea to a verified, engaged launch
              audience—with the operational details kept quiet until you need them.
            </p>
          </div>
          <div className="compare-cta-actions">
            <PrimaryLink href="/compare">Compare all seven tools</PrimaryLink>
          </div>
        </section>
      </main>
    </ComparisonShell>
  );
}
