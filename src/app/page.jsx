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
import Image from "next/image";
import Link from "next/link";

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
import { getPosts, getReadingMinutes } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";
import { listTemplates } from "@/lib/templates/catalog.mjs";

import "./landing.css";

export const revalidate = 3600;

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
    "Transactional platform emails are handled automatically by Waitlyze. To send waitlist confirmation emails, broadcasts, and automated sequences from your own domain, simply connect your Resend account in workspace settings.",
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
    title: "Automated welcome & milestone emails",
    copy: "Send confirmation emails, cohort broadcasts, and automated sequences with your verified Resend account.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Turnstile & velocity fraud protection",
    copy: "Block bot bursts with Cloudflare Turnstile, IP-velocity limits and verified-only referral credit.",
  },
  {
    icon: WorkflowCircle01Icon,
    title: "Signed webhooks & retry outbox",
    copy: "Stream real-time signup and referral events to your stack with delivery logs and one-click retries.",
  },
  {
    icon: Download01Icon,
    title: "Transparent referral point ledger",
    copy: "Every qualifying share is recorded in an auditable ledger with masked public leaderboards and CSV export.",
  },
  {
    icon: GlobeIcon,
    title: "Hosted page, embed or custom domain",
    copy: "Launch on a Waitlyze-hosted URL, connect your domain, or drop embeddable forms and counters onto your site.",
  },
  {
    icon: WorkHistoryIcon,
    title: "Drafts, revisions & instant rollback",
    copy: "Edit safely in private drafts, pause signups anytime and roll back to any previously published revision.",
  },
  {
    icon: UserGroupIcon,
    title: "Role-based workspace collaboration",
    copy: "Invite teammates with granular permissions across page editing, subscriber management and broadcasts.",
  },
  {
    icon: CodeIcon,
    title: "Server-side Signup API",
    copy: "Collect signups from your own custom frontend using scoped server-side API keys alongside hosted pages.",
  },
  {
    icon: Notification01Icon,
    title: "Real-time Slack & Discord alerts",
    copy: "Route new signup and referral milestone notifications straight to your team's launch channel.",
  },
];

/**
 * Renders a styled internal link with an upward-right arrow icon.
 */
function TextLink({ href, children }) {
  return (
    <Link className="wl-text-link" href={href}>
      {children}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
    </Link>
  );
}

const ASSET_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://assets.waitlyze.com";
const ASSET_VER = "v=4";

/**
 * Renders a framed product screenshot or walkthrough video.
 */
function ProductFrame({ src, alt, tone = "mint", hero = false, videoSrc, poster }) {
  return (
    <div
      className={`wl-product-frame wl-frame-${tone} ${hero ? "wl-product-frame-hero" : ""} ${
        videoSrc ? "wl-product-frame-video" : ""
      }`}
    >
      <div className="wl-product-window">
        {videoSrc ? (
          <video
            autoPlay
            loop
            muted
            controls
            playsInline
            preload={hero ? "metadata" : "none"}
            poster={poster}
            aria-label={alt}
            width={1120}
            height={630}
          >
            <source src={videoSrc} type="video/webm" />
            {src ? (
              <Image
                src={src}
                alt={alt}
                width={1120}
                height={875}
                sizes={
                  hero ? "(max-width: 1152px) 100vw, 1088px" : "(max-width: 720px) 100vw, 540px"
                }
              />
            ) : null}
          </video>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={1120}
            height={875}
            sizes={hero ? "(max-width: 1152px) 100vw, 1088px" : "(max-width: 720px) 100vw, 540px"}
            priority={hero}
          />
        )}
      </div>
    </div>
  );
}

const featureCards = [
  {
    title: "Visual page builder with live responsive canvas",
    copy: "Customize sections, signup fields, brand kit tokens and post-signup confirmation screens with instant desktop and mobile preview.",
    image: `${ASSET_BASE}/showcase-builder-4k.png?${ASSET_VER}`,
    alt: "Waitlyze visual page builder showing blocks, live Nova Studio canvas preview, and section properties",
    tone: "mint",
  },
  {
    title: "Verified subscriber CRM & fraud review",
    copy: "Filter signups by verification status, acquisition source, geography and referral points—with one-click CSV import and export.",
    image: `${ASSET_BASE}/showcase-subscribers-4k.png?${ASSET_VER}`,
    alt: "Waitlyze signups manager displaying verified subscribers, country flags, acquisition sources, devices, positions, and referral points",
    tone: "blue",
  },
  {
    title: "Cohort broadcasts & automated sequences",
    copy: "Send release waves, roadmap updates and automated milestone emails to opted-in subscribers from your connected Resend sender.",
    image: `${ASSET_BASE}/showcase-emails-4k.png?${ASSET_VER}`,
    alt: "Waitlyze email broadcast composer showing Beta Cohort 2 rollout draft and completed campaign history",
    tone: "sand",
  },
  {
    title: "Full-funnel attribution & K-factor analytics",
    copy: "Measure visitors, conversion benchmarks, viral K-factor, referral share rates and channel breakdown in real time.",
    image: `${ASSET_BASE}/showcase-analytics-4k.png?${ASSET_VER}`,
    alt: "Waitlyze analytics dashboard with visitor-to-signup conversion, K-factor, referral points awarded, and 30-day activity chart",
    tone: "blue",
  },
  {
    title: "Referral cockpit, queue jumps & point ledger",
    copy: "Turn every verified subscriber into an advocate with personal referral links, live queue position, points and social sharing.",
    image: `${ASSET_BASE}/showcase-referral-4k.png?${ASSET_VER}`,
    alt: "Waitlyze post-signup referral screen showing live queue position, earned points, personal share link, and social channels",
    tone: "mint",
  },
];

const steps = [
  {
    number: "01",
    title: "Design your launch page",
    copy: "Start from a high-converting template and tailor every block in the visual builder. Configure custom fields, brand styling, and confirmation states before publishing.",
    href: "/docs/page-builder",
    link: "Explore the page builder",
    image: `${ASSET_BASE}/showcase-design-4k.png?${ASSET_VER}`,
    alt: "Waitlyze visual builder showing starter templates, live Nova Studio canvas preview, and brand typography and styling tokens",
    tone: "mint",
  },
  {
    number: "02",
    title: "Publish anywhere in one click",
    copy: "Go live on a Waitlyze-hosted page, connect your custom domain, embed the widget on your existing site, or submit signups through our server-side API.",
    href: "/docs/embed",
    link: "See publishing options",
    image: `${ASSET_BASE}/showcase-publish-4k.png?${ASSET_VER}`,
    alt: "Waitlyze publish and share workspace showing hosted page, website embed snippet, server-side API, custom domain, and SEO options",
    tone: "sand",
  },
  {
    number: "03",
    title: "Reward referrals automatically",
    copy: "Once verified, subscribers unlock their queue position, point balance, and personal referral link. Built-in velocity checks and email verification keep rewards fair.",
    href: "/docs/referrals",
    link: "How referrals work",
    image: `${ASSET_BASE}/showcase-referrals-analytics-4k.png?${ASSET_VER}`,
    alt: "Waitlyze global audience map and referrals breakdown showing organic vs referred signups and top referrers leaderboard",
    tone: "blue",
  },
  {
    number: "04",
    title: "Track attribution & roll out cohorts",
    copy: "See which channels and referrers drive verified signups, then invite top supporters in waves using targeted email broadcasts or CSV exports.",
    href: "/docs/analytics",
    link: "Explore analytics",
    image: `${ASSET_BASE}/showcase-attribution-4k.png?${ASSET_VER}`,
    alt: "Waitlyze conversion funnel, acquisition channel breakdown, and visitor device analytics",
    tone: "mint",
  },
];

/**
 * Renders the public Waitlyze marketing landing page.
 */
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
            <p className="wl-assurance">Free to get started. No credit card required.</p>
          </div>
          <ProductFrame
            hero
            videoSrc={`${ASSET_BASE}/showcase-demo-4k.webm?${ASSET_VER}`}
            alt="Waitlyze product walkthrough video demonstrating analytics, visual page builder, referral settings, subscriber list, and email broadcasts"
            tone="mint"
          />
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
                <div className="wl-more-header">
                  <HugeiconsIcon icon={icon} size={22} strokeWidth={1.6} aria-hidden="true" />
                  <h3>{title}</h3>
                </div>
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

        <Pricing />

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
              <a href="mailto:support@waitlyze.com">
                Say hello <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </a>
              <a href={github} target="_blank" rel="noopener noreferrer">
                View the source{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
              </a>
              <Link href="/docs/changelog">
                View changelog{" "}
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
