import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import LegalTOC from "./legal-toc";
import PublicShell from "./public-shell";

export default function LegalDocument({
  title,
  description,
  sections,
  children,
}) {
  return (
    <PublicShell>
      <main id="main-content" className="wl-container wl-legal">
        <Link prefetch={false} href="/" className="wl-text-link">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} aria-hidden="true" /> Back to Waitlyze
        </Link>
        <header className="wl-legal-heading">
          <p className="wl-eyebrow">The important details</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <span>Last updated · October 11, 2026</span>
        </header>
        <div className="wl-legal-grid">
          <aside>
            <LegalTOC sections={sections} />
            <a className="wl-text-link" href="mailto:hi@falakgala.dev">
              Have a question? <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
            </a>
          </aside>
          <article className="wl-legal-copy">{children}</article>
        </div>
        <nav className="wl-legal-related" aria-label="Related policies">
          <Link prefetch={false} href="/privacy">
            Privacy policy <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
          <Link prefetch={false} href="/terms">
            Terms of service <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
        </nav>
      </main>
    </PublicShell>
  );
}
