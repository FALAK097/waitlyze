import { notFound } from "next/navigation";

import {
  AlternativeFaqSection,
  FairTakeSection,
  MatchupCard,
  PricingSection,
  RelatedComparisonsSection,
  ShortAnswerSection,
  SideBySideDuelTable,
  SwitchingStepsSection,
  WhyWaitlyzeSection,
} from "@/components/comparison/alternative-detail-sections";
import {
  Breadcrumbs,
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  HowWeChecked,
  ResearchNote,
  StructuredData,
} from "@/components/comparison/comparison-shell";
import SignupButton from "@/components/landing/signup-button";
import {
  breadcrumbSchema,
  competitors,
  featureRows,
  getCompetitor,
  getCompetitorFaqs,
  getRelatedCompetitors,
  pricingRows,
  RESEARCHED_ON,
  waitlyzeHighlights,
} from "@/lib/comparison-data";

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
          <MatchupCard competitor={competitor} pricingRows={pricingRows} />
        </section>

        <ShortAnswerSection competitor={competitor} />

        <SideBySideDuelTable
          competitor={competitor}
          pricingRows={pricingRows}
          featureRows={featureRows}
        />

        <PricingSection competitor={competitor} />

        <FairTakeSection competitor={competitor} />

        <WhyWaitlyzeSection competitor={competitor} highlights={waitlyzeHighlights} />

        <SwitchingStepsSection competitor={competitor} />

        <AlternativeFaqSection competitor={competitor} faqs={faqs} />

        <RelatedComparisonsSection related={related} />

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
