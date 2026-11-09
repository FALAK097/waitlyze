import {
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  DollarCircleIcon,
  MinusSignCircleIcon,
  StarHalfIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import { FEATURE_LEVELS } from "@/lib/comparison-data";
import { SITE_URL } from "@/lib/site-metadata";

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

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="compare-breadcrumbs">
      <ol>
        {items.map(({ label, href }, index) => (
          <li key={label}>
            {href && index < items.length - 1 ? (
              <Link href={href}>{label}</Link>
            ) : (
              <span aria-current="page">{label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ToolLogo({ tool, size = 40, className = "" }) {
  return (
    <span className={`compare-logo ${className}`} style={{ "--logo-size": `${size}px` }}>
      <Image src={tool.logo} alt="" width={size} height={size} />
    </span>
  );
}

const levelIcons = {
  included: CheckmarkCircle02Icon,
  paid: DollarCircleIcon,
  limited: StarHalfIcon,
  none: MinusSignCircleIcon,
};

export function FeatureValue({ value }) {
  return (
    <span className={`compare-value is-${value.level}`}>
      <HugeiconsIcon icon={levelIcons[value.level]} size={17} aria-hidden="true" />
      <span>
        <span className="sr-only">{FEATURE_LEVELS[value.level]}: </span>
        {value.label}
      </span>
    </span>
  );
}

export function FeatureLegend() {
  return (
    <ul className="compare-legend" aria-label="Legend">
      {Object.entries(FEATURE_LEVELS).map(([level, label]) => (
        <li className={`compare-value is-${level}`} key={level}>
          <HugeiconsIcon icon={levelIcons[level]} size={15} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
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
      Pricing reviewed {date}. Plans change, so confirm current details before you buy.
    </p>
  );
}

export function ComparisonCta({ title, copy, secondary }) {
  return (
    <section className="compare-wrap compare-cta">
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="compare-cta-actions">
        <SignupButton>Start free</SignupButton>
        {secondary ? (
          <Link className="compare-text-link" href={secondary.href}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function HowWeChecked({ date }) {
  return (
    <section className="compare-wrap compare-section" aria-labelledby="how-we-checked">
      <div className="compare-section-heading">
        <h2 id="how-we-checked">How we checked</h2>
        <p>
          Every competitor fact comes from that company&apos;s own public pricing, feature, and
          documentation pages, reviewed on {date}. Prices are in USD on monthly billing unless
          noted. We are Waitlyze, so we are not a neutral party, but we credit where competitors win
          and acknowledge our own gaps. Our comparison data is tracked openly in our repository on{" "}
          <a
            className="compare-inline-link"
            href="https://github.com/FALAK097/waitlyze"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . If you work at any of these platforms or spot an inaccuracy, please open a PR on GitHub
          or{" "}
          <a className="compare-inline-link" href="mailto:hi@falakgala.dev">
            email us
          </a>
          —we merge corrections quickly.
        </p>
      </div>
    </section>
  );
}

export function StructuredData({ data }) {
  return (
    <script
      type="application/ld+json"
      // Escape markup characters so JSON-LD can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ label, href }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: label,
      item: `${SITE_URL}${href}`,
    })),
  };
}
