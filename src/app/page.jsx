import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  CodeIcon,
  Download01Icon,
  GlobeIcon,
  Layout01Icon,
  Mail01Icon,
  ShieldCheckIcon,
  Tick01Icon,
  UserGroupIcon,
  WorkflowCircle01Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import FAQAccordion from "@/components/landing/faq-accordion";
import ProductTour from "@/components/landing/product-tour";
import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import WaitlistPlayground from "@/components/landing/waitlist-playground";
import { SiteStructuredData } from "@/components/seo/structured-data";

export const metadata = {
  title: { absolute: "Waitlyze | Build an audience before you launch" },
  description:
    "Create a branded waitlist, collect signups, grow with referrals, and understand your audience. A no-code waitlist builder for founders and marketing teams. Free to use.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Waitlyze | Build an audience before you launch",
    description:
      "Your waitlist, referrals, and audience insights. One place to get your next launch started.",
  },
  twitter: { card: "summary_large_image", title: "Waitlyze | Build an audience before you launch" },
};

const faqs = [
  [
    "Is Waitlyze free to use?",
    "Yes. You can currently create a waitlist, collect signups, and explore your audience with Waitlyze for free. No credit card is required.",
  ],
  [
    "Do I need a website or coding skills?",
    "Neither is required. Build your form visually and share its hosted page. If you already have a website, you can add the form using the embed code from your waitlist editor.",
  ],
  [
    "Can I make it look like my brand?",
    "Yes. Choose a template, edit your headline and copy, and arrange the page sections. Your hosted page and website embed share the published design.",
  ],
  [
    "How do referrals work?",
    "Subscribers get a personal referral link they can share. Waitlyze tracks referred signups so you can see who is helping your audience grow.",
  ],
  [
    "What can I learn about my audience?",
    "See signups and impressions over time, where visitors come from, and the devices they use. Use those insights to understand which launch channels are bringing people in.",
  ],
  [
    "Can I export my subscribers?",
    "Yes. Export your signup data as CSV from your dashboard, so you can work with your audience data outside Waitlyze.",
  ],
];

const containerClasses = "mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12";
const eyebrowClasses =
  "flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase";

export default function LandingPage() {
  return (
    <PublicShell>
      <SiteStructuredData faqs={faqs} />
      <main id="main-content" className="scroll-mt-28">
        <section
          className={`${containerClasses} relative isolate grid grid-cols-1 justify-items-center gap-13 pt-18 pb-22 md:gap-8 md:py-12 2xl:gap-22`}
          aria-labelledby="hero-title"
        >
          <div className="w-full max-w-4xl text-center">
            <p className={`${eyebrowClasses} justify-center`}>
              <span className="inline-block size-1.5 shrink-0 rounded-full bg-product-accent-solid" />{" "}
              Big ideas start with a little interest
            </p>
            <h1
              id="hero-title"
              className="mt-5 font-product-display text-5xl leading-tight font-medium tracking-tighter text-balance lg:text-6xl"
            >
              Launch to people.
              <br />
              <span>Not to silence.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-84 text-base leading-normal text-product-text-secondary">
              Build a branded waitlist. Grow it with referrals. Know who’s ready for launch day.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-sm:flex-col max-sm:gap-5 md:gap-4">
              <SignupButton className="max-sm:w-full" />
              <a
                className="group inline-flex items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-900"
                href="#how-it-works"
              >
                Explore the product{" "}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-180 group-hover:translate-x-0.5"
                />
              </a>
            </div>
            <p className="mt-5 flex flex-wrap justify-center gap-2 gap-x-4 text-micro text-product-text-secondary">
              {["Free to use", "No credit card", "No code needed"].map((text) => (
                <span key={text} className="flex items-center gap-1">
                  <HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" />
                  {text}
                </span>
              ))}
            </p>
          </div>
          <WaitlistPlayground />
        </section>
        <section
          id="how-it-works"
          className={`${containerClasses} scroll-mt-28 py-16 md:pt-6 md:pb-14 lg:pb-18 xl:pb-24`}
          aria-labelledby="tour-title"
        >
          <div className="flex items-end justify-between gap-8 max-md:block">
            <div>
              <p className={eyebrowClasses}>Inside Waitlyze</p>
              <h2
                id="tour-title"
                className="mt-4 font-product-display text-4xl leading-tight font-semibold tracking-tighter text-balance lg:text-5xl"
              >
                Your launch starts here.
              </h2>
            </div>
            <p className="mt-5 max-w-54 text-body text-product-text-secondary max-md:mt-5 max-md:max-w-none">
              Design it. Share it. Watch your audience grow.
            </p>
          </div>
          <ProductTour />
        </section>
        <section
          id="features"
          className={`${containerClasses} scroll-mt-28 py-16 md:py-14 lg:py-18 xl:py-24`}
          aria-labelledby="features-title"
        >
          <div className="flex items-end justify-between gap-8 max-md:block">
            <div>
              <p className={eyebrowClasses}>Small setup. Room to grow.</p>
              <h2
                id="features-title"
                className="mt-4 font-product-display text-4xl leading-tight font-semibold tracking-tighter text-balance lg:text-5xl"
              >
                More than an email field.
              </h2>
            </div>
            <p className="mt-5 max-w-54 text-body text-product-text-secondary max-md:mt-5 max-md:max-w-none">
              From the first signup to your launch-day email.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-7 max-sm:mt-8 md:grid-cols-3 md:gap-6 lg:gap-12">
            {[
              [
                Mail01Icon,
                "Emails that keep it moving",
                "Welcome subscribers, send updates, and set up email automation.",
              ],
              [
                CodeIcon,
                "Your site. Your form.",
                "Share a hosted page, embed a form, or collect signups through the API.",
              ],
              [
                Download01Icon,
                "An audience you own",
                "Take your subscriber list with you. Export your audience to CSV.",
              ],
              [
                Layout01Icon,
                "A starting point, ready",
                "Choose a launch template and make the page your own.",
              ],
              [
                WorkflowCircle01Icon,
                "Connected to your workflow",
                "Connect Resend for email and use webhooks to send events to your tools.",
              ],
              [
                ShieldCheckIcon,
                "Quality over quantity",
                "Verify subscriber email addresses and track referral activity.",
              ],
              [
                UserGroupIcon,
                "Build with your team",
                "Invite teammates and choose who can edit, publish, or send emails.",
              ],
              [
                GlobeIcon,
                "Your launch. Your domain.",
                "Connect a custom domain to your hosted waitlist page.",
              ],
              [
                WorkHistoryIcon,
                "Publish with control",
                "Keep drafts private, pause signups, or restore a published version.",
              ],
            ].map(([Icon, title, text]) => (
              <article key={title}>
                <HugeiconsIcon
                  icon={Icon}
                  size={21}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-product-success-text"
                />
                <h3 className="mt-4 font-product-display text-section leading-snug font-semibold tracking-tight text-balance">
                  {title}
                </h3>
                <p className="mt-2.5 max-w-60 text-sm text-product-text-secondary">{text}</p>
              </article>
            ))}
          </div>
          <div
            className="mt-12 grid grid-cols-1 gap-12 pt-8 md:grid-cols-2 md:gap-6"
            aria-label="Planned features"
          >
            <div>
              <p className={eyebrowClasses}>On the roadmap</p>
              <p className="mt-3 max-w-48 text-base text-product-text-secondary">
                Building the next part of your launch.
              </p>
            </div>
            <ul className="flex flex-wrap gap-4 gap-x-6">
              {[
                [WorkflowCircle01Icon, "More native integrations"],
                [ShieldCheckIcon, "Advanced spam detection"],
                [CodeIcon, "Developer docs & SDKs"],
                [UserGroupIcon, "Referral rewards"],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-2 text-caption">
                  <HugeiconsIcon icon={Icon} size={16} aria-hidden="true" />
                  {text}
                  <span className="text-micro text-product-text-secondary">Planned</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section
          id="faq"
          className={`${containerClasses} flex scroll-mt-28 flex-col gap-8 py-16 md:py-14 lg:flex-row lg:gap-20 lg:pb-18 xl:pb-24`}
          aria-labelledby="faq-title"
        >
          <div className="lg:w-2/5">
            <p className={eyebrowClasses}>A few things, answered</p>
            <h2
              id="faq-title"
              className="mt-4 font-product-display text-4xl leading-tight font-semibold tracking-tighter text-balance lg:text-5xl"
            >
              FAQs.
            </h2>
            <p className="mt-5 max-w-80 text-product-text-secondary">
              <a
                href="mailto:hi@falakgala.dev"
                className="group inline-flex items-center gap-2.5 text-sm font-medium underline-offset-4 hover:underline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-900"
              >
                Talk to the maker{" "}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-180 group-hover:translate-x-0.5"
                />
              </a>
            </p>
          </div>
          <FAQAccordion items={faqs} />
        </section>
        <section
          className={`${containerClasses} flex items-center justify-between gap-8 py-14 pb-18 max-md:flex-col max-md:items-start max-sm:py-15`}
          aria-labelledby="cta-title"
        >
          <div>
            <p className={eyebrowClasses}>Ready when you are</p>
            <h2
              id="cta-title"
              className="mt-4 font-product-display text-4xl leading-tight font-semibold tracking-tighter text-balance max-sm:text-3xl lg:text-5xl"
            >
              Give your idea a head start.
            </h2>
          </div>
          <div>
            <SignupButton />
            <span className="mt-3 block text-micro text-product-text-secondary">
              Free to use. No credit card needed.
            </span>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
