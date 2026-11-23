import FinalCta from "@/components/landing/final-cta";
import PublicShell from "@/components/landing/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolsHubDirectory } from "@/components/tools/tools-hub-directory";
import { absoluteUrl, breadcrumbNode } from "@/lib/seo-helpers";
import { listTools, TOOL_CATEGORIES } from "@/lib/tools/registry.mjs";

export const metadata = {
  title: "14 Free Pre-Launch Waitlist Tools | Waitlyze",
  description:
    "Fourteen free, no-account pre-launch tools for founders: grade your waitlist landing page, model viral K-factor growth, write launch copy, design referral tiers, and audit list health.",
  alternates: {
    canonical: "/tools",
    types: {
      "text/markdown": [{ url: "/tools.md", title: "Waitlyze Free Tools (Markdown)" }],
    },
  },
  openGraph: {
    type: "website",
    url: "/tools",
    title: "14 Free Pre-Launch Waitlist Tools | Waitlyze",
    description:
      "Audits, calculators, and copy builders for pre-launch waitlists. No account required.",
    images: [{ url: "/og/tools", width: 1200, height: 630, alt: "Waitlyze Free Waitlist Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "14 Free Pre-Launch Waitlist Tools | Waitlyze",
    description:
      "14 free no-login waitlist calculators, graders, copy builders, and DNS/health diagnostics.",
    images: ["/og/tools"],
  },
};

const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 sm:px-6";

export default function LaunchLabHubPage() {
  const allTools = listTools();

  return (
    <PublicShell>
      <JsonLd
        data={[
          {
            "@type": "CollectionPage",
            name: "14 Free Pre-Launch Waitlist Tools | Waitlyze",
            url: absoluteUrl("/tools"),
            description:
              "Fourteen free, no-account waitlist tools for grading pages, modeling viral growth, writing copy, and auditing deliverability.",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: allTools.map((tool, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: tool.title,
                url: absoluteUrl(tool.path),
              })),
            },
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Free tools", path: "/tools" },
          ]),
        ]}
      />

      <main id="main-content" className="scroll-mt-24">
        <section className={`${CONTAINER} pt-12 pb-8 md:pt-16`} aria-labelledby="tools-hub-title">
          <div className="max-w-2xl">
            <h1
              id="tools-hub-title"
              className="font-product-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-product-text-primary sm:text-5xl"
            >
              {allTools.length} free waitlist tools.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-pretty text-product-text-secondary sm:text-lg">
              Audits, calculators, and copy builders for pre-launch waitlists. No account required.
            </p>
          </div>
        </section>

        <div className={`${CONTAINER} pb-18`}>
          <ToolsHubDirectory
            categories={TOOL_CATEGORIES}
            tools={allTools.map((t) => ({
              slug: t.slug,
              path: t.path,
              title: t.title,
              shortTitle: t.shortTitle,
              category: t.category,
              targetJob: t.targetJob,
            }))}
          />
        </div>

        <div className={`${CONTAINER} pb-18`}>
          <FinalCta />
        </div>
      </main>
    </PublicShell>
  );
}
