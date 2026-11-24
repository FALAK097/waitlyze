import { buildToolMetadata, ToolPageShell } from "@/components/tools/tool-page-shell";
import { BenchmarksExplorerWidget } from "@/components/tools/widgets/benchmarks-explorer-widget";
import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo-helpers";
import { SITE_URL } from "@/lib/site-metadata";
import {
  BENCHMARK_LAST_UPDATED,
  getLiveCohortAvailability,
  MIN_COHORT_SAMPLE_SIZE,
} from "@/lib/tools/benchmarks.mjs";

export const metadata = buildToolMetadata("waitlist-benchmarks");

export default async function WaitlistBenchmarksPage() {
  const availability = await getLiveCohortAvailability(prisma);

  const researchJsonLd = [
    {
      "@type": "Article",
      "@id": `${absoluteUrl("/research/waitlist-benchmarks")}#article`,
      headline: "Waitlist Benchmarks: Conversion, Verification & Viral K-Factor Explorer",
      description:
        "Transparent quartile ranges (P25, P50, P75) and cohort methodology for pre-launch waitlist conversion, verification, share rate, and K-factor.",
      datePublished: BENCHMARK_LAST_UPDATED,
      dateModified: BENCHMARK_LAST_UPDATED,
      author: { "@type": "Person", name: "Falak Gala" },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: absoluteUrl("/research/waitlist-benchmarks"),
    },
    {
      "@type": "Dataset",
      "@id": `${absoluteUrl("/research/waitlist-benchmarks")}#dataset`,
      name: "Waitlyze Waitlist Benchmark Explorer Dataset",
      description:
        "Privacy-safe aggregate waitlist conversion, verification, share rate, and K-factor quartile distributions with minimum cohort N >= 30.",
      url: absoluteUrl("/research/waitlist-benchmarks"),
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Waitlyze",
        url: SITE_URL,
      },
      dateModified: BENCHMARK_LAST_UPDATED,
      isAccessibleForFree: true,
    },
  ];

  return (
    <ToolPageShell slug="waitlist-benchmarks" extraJsonLd={researchJsonLd}>
      <BenchmarksExplorerWidget
        liveCampaignCount={availability.eligibleCount}
        minSampleThreshold={MIN_COHORT_SAMPLE_SIZE}
      />
    </ToolPageShell>
  );
}
