import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUpRight01Icon, CodeIcon, Download01Icon, GlobeIcon, Layout01Icon, Mail01Icon, ShieldCheckIcon, Tick01Icon, UserGroupIcon, WorkflowCircle01Icon, WorkHistoryIcon } from "@hugeicons/core-free-icons";
import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import WaitlistPlayground from "@/components/landing/waitlist-playground";
import FAQAccordion from "@/components/landing/faq-accordion";
import ProductTour from "@/components/landing/product-tour";
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
  twitter: {
    title: "Waitlyze | Build an audience before you launch",
    description:
      "Create a branded waitlist and turn early interest into your next launch’s audience.",
  },
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

export default function LandingPage() {
  return (
    <PublicShell>
      <SiteStructuredData faqs={faqs} />
      <main id="main-content">
        <section className="wl-hero wl-container" aria-labelledby="hero-title">
          <div className="wl-hero-copy">
            <p className="wl-eyebrow"><span className="wl-accent-dot" /> Big ideas start with a little interest</p>
            <h1 id="hero-title">Launch to people.<br /><span>Not to silence.</span></h1>
            <p className="wl-lede">Build a branded waitlist. Grow it with referrals. Know who’s ready for launch day.</p>
            <div className="wl-hero-actions">
              <SignupButton />
              <a className="wl-text-link" href="#how-it-works">Explore the product <HugeiconsIcon icon={ArrowDown01Icon} size={16} aria-hidden="true" /></a>
            </div>
            <p className="wl-reassurance">{["Free to use", "No credit card", "No code needed"].map(text => <span key={text}><HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" />{text}</span>)}</p>
          </div>
          <WaitlistPlayground />
        </section>
        <section id="how-it-works" className="wl-container wl-section wl-tour-section" aria-labelledby="tour-title">
          <div className="wl-section-heading wl-heading-row">
            <div><p className="wl-eyebrow">Inside Waitlyze</p><h2 id="tour-title">Your launch starts here.</h2></div>
            <p>Design it. Share it. Watch your audience grow.</p>
          </div>
          <ProductTour />
        </section>
        <section id="features" className="wl-container wl-section wl-capabilities" aria-labelledby="features-title">
          <div className="wl-section-heading wl-heading-row">
            <div><p className="wl-eyebrow">Small setup. Room to grow.</p><h2 id="features-title">More than an email field.</h2></div>
            <p>From the first signup to your launch-day email.</p>
          </div>
          <div className="wl-capability-grid">
            {[
              [Mail01Icon, "Emails that keep it moving", "Welcome subscribers, send updates, and set up email automation."],
              [CodeIcon, "Your site. Your form.", "Share a hosted page, embed a form, or collect signups through the API."],
              [Download01Icon, "An audience you own", "Take your subscriber list with you. Export your audience to CSV."],
              [Layout01Icon, "A starting point, ready", "Choose a launch template and make the page your own."],
              [WorkflowCircle01Icon, "Connected to your workflow", "Connect Resend for email and use webhooks to send events to your tools."],
              [ShieldCheckIcon, "Quality over quantity", "Verify subscriber email addresses and track referral activity."],
              [UserGroupIcon, "Build with your team", "Invite teammates and choose who can edit, publish, or send emails."],
              [GlobeIcon, "Your launch. Your domain.", "Connect a custom domain to your hosted waitlist page."],
              [WorkHistoryIcon, "Publish with control", "Keep drafts private, pause signups, or restore a published version."],
            ].map(([Icon, title, text]) => <article key={title}><HugeiconsIcon icon={Icon} size={21} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="wl-roadmap" aria-label="Planned features">
            <div><p className="wl-eyebrow">On the roadmap</p><p>Building the next part of your launch.</p></div>
            <ul>{[[WorkflowCircle01Icon, "More native integrations"], [ShieldCheckIcon, "Advanced spam detection"], [CodeIcon, "Developer docs & SDKs"], [UserGroupIcon, "Referral rewards"]].map(([Icon, text]) => <li key={text}><HugeiconsIcon icon={Icon} size={16} aria-hidden="true" />{text}<span>Planned</span></li>)}</ul>
          </div>
        </section>
        <section id="faq" className="wl-faq wl-container wl-section" aria-labelledby="faq-title">
          <div className="wl-section-heading"><p className="wl-eyebrow">A few things, answered</p><h2 id="faq-title">FAQs.</h2><p><a href="mailto:hi@falakgala.dev" className="wl-text-link">Talk to the maker <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" /></a></p></div>
          <FAQAccordion items={faqs} />
        </section>
        <section className="wl-final-cta wl-container" aria-labelledby="cta-title">
          <div><p className="wl-eyebrow">Ready when you are</p><h2 id="cta-title">Give your idea a head start.</h2></div>
          <div><SignupButton /><span className="wl-cta-note">Free to use. No credit card needed.</span></div>
        </section>
      </main>
    </PublicShell>
  );
}
