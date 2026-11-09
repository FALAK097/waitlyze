import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import {
  ComparisonCta,
  ComparisonShell,
  Eyebrow,
  PrimaryLink,
  ResearchNote,
} from "@/components/comparison/comparison-shell";
import { adjacentTools, competitors, RESEARCHED_ON } from "@/lib/comparison-data";

export const metadata = {
  title: { absolute: "Best Waitlist Software Alternatives (2026) | Waitlyze" },
  description:
    "Compare Waitlyze with GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, Waitlister, and adjacent launch tools.",
  alternates: { canonical: "/alternatives" },
  openGraph: {
    type: "website",
    url: "/alternatives",
    title: "Waitlist software alternatives, without the sales fog",
    description: "A source-checked guide to choosing the right waitlist platform for your launch.",
  },
};

export default function AlternativesPage() {
  return (
    <ComparisonShell>
      <main id="main-content" className="compare-page">
        <section className="compare-wrap compare-hero">
          <div className="compare-hero-copy">
            <Eyebrow>Waitlist alternatives</Eyebrow>
            <h1 className="compare-title">Find the right waitlist tool.</h1>
            <p className="compare-lede">
              Compare dedicated platforms by the parts that shape a real launch: page design,
              verification, referrals, email, analytics, and how the bill changes as your audience
              grows.
            </p>
            <div className="compare-hero-actions">
              <PrimaryLink href="/compare">Compare every tool</PrimaryLink>
              <Link className="compare-text-link" href="/#features">
                Explore Waitlyze
              </Link>
            </div>
            <ResearchNote date={RESEARCHED_ON} />
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="dedicated-tools">
          <div className="compare-section-heading">
            <h2 id="dedicated-tools">Dedicated waitlist platforms</h2>
            <p>
              Six serious alternatives, each useful for a different launch shape. No universal
              winner—just clearer tradeoffs.
            </p>
          </div>
          <div className="compare-tool-list">
            {competitors.map((competitor) => (
              <Link
                className="compare-tool-link"
                href={`/alternatives/${competitor.slug}`}
                key={competitor.slug}
              >
                <span className="compare-tool-mark" aria-hidden="true">
                  <Image
                    src={competitor.logo}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                </span>
                <span className="compare-tool-copy">
                  <h3>Waitlyze vs {competitor.name}</h3>
                  <p>{competitor.bestFor}</p>
                </span>
                <span className="compare-tool-meta">
                  {competitor.price}
                  <HugeiconsIcon className="ml-2 inline" icon={ArrowRight02Icon} size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="compare-wrap compare-section" aria-labelledby="adjacent-tools">
          <div className="compare-section-heading">
            <h2 id="adjacent-tools">Useful tools that are not quite waitlist platforms</h2>
            <p>
              These can collect interest, but you will assemble more of the launch workflow
              yourself. They belong in the conversation—just not in a false like-for-like table.
            </p>
          </div>
          <div className="compare-adjacent-list">
            {adjacentTools.map((tool) => (
              <article className="compare-adjacent-item" key={tool.name}>
                <div className="flex items-center gap-3">
                  <Image
                    src={tool.logo}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-md object-contain"
                  />
                  <h3>{tool.name}</h3>
                </div>
                <p>
                  <strong>{tool.fit}.</strong> {tool.gap}.
                </p>
              </article>
            ))}
          </div>
        </section>

        <ComparisonCta
          title="Start with the launch, not the feature checklist."
          copy="Waitlyze keeps your page, verified audience, referrals, email, and launch signals together—without making the setup feel like a growth-ops project."
          href="/"
          label="Build your waitlist free"
        />
      </main>
    </ComparisonShell>
  );
}
