"use client";

import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();

// Dense, readable ranked rows based on DataFast's breakdown panels. The bar is
// a proportional background rather than a separate axis, so labels remain
// useful at narrow widths and to assistive technology.
export function EvilBarRows({ rows, noun = "visitors", kind }) {
  return <ol className="evil-bar-rows">
    {rows.map((row) => <li key={row.label} title={`${row.label}: ${number.format(row.value)} ${noun}`}>
      <span className="evil-bar-row-fill" style={{ "--evil-bar-share": `${Math.max(row.share, 2)}%` }} aria-hidden="true" />
      <AnalyticsDimensionIcon label={row.label} kind={kind} code={row.code} />
      <span className="evil-bar-row-label">{row.label}</span>
      <strong>{number.format(row.value)}</strong>
      <small>{row.share}%</small>
    </li>)}
  </ol>;
}
