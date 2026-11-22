import Link from "next/link";

import FAQAccordion from "@/components/landing/faq-accordion";
import Pricing from "@/components/landing/pricing";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";
import { SITE_URL } from "@/lib/site-metadata";

import "../landing.css";

export const metadata = {
  title: "Pricing",
  description:
    "Compare Waitlyze Free and Pro pricing. Start with one waitlist and 100 signups for $0, or upgrade for unlimited waitlists, analytics, email, and custom domains.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    url: "/pricing",
    title: "Waitlyze Pricing",
    description: "Start free, then upgrade when your launch needs more room to grow.",
  },
};

const pricingFaqs = [
  [
    "How much does Waitlyze cost?",
    `Waitlyze Free costs $0. Pro costs ${WAITLYZE_PRICING.pro.monthly.formatted} USD per month or ${WAITLYZE_PRICING.pro.annual.formatted} USD per year before any applicable tax or regional adjustment.`,
  ],
  [
    "What is included in the Free plan?",
    "Free includes one workspace, one waitlist, 100 cumulative signups, a hosted page, an embeddable form, referral links, queue position, confirmation email through your connected Resend sender, and CSV export.",
  ],
  [
    "What does Pro add?",
    "Pro adds unlimited workspaces, plus unlimited waitlists, signups, and workspace members on each workspace with a Pro subscription, along with advanced analytics, referral rewards, broadcasts, automations, custom domains, and the option to remove Waitlyze branding.",
  ],
  [
    "Can I cancel Pro?",
    "Yes. You can cancel renewal from workspace Billing and keep Pro through the end of the paid period.",
  ],
  [
    "Does Waitlyze offer refunds?",
    "Payments are non-refundable except where applicable law requires otherwise. Read the Refund Policy before purchasing if you need more detail.",
  ],
];

export default function PricingPage() {
  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/pricing#webpage`,
            url: `${SITE_URL}/pricing`,
            name: "Waitlyze Pricing",
            description: "Waitlyze Free and Pro plan pricing, limits, and billing details.",
            isPartOf: { "@id": `${SITE_URL}/#website` },
            about: { "@id": `${SITE_URL}/#software` },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Pricing",
                item: `${SITE_URL}/pricing`,
              },
            ],
          },
          {
            "@type": "FAQPage",
            mainEntity: pricingFaqs.map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          },
        ]}
      />
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-6 lg:py-24">
        <header className="max-w-3xl">
          <p className="wl-eyebrow">WAITLYZE PRICING</p>
          <h1 className="mt-4 font-product-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Start free. Upgrade when the audience grows.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-product-text-secondary">
            Free covers one real launch with up to 100 cumulative signups. Pro unlocks unlimited
            workspaces, removes waitlist, signup, and member limits on each workspace with a Pro
            subscription, and unlocks advanced launch operations.
          </p>
        </header>

        <div className="mt-6">
          <Pricing />
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-3" aria-labelledby="billing-title">
          <h2 id="billing-title" className="sr-only">
            Billing details
          </h2>
          {[
            [
              "Regional pricing",
              "Where available, checkout shows a country-adjusted price in your local currency.",
            ],
            [
              "Taxes at checkout",
              "Applicable tax is calculated before payment, so you can review the final total.",
            ],
            [
              "Your data stays yours",
              "Export subscribers as CSV before, during, or after a plan change.",
            ],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl bg-product-bg-inset p-6">
              <h3 className="font-product-display text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-product-text-secondary">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-20" aria-labelledby="pricing-faq-title">
          <div className="max-w-2xl">
            <p className="wl-eyebrow">PRICING FAQ</p>
            <h2
              id="pricing-faq-title"
              className="mt-4 font-product-display text-4xl font-semibold tracking-tight"
            >
              Plan and billing questions.
            </h2>
            <p className="mt-4 text-product-text-secondary">
              For the contractual details, read the{" "}
              <Link href="/terms" className="underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/refund-policy" className="underline underline-offset-4">
                Refund Policy
              </Link>
              .
            </p>
          </div>
          <div className="mt-8 max-w-3xl">
            <FAQAccordion items={pricingFaqs} />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
