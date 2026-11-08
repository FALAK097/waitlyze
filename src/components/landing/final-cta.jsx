import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import SignupButton from "./signup-button";

import "./final-cta.css";

export default function FinalCta({ className = "", compact = false }) {
  return (
    <section
      className={`wl-final-cta ${compact ? "wl-final-cta-compact" : ""} ${className}`}
      aria-labelledby="wl-final-cta-title"
    >
      <div className="wl-final-cta-content">
        <p className="wl-final-cta-eyebrow">WHEN YOU’RE READY</p>
        <h2 id="wl-final-cta-title">Give your next launch a head start.</h2>
        <p>
          Build a page, invite your first people in, and learn what brings them back. Free to start.
        </p>
        <div className="wl-final-cta-actions">
          <SignupButton className="wl-final-cta-primary">Start for free</SignupButton>
          <a
            className="wl-final-cta-secondary"
            href="https://github.com/FALAK097/waitlyze"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the source <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
