"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const ranges = [7, 30, 90];
const chartConfig = {
  visitors: { label: "Visitors", color: "var(--product-text-secondary)" },
  signups: { label: "Signups", color: "var(--product-success-text)" },
};
const number = new Intl.NumberFormat();

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return <div className="waitlist-analytics-tooltip">
    <p>{formatDate(label, { month: "long", day: "numeric", year: "numeric" })}</p>
    {payload.map((entry) => <div className="waitlist-analytics-tooltip-value" key={entry.dataKey}>
      <i data-series={entry.dataKey} aria-hidden="true" />
      <span>{chartConfig[entry.dataKey]?.label ?? entry.name}</span>
      <strong>{number.format(entry.value)}</strong>
    </div>)}
  </div>;
}

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function Metric({ label, value, detail }) {
  return <div className="waitlist-analytics-metric"><dt>{label}</dt><dd><span>{value}</span><small>{detail}</small></dd></div>;
}

export function WaitlistAnalytics({ waitListId }) {
  const [days, setDays] = useState(30);
  const [retryCount, setRetryCount] = useState(0);
  const [mode, setMode] = useState("chart");
  const [focusedSeries, setFocusedSeries] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const timeZone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch { return "UTC"; }
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/wait-lists/${waitListId}/analytics?days=${days}&timeZone=${encodeURIComponent(timeZone)}`, { signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load analytics.");
      setAnalytics(result);
    } catch (cause) {
      if (cause.name !== "AbortError") setError(cause.message || "Could not load analytics.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [days, retryCount, timeZone, waitListId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const summary = analytics?.summary;
  const series = analytics?.series ?? [];
  const noActivity = summary && summary.visitors === 0 && summary.signups === 0;
  const conversion = summary?.conversionRate == null ? "—" : `${summary.conversionRate}%`;
  const verification = summary?.verificationRate == null ? "—" : `${summary.verificationRate}%`;
  const chartId = useId().replaceAll(":", "");
  const toggleFocusedSeries = (seriesName) => setFocusedSeries((current) => current === seriesName ? null : seriesName);

  return <section className="waitlist-analytics" aria-labelledby="waitlist-analytics-title" aria-busy={loading}>
    <header className="waitlist-analytics-header">
      <div><p className="waitlist-analytics-eyebrow">Performance</p><h2 id="waitlist-analytics-title">Waitlist analytics</h2><p className="product-help">Visitors, signups, and verification for this waitlist.</p></div>
      <div className="waitlist-analytics-controls">
        <div className="waitlist-analytics-range" role="group" aria-label="Analytics date range">
          {ranges.map((range) => <button type="button" key={range} aria-pressed={days === range} onClick={() => setDays(range)}>{range} days</button>)}
        </div>
      </div>
    </header>

    {error ? <div className="waitlist-analytics-message" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div> : null}
    {!error && loading && !analytics ? <p className="waitlist-analytics-message" role="status">Loading analytics…</p> : null}
    {!error && analytics ? <>
      {loading ? <p className="sr-only" role="status">Updating analytics…</p> : null}
      <dl className="waitlist-analytics-metrics">
        <Metric label="Visitors" value={number.format(summary.visitors)} detail="Distinct browsers" />
        <Metric label="Signups" value={number.format(summary.signups)} detail={`${number.format(summary.verifiedSignups)} verified`} />
        <Metric label="Conversion" value={conversion} detail="Visitors who signed up" />
        <Metric label="Verification" value={verification} detail={`${number.format(summary.pendingVerification)} awaiting verification`} />
      </dl>

      <section className="waitlist-analytics-panel" aria-labelledby="waitlist-trend-title">
        <header className="waitlist-analytics-panel-heading"><div><h3 id="waitlist-trend-title">Activity over time</h3><p>{formatDate(analytics.range.startDate)} – {formatDate(analytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })} · {timeZone}</p></div>
          <div className="waitlist-analytics-view" role="group" aria-label="Activity display">
            <button type="button" aria-pressed={mode === "chart"} onClick={() => setMode("chart")}>Chart</button>
            <button type="button" aria-pressed={mode === "table"} onClick={() => setMode("table")}>Table</button>
          </div>
        </header>
        {noActivity ? <div className="waitlist-analytics-empty"><p>No activity in this period yet.</p><span>Once visitors arrive, their activity will appear here.</span></div> : mode === "chart" ? <>
          <div className="waitlist-analytics-chart"><ChartContainer config={chartConfig}>
              <AreaChart data={series} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} accessibilityLayer>
                <defs>
                  <linearGradient id={`${chartId}-visitors`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--product-text-secondary)" stopOpacity="0.16" />
                    <stop offset="95%" stopColor="var(--product-text-secondary)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id={`${chartId}-signups`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--product-success-text)" stopOpacity="0.26" />
                    <stop offset="95%" stopColor="var(--product-success-text)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--product-border-subtle)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} tickFormatter={(value) => formatDate(value)} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<ActivityTooltip />} cursor={{ stroke: "var(--product-border-control)", strokeDasharray: "3 3" }} />
                <Area dataKey="visitors" name="visitors" type="monotone" stroke="var(--product-text-secondary)" fill={`url(#${chartId}-visitors)`} fillOpacity={focusedSeries && focusedSeries !== "visitors" ? 0.2 : 1} strokeOpacity={focusedSeries && focusedSeries !== "visitors" ? 0.35 : 1} strokeWidth={focusedSeries === "visitors" ? 2.5 : 1.5} activeDot={{ r: 4, strokeWidth: 2, fill: "var(--product-bg-surface)" }} isAnimationActive={false} />
                <Area dataKey="signups" name="signups" type="monotone" stroke="var(--product-success-text)" fill={`url(#${chartId}-signups)`} fillOpacity={focusedSeries && focusedSeries !== "signups" ? 0.12 : 1} strokeOpacity={focusedSeries && focusedSeries !== "signups" ? 0.35 : 1} strokeWidth={focusedSeries === "signups" ? 2.5 : 2} activeDot={{ r: 4, strokeWidth: 2, fill: "var(--product-bg-surface)" }} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer></div>
          <div className="waitlist-analytics-legend" role="group" aria-label="Focus chart series">
            <span className="sr-only">Choose a series to emphasize it; choose it again to show both.</span>
            {Object.entries(chartConfig).map(([seriesName, config]) => <button key={seriesName} type="button" aria-label={`Emphasize ${config.label.toLowerCase()}`} aria-pressed={focusedSeries === seriesName} onClick={() => toggleFocusedSeries(seriesName)}>
              <i className={`waitlist-analytics-legend-${seriesName}`} aria-hidden="true" />{config.label}
            </button>)}
          </div>
        </> : <div className="product-table-wrap waitlist-analytics-table-wrap"><table className="product-waitlist-table"><caption className="sr-only">Daily visitors and signups from {formatDate(analytics.range.startDate)} to {formatDate(analytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })}</caption><thead><tr><th scope="col">Date</th><th scope="col">Visitors</th><th scope="col">Signups</th><th scope="col">Verified</th></tr></thead><tbody>{[...series].reverse().map((day) => <tr key={day.date}><th scope="row">{formatDate(day.date, { month: "short", day: "numeric", year: "numeric" })}</th><td>{number.format(day.visitors)}</td><td>{number.format(day.signups)}</td><td>{number.format(day.verifiedSignups)}</td></tr>)}</tbody></table></div>}
      </section>
      <details className="waitlist-analytics-definitions"><summary>How these numbers are counted</summary><ul><li>{analytics.definitions.visitors}</li><li>{analytics.definitions.conversionRate}</li><li>{analytics.definitions.verificationRate}</li>{analytics.caveats.slice(0, 2).map((caveat) => <li key={caveat}>{caveat}</li>)}</ul></details>
    </> : null}
  </section>;
}
