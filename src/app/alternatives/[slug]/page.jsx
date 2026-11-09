import {
  Analytics01Icon,
  ArrowRight01Icon,
  CodeIcon,
  Mail01Icon,
  PaintBoardIcon,
  ShieldCheckIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  breadcrumbSchema,
  CheckList,
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  FeatureLegend,
  FeatureValue,
  HowWeChecked,
  ResearchNote,
  StructuredData,
  ToolLogo,
} from "@/components/comparison/comparison-shell";
import FAQAccordion from "@/components/landing/faq-accordion";
import SignupButton from "@/components/landing/signup-button";
import {
  competitors,
  featureRows,
  getCompetitor,
  getCompetitorFaqs,
  getFirstYearCost,
  getRelatedCompetitors,
  pricingRows,
  RESEARCHED_ON,
  waitlyze,
  waitlyzeHighlights,
} from "@/lib/comparison-data";

const highlightIcons = {
  page: PaintBoardIcon,
  shield: ShieldCheckIcon,
  mail: Mail01Icon,
  analytics: Analytics01Icon,
  code: CodeIcon,
  source: SourceCodeIcon,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return competitors.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) return {};
  const title = `Waitlyze vs ${competitor.name}: Pricing, Features & Verdict (2026)`;
  const description = `${competitor.name} alternative: compare Waitlyze and ${competitor.name} on free plans, pricing, hosted pages, referrals, email, analytics, custom domains, and API access.`;
  return {
    title: { absolute: `${title} | Waitlyze` },
    description,
    alternates: { canonical: `/alternatives/${slug}` },
    openGraph: { type: "article", url: `/alternatives/${slug}`, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

function CostBars({ competitor }) {
  const cost = getFirstYearCost(competitor);
  const rows = [
    { label: "Waitlyze Pro, annual", value: cost.waitlyzeAnnual, highlight: true },
    { label: "Waitlyze Pro, monthly", value: cost.waitlyzeMonthly, highlight: true },
    { label: `${competitor.name}, entry plan`, value: cost.competitor },
  ];
  const max = Math.max(...rows.map((row) => row.value));

  return (
    <figure className="compare-cost">
      <figcaption>
        <span>First 12 months at list price</span>
        <span>Entry paid plan, before tax or regional pricing</span>
      </figcaption>
      <dl>
        {rows.map((row) => (
          <div className={row.highlight ? "is-waitlyze" : undefined} key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <span
                className="compare-cost-bar"
                style={{ "--bar": `${Math.max((row.value / max) * 100, 4)}%` }}
                aria-hidden="true"
              />
              <span className="compare-cost-value">${row.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export default async function AlternativeDetailPage({ params }) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  const faqs = getCompetitorFaqs(competitor);
  const related = getRelatedCompetitors(slug);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Alternatives", href: "/alternatives" },
    { label: `Waitlyze vs ${competitor.name}`, href: `/alternatives/${slug}` },
  ];

  return (
    <ComparisonShell>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbSchema(crumbs),
            {
              "@type": "FAQPage",
              mainEntity: faqs.map(([question, answer]) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer },
              })),
            },
          ],
        }}
      />
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-detail-hero">
          <div className="compare-detail-hero-copy">
            <Breadcrumbs items={crumbs} />
            <Eyebrow>{competitor.name} alternative</Eyebrow>
            <h1 className="compare-title">Waitlyze vs {competitor.name}</h1>
            <p className="compare-lede">{competitor.summary}</p>
            <div className="compare-hero-actions">
              <SignupButton>Start free</SignupButton>
              <a className="compare-text-link" href="#side-by-side">
                See the side-by-side
              </a>
            </div>
            <ResearchNote date={RESEARCHED_ON} />
          </div>

          <aside className="compare-matchup" aria-label="Matchup summary">
            <div className="compare-matchup-head">
              <div className="is-waitlyze">
                <ToolLogo tool={waitlyze} size={48} />
                <strong>Waitlyze</strong>
                <span>Launch workspace</span>
              </div>
              <span className="compare-matchup-vs" aria-hidden="true">
                vs
              </span>
              <div>
                <ToolLogo tool={competitor} size={48} />
                <strong>{competitor.name}</strong>
                <span>{competitor.category}</span>
              </div>
            </div>
            <dl className="compare-matchup-rows">
              {pricingRows.map(({ key, label }) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd className="is-waitlyze">{waitlyze[key]}</dd>
                  <dd>{competitor[key]}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="short-answer">
          <div className="compare-section-heading">
            <Eyebrow>The short answer</Eyebrow>
            <h2 id="short-answer" className="compare-verdict">
              {competitor.verdict}
            </h2>
          </div>
          <div className="compare-choose">
            <div className="compare-choose-card is-waitlyze">
              <h3>
                <ToolLogo tool={waitlyze} size={28} />
                Choose Waitlyze if
              </h3>
              <CheckList items={competitor.chooseWaitlyze} />
            </div>
            <div className="compare-choose-card">
              <h3>
                <ToolLogo tool={competitor} size={28} />
                Choose {competitor.name} if
              </h3>
              <CheckList items={competitor.chooseThem} />
            </div>
          </div>
        </section>

        <section
          id="side-by-side"
          className="compare-wrap compare-section"
          aria-labelledby="side-by-side-title"
        >
          <div className="compare-section-heading compare-heading-row">
            <div>
              <Eyebrow>Side by side</Eyebrow>
              <h2 id="side-by-side-title">Feature by feature</h2>
              <p>Where each capability is available and what it costs to unlock.</p>
            </div>
            <FeatureLegend />
          </div>
          <table className="compare-duel">
            <caption className="sr-only">
              Waitlyze compared with {competitor.name} on pricing and launch features
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Capability</span>
                </th>
                <th scope="col" className="is-waitlyze">
                  <span>
                    <ToolLogo tool={waitlyze} size={24} />
                    Waitlyze
                  </span>
                </th>
                <th scope="col">
                  <span>
                    <ToolLogo tool={competitor} size={24} />
                    {competitor.name}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pricingRows.map(({ key, label }) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td className="is-waitlyze" data-tool="Waitlyze">
                    {waitlyze[key]}
                  </td>
                  <td data-tool={competitor.name}>{competitor[key]}</td>
                </tr>
              ))}
              {featureRows.map(({ key, label, hint }) => (
                <tr key={key}>
                  <th scope="row">
                    {label}
                    <span>{hint}</span>
                  </th>
                  <td className="is-waitlyze" data-tool="Waitlyze">
                    <FeatureValue value={waitlyze.features[key]} />
                  </td>
                  <td data-tool={competitor.name}>
                    <FeatureValue value={competitor.features[key]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="pricing">
          <div className="compare-section-heading">
            <Eyebrow>Pricing</Eyebrow>
            <h2 id="pricing">How the bill grows</h2>
            <p>{competitor.pricingStory}</p>
          </div>
          <div className="compare-pricing">
            <div className="compare-plans">
              {waitlyze.plans.map((plan) => (
                <article className="compare-plan" key={plan.name}>
                  <header>
                    <h3>Waitlyze {plan.name}</h3>
                    <p>
                      <strong>{plan.price}</strong> {plan.cadence}
                    </p>
                  </header>
                  <CheckList items={plan.items} />
                </article>
              ))}
            </div>
            <CostBars competitor={competitor} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="fair-take">
          <div className="compare-section-heading">
            <Eyebrow>A fair take</Eyebrow>
            <h2 id="fair-take">Where {competitor.name} does better today</h2>
            <p>{competitor.whereTheyWinToday}</p>
          </div>
          <div className="compare-callout-card">
            <span className="compare-callout-badge">Who should pick {competitor.name}</span>
            <p className="compare-callout-copy">{competitor.whoShouldPickThemSummary}</p>
          </div>
          <div className="compare-prose-grid">
            <div>
              <h3>{competitor.name} strengths</h3>
              <CheckList items={competitor.strengths} />
            </div>
            <div>
              <h3>Tradeoffs to keep in mind</h3>
              <ul className="compare-tradeoffs">
                {competitor.tradeoffs.map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="why-waitlyze">
          <div className="compare-section-heading">
            <Eyebrow>Why Waitlyze</Eyebrow>
            <h2 id="why-waitlyze">Everything the launch needs, in one calm place.</h2>
            <p>
              The parts of Waitlyze that founders switching from {competitor.name} notice first.
            </p>
          </div>
          <div className="compare-highlights">
            {waitlyzeHighlights.map(({ icon, title, copy }) => (
              <article key={title}>
                <HugeiconsIcon
                  icon={highlightIcons[icon]}
                  size={22}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="switching">
          <div className="compare-section-heading">
            <Eyebrow>Switching</Eyebrow>
            <h2 id="switching">Move from {competitor.name} in an afternoon.</h2>
            <p>Your list comes with you. Nothing has to go dark while you switch.</p>
          </div>
          <ol className="compare-steps">
            <li>
              <span className="compare-step-number">01</span>
              <h3>Export your list</h3>
              <p>Download your subscribers from {competitor.name} as a CSV file.</p>
            </li>
            <li>
              <span className="compare-step-number">02</span>
              <h3>Import into Waitlyze</h3>
              <p>
                Create a waitlist and import the CSV from the Subscribers view. Duplicate emails are
                skipped automatically.
              </p>
            </li>
            <li>
              <span className="compare-step-number">03</span>
              <h3>Publish and update links</h3>
              <p>
                Start from a <Link href="/templates">template</Link>, publish your hosted page or
                embed, and point your launch links to it.
              </p>
            </li>
          </ol>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="faq">
          <div className="compare-faq">
            <div className="compare-section-heading">
              <Eyebrow>FAQs</Eyebrow>
              <h2 id="faq">Waitlyze vs {competitor.name}, answered.</h2>
              <p>
                More questions? <Link href="/docs">Read the docs</Link> or{" "}
                <a href="mailto:hi@falakgala.dev">get in touch</a>.
              </p>
            </div>
            <FAQAccordion items={faqs} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="more-comparisons">
          <div className="compare-section-heading compare-heading-row">
            <div>
              <Eyebrow>Keep comparing</Eyebrow>
              <h2 id="more-comparisons">Other waitlist tools</h2>
            </div>
            <Link className="compare-text-link" href="/compare">
              See all seven side by side
            </Link>
          </div>
          <ul className="compare-related">
            {related.map((tool) => (
              <li key={tool.slug}>
                <Link href={`/alternatives/${tool.slug}`}>
                  <ToolLogo tool={tool} size={32} />
                  <span>
                    <strong>Waitlyze vs {tool.name}</strong>
                    <span>
                      {tool.category} · from {tool.price}
                    </span>
                  </span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <HowWeChecked date={RESEARCHED_ON} />

        <ComparisonCta
          title={`Ready to try the ${competitor.name} alternative?`}
          copy="Build your page, verify your audience, and grow through referrals. Free for your first 100 signups, no credit card required."
          secondary={{ href: "/templates", label: "Browse templates" }}
        />
      </main>
    </ComparisonShell>
  );
}
