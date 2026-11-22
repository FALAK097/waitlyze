import Link from "next/link";

import FinalCta from "@/components/landing/final-cta";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";

import "../landing.css";

const GITHUB_URL = "https://github.com/FALAK097/waitlyze";
const FOUNDER_URL = "https://falakgala.dev";

export const metadata = {
  title: "About",
  description:
    "Waitlyze is open-source waitlist software built by Falak Gala for founders who want to build, grow, email, and measure a launch audience.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    title: "About Waitlyze",
    description: "Why Waitlyze exists, who it is for, and how the open-source product is built.",
  },
};

export default function AboutPage() {
  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "AboutPage",
            "@id": `${SITE_URL}/about#webpage`,
            url: `${SITE_URL}/about`,
            name: "About Waitlyze",
            description: SITE_DESCRIPTION,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            mainEntity: { "@id": `${SITE_URL}/#organization` },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "About",
                item: `${SITE_URL}/about`,
              },
            ],
          },
        ]}
      />
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-6 lg:py-24">
        <header className="max-w-3xl">
          <p className="wl-eyebrow">ABOUT WAITLYZE</p>
          <h1 className="mt-4 font-product-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Build an audience before you ask it to show up.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-product-text-secondary">
            Waitlyze is open-source waitlist software for founders and product teams. It brings
            signup pages, verified referrals, subscriber email, and launch analytics into one
            focused workspace.
          </p>
        </header>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <section
            className="rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 sm:p-8"
            aria-labelledby="why-title"
          >
            <h2
              id="why-title"
              className="font-product-display text-3xl font-semibold tracking-tight"
            >
              Why it exists
            </h2>
            <div className="mt-5 grid gap-4 leading-relaxed text-product-text-secondary">
              <p>
                A launch waitlist should do more than collect email addresses. It should show who is
                interested, what brought them in, and which early supporters help the audience grow.
              </p>
              <p>
                Waitlyze keeps those jobs connected so founders can move from a launch page to an
                informed rollout without stitching together a form, spreadsheet, referral script,
                and email tool.
              </p>
            </div>
          </section>

          <section
            className="rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 sm:p-8"
            aria-labelledby="builder-title"
          >
            <h2
              id="builder-title"
              className="font-product-display text-3xl font-semibold tracking-tight"
            >
              Built in the open
            </h2>
            <div className="mt-5 grid gap-4 leading-relaxed text-product-text-secondary">
              <p>
                Waitlyze is built and maintained by{" "}
                <a
                  href={FOUNDER_URL}
                  className="font-medium text-product-text-primary underline underline-offset-4"
                >
                  Falak Gala
                </a>
                . The source, release history, and product documentation are public.
              </p>
              <p>
                That means prospective users can inspect how the product works, follow meaningful
                changes, and ask direct questions before trusting it with a launch audience.
              </p>
            </div>
          </section>
        </div>

        <section
          className="mt-16 rounded-2xl bg-product-bg-inset p-6 sm:p-10"
          aria-labelledby="principles-title"
        >
          <h2
            id="principles-title"
            className="font-product-display text-3xl font-semibold tracking-tight"
          >
            Product principles
          </h2>
          <dl className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              [
                "Verified growth",
                "Referral credit should reflect confirmed people, not raw clicks or disposable addresses.",
              ],
              [
                "Portable audiences",
                "Subscribers can be exported, and integrations use documented APIs and signed webhooks.",
              ],
              [
                "Clear operations",
                "Pricing, limits, publishing state, and launch metrics should be understandable before they become urgent.",
              ],
            ].map(([term, description]) => (
              <div key={term}>
                <dt className="font-product-display text-xl font-semibold">{term}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-product-text-secondary">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16" aria-labelledby="learn-title">
          <h2
            id="learn-title"
            className="font-product-display text-3xl font-semibold tracking-tight"
          >
            Learn more or get in touch
          </h2>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 font-medium">
            <Link href="/features" className="underline underline-offset-4">
              Explore features
            </Link>
            <Link href="/docs" className="underline underline-offset-4">
              Read the docs
            </Link>
            <Link href="/docs/changelog" className="underline underline-offset-4">
              View the changelog
            </Link>
            <a href={GITHUB_URL} className="underline underline-offset-4">
              Browse the source
            </a>
            <a href="mailto:support@waitlyze.com" className="underline underline-offset-4">
              Contact Waitlyze
            </a>
          </div>
        </section>

        <div className="mt-16">
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
