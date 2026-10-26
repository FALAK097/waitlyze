"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { DocsTopNav } from "@/components/docs/docs-top-nav";
import { getDocsSection, getDocsSectionTree } from "@/lib/docs-sections";
import { gitConfig } from "@/lib/docs-shared";

function DocsMark() {
  return (
    <span className="inline-flex h-6 -skew-x-12 items-center gap-0.5" aria-hidden="true">
      <i className="block h-3.5 w-1 rounded-sm bg-lime-300" />
      <i className="block h-5.5 w-1 rounded-sm bg-lime-300" />
      <i className="block h-4 w-1 rounded-sm bg-lime-300" />
    </span>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-fd-border bg-fd-secondary p-1">
      <a
        href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub repository"
        className="inline-flex size-8 items-center justify-center rounded-lg text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4.5">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      </a>
      <span className="text-sm text-fd-border select-none" aria-hidden="true">
        |
      </span>
      <a
        href="/waitlists"
        target="_blank"
        rel="noreferrer"
        className="flex min-h-8 flex-1 items-center gap-1.5 rounded-lg px-2 text-caption font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <span>Waitlists</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3.5 shrink-0"
        >
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </a>
    </div>
  );
}

export function DocsSectionLayout({ tree, children }) {
  const pathname = usePathname();
  const section = getDocsSection(pathname);
  const sectionTree = useMemo(() => getDocsSectionTree(tree, section), [tree, section]);

  return (
    <DocsLayout
      tree={sectionTree}
      sidebar={{ defaultOpenLevel: 2, footer: <SidebarFooter /> }}
      nav={{ title: <DocsMark />, url: "/" }}
      slots={{ header: DocsTopNav }}
      themeSwitch={{ enabled: false }}
      containerProps={{
        className:
          "waitlyze-docs group bg-white min-h-dvh [&_h1]:text-balance [&_h2]:text-balance [&_p]:text-pretty [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-fd-primary",
        style: { "--fd-header-height": "68px" },
      }}
    >
      {children}
    </DocsLayout>
  );
}
