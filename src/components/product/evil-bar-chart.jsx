"use client";

import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();

export function EvilBarRows({ rows, kind, metric = "visitors" }) {
  const maxTotal = rows.reduce((max, row) => Math.max(max, row.visitors + row.signups), 0) || 1;
  return <ol className="evil-bar-rows">
    {rows.map((row) => {
      const value = metric === "signups" ? row.signups : row.visitors;
      const total = row.visitors + row.signups;
      const width = total > 0 ? Math.max((total / maxTotal) * 100, 2) : 0;
      const visitorShare = total > 0 ? (row.visitors / total) * 100 : 0;
      const signupShare = total > 0 ? (row.signups / total) * 100 : 0;
      const parts = [];
      if (row.visitors > 0) parts.push(`${number.format(row.visitors)} visitors`);
      if (row.signups > 0) parts.push(`${number.format(row.signups)} signups`);
      return <li key={row.label} title={`${row.label}: ${parts.join(" · ") || "0 visitors"}`}>
        <span className="evil-bar-row-track" aria-hidden="true" style={{ "--bar-w": `${width}%` }}>
          {row.visitors > 0 ? <span className="evil-bar-row-fill" data-series="visitors" style={{ "--seg": `${visitorShare}` }} /> : null}
          {row.signups > 0 ? <span className="evil-bar-row-fill" data-series="signups" style={{ "--seg": `${signupShare}` }} /> : null}
        </span>
        <AnalyticsDimensionIcon label={row.label} kind={kind} code={row.code} />
        <span className="evil-bar-row-label">{row.label}</span>
        <strong>{number.format(value)}</strong>
      </li>;
    })}
  </ol>;
}
