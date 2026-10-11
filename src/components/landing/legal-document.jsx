import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
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
        <Link href="/" className="wl-text-link">
          <ArrowLeft size={15} aria-hidden="true" /> Back to Waitlyze
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
              Have a question? <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </aside>
          <article className="wl-legal-copy">{children}</article>
        </div>
        <nav className="wl-legal-related" aria-label="Related policies">
          <Link href="/privacy">
            Privacy policy <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/terms">
            Terms of service <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </main>
    </PublicShell>
  );
}
