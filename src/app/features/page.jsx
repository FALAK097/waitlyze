import Image from "next/image";
import Link from "next/link";

import FinalCta from "@/components/landing/final-cta";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-metadata";

import "../landing.css";

export const metadata = {
  title: "Waitlist Software Features",
  description:
    "Build a branded waitlist, reward verified referrals, email subscribers, and track launch growth with Waitlyze.",
  alternates: {
    canonical: "/features",
    types: {
      "text/markdown": [{ url: "/features.md", title: "Waitlist Software Features (Markdown)" }],
    },
  },
  openGraph: {
    type: "website",
    url: "/features",
    title: "Waitlist Software Features | Waitlyze",
    description: "Build, grow, and measure your launch waitlist in one workspace.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waitlist Software Features | Waitlyze",
    description: "Build, grow, and measure your launch waitlist in one workspace.",
    images: ["/opengraph-image"],
  },
};

const ASSET_BASE = "https://assets.waitlyze.com";
const ASSET_VERSION = "v=4";

const featureGroups = [
  {
    eyebrow: "01 · BUILD",
    title: "A launch page that feels like yours.",
    description:
      "Choose a template, shape each section in the visual editor, and publish a branded page without writing code.",
    image: "showcase-builder-4k.png",
    alt: "Waitlyze visual page builder with editable blocks and a live page preview",
    links: [
      ["Visual page builder", "/docs/page-builder"],
      ["Hosted pages and publishing", "/docs/publishing"],
      ["Templates", "/templates"],
    ],
  },
  {
    eyebrow: "02 · GROW",
    title: "Turn early supporters into advocates.",
    description:
      "Give confirmed subscribers a personal referral link, show their place in line, and award points when referred signups are verified.",
    image: "showcase-referral-4k.png",
    alt: "Waitlyze subscriber referral page showing queue position, referral link, and earned points",
    links: [
      ["Verified referrals", "/docs/referrals"],
      ["Signup verification", "/docs/signup-flow"],
    ],
  },
  {
    eyebrow: "03 · MANAGE",
    title: "Keep every signup in reach.",
    description:
      "Review subscriber details, find people by status or source, and export your audience whenever you need it.",
    image: "showcase-subscribers-4k.png",
    alt: "Waitlyze subscriber manager with verification, acquisition source, and referral details",
    links: [
      ["Subscriber management", "/docs/subscribers"],
      ["CSV export", "/docs/subscribers"],
    ],
  },
  {
    eyebrow: "04 · ENGAGE",
    title: "Send the right update at the right time.",
    description:
      "Send confirmation emails, targeted launch updates, and automated sequences through your connected email sender.",
    image: "showcase-emails-4k.png",
    alt: "Waitlyze email workspace with a broadcast composer and campaign history",
    links: [
      ["Email setup", "/docs/email"],
      ["Broadcasts and automations", "/docs/broadcasts"],
    ],
  },
  {
    eyebrow: "05 · MEASURE",
    title: "See what is moving your launch forward.",
    description:
      "Follow visitors through verified signups, compare acquisition sources, and see how much growth comes from referrals.",
    image: "showcase-analytics-4k.png",
    alt: "Waitlyze analytics dashboard with signup conversion, referral metrics, and activity trends",
    links: [
      ["Launch analytics", "/docs/analytics"],
      ["Referral metrics", "/docs/referrals"],
    ],
  },
  {
    eyebrow: "06 · CONNECT",
    title: "Bring your launch tools together.",
    description:
      "Embed your signup form, connect the services you already use, or send signups through the API.",
    image: "showcase-publish-4k.png",
    alt: "Waitlyze publishing options for a hosted waitlist page, embedded form, API, and custom domain",
    links: [
      ["Embed forms", "/docs/embed"],
      ["API and webhooks", "/docs/api/reference"],
      ["Integrations", "/docs/zapier"],
    ],
  },
];

const headingId = (index) => `feature-group-${index + 1}`;

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
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-5 sm:px-6">
        <header className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-24">
          <div>
            <p className="wl-eyebrow">WAITLYZE FEATURES</p>
            <h1 className="mt-4 max-w-2xl font-product-display text-5xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl">
              Your waitlist, from first page to launch day.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-product-text-secondary">
              Build your page, bring in the right people, and keep the launch moving—all from one
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-product-text-primary bg-product-accent-solid px-5 font-medium text-product-accent-label transition-colors hover:bg-product-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                See plans
              </Link>
              <Link
                href="/docs"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-product-border-subtle px-5 font-medium transition-colors hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
              >
                Read the docs
              </Link>
            </div>
          </div>
          <div className="relative aspect-[1.35] overflow-hidden rounded-2xl border border-product-border-subtle bg-product-bg-inset shadow-sm">
            <Image
              src={`${ASSET_BASE}/showcase-builder-4k.png?${ASSET_VERSION}`}
              alt="Waitlyze visual page builder with a live preview of a branded waitlist page"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top"
            />
          </div>
        </header>

        <section className="pb-20 sm:pb-24" aria-labelledby="feature-list-title">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="wl-eyebrow">ONE WORKSPACE, EVERY STAGE</p>
              <h2
                id="feature-list-title"
                className="mt-3 font-product-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                The tools behind a thoughtful launch.
              </h2>
            </div>
            <p className="max-w-md text-product-text-secondary">
              Start with the essentials and add more as your audience grows.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {featureGroups.map((group, index) => (
              <article
                key={group.eyebrow}
                className={`overflow-hidden rounded-2xl border border-product-border-subtle bg-product-bg-surface ${index === 0 || index === featureGroups.length - 1 ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}
                aria-labelledby={headingId(index)}
              >
                <div
                  className={`relative aspect-[1.65] overflow-hidden bg-product-bg-inset ${index === 0 || index === featureGroups.length - 1 ? "md:aspect-auto md:min-h-full" : ""}`}
                >
                  <Image
                    src={`${ASSET_BASE}/${group.image}?${ASSET_VERSION}`}
                    alt={group.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-semibold tracking-[0.14em] text-product-text-secondary">
                    {group.eyebrow}
                  </p>
                  <h3
                    id={headingId(index)}
                    className="mt-3 font-product-display text-2xl leading-tight font-semibold tracking-tight text-balance"
                  >
                    {group.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-product-text-secondary">
                    {group.description}
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {group.links.map(([label, href]) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="inline-flex min-h-9 items-center rounded-full border border-product-border-subtle px-3 text-sm font-medium transition-colors hover:bg-product-bg-inset hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="pb-16 sm:pb-24">
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
