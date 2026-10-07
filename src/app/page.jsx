import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Code2,
  Download,
  Mail,
  Plus,
} from "lucide-react";
import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import WaitlistPlayground from "@/components/landing/waitlist-playground";

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
    "Yes. Customize your form’s colors, logo, text, and styling in the visual editor. Your hosted form and embedded form use the design you choose.",
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
    "Yes. Export your signup data as CSV or PDF from your dashboard, so you can work with your audience data outside Waitlyze.",
  ],
];

export default function LandingPage() {
  return (
    <PublicShell>
      <main id="main-content">
        <HeroSection />
        <AudienceSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </PublicShell>
  );
}

function HeroSection() {
  return (
    <section className="wl-hero wl-container" aria-labelledby="hero-title">
      <div className="wl-hero-copy">
        <p className="wl-eyebrow">
          <span className="wl-accent-dot" /> Big ideas start with a little
          interest
        </p>
        <h1 id="hero-title">
          Launch to people.
          <br />
          <span>Not to silence.</span>
        </h1>
        <p className="wl-lede">
          Give your next idea an audience. Build a branded waitlist, grow it
          with referrals, and learn who’s interested before launch day.
        </p>
        <div className="wl-hero-actions">
          <SignupButton />
          <a className="wl-text-link" href="#how-it-works">
            See how it works <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <p className="wl-reassurance">
          <span>
            <Check size={14} aria-hidden="true" /> Free to use
          </span>
          <span>
            <Check size={14} aria-hidden="true" /> No credit card
          </span>
          <span>
            <Check size={14} aria-hidden="true" /> No code needed
          </span>
        </p>
      </div>
      <WaitlistPlayground />
    </section>
  );
}

function AudienceSection() {
  return (
    <section
      className="wl-audience wl-container"
      aria-label="Built for your next launch"
    >
      <p>
        For the idea you can’t
        <br />
        stop thinking about.
      </p>
      <span>First products</span>
      <span>Startup launches</span>
      <span>New features</span>
      <span>Early-access communities</span>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="wl-section wl-container"
      aria-labelledby="how-title"
    >
      <div className="wl-section-heading">
        <p className="wl-eyebrow">01 / From idea to interest</p>
        <h2 id="how-title">
          Less setup.
          <br />
          More “keep me posted.”
        </h2>
        <p>
          You’re already building something. Your waitlist shouldn’t be another
          project.
        </p>
      </div>
      <ol className="wl-steps">
        <li>
          <span className="wl-step-number">01</span>
          <h3>Make it feel like you.</h3>
          <p>
            Add your brand, write your message, and style your form. See your
            changes as you make them.
          </p>
          <a href="#preview">
            Try the preview <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </li>
        <li>
          <span className="wl-step-number">02</span>
          <h3>Put your idea out there.</h3>
          <p>
            Share a hosted waitlist page or embed the form on your website. One
            link, ready for your next campaign.
          </p>
          <span className="wl-step-detail">Hosted page + website embed</span>
        </li>
        <li>
          <span className="wl-step-number">03</span>
          <h3>Find your first believers.</h3>
          <p>
            Collect signups, see where interest comes from, and let subscribers
            spread the word with referral links.
          </p>
          <span className="wl-step-detail">Audience insights + referrals</span>
        </li>
      </ol>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      id="features"
      className="wl-feature-section"
      aria-labelledby="features-title"
    >
      <div className="wl-container">
        <div className="wl-section-heading">
          <p className="wl-eyebrow">02 / The whole pre-launch picture</p>
          <h2 id="features-title">
            Not just a list.
            <br />
            Your launch, taking shape.
          </h2>
        </div>
        <div className="wl-essentials">
          <div>
            <Mail size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3>Keep the conversation going.</h3>
            <p>
              Customize welcome emails and give new subscribers a personal
              referral link to share.
            </p>
          </div>
          <div>
            <Code2 size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3>Fits into what you’re building.</h3>
            <p>
              Use a hosted form, add the embed to your site, or connect through
              the API.
            </p>
          </div>
          <div>
            <Download size={22} strokeWidth={1.5} aria-hidden="true" />
            <h3>Your list, ready for what’s next.</h3>
            <p>
              Export your subscribers to CSV or PDF. Bring your audience data
              into your next workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section
      className="wl-use-cases wl-container wl-section"
      aria-labelledby="use-title"
    >
      <div className="wl-section-heading">
        <p className="wl-eyebrow">03 / Built for your next chapter</p>
        <h2 id="use-title">
          One founder.
          <br />
          Or a whole launch team.
        </h2>
      </div>
      <div className="wl-use-copy">
        <article>
          <span className="wl-eyebrow">For founders</span>
          <h3>
            Test the interest.
            <br />
            Then take the leap.
          </h3>
          <p>
            Give your idea a home while you build. Start collecting early
            interest without spending your weekend wiring up forms and
            spreadsheets.
          </p>
        </article>
        <article>
          <span className="wl-eyebrow">For marketing teams</span>
          <h3>
            Give your campaign
            <br />
            somewhere to land.
          </h3>
          <p>
            Launch a branded signup experience, track the channels bringing
            people in, and keep your pre-launch audience organized.
          </p>
        </article>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section
      id="faq"
      className="wl-faq wl-container wl-section"
      aria-labelledby="faq-title"
    >
      <div className="wl-section-heading">
        <p className="wl-eyebrow">A few things, answered</p>
        <h2 id="faq-title">
          Before you
          <br />
          make your move.
        </h2>
        <p>
          Something else on your mind?
          <br />
          <a href="mailto:hi@falakgala.dev" className="wl-text-link">
            Talk to the maker <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </p>
      </div>
      <div className="wl-faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="wl-final-cta" aria-labelledby="cta-title">
      <div className="wl-container">
        <p className="wl-eyebrow">
          <span className="wl-accent-dot" /> Your next chapter starts here
        </p>
        <h2 id="cta-title">
          Something worth building.
          <br />
          <span>Someone waiting for it.</span>
        </h2>
        <p>Start with a waitlist. See where it takes you.</p>
        <SignupButton />
        <span className="wl-cta-note">Free to use. No credit card needed.</span>
      </div>
    </section>
  );
}
