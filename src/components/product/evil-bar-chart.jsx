"use client";

import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();

export function EvilBarRows({ rows, kind, metric = "visitors" }) {
  const maxVisitors = rows.reduce((max, row) => Math.max(max, row.visitors), 0) || 1;
  const maxSignups = rows.reduce((max, row) => Math.max(max, row.signups), 0) || 1;
  return <ol className="evil-bar-rows">
    {rows.map((row) => {
      const value = metric === "signups" ? row.signups : row.visitors;
      const visitorWidth = Math.max((row.visitors / maxVisitors) * 100, row.visitors > 0 ? 2 : 0);
      const signupWidth = Math.max((row.signups / maxSignups) * 100, row.signups > 0 ? 2 : 0);
      return <li key={row.label} title={`${row.label}: ${number.format(row.visitors)} visitors · ${number.format(row.signups)} signups`}>
        <span className="evil-bar-row-tracks" aria-hidden="true">
          <span className="evil-bar-row-fill" data-series="visitors" style={{ "--bar-w": `${visitorWidth}%` }} />
          <span className="evil-bar-row-fill" data-series="signups" style={{ "--bar-w": `${signupWidth}%` }} />
        </span>
        <AnalyticsDimensionIcon label={row.label} kind={kind} code={row.code} />
        <span className="evil-bar-row-label">{row.label}</span>
        <strong>{number.format(value)}</strong>
      </li>;
    })}
  </ol>;
}
