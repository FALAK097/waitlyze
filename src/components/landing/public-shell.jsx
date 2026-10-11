import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicFontClasses } from "@/lib/public-fonts";
import Header from "./header";
import Wordmark from "./wordmark";
import CopyrightYear from "./copyright-year";
import "./public.css";

export default function PublicShell({ children }) {
  return (
    <div className={`wl ${publicFontClasses}`}>
      <a href="#main-content" className="wl-skip">
        Skip to content
      </a>
      <Header />
      {children}
      <footer className="wl-footer">
        <div className="wl-container">
        <div className="wl-footer-top">
          <div>
            <Link href="/" aria-label="Waitlyze home">
              <Wordmark />
            </Link>
            <p>Made for the quiet work that comes before a big launch.</p>
          </div>
          <nav aria-label="Product">
            <span className="wl-eyebrow">Explore</span>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#features">Features</Link>
            <Link href="/#faq">FAQs</Link>
          </nav>
          <nav aria-label="Company">
            <span className="wl-eyebrow">Good to know</span>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
            <a href="mailto:hi@falakgala.dev">
              Get in touch <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </nav>
        </div>
        <div className="wl-footer-bottom">
          <span>© <CopyrightYear initialYear={new Date().getFullYear()} /> Waitlyze</span>
          <a
            href="https://falakgala.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Made by Falak Gala <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
        </div>
      </footer>
    </div>
  );
}
