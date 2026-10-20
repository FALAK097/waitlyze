"use client";

import { AnalyticsDimensionIcon } from "@/components/product/analytics-dimension-icon";

const number = new Intl.NumberFormat();

export function EvilBarRows({ rows, kind, metric = "visitors" }) {
  const maxTotal = rows.reduce((max, row) => Math.max(max, row.visitors + row.signups), 0) || 1;
  return (
    <ol className="m-0 grid list-none p-0">
      {rows.map((row) => {
        const value = metric === "signups" ? row.signups : row.visitors;
        const total = row.visitors + row.signups;
        const width = total > 0 ? Math.max((total / maxTotal) * 100, 2) : 0;
        const visitorShare = total > 0 ? (row.visitors / total) * 100 : 0;
        const signupShare = total > 0 ? (row.signups / total) * 100 : 0;
        const parts = [];
        if (row.visitors > 0) parts.push(`${number.format(row.visitors)} visitors`);
        if (row.signups > 0) parts.push(`${number.format(row.signups)} signups`);
        return (
          <li
            key={row.label}
            title={`${row.label}: ${parts.join(" · ") || "0 visitors"}`}
            className="relative isolate flex min-h-12 items-center gap-2.5 overflow-hidden border-t border-product-border-subtle px-3.5 py-2 text-xs first:border-t-0"
          >
            <span
              className="pointer-events-none absolute inset-y-2 left-0 -z-10 flex w-(--bar-w) min-w-0 items-stretch"
              aria-hidden="true"
              style={{ "--bar-w": `${width}%` }}
            >
              {row.visitors > 0 ? (
                <span
                  className="block min-w-0 shrink-0 grow-(--seg) basis-0 bg-product-success-text/40 transition-all duration-200 last:rounded-r"
                  data-series="visitors"
                  style={{ "--seg": `${visitorShare}` }}
                />
              ) : null}
              {row.signups > 0 ? (
                <span
                  className="block min-w-0 shrink-0 grow-(--seg) basis-0 bg-chart-2/45 transition-all duration-200 last:rounded-r"
                  data-series="signups"
                  style={{ "--seg": `${signupShare}` }}
                />
              ) : null}
            </span>
            <AnalyticsDimensionIcon label={row.label} kind={kind} code={row.code} />
            <span className="min-w-0 flex-1 truncate font-medium text-product-text-primary">
              {row.label}
            </span>
            <strong className="shrink-0 font-semibold text-product-text-primary tabular-nums">
              {number.format(value)}
            </strong>
          </li>
        );
      })}
    </ol>
  );
}
