"use client";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const EvilAreaChart = dynamic(() => import("@/components/product/evil-area-chart").then((module) => module.EvilAreaChart), {
  loading: () => <div className="waitlist-analytics-loading-chart" role="status" aria-label="Loading audience chart" />,
});

const ranges = [7, 30, 90];
const number = new Intl.NumberFormat();

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function Metric({ label, value, detail, verdict }) {
  return <div className="waitlist-analytics-metric"><dt>{label}</dt><dd><span>{value}</span>{verdict ? <span className="waitlist-analytics-verdict" data-tone={verdict.tone}>{verdict.label}</span> : null}<small>{detail}</small></dd></div>;
}

function RankedRows({ rows, empty }) {
  if (!rows.length) return <p className="product-help">{empty}</p>;
  return <ul className="waitlist-analytics-ranked">{rows.map((row) => <li key={row.label}><span>{row.label}</span><span className="tabular-nums">{number.format(row.value)} · {row.share}%</span></li>)}</ul>;
}

function rateText(value) {
  return value == null ? "—" : `${value}%`;
}

function AnalyticsSkeleton() {
  return <div className="waitlist-analytics-loading" aria-hidden="true">
    <div className="waitlist-analytics-loading-metrics">{[0, 1, 2, 3, 4, 5].map((item) => <div className="waitlist-analytics-loading-metric" key={item}><i /><i /></div>)}</div>
    <div className="waitlist-analytics-loading-chart"><i /><i /><i /><i /><i /></div>
  </div>;
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
      if (!signal.aborted) setAnalytics(result);
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

  const currentAnalytics = analytics?.range.days === days ? analytics : null;
  const summary = currentAnalytics?.summary;
  const series = currentAnalytics?.series ?? [];
  const noActivity = summary && summary.visitors === 0 && summary.signups === 0;
  const conversion = summary?.conversionRate == null ? "—" : `${summary.conversionRate}%`;
  const verification = summary?.verificationRate == null ? "—" : `${summary.verificationRate}%`;
  const kfactor = summary?.kfactor == null ? "—" : summary.kfactor.toFixed(2);
  const funnel = currentAnalytics?.funnel;
  const funnelVerifiedRate = funnel && funnel.referred > 0 ? Math.round((funnel.verified / funnel.referred) * 1000) / 10 : null;
  const funnelSharedRate = funnel && funnel.verified > 0 ? Math.round((funnel.sharedAgain / funnel.verified) * 1000) / 10 : null;
  const toggleFocusedSeries = (seriesName) => setFocusedSeries((current) => current === seriesName ? null : seriesName);

  return <section className="waitlist-analytics" aria-labelledby="waitlist-analytics-title" aria-busy={loading}>
    <header className="waitlist-analytics-header">
      <div><h2 id="waitlist-analytics-title">Analytics</h2><p className="product-help">Visitors, signups, and verification for this waitlist.</p></div>
      <div className="waitlist-analytics-controls">
        <div className="waitlist-analytics-range" role="group" aria-label="Analytics date range">
          {ranges.map((range) => <Button type="button" key={range} aria-pressed={days === range} onClick={() => setDays(range)}>{range} days</Button>)}
        </div>
      </div>
    </header>

    {error ? <div className="waitlist-analytics-message" role="alert"><p>{error}</p><Button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button></div> : null}
    {!error && loading && !currentAnalytics ? <><p className="sr-only" role="status">Loading analytics…</p><AnalyticsSkeleton /></> : null}
    {!error && currentAnalytics ? <>
      {loading ? <p className="sr-only" role="status">Updating analytics…</p> : null}
      <dl className="waitlist-analytics-metrics">
        <Metric label="Visitors" value={number.format(summary.visitors)} detail="Distinct browsers" />
        <Metric label="Signups" value={number.format(summary.signups)} detail={`${number.format(summary.verifiedSignups)} verified`} />
        <Metric label="Conversion" value={conversion} detail="Visitors who signed up" verdict={summary.conversionVerdict} />
        <Metric label="Verification" value={verification} detail={`${number.format(summary.pendingVerification)} awaiting verification`} />
        <Metric label="Viral K-factor" value={kfactor} detail="Signups per verified signup" verdict={summary.kfactorVerdict} />
        <Metric label="Points awarded" value={number.format(summary.pointsTotal)} detail={`${number.format(summary.pointsSignup)} join · ${number.format(summary.pointsReferral)} referral`} />
      </dl>

      <section className="waitlist-analytics-panel" aria-labelledby="waitlist-trend-title">
        <header className="waitlist-analytics-panel-heading"><div><h3 id="waitlist-trend-title">Activity over time</h3><p>{formatDate(currentAnalytics.range.startDate)} – {formatDate(currentAnalytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })} · {timeZone}</p></div>
          <div className="waitlist-analytics-view" role="group" aria-label="Activity display">
            <Button type="button" aria-pressed={mode === "chart"} onClick={() => setMode("chart")}>Chart</Button>
            <Button type="button" aria-pressed={mode === "table"} onClick={() => setMode("table")}>Table</Button>
          </div>
        </header>
        {mode === "table" ? <div className="product-table-wrap waitlist-analytics-table-wrap product-waitlist-table"><Table><caption className="sr-only">Daily visitors and signups from {formatDate(currentAnalytics.range.startDate)} to {formatDate(currentAnalytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })}</caption><TableHeader><TableRow><TableHead scope="col">Date</TableHead><TableHead scope="col">Visitors</TableHead><TableHead scope="col">Signups</TableHead><TableHead scope="col">Verified</TableHead></TableRow></TableHeader><TableBody>{[...series].reverse().map((day) => <TableRow key={day.date}><TableHead scope="row">{formatDate(day.date, { month: "short", day: "numeric", year: "numeric" })}</TableHead><TableCell>{number.format(day.visitors)}</TableCell><TableCell>{number.format(day.signups)}</TableCell><TableCell>{number.format(day.verifiedSignups)}</TableCell></TableRow>)}</TableBody></Table></div> : noActivity ? <div className="waitlist-analytics-empty"><p>No activity yet</p><span>Share your page to start learning about your audience.</span><Link prefetch={false} href={`/waitlists/${waitListId}`}>Open your page</Link></div> : <>
          <div className="waitlist-analytics-chart"><EvilAreaChart series={series} focusedSeries={focusedSeries} formatDate={formatDate} /></div>
          <div className="waitlist-analytics-legend" role="group" aria-label="Focus chart series">
            <span className="sr-only">Choose a series to emphasize it; choose it again to show both.</span>
            {[{ label: "Visitors", name: "visitors" }, { label: "Signups", name: "signups" }].map(({ label, name: seriesName }) => <Button key={seriesName} type="button" aria-label={`Emphasize ${label.toLowerCase()}`} aria-pressed={focusedSeries === seriesName} onClick={() => toggleFocusedSeries(seriesName)}>
              <i className={`waitlist-analytics-legend-${seriesName}`} aria-hidden="true" />{label}
            </Button>)}
          </div>
        </>}
      </section>
      <section className="waitlist-analytics-panel" aria-labelledby="waitlist-loop-title">
        <header className="waitlist-analytics-panel-heading"><div><h3 id="waitlist-loop-title">Referral loop</h3><p>Referred → verified → sharing again, plus top referrers.</p></div></header>
        <ol className="waitlist-analytics-funnel">
          <li><strong className="tabular-nums">{number.format(funnel.referred)}</strong><span>Referred in</span></li>
          <li><strong className="tabular-nums">{number.format(funnel.verified)} · {rateText(funnelVerifiedRate)}</strong><span>Verified</span></li>
          <li><strong className="tabular-nums">{number.format(funnel.sharedAgain)} · {rateText(funnelSharedRate)}</strong><span>Shared again</span></li>
        </ol>
        {currentAnalytics.topReferrers.length ? <div className="product-table-wrap waitlist-analytics-table-wrap product-waitlist-table"><table>
          <caption className="sr-only">Top referrers</caption>
          <thead><tr><th scope="col">Referrer</th><th scope="col">Referrals</th><th scope="col">Points</th></tr></thead>
          <tbody>{currentAnalytics.topReferrers.map((referrer) => <tr key={referrer.email}><th scope="row">{referrer.email}</th><td className="tabular-nums">{number.format(referrer.referrals)}</td><td className="tabular-nums">{number.format(referrer.points)}</td></tr>)}</tbody>
        </table></div> : <p className="product-help">No eligible referrals in this period.</p>}
      </section>

      <section className="waitlist-analytics-panel" aria-labelledby="waitlist-sources-title">
        <header className="waitlist-analytics-panel-heading"><div><h3 id="waitlist-sources-title">Sources & audience</h3><p>Where signups came from and who they are.</p></div></header>
        <div className="waitlist-analytics-breakdowns">
          <div><h4>UTM sources</h4><RankedRows rows={currentAnalytics.sources.utm} empty="No source data in this period." /></div>
          <div><h4>Referrer hosts</h4><RankedRows rows={currentAnalytics.sources.referrers} empty="No referrer data in this period." /></div>
          <div><h4>Countries</h4><RankedRows rows={currentAnalytics.geo.countries} empty="No country data in this period." /></div>
          <div><h4>Devices</h4><RankedRows rows={currentAnalytics.geo.devices} empty="No device data in this period." /></div>
        </div>
      </section>

      <section className="waitlist-analytics-panel" aria-labelledby="waitlist-emails-title">
        <header className="waitlist-analytics-panel-heading"><div><h3 id="waitlist-emails-title">Emails</h3><p>Broadcast delivery, send by send.</p></div></header>
        {currentAnalytics.emails.length ? <div className="product-table-wrap waitlist-analytics-table-wrap product-waitlist-table"><table>
          <caption className="sr-only">Broadcast delivery</caption>
          <thead><tr><th scope="col">Broadcast</th><th scope="col">Sent</th><th scope="col">Delivered</th><th scope="col">Failed</th></tr></thead>
          <tbody>{currentAnalytics.emails.map((email) => <tr key={email.id}><th scope="row">{email.name}<span>{email.sentAt ? formatDate(email.sentAt.slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></th><td className="tabular-nums">{number.format(email.total)}</td><td className="tabular-nums">{number.format(email.delivered)}{email.deliveredRate == null ? "" : ` · ${email.deliveredRate}%`}</td><td className="tabular-nums">{number.format(email.failed)}</td></tr>)}</tbody>
        </table></div> : <p className="product-help">No broadcasts sent in this period.</p>}
      </section>

      <div className="waitlist-analytics-definitions"><Collapsible><CollapsibleTrigger>How these numbers are counted</CollapsibleTrigger><CollapsibleContent><ul><li>{currentAnalytics.definitions.visitors}</li><li>{currentAnalytics.definitions.conversionRate}</li><li>{currentAnalytics.definitions.verificationRate}</li><li>{currentAnalytics.definitions.kfactor}</li><li>{currentAnalytics.definitions.points}</li>{currentAnalytics.caveats.slice(0, 2).map((caveat) => <li key={caveat}>{caveat}</li>)}</ul></CollapsibleContent></Collapsible></div>
    </> : null}
  </section>;
}
