"use client";

import { EvilAreaChart } from "@/components/product/waitlist-analytics-visualizations";

const startDate = new Date("2026-01-01T00:00:00Z");
const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function makeSeries(length, mode = "typical") {
  return Array.from({ length }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    const wave = Math.round(Math.abs(Math.sin(index * 0.31) * 120));
    const active = mode !== "sparse" || index % 13 === 0;
    const scale = mode === "large-counts" ? 1_000_000 : 1;

    return {
      date: date.toISOString().slice(0, 10),
      visitors: active ? wave * scale : 0,
      signups: active ? Math.round(wave * 0.18) * scale : 0,
    };
  });
}

const fullRange = makeSeries(90, "large-counts");
const scenarios = [
  { label: "No activity: 0 data points", series: [] },
  { label: "One day", series: makeSeries(1) },
  { label: "Typical range: 30 days", series: makeSeries(30) },
  { label: "Maximum range: 90 sparse days", series: makeSeries(90, "sparse") },
  { label: "Maximum range: 90 dense days, large counts", series: fullRange },
  {
    label: "Maximum range in a 320px container",
    series: fullRange,
    containerClassName: "w-[320px]",
  },
  {
    label: "Maximum range squeezed beside a fixed-width sibling",
    series: fullRange,
    containerClassName: "flex w-[380px] gap-3",
    squeezed: true,
  },
  {
    label: "Maximum range in a 1280px container",
    series: fullRange,
    containerClassName: "w-[1280px]",
  },
];

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

export default function AnalyticsChartBreakHarness() {
  return (
    <main className="product-ui grid gap-8 overflow-x-auto p-4">
      {scenarios.map(({ label, series, containerClassName, squeezed }) => (
        <section className="grid gap-2" key={label}>
          <h2>{label}</h2>
          <div className={containerClassName ?? "w-full max-w-5xl"}>
            <div className={squeezed ? "min-w-0 flex-1" : "w-full"}>
              <EvilAreaChart series={series} formatDate={formatDate} />
            </div>
            {squeezed ? (
              <aside className="w-20 shrink-0 rounded-lg border border-product-border-subtle p-2 text-caption">
                Side panel
              </aside>
            ) : null}
          </div>
        </section>
      ))}
    </main>
  );
}
