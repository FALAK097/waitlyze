import {
  ArrowUpRight01Icon,
  CodeIcon,
  Download01Icon,
  GlobeIcon,
  Mail01Icon,
  Notification01Icon,
  ShieldCheckIcon,
  UserGroupIcon,
  WorkflowCircle01Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PostCard } from "@/components/blog/post-card";
import AskAi from "@/components/landing/ask-ai";
import FAQAccordion from "@/components/landing/faq-accordion";
import FinalCta from "@/components/landing/final-cta";
import GitHubMark from "@/components/landing/github-mark";
import Pricing from "@/components/landing/pricing";
import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import TemplateCards from "@/components/landing/template-cards";
import { SiteStructuredData } from "@/components/seo/structured-data";
import { getRegionalPricing } from "@/lib/billing/regional-pricing.mjs";
import { getPosts, getReadingMinutes } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";
import { listTemplates } from "@/lib/templates/catalog.mjs";

import "./landing.css";

export const metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
    types: { "text/markdown": [{ url: "/index.md", title: "Markdown for AI agents" }] },
  },
  openGraph: { type: "website", url: "/", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

async function LocalizedPricing() {
  const requestHeaders = await headers();
  const country =
    requestHeaders.get("x-vercel-ip-country") ||
    requestHeaders.get("cf-ipcountry") ||
    (process.env.NODE_ENV === "development" ? "IN" : null);
  const regionalPricing = await getRegionalPricing(country);
  return <Pricing regionalPricing={regionalPricing} />;
}

function PricingFallback() {
  return (
    <section
      id="pricing"
      className="wl-section wl-pricing bg-product-bg-page px-4 sm:px-5 md:px-8 lg:px-12"
      aria-label="Loading plans"
    >
      <div className="@container mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-5 md:gap-6 @min-[56rem]:grid-cols-2">
          <div className="h-112 animate-pulse rounded-2xl border border-product-border-subtle bg-product-bg-surface" />
          <div className="h-112 animate-pulse rounded-2xl border border-product-border-subtle bg-product-bg-surface" />
        </div>
      </div>
    </section>
  );
}

const github = "https://github.com/FALAK097/waitlyze";
const faqs = [
  [
    "Is Waitlyze free?",
    "Yes. Free includes one waitlist (drafts count) and 100 lifetime signups per workspace. Deleting a waitlist removes its data but does not reset signup usage. Pro is $15 per month or $50 per year, with unlimited waitlists, signups, and workspace members.",
  ],
  [
    "Will prices change by country?",
    "Where available, the pricing page shows Dodo Payments' country-adjusted price in your local currency. Taxes are calculated at checkout, and the final total is confirmed before payment.",
  ],
  [
    "Do I need a website?",
    "No. Publish a hosted waitlist page and share its link. You can also embed your published form on your own site.",
  ],
  [
    "How do referrals work?",
    "When referral sharing is enabled, verified subscribers receive a personal link. Referred signups must confirm their email before they count toward referral credit.",
  ],
  [
    "Can I email my subscribers?",
    "Yes, with Pro. Connect and verify your own Resend sender first. Waitlyze never falls back to its own Resend account for subscriber email. Marketing messages go only to verified subscribers who explicitly opted in.",
  ],
  [
    "Can I edit a published page?",
    "Yes. Changes save as drafts. Your live page stays unchanged until you publish again, and you can roll back to an earlier published revision.",
  ],
  [
    "Can I export my audience?",
    "Yes. Search and filter subscribers in the dashboard, then export them as CSV.",
  ],
  [
    "What does analytics show?",
    "See visitors, signups, conversion and verification, plus available breakdowns by source, device, geography and landing page.",
  ],
  [
    "Can my team work together?",
    "Yes. Invite teammates to your workspace and assign permissions for editing, publishing and email work.",
  ],
  [
    "Can I use my own domain?",
    "Yes, when custom-domain support is configured for your deployment. You can use a Waitlyze-hosted page without setting up a domain.",
  ],
  [
    "Do I need a separate email service?",
    "Email sending needs a configured sender and delivery setup. You can connect a verified Resend domain; marketing email also requires verified addresses and explicit opt-in.",
  ],
  [
    "How do I protect my waitlist from bots?",
    "You can turn on Cloudflare Turnstile for the signup form. Referral credit is gated on email verification and eligibility checks.",
  ],
  [
    "Can I collect signups through my own form?",
    "Yes. Use the server-side Signup API with a scoped API key, or embed the published form. Never put a secret API key in browser code.",
  ],
  [
    "What happens if I pause my waitlist?",
    "Paused waitlists stop accepting new signups. Your published content and subscriber records remain available to manage from your workspace.",
  ],
  [
    "Can I cancel Pro or get a refund?",
    "You can cancel renewal from workspace Billing at any time and keep Pro through the paid period. Payments are non-refundable except where applicable law requires otherwise. See the Refund Policy in the footer.",
  ],
];

const moreFeatures = [
  {
    icon: Mail01Icon,
    title: "Email with intent",
    copy: "Welcome messages, reminders and broadcasts for verified subscribers who opted in.",
  },
  {
    icon: Download01Icon,
    title: "Your list stays yours",
    copy: "Filter your subscribers and export them to CSV whenever you need.",
  },
  {
    icon: GlobeIcon,
    title: "Your own address",
    copy: "Connect a custom domain when your deployment is configured for it.",
  },
  {
    icon: WorkflowCircle01Icon,
    title: "Events for your tools",
    copy: "Send signed webhook events to your own systems when a signup or referral happens.",
  },
  {
    icon: UserGroupIcon,
    title: "Room for your team",
    copy: "Invite teammates and set permissions for editing, publishing and email.",
  },
  {
    icon: WorkHistoryIcon,
    title: "A safer publish button",
    copy: "Keep drafts private, pause signups and roll back to a previous published version.",
  },
  {
    icon: ShieldCheckIcon,
    title: "A cleaner list",
    copy: "Require email verification and add Turnstile to the signup form.",
  },
  {
    icon: CodeIcon,
    title: "Built for your stack",
    copy: "Use scoped API keys for server-side signups, alongside the hosted page and embed.",
  },
  {
    icon: Notification01Icon,
    title: "Know when things happen",
    copy: "Send launch activity to Slack or Discord when notifications are configured.",
  },
];

function TextLink({ href, children }) {
  return (
    <Link className="wl-text-link" href={href}>
      {children}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
    </Link>
  );
}

function ProductFrame({ src, alt, tone = "mint", hero = false }) {
  return (
    <div className={`wl-product-frame wl-frame-${tone} ${hero ? "wl-product-frame-hero" : ""}`}>
      <div className="wl-product-window">
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={625}
          sizes={hero ? "(max-width: 1152px) 100vw, 1088px" : "(max-width: 720px) 100vw, 540px"}
          priority={hero}
        />
      </div>
    </div>
  );
}

const featureCards = [
  {
    title: "Build a page that feels like yours",
    copy: "Edit the headline, signup form and page sections while previewing the experience as you go.",
    image: "/images/landing-design.webp",
    alt: "Authenticated Waitlyze editor with a live preview of a sample Weekend waitlist",
    tone: "mint",
  },
  {
    title: "Make it work on every screen",
    copy: "Switch to the mobile preview before you publish, so your page looks right wherever it’s shared.",
    image: "/images/landing-design-late.webp",
    alt: "Authenticated Waitlyze editor showing the mobile preview of the sample Weekend waitlist",
    tone: "blue",
  },
  {
    title: "Publish and share",
    copy: "Get a hosted link or copy an embed snippet for your own website.",
    image: "/images/landing-publish.webp",
    alt: "Waitlyze publish screen showing hosted page and embed options for a sample waitlist",
    tone: "sand",
  },
  {
    title: "See what’s working",
    copy: "Follow visitors, signups and conversion from a single analytics view.",
    image: "/images/landing-understand.webp",
    alt: "Authenticated Waitlyze analytics dashboard with sample visitor and signup data",
    tone: "blue",
  },
  {
    title: "Turn signups into supporters",
    copy: "Give verified subscribers a share link, with points and queue position as friends join.",
    image: "/images/landing-referrals.webp",
    alt: "Waitlyze confirmed-signup preview with a referral link and leaderboard using example data",
    tone: "referral",
  },
];

const steps = [
  {
    number: "01",
    title: "Make your page",
    copy: "Start with a template, then write your story in the page builder. Edit your content and preview it on desktop or mobile before anyone sees it.",
    href: "/docs/page-builder",
    link: "Explore the page builder",
    image: "/images/landing-design.webp",
    alt: "Waitlyze page builder editing a sample waitlist",
    tone: "mint",
  },
  {
    number: "02",
    title: "Put it out there",
    copy: "Publish to a Waitlyze-hosted page, embed the form on your site, or collect signups through the API. One waitlist, wherever your audience finds you.",
    href: "/docs/embed",
    link: "See publishing options",
    image: "/images/landing-publish.webp",
    alt: "Waitlyze publish screen with hosted link and embed code",
    tone: "sand",
  },
  {
    number: "03",
    title: "Give people a reason to share",
    copy: "After signing up and verifying their email, subscribers can get a personal link to invite friends. Track their progress, points and place in the queue.",
    href: "/docs/referrals",
    link: "How referrals work",
    image: "/images/landing-referrals.webp",
    alt: "Waitlyze confirmed-signup preview showing a referral link and leaderboard with example data",
    tone: "referral",
  },
  {
    number: "04",
    title: "Learn as you grow",
    copy: "See where visitors come from, how many join and which channels convert. Use what you learn to make your next launch decision with confidence.",
    href: "/docs/analytics",
    link: "Explore analytics",
    image: "/images/landing-understand.webp",
    alt: "Waitlyze analytics screen with example visitor and signup trends",
    tone: "mint",
  },
];

export default async function LandingPage() {
  const featuredTemplates = listTemplates().filter((template) =>
    ["saas", "creator", "event"].includes(template.id),
  );
  const latestPosts = getPosts().slice(0, 3);
  const minutes = new Map(
    await Promise.all(latestPosts.map(async (post) => [post.url, await getReadingMinutes(post)])),
  );

  return (
    <PublicShell>
      <SiteStructuredData faqs={faqs} />
      <main id="main-content" className="wl-landing wl-root">
        <section className="wl-hero" aria-labelledby="hero-title">
          <div className="wl-hero-copy">
            <a className="wl-source-pill" href={github} target="_blank" rel="noopener noreferrer">
              <span>
                <GitHubMark /> On GitHub
              </span>
              <span>See how Waitlyze is built</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} aria-hidden="true" />
            </a>
            <h1 id="hero-title">
              Your launch starts
              <br className="wl-desktop-break" /> before launch day.
            </h1>
            <p className="wl-hero-lede">
              Build a page, grow your waitlist, and see what brings people in. Everything you need
              to turn early interest into an audience.
            </p>
            <div className="wl-hero-actions">
              <SignupButton className="wl-hero-primary">Start for free</SignupButton>
              <Link className="wl-secondary-button" href="/templates">
                Explore templates
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className="wl-assurance">
              Free to get started <span aria-hidden="true">·</span> No credit card required
            </p>
          </div>
          <ProductFrame
            hero
            src="/images/landing-understand.webp"
            alt="Authenticated Waitlyze analytics dashboard showing sample visitor, signup and conversion data"
            tone="blue"
          />
          <p className="wl-image-note">Inside Waitlyze · sample waitlist shown</p>
        </section>

        <section id="features" className="wl-section wl-features" aria-labelledby="features-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">THE ESSENTIALS</p>
            <h2 id="features-title">Everything you need to get your first people in.</h2>
            <p>From the first page to the first signups, keep the whole launch in one place.</p>
          </div>
          <div className="wl-feature-grid">
            {featureCards.map((feature, index) => (
              <article
                className={`wl-feature-card ${index < 2 ? "wl-feature-wide" : ""}`}
                key={feature.title}
              >
                <ProductFrame src={feature.image} alt={feature.alt} tone={feature.tone} />
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="steps" className="wl-section wl-steps" aria-labelledby="steps-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">HOW IT WORKS</p>
            <h2 id="steps-title">From an idea to an audience.</h2>
            <p>Four steps from your first page to a clearer picture of your audience.</p>
          </div>
          <div className="wl-step-list">
            {steps.map((step, index) => (
              <article
                className={`wl-step ${index % 2 ? "wl-step-reverse" : ""}`}
                key={step.number}
              >
                <div className="wl-step-copy">
                  <span className="wl-step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                  <TextLink href={step.href}>{step.link}</TextLink>
                </div>
                <ProductFrame src={step.image} alt={step.alt} tone={step.tone} />
              </article>
            ))}
          </div>
        </section>

        <section className="wl-section wl-more-features" aria-labelledby="more-features-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">THE DETAILS MATTER</p>
            <h2 id="more-features-title">More than a form and a counter.</h2>
            <p>Practical tools for the parts of a launch that happen after someone joins.</p>
          </div>
          <div className="wl-more-grid">
            {moreFeatures.map(({ icon, title, copy }) => (
              <article className="wl-more-item" key={title}>
                <HugeiconsIcon icon={icon} size={23} strokeWidth={1.6} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="templates"
          className="wl-section wl-templates"
          aria-labelledby="templates-title"
        >
          <div className="wl-section-heading wl-heading-with-link">
            <div>
              <p className="wl-eyebrow">START WITH A TEMPLATE</p>
              <h2 id="templates-title">A good place to begin.</h2>
              <p>Choose a starting point. Make it unmistakably yours.</p>
            </div>
            <TextLink href="/templates">Explore all templates</TextLink>
          </div>
          <TemplateCards templates={featuredTemplates} />
        </section>

        <Suspense fallback={<PricingFallback />}>
          <LocalizedPricing />
        </Suspense>

        <AskAi />

        <section id="faq" className="wl-section wl-faq" aria-labelledby="faq-title">
          <div className="wl-section-heading">
            <p className="wl-eyebrow">FAQS</p>
            <h2 id="faq-title">Good questions, answered.</h2>
            <p>
              Want the details? <Link href="/docs">Read the docs</Link>.
            </p>
          </div>
          <FAQAccordion items={faqs} />
        </section>

        {latestPosts.length > 0 && (
          <section className="wl-section wl-blog" aria-labelledby="blog-title">
            <div className="wl-section-heading wl-heading-with-link">
              <div>
                <p className="wl-eyebrow">FROM THE BLOG</p>
                <h2 id="blog-title">Ideas for the road ahead.</h2>
                <p>Practical notes on growing a launch audience.</p>
              </div>
              <TextLink href="/blog">Read the blog</TextLink>
            </div>
            <div className="wl-blog-grid">
              {latestPosts.map((post) => (
                <PostCard
                  key={post.url}
                  post={post}
                  minutes={minutes.get(post.url)}
                  headingAs="h3"
                  compact
                />
              ))}
            </div>
          </section>
        )}

        <section className="wl-section wl-about" aria-labelledby="about-title">
          <div className="wl-about-title">
            <p className="wl-eyebrow">FROM THE BUILDER</p>
            <h2 id="about-title">Building in the open.</h2>
            <p>Follow along, ask a question or look through the code.</p>
          </div>
          <div className="wl-about-copy">
            <p>
              Waitlyze is an open-source project built by <strong>Falak Gala</strong>. You can read
              the docs, review the code and follow what changes in the changelog.
            </p>
            <p>
              Have a question, spotted a rough edge, or want to see how something works? You can
              reach me.
            </p>
            <div className="wl-about-links">
              <a href="mailto:hi@falakgala.dev">
                Say hello <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </a>
              <a href={github} target="_blank" rel="noopener noreferrer">
                View the source{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </a>
              <Link href="/docs/changelog">
                Read the changelog{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <div className="wl-final-wrap">
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
