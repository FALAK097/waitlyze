import Link from "next/link";

import FinalCta from "@/components/landing/final-cta";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-metadata";

import "../landing.css";

export const metadata = {
  title: "Waitlist Software Features",
  description:
    "Explore Waitlyze features for building a waitlist page, verified referrals, launch emails, audience analytics, embeds, API access, and integrations.",
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    url: "/features",
    title: "Waitlist Software Features | Waitlyze",
    description: "Build, grow, engage, and measure a launch waitlist from one focused workspace.",
  },
};

const featureGroups = [
  {
    title: "Build a branded waitlist",
    description:
      "Start with a hosted page or template, customize the signup experience, then publish on Waitlyze or your own domain.",
    features: [
      ["Visual page builder", "/docs/page-builder"],
      ["Hosted pages and publishing", "/docs/publishing"],
      ["Embeddable signup forms", "/docs/embed"],
      ["Custom domains with HTTPS", "/docs/domains"],
      ["Launch templates", "/templates"],
    ],
  },
  {
    title: "Grow through verified referrals",
    description:
      "Give confirmed subscribers a personal referral link, track their place in line, and reward qualified growth instead of unverified clicks.",
    features: [
      ["Verified referral credit", "/docs/referrals"],
      ["Queue positions and public leaderboards", "/docs/referrals"],
      ["Milestone rewards", "/docs/referrals"],
      ["Bot and velocity protection", "/docs/signup-flow"],
    ],
  },
  {
    title: "Engage the people who joined",
    description:
      "Keep the audience informed with confirmation email, targeted broadcasts, and automated sequences sent through your verified sender.",
    features: [
      ["Email confirmation", "/docs/email"],
      ["Audience broadcasts", "/docs/broadcasts"],
      ["Email automations", "/docs/automations"],
      ["Resend sender connection", "/docs/resend"],
    ],
  },
  {
    title: "Measure launch demand",
    description:
      "See the path from visit to verified signup, compare acquisition sources, and understand whether referrals are compounding growth.",
    features: [
      ["Visitor and signup conversion", "/docs/analytics"],
      ["Source, device, geography, and landing-page breakdowns", "/docs/analytics"],
      ["Referral and K-factor metrics", "/docs/analytics"],
      ["Subscriber search and CSV export", "/docs/subscribers"],
    ],
  },
  {
    title: "Connect your launch stack",
    description:
      "Use documented APIs and signed events when your waitlist needs to connect with a custom frontend or the tools your team already uses.",
    features: [
      ["Server-side Signup API", "/docs/api/reference"],
      ["Signed webhooks", "/docs/webhooks"],
      ["Slack notifications", "/docs/slack"],
      ["Discord notifications", "/docs/discord"],
      ["Zapier workflows", "/docs/zapier"],
    ],
  },
];

const headingId = (title) => title.replaceAll(" ", "-").toLowerCase();

export default function FeaturesPage() {
  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/features#webpage`,
            url: `${SITE_URL}/features`,
            name: "Waitlist Software Features",
            description:
              "Waitlyze features for building, growing, engaging, and measuring a launch waitlist.",
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
                name: "Features",
                item: `${SITE_URL}/features`,
              },
            ],
          },
        ]}
      />
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-6 lg:py-24">
        <header className="max-w-3xl">
          <p className="wl-eyebrow">WAITLYZE FEATURES</p>
          <h1 className="mt-4 font-product-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Waitlist software from first signup to launch day.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-product-text-secondary">
            Waitlyze gives founders one place to build a branded waitlist, verify referrals, email
            subscribers, and understand where launch demand comes from.
          </p>
        </header>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {featureGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-2xl border border-product-border-subtle bg-product-bg-surface p-6 sm:p-8"
              aria-labelledby={headingId(group.title)}
            >
              <h2
                id={headingId(group.title)}
                className="font-product-display text-2xl font-semibold tracking-tight"
              >
                {group.title}
              </h2>
              <p className="mt-3 leading-relaxed text-product-text-secondary">
                {group.description}
              </p>
              <ul className="mt-6 grid gap-3">
                {group.features.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="decoration-product-border-strong font-medium underline underline-offset-4 hover:text-product-success-text"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section
          className="mt-16 rounded-2xl bg-product-bg-inset p-6 sm:p-10"
          aria-labelledby="choose-title"
        >
          <h2
            id="choose-title"
            className="font-product-display text-3xl font-semibold tracking-tight"
          >
            Choose a starting point.
          </h2>
          <p className="mt-3 max-w-2xl text-product-text-secondary">
            Browse ready-to-customize templates, compare plans, or read the documentation before you
            create an account.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 font-medium">
            <Link href="/templates" className="underline underline-offset-4">
              Browse templates
            </Link>
            <Link href="/pricing" className="underline underline-offset-4">
              Compare pricing
            </Link>
            <Link href="/docs" className="underline underline-offset-4">
              Read the docs
            </Link>
          </div>
        </section>

        <div className="mt-16">
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
