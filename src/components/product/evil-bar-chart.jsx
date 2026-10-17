"use client";

import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();

export function EvilBarRows({ rows, noun = "visitors", kind, metric = "visitors" }) {
  return <ol className="evil-bar-rows">
    {rows.map((row) => {
      const value = metric === "signups" ? row.signups : row.visitors;
      const share = metric === "signups" ? row.signupsShare : row.visitorsShare;
      return <li key={row.label} title={`${row.label}: ${number.format(value)} ${noun}`}>
        <span className="evil-bar-row-fill" style={{ "--evil-bar-share": `${Math.max(share, 2)}%` }} aria-hidden="true" />
        <AnalyticsDimensionIcon label={row.label} kind={kind} code={row.code} />
        <span className="evil-bar-row-label">{row.label}</span>
        <strong>{number.format(value)}</strong>
        <small>{share}%</small>
      </li>;
    })}
  </ol>;
}
