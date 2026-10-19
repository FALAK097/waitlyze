import { RootProvider } from "fumadocs-ui/provider/next";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { gitConfig } from "@/lib/docs-shared";
import { DocsTopNav } from "@/components/docs/docs-top-nav";
import "./docs.css";

export const metadata = { title: "Developer docs", description: "Create waitlists, publish pages, grow referrals, send email, and connect your stack to Waitlyze." };

function DocsMark() {
  return <span className="docs-mark" aria-hidden="true"><i /><i /><i /></span>;
}

function SidebarFooter() {
  return <div className="docs-sidebar-footer">
    <a href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`} target="_blank" rel="noreferrer" aria-label="GitHub repository" className="docs-sidebar-footer-icon"><svg role="img" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg></a>
    <span className="docs-sidebar-footer-separator" aria-hidden="true">|</span>
    <a href="/waitlists" target="_blank" rel="noreferrer" className="docs-sidebar-footer-link"><span>Waitlists</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg></a>
  </div>;
}

export default function Layout({ children }) {
  return <RootProvider theme={{ enabled: false }} search={{ options: { api: "/api/docs/search" }, links: [["Introduction", "/docs"], ["Publish a waitlist", "/docs/publishing"], ["Signup API", "/docs/api"], ["Embed a form", "/docs/embed"], ["Automations", "/docs/automations"], ["Webhooks", "/docs/webhooks"], ["Troubleshooting", "/docs/troubleshooting"]] }}><DocsLayout
    tree={source.getPageTree()}
    sidebar={{ defaultOpenLevel: 2, footer: <SidebarFooter /> }}
    nav={{ title: <DocsMark />, url: "/" }}
    slots={{ header: DocsTopNav }}
    themeSwitch={{ enabled: false }}
    containerProps={{ className: "waitlyze-docs", style: { "--fd-header-height": "68px" } }}
  >{children}</DocsLayout></RootProvider>;
}
