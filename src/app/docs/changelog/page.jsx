import { readFile } from "node:fs/promises";
import path from "node:path";

import { RssIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import Link from "next/link";

import { ChangelogCopyButton } from "@/components/changelog/changelog-copy-button";
import { formatChangelogDate, parseChangelog } from "@/lib/changelog";

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
      <div className="mx-auto w-full max-w-3xl pt-2 pb-20">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
                Changelog
              </h1>
              <p className="mt-2 text-base text-fd-muted-foreground">
                New features, improvements, and updates shipped across Waitlyze.
              </p>
            </div>
            <Link
              href="/rss.xml"
              prefetch={false}
              title="Subscribe to Waitlyze updates via RSS"
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              <HugeiconsIcon icon={RssIcon} size={14} aria-hidden="true" />
              RSS feed
            </Link>
          </div>
        </header>

        {/* Minimal clean release stream */}
        <div className="space-y-16">
          {releases.map((release) => {
            const isLatest = release.isLatest;
            const fullDate = formatChangelogDate(release.date);

            return (
              <article key={release.version} className="relative">
                {/* Meta info row */}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-fd-foreground">
                      {release.version}
                    </span>
                    <time className="text-xs text-fd-muted-foreground">{fullDate}</time>
                    {isLatest && (
                      <span className="rounded-full bg-fd-primary/10 px-2 py-0.5 text-[11px] font-medium text-fd-primary">
                        Latest
                      </span>
                    )}
                  </div>
                  <ChangelogCopyButton releaseId={release.id} version={release.version} />
                </div>

                {/* Release Title */}
                <h2
                  id={release.id}
                  className="scroll-mt-24 text-xl font-semibold tracking-tight text-fd-foreground"
                >
                  <a href={`#${release.id}`} className="hover:underline">
                    {release.title}
                  </a>
                </h2>

                {/* 2-3 line brief */}
                {release.summary && (
                  <p className="mt-2.5 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
                    {release.summary}
                  </p>
                )}

                {/* Features */}
                {release.features && release.features.length > 0 && (
                  <div className="mt-6 space-y-2.5">
                    <h3 className="text-xs font-semibold tracking-wider text-fd-foreground uppercase">
                      Features
                    </h3>
                    <ul className="space-y-2">
                      {release.features.map((item, idx) => (
                        <li key={idx} className="text-sm leading-relaxed text-fd-muted-foreground">
                          {item.title && (
                            <strong className="mr-1.5 font-medium text-fd-foreground">
                              {item.title}.
                            </strong>
                          )}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fixes */}
                {release.fixes && release.fixes.length > 0 && (
                  <div className="mt-6 space-y-2.5">
                    <h3 className="text-xs font-semibold tracking-wider text-fd-foreground uppercase">
                      Fixes
                    </h3>
                    <ul className="space-y-2">
                      {release.fixes.map((item, idx) => (
                        <li key={idx} className="text-sm leading-relaxed text-fd-muted-foreground">
                          {item.title && (
                            <strong className="mr-1.5 font-medium text-fd-foreground">
                              {item.title}.
                            </strong>
                          )}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </DocsPage>
  );
}
