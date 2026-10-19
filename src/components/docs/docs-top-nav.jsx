"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";

const links = [
  { label: "Documentation", href: "/docs", section: "docs" },
  { label: "Changelog", href: "/docs/changelog", section: "changelog" },
];

function isActive(pathname, section) {
  if (section === "changelog") return pathname === "/docs/changelog";
  return pathname.startsWith("/docs") && pathname !== "/docs/changelog";
}

export function DocsTopNav() {
  const pathname = usePathname();
  const { slots } = useDocsLayout();
  const NavTitle = slots.navTitle;
  const SearchTrigger = slots.searchTrigger?.sm;
  const SidebarTrigger = slots.sidebar?.trigger;

  return (
    <header id="nd-subnav" className="waitlyze-docs-topnav">
      <div className="waitlyze-docs-topnav-brand">{NavTitle && <NavTitle />}</div>
      <nav className="waitlyze-docs-topnav-links" aria-label="Documentation sections">
        {links.map(({ label, href, section }) => {
          const active = isActive(pathname, section);
          return <Link key={href} href={href} className="waitlyze-docs-topnav-link" aria-current={active ? "page" : undefined}>{label}</Link>;
        })}
      </nav>
      <div className="waitlyze-docs-topnav-actions">
        {SearchTrigger && <SearchTrigger hideIfDisabled className="waitlyze-docs-topnav-action" />}
        {SidebarTrigger && <SidebarTrigger className="waitlyze-docs-topnav-action waitlyze-docs-sidebar-trigger"><HugeiconsIcon icon={Menu01Icon} aria-hidden="true" /></SidebarTrigger>}
      </div>
    </header>
  );
}
