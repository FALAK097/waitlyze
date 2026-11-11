import { readFile } from "node:fs/promises";
import path from "node:path";

import { CheckmarkCircle01Icon, RssIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import Link from "next/link";

import { ChangelogCopyButton } from "@/components/changelog/changelog-copy-button";
import { formatChangelogDate, parseChangelog } from "@/lib/changelog";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Changelog",
  description: "Waitlyze release notes, from the first waitlist release through the latest update.",
  alternates: { canonical: "/docs/changelog" },
  openGraph: {
    type: "website",
    url: "/docs/changelog",
    title: "Changelog | Waitlyze",
    description:
      "Waitlyze release notes, from the first waitlist release through the latest update.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Waitlyze",
    description:
      "Waitlyze release notes, from the first waitlist release through the latest update.",
  },
};

export default async function ChangelogPage() {
  const changelogRaw = await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
  const releases = parseChangelog(changelogRaw);

  const toc = releases.map((release) => ({
    title: release.version,
    url: `#${release.id}`,
    depth: 2,
  }));

  return (
    <DocsPage className="waitlyze-changelog-page max-w-none" toc={toc}>
      <div className="mx-auto w-full max-w-4xl pt-2 pb-16">
        {/* Hero Section */}
        <header className="mb-14 border-b border-fd-border pb-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Product updates
            </span>
            <span className="rounded-full border border-fd-border bg-fd-muted/60 px-2.5 py-0.5 text-xs text-fd-muted-foreground">
              {releases.length} releases
            </span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-fd-foreground sm:text-5xl">
                Changelog
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-fd-muted-foreground sm:text-lg">
                Follow along with new features, architecture upgrades, and product improvements
                shipped across Waitlyze.
              </p>
            </div>
            <Link
              href="/rss.xml"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-white px-3 py-1.5 text-xs font-medium text-fd-muted-foreground shadow-2xs transition-colors hover:border-fd-border hover:bg-fd-muted/50 hover:text-fd-foreground"
            >
              <HugeiconsIcon icon={RssIcon} size={13} aria-hidden="true" />
              RSS Feed
            </Link>
          </div>

          {/* Quick jump navigation */}
          <div className="mt-8 flex flex-wrap items-center gap-2 pt-2">
            <span className="mr-1 text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
              Jump to:
            </span>
            {releases.slice(0, 7).map((r, i) => (
              <a
                key={r.version}
                href={`#${r.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-fd-border/70 bg-white px-2.5 py-1 font-mono text-xs font-medium text-fd-muted-foreground transition-all hover:border-fd-primary hover:text-fd-foreground hover:shadow-2xs",
                  i === 0 &&
                    "border-emerald-500/30 bg-emerald-50/60 font-semibold text-emerald-900",
                )}
              >
                {r.version}
                {i === 0 && <span className="size-1.5 rounded-full bg-emerald-500" />}
              </a>
            ))}
          </div>
        </header>

        {/* Timeline Stream */}
        <div className="relative ml-3 space-y-16 border-l-2 border-fd-border/70 pb-16 md:ml-36">
          {releases.map((release) => {
            const isLatest = release.isLatest;
            const fullDate = formatChangelogDate(release.date);

            return (
              <article key={release.version} className="group relative pl-6 md:pl-10">
                {/* Desktop Left Rail: Version, Date, Latest tag */}
                <div className="top-1 hidden w-32 flex-col items-end gap-1.5 pr-4 text-right md:absolute md:-left-36 md:flex">
                  <span className="inline-flex items-center rounded-md border border-fd-border bg-white px-2 py-0.5 font-mono text-xs font-semibold text-fd-foreground shadow-2xs">
                    {release.version}
                  </span>
                  <time className="text-xs font-medium text-fd-muted-foreground">
                    {release.date}
                  </time>
                  {isLatest && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Latest
                    </span>
                  )}
                </div>

                {/* Timeline Connector Node */}
                <div
                  className={cn(
                    "absolute top-2.5 -left-[9px] size-4 rounded-full border-2 bg-white transition-all group-hover:scale-110",
                    isLatest
                      ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10"
                      : "border-fd-border/80 group-hover:border-fd-primary",
                  )}
                  aria-hidden="true"
                >
                  {isLatest && <span className="absolute inset-1 rounded-full bg-emerald-500" />}
                </div>

                {/* Release Card */}
                <div className="rounded-2xl border border-fd-border/80 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm md:p-8">
                  {/* Mobile Header (When left rail is hidden on small screens) */}
                  <div className="mb-4 flex flex-wrap items-center gap-2 md:hidden">
                    <span className="inline-flex items-center rounded-md border border-fd-border bg-white px-2 py-0.5 font-mono text-xs font-semibold text-fd-foreground">
                      {release.version}
                    </span>
                    <time className="text-xs text-fd-muted-foreground">{fullDate}</time>
                    {isLatest && (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Title & Copy Anchor Button */}
                  <div className="flex items-start justify-between gap-4">
                    <h2
                      id={release.id}
                      className="scroll-mt-28 text-2xl font-bold tracking-tight text-fd-foreground transition-colors group-hover:text-fd-primary"
                    >
                      <a href={`#${release.id}`} className="hover:underline">
                        {release.title}
                      </a>
                    </h2>
                    <ChangelogCopyButton releaseId={release.id} version={release.version} />
                  </div>

                  {/* Summary Lead */}
                  <p className="mt-3 border-b border-fd-border/60 pb-6 text-base leading-relaxed font-normal text-fd-muted-foreground">
                    {release.summary}
                  </p>

                  {/* Highlights / Feature Section */}
                  {release.highlights && release.highlights.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-4 flex items-center gap-2">
                        <HugeiconsIcon icon={SparklesIcon} size={16} className="text-emerald-600" />
                        <h3 className="text-xs font-bold tracking-wider text-fd-foreground uppercase">
                          {release.section || "Highlights"}
                        </h3>
                        <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
                          {release.highlights.length} updates
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-1">
                        {release.highlights.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="group/item rounded-xl border border-fd-border/60 bg-fd-muted/20 p-4 transition-all hover:border-fd-border hover:bg-fd-muted/40 hover:shadow-2xs"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                              </div>
                              <div className="min-w-0 flex-1">
                                {item.title && (
                                  <h4 className="text-sm font-semibold text-fd-foreground">
                                    {item.title}
                                  </h4>
                                )}
                                <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </DocsPage>
  );
}
