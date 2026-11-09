import {
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import PublicShell from "@/components/landing/public-shell";

import "./comparison.css";

export function ComparisonShell({ children }) {
  return <PublicShell>{children}</PublicShell>;
}

export function Eyebrow({ children }) {
  return <p className="compare-eyebrow">{children}</p>;
}

export function PrimaryLink({ href, children }) {
  return (
    <Link className="compare-primary-link" href={href}>
      {children}
      <HugeiconsIcon icon={ArrowRight02Icon} size={18} aria-hidden="true" />
    </Link>
  );
}

export function SourceLink({ href, children = "View vendor source" }) {
  return (
    <a className="compare-source-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <HugeiconsIcon icon={LinkSquare01Icon} size={15} aria-hidden="true" />
    </a>
  );
}

export function CheckList({ items }) {
  return (
    <ul className="compare-check-list">
      {items.map((item) => (
        <li key={item}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ResearchNote({ date }) {
  return (
    <p className="compare-research-note">
      Vendor pages checked {date}. Plans change; confirm current details before purchasing.
    </p>
  );
}

export function ComparisonCta({ title, copy, href, label }) {
  return (
    <section className="compare-wrap compare-cta">
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="compare-cta-actions">
        <PrimaryLink href={href}>{label}</PrimaryLink>
      </div>
    </section>
  );
}
