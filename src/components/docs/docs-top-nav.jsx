"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getDocsSection } from "@/lib/docs-sections";
import { cn } from "@/lib/utils";

const links = [
  { label: "Documentation", href: "/docs", section: "documentation" },
  { label: "API Reference", href: "/docs/api/reference", section: "api" },
  { label: "Integrations", href: "/docs/integrations/overview", section: "integrations" },
  { label: "Changelog", href: "/docs/changelog", section: "changelog" },
];

const actionClasses =
  "inline-flex size-9 items-center justify-center rounded-lg bg-transparent text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground";

export function DocsTopNav() {
  const pathname = usePathname();
  const { slots } = useDocsLayout();
  const NavTitle = slots.navTitle;
  const SearchTrigger = slots.searchTrigger?.sm;
  const SidebarTrigger = slots.sidebar?.trigger;

  return (
    <header
      id="nd-subnav"
      className="sticky top-(--fd-docs-row-1) z-30 flex h-(--fd-header-height) items-stretch justify-center border-b border-fd-border bg-fd-background/92 px-4 backdrop-blur-md [grid-area:header] md:px-8 xl:px-11"
    >
      <div className="hidden max-md:flex max-md:flex-none max-md:items-center [&>*]:max-md:origin-left [&>*]:max-md:scale-80">
        {NavTitle && <NavTitle />}
      </div>
      <nav
        className="no-scrollbar flex min-w-0 flex-1 items-stretch justify-start gap-1.5 overflow-x-auto md:gap-6 xl:gap-9"
        aria-label="Documentation sections"
      >
        {links.map(({ label, href, section }) => {
          const active = getDocsSection(pathname) === section;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex shrink-0 items-center border-b-2 border-transparent px-2 text-base font-medium whitespace-nowrap text-fd-foreground transition-colors duration-150 hover:text-fd-primary max-md:px-1 max-md:text-xs",
                active && "border-fd-primary text-fd-primary",
              )}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden max-md:flex max-md:items-center max-md:gap-0.5">
        {SearchTrigger && <SearchTrigger hideIfDisabled className={actionClasses} />}
        {SidebarTrigger && (
          <SidebarTrigger
            className={cn(actionClasses, "group-has-[.waitlyze-changelog-page]:hidden")}
          >
            <HugeiconsIcon icon={Menu01Icon} aria-hidden="true" />
          </SidebarTrigger>
        )}
      </div>
    </header>
  );
}
