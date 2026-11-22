import Link from "next/link";

import Pricing from "@/components/landing/pricing";
import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import { SiteStructuredData } from "@/components/seo/structured-data";
import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";

import "../landing.css";

export const revalidate = 3600;

export const metadata = {
  title: { absolute: "Waitlyze Pricing: Free & Pro Plans | Waitlyze" },
  description: `Start free with one waitlist and 100 signups per workspace. Waitlyze Pro is ${WAITLYZE_PRICING.pro.monthly.formatted}/month or ${WAITLYZE_PRICING.pro.annual.formatted}/year for unlimited waitlists, signups, members, analytics, email, and custom domains.`,
  alternates: {
    canonical: "/pricing",
    types: { "text/markdown": [{ url: "/pricing.md", title: "Waitlyze pricing in Markdown" }] },
  },
  openGraph: {
    type: "website",
    url: "/pricing",
    title: "Waitlyze pricing: Free and Pro plans",
    description: "Clear waitlist software pricing with no per-subscriber charge on Pro.",
  },
};

const pricingFaqs = [
  [
    "How much does Waitlyze cost?",
    `Free costs $0 and includes one workspace, one waitlist, and 100 cumulative signups per Free workspace. Pro costs ${WAITLYZE_PRICING.pro.monthly.formatted} per month or ${WAITLYZE_PRICING.pro.annual.formatted} per year in USD before any applicable tax. Country-adjusted pricing may be available at checkout.`,
  ],
  [
    "Does the Free signup limit reset?",
    "No. The 100-signup allowance is cumulative for each Free workspace, not a monthly allowance. Deleting a waitlist does not reset that workspace's usage.",
  ],
  [
    "Do I need a separate email provider?",
    "Yes for subscriber email. Connect a verified Resend sender for confirmation email. Pro also unlocks broadcasts and automated sequences sent through that connected sender.",
  ],
  [
    "Does Waitlyze automatically deliver referral rewards?",
    "No. Waitlyze tracks verified referrals, points, milestones, and reward eligibility. The waitlist owner is responsible for fulfilling any promised reward.",
  ],
  [
    "Can I cancel Pro?",
    "Yes. Cancel renewal from workspace Billing and keep Pro through the current paid period. Payments are non-refundable except where applicable law requires otherwise.",
  ],
];

const planFit = [
  {
    title: "Choose Free for a first launch",
    copy: "Best when you are validating one idea, can stay under 100 cumulative signups in its Free workspace, and do not need a custom domain, team access, broadcasts, or advanced analytics.",
  },
  {
    title: "Choose Pro for active growth",
    copy: "Best when you need multiple launches, unlimited signups and teammates, source analytics, email campaigns, referral milestones, custom domains, or unbranded pages.",
  },
  {
    title: "Look elsewhere for reward fulfillment",
    copy: "Waitlyze records referral progress but does not ship products, issue gift cards, or automatically fulfill rewards. Use a fulfillment tool if that is central to your campaign.",
  },
];

export default function PricingPage() {
  return (
    <PublicShell>
      <SiteStructuredData faqs={pricingFaqs} />
      <main id="main-content" className="wl-landing wl-root">
        <section className="wl-hero" aria-labelledby="pricing-page-title">
          <div className="wl-hero-copy">
            <p className="wl-eyebrow">WAITLIST SOFTWARE PRICING</p>
            <h1 id="pricing-page-title">Simple pricing for the whole pre-launch journey.</h1>
            <p className="wl-hero-lede">
              Start with a real waitlist for free. Upgrade when you need unlimited signups, multiple
              launches, deeper analytics, subscriber email, or your own domain—without a
              per-subscriber bill.
            </p>
            <div className="wl-hero-actions">
              <SignupButton className="wl-hero-primary">Start for free</SignupButton>
              <Link className="wl-secondary-button" href="/compare">
                Compare waitlist tools
              </Link>
            </div>
            <p className="wl-assurance">No credit card required for Free.</p>
          </div>
        </section>

        <Pricing />

        <section className="wl-section" aria-labelledby="plan-fit-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">CHOOSE BY WHAT YOU NEED</p>
            <h2 id="plan-fit-title">Which plan fits?</h2>
            <p>The useful dividing line is how you plan to grow and operate the list.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {planFit.map((item) => (
              <article
                className="rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6"
                key={item.title}
              >
                <h3 className="text-xl tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-product-text-secondary">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="wl-section pt-0" aria-labelledby="pricing-details-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">BEFORE YOU BUY</p>
            <h2 id="pricing-details-title">What the price does—and does not—include.</h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg">Included with Pro</h3>
              <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm text-product-text-secondary">
                <li>Unlimited workspaces, waitlists, signups, and workspace members</li>
                <li>Advanced analytics, referral milestones, broadcasts, and automations</li>
                <li>One optional custom domain per waitlist and removal of Waitlyze branding</li>
                <li>CSV export, API access, webhooks, and hosted or embedded signup forms</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg">Separate or usage-dependent</h3>
              <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm text-product-text-secondary">
                <li>A connected, verified Resend sender is required for subscriber email</li>
                <li>You fulfill any referral rewards promised to subscribers</li>
                <li>Applicable taxes and any country-adjusted price appear at checkout</li>
                <li>Payments are non-refundable except where the law requires otherwise</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-sm text-product-text-secondary">
            Need implementation detail? Read the <Link href="/docs">product documentation</Link>,
            review the <Link href="/compare">side-by-side comparison</Link>, or see the{" "}
            <Link href="/refund-policy">Refund Policy</Link>.
          </p>
        </section>

        <section className="wl-section wl-faq pt-0" aria-labelledby="pricing-faq-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">PRICING FAQ</p>
            <h2 id="pricing-faq-title">Questions before upgrading.</h2>
          </div>
          <dl className="grid max-w-3xl gap-8">
            {pricingFaqs.map(([question, answer]) => (
              <div key={question}>
                <dt className="font-product-display text-lg font-semibold">{question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-product-text-secondary">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </PublicShell>
  );
}
