"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EvilBarRows } from "@/components/product/evil-bar-chart";

const EvilAreaChart = dynamic(() => import("@/components/product/evil-area-chart").then((module) => module.EvilAreaChart), {
  loading: () => <div className="waitlist-analytics-loading-chart" role="status" aria-label="Loading activity chart" />,
});
const EvilPieChart = dynamic(() => import("@/components/product/evil-pie-chart").then((module) => module.EvilPieChart), {
  loading: () => <div className="waitlist-analytics-panel-loading" role="status" aria-label="Loading channel chart" />,
});
const EvilWorldMap = dynamic(() => import("@/components/product/evil-world-map").then((module) => module.EvilWorldMap), {
  loading: () => <div className="waitlist-analytics-panel-loading" role="status" aria-label="Loading visitor map" />,
});

const rangePresets = [
  { label: "Daily", days: "1" },
  { label: "Last 7 days", days: "7" },
  { label: "Last 30 days", days: "30" },
  { label: "Last 90 days", days: "90" },
];
const MAX_RANGE_DAYS = 90;
const number = new Intl.NumberFormat();
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const rangeQueryOptions = {
  range: parseAsStringLiteral(["1", "7", "30", "90", "custom"]).withDefault("30"),
  from: parseAsString,
  to: parseAsString,
};

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function countryLabel(code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return code || "Unknown";
  return regionNames.of(clean) || clean;
}

function parseIsoDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function rangeLabel(range, from, to) {
  if (range !== "custom") return rangePresets.find((option) => option.days === range)?.label ?? "Last 30 days";
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (!fromDate || !toDate) return "Custom";
  return `${format(fromDate, "LLL d")} – ${format(toDate, "LLL d, y")}`;
}

function Comparison({ value }) {
  if (value == null) return <small className="waitlist-analytics-comparison is-neutral">No prior baseline</small>;
  const tone = value > 0 ? "is-up" : value < 0 ? "is-down" : "is-neutral";
  return <small className={`waitlist-analytics-comparison ${tone}`}>
    <span>{Math.abs(value)}%</span>
    <span aria-hidden="true">{value > 0 ? "↑" : value < 0 ? "↓" : "–"}</span>
    <span className="sr-only">{value > 0 ? "increase" : value < 0 ? "decrease" : "no change"} from the previous period</span>
  </small>;
}

function Metric({ label, value, change, detail }) {
  return <div className="waitlist-analytics-metric" title={detail}>
    <dt>{label}</dt>
    <dd>{value}</dd>
    {change !== undefined ? <Comparison value={change} /> : <small className="waitlist-analytics-comparison is-neutral">{detail}</small>}
  </div>;
}

function DimensionPicker({ label, options, value, onChange }) {
  return <div className="waitlist-analytics-dimensions" role="group" aria-label={label}>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

function RangePicker({ range, from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("presets");
  const [draft, setDraft] = useState(undefined);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const committed = useMemo(() => {
    const fromDate = parseIsoDate(from);
    const toDate = parseIsoDate(to);
    return fromDate && toDate ? { from: fromDate, to: toDate } : undefined;
  }, [from, to]);

  const disabled = (day) => {
    if (day > today) return true;
    if (!draft?.from) return false;
    return Math.abs(differenceInCalendarDays(day, draft.from)) >= MAX_RANGE_DAYS;
  };

  const draftDays = draft?.from && draft?.to ? differenceInCalendarDays(draft.to, draft.from) + 1 : null;
  const canApply = Boolean(draft?.from && draft?.to && draftDays >= 1 && draftDays <= MAX_RANGE_DAYS);

  const openPicker = () => {
    setDraft(committed);
    setView("calendar");
  };

  const applyDraft = () => {
    if (!canApply) return;
    onChange({
      range: "custom",
      from: format(draft.from, "yyyy-MM-dd"),
      to: format(draft.to, "yyyy-MM-dd"),
    });
    setOpen(false);
    setView("presets");
    setDraft(undefined);
  };

  return <Popover open={open} onOpenChange={(nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setView("presets");
      setDraft(undefined);
    }
  }}>
    <PopoverTrigger
      render={
        <button type="button" className="waitlist-analytics-range-trigger" aria-label={`Date range: ${rangeLabel(range, from, to)}`}>
          <HugeiconsIcon icon={CalendarIcon} aria-hidden="true" />
          {rangeLabel(range, from, to)}
        </button>
      }
    />
    <PopoverContent align="end" className={view === "calendar" ? "w-120" : "w-48"}>
      <div className="waitlist-analytics-range-popover">
        {view === "presets" ? <div className="waitlist-analytics-range-presets" role="group" aria-label="Date range presets">
          {rangePresets.map((option) => <button key={option.days} type="button" aria-pressed={range === option.days} onClick={() => { onChange({ range: option.days, from: null, to: null }); setOpen(false); }}>{option.label}</button>)}
          <button type="button" aria-pressed={false} onClick={openPicker}>Custom…</button>
        </div> : <>
          <div className="waitlist-analytics-range-calendar-header">
            <button type="button" className="waitlist-analytics-range-back" onClick={() => setView("presets")}>← Presets</button>
            <span>{canApply ? `${format(draft.from, "LLL d")} – ${format(draft.to, "LLL d, y")}` : "Select start and end"}</span>
          </div>
          <Calendar
            mode="range"
            defaultMonth={draft?.from ?? addDaysSafe(today, -14)}
            selected={draft}
            onSelect={setDraft}
            disabled={disabled}
            numberOfMonths={2}
          />
          <div className="waitlist-analytics-range-footer">
            <div className="waitlist-analytics-range-fields">
              <label>
                <span>Start</span>
                <output>{draft?.from ? format(draft.from, "yyyy-MM-dd") : "—"}</output>
              </label>
              <label>
                <span>End</span>
                <output>{draft?.to ? format(draft.to, "yyyy-MM-dd") : "—"}</output>
              </label>
            </div>
            <div className="waitlist-analytics-range-actions">
              <button type="button" onClick={() => setDraft(undefined)}>Clear</button>
              <button type="button" className="waitlist-analytics-range-apply" disabled={!canApply} onClick={applyDraft}>Apply</button>
            </div>
          </div>
        </>}
      </div>
    </PopoverContent>
  </Popover>;
}

function addDaysSafe(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function RankedBars({ rows, empty, noun = "visitors", kind }) {
  if (!rows.length) return <p className="waitlist-analytics-panel-empty">{empty}</p>;
  return <EvilBarRows rows={rows} noun={noun} kind={kind} />;
}

function AnalyticsSkeleton() {
  return <div className="waitlist-analytics-loading" aria-hidden="true">
    <div className="waitlist-analytics-loading-metrics">{[0, 1, 2, 3, 4, 5].map((item) => <div className="waitlist-analytics-loading-metric" key={item}><i /><i /></div>)}</div>
    <div className="waitlist-analytics-loading-chart"><i /><i /><i /><i /><i /></div>
  </div>;
}

export function WaitlistAnalytics({ waitListId, emailsEnabled = false }) {
  const [{ range, from, to }, setRangeState] = useQueryStates(rangeQueryOptions, { history: "push" });
  const [retryCount, setRetryCount] = useState(0);
  const [mode, setMode] = useState("chart");
  const [metric, setMetric] = useState("visitors");
  const [acquisitionView, setAcquisitionView] = useState("channels");
  const [audienceView, setAudienceView] = useState("map");
  const [pagesView, setPagesView] = useState("hostnames");
  const [technologyView, setTechnologyView] = useState("browsers");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const timeZone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch { return "UTC"; }
  }, []);

  const requestDays = range === "custom"
    ? (() => {
      const fromDate = parseIsoDate(from);
      const toDate = parseIsoDate(to);
      if (!fromDate || !toDate) return 30;
      return Math.min(Math.max(differenceInCalendarDays(toDate, fromDate) + 1, 1), MAX_RANGE_DAYS);
    })()
    : Number(range);
  const requestEnd = range === "custom" ? (parseIsoDate(to) ? to : null) : null;
  const requestValid = range !== "custom" || Boolean(parseIsoDate(from) && parseIsoDate(to));

  const load = useEffectEvent(async (signal) => {
    if (!requestValid) return;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ days: String(requestDays), timeZone });
      if (requestEnd) query.set("endDate", requestEnd);
      const response = await fetch(`/api/wait-lists/${waitListId}/analytics?${query}`, { signal, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load analytics.");
      if (!signal.aborted) setAnalytics({ ...result, requestKey: { days: requestDays, end: requestEnd ?? null } });
    } catch (cause) {
      if (cause.name !== "AbortError") setError(cause.message || "Could not load analytics.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  });

  useEffect(() => {
    if (!requestValid) {
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [requestDays, requestEnd, requestValid, retryCount, timeZone]);

  const rangeMatches = (result) => result?.requestKey
    && result.requestKey.days === requestDays
    && result.requestKey.end === (requestEnd ?? null);
  const currentAnalytics = analytics && rangeMatches(analytics) ? analytics : null;
  const summary = currentAnalytics?.summary;
  const series = currentAnalytics?.series ?? [];
  const noActivity = summary && summary.visitors === 0 && summary.signups === 0;
  const conversion = summary?.conversionRate == null ? "—" : `${summary.conversionRate}%`;
  const verification = summary?.verificationRate == null ? "—" : `${summary.verificationRate}%`;
  const acquisition = currentAnalytics ? {
    referrers: { rows: currentAnalytics.sources.referrers, empty: "No referrer data in this period." },
    campaigns: { rows: currentAnalytics.sources.campaigns, empty: "No campaign data in this period." },
    keywords: { rows: currentAnalytics.sources.keywords, empty: "No keyword data in this period." },
  }[acquisitionView] : null;
  const countryRows = currentAnalytics?.geo.countries.map((row) => ({ ...row, code: row.label, label: countryLabel(row.label) })) ?? [];
  const audience = currentAnalytics ? {
    countries: { rows: countryRows, empty: "No country data in this period." },
    regions: { rows: currentAnalytics.geo.regions, empty: "No region data in this period." },
    cities: { rows: currentAnalytics.geo.cities, empty: "No city data in this period." },
  }[audienceView] : null;
  const pages = currentAnalytics ? {
    hostnames: { rows: currentAnalytics.pages.hostnames, empty: "No hostname data in this period." },
    landingPages: { rows: currentAnalytics.pages.landingPages, empty: "No landing page data in this period." },
  }[pagesView] : null;
  const technology = currentAnalytics ? {
    browsers: { rows: currentAnalytics.technology.browsers, empty: "No browser data in this period." },
    operatingSystems: { rows: currentAnalytics.technology.operatingSystems, empty: "No operating system data in this period." },
    devices: { rows: currentAnalytics.technology.devices, empty: "No device data in this period." },
  }[technologyView] : null;

  return <section className="waitlist-analytics" aria-labelledby="waitlist-analytics-title" aria-busy={loading}>
    <header className="waitlist-analytics-header">
      <div><h2 id="waitlist-analytics-title">Analytics</h2><p>Understand how people discover, join, and share this waitlist.</p></div>
      <div className="waitlist-analytics-controls">
        <RangePicker
          range={range}
          from={from}
          to={to}
          onChange={(next) => setRangeState({ range: next.range, from: next.from, to: next.to })}
        />
      </div>
    </header>

    {error ? <div className="waitlist-analytics-message" role="alert"><p>{error}</p><Button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</Button></div> : null}
    {!error && !requestValid ? <div className="waitlist-analytics-message" role="status"><p>Pick a complete custom range</p><span>Choose both a start and end date (up to 90 days).</span></div> : null}
    {!error && requestValid && loading && !currentAnalytics ? <><p className="sr-only" role="status">Loading analytics…</p><AnalyticsSkeleton /></> : null}
    {!error && currentAnalytics ? <>
      {loading ? <p className="sr-only" role="status">Updating analytics…</p> : null}
      <section className="waitlist-analytics-overview" aria-labelledby="waitlist-trend-title">
        <dl className="waitlist-analytics-metrics">
          <Metric label="Visitors" value={number.format(summary.visitors)} change={summary.change?.visitors} detail="Distinct stored browsers" />
          <Metric label="Signups" value={number.format(summary.signups)} change={summary.change?.signups} detail="People who joined" />
          <Metric label="Conversion" value={conversion} change={summary.change?.conversionRate} detail="Visitors who signed up" />
          <Metric label="Verification" value={verification} change={summary.change?.verificationRate} detail={`${number.format(summary.verifiedSignups)} verified`} />
          <Metric label="Points awarded" value={number.format(summary.pointsTotal)} detail={`${number.format(summary.pointsSignup)} join · ${number.format(summary.pointsReferral)} referral`} />
        </dl>

        <div className="waitlist-analytics-chart-toolbar">
          <div>
            <h3 id="waitlist-trend-title">Activity</h3>
            <p>{formatDate(currentAnalytics.range.startDate)} – {formatDate(currentAnalytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })} · {timeZone}</p>
          </div>
          <div className="waitlist-analytics-toolbar-controls">
            <div className="waitlist-analytics-view" role="group" aria-label="Chart metric">
              <Button type="button" aria-pressed={metric === "visitors"} onClick={() => setMetric("visitors")}>Visitors</Button>
              <Button type="button" aria-pressed={metric === "signups"} onClick={() => setMetric("signups")}>Signups</Button>
            </div>
            <div className="waitlist-analytics-view" role="group" aria-label="Activity display">
              <Button type="button" aria-pressed={mode === "chart"} onClick={() => setMode("chart")}><HugeiconsIcon icon={ChartLineData01Icon} aria-hidden="true" />Chart</Button>
              <Button type="button" aria-pressed={mode === "table"} onClick={() => setMode("table")}>Table</Button>
            </div>
          </div>
        </div>

        {mode === "table" ? <div className="product-table-wrap waitlist-analytics-table-wrap"><Table><caption className="sr-only">Daily visitors and signups from {formatDate(currentAnalytics.range.startDate)} to {formatDate(currentAnalytics.range.endDate, { month: "short", day: "numeric", year: "numeric" })}</caption><TableHeader><TableRow><TableHead scope="col">Date</TableHead><TableHead scope="col">Visitors</TableHead><TableHead scope="col">Signups</TableHead><TableHead scope="col">Verified</TableHead></TableRow></TableHeader><TableBody>{[...series].reverse().map((day) => <TableRow key={day.date}><TableHead scope="row">{formatDate(day.date, { month: "short", day: "numeric", year: "numeric" })}</TableHead><TableCell>{number.format(day.visitors)}</TableCell><TableCell>{number.format(day.signups)}</TableCell><TableCell>{number.format(day.verifiedSignups)}</TableCell></TableRow>)}</TableBody></Table></div> : noActivity ? <div className="waitlist-analytics-empty"><p>No activity yet</p><span>Share your page to start learning about your audience.</span><Link prefetch={false} href={`/waitlists/${waitListId}`}>Open your page</Link></div> : <>
          <div className="waitlist-analytics-chart"><EvilAreaChart series={series} focusedSeries={metric} formatDate={formatDate} /></div>
        </>}
      </section>

      <div className="waitlist-analytics-grid">
        <section className="waitlist-analytics-data-panel" aria-labelledby="waitlist-sources-title">
          <header><h3 id="waitlist-sources-title">Acquisition</h3><span>Visitors</span></header>
          <DimensionPicker label="Acquisition dimension" value={acquisitionView} onChange={setAcquisitionView} options={[
            { label: "Channel", value: "channels" },
            { label: "Referrer", value: "referrers" },
            { label: "Campaign", value: "campaigns" },
            { label: "Keyword", value: "keywords" },
          ]} />
          <div className="waitlist-analytics-panel-body">
            {acquisitionView === "channels"
              ? <EvilPieChart rows={currentAnalytics.sources.channels} />
              : <RankedBars rows={acquisition.rows} empty={acquisition.empty} kind="acquisition" />}
          </div>
        </section>

        <section className="waitlist-analytics-data-panel" aria-labelledby="waitlist-audience-title">
          <header><h3 id="waitlist-audience-title">Audience</h3><span>Visitors</span></header>
          <DimensionPicker label="Audience dimension" value={audienceView} onChange={setAudienceView} options={[
            { label: "Map", value: "map" },
            { label: "Country", value: "countries" },
            { label: "Region", value: "regions" },
            { label: "City", value: "cities" },
          ]} />
          <div className="waitlist-analytics-panel-body">
            {audienceView === "map"
              ? <EvilWorldMap countries={currentAnalytics.geo.mapCountries ?? currentAnalytics.geo.countries} />
              : <RankedBars rows={audience.rows} empty={audience.empty} kind={audienceView === "countries" ? "country" : audienceView === "regions" ? "region" : "city"} />}
          </div>
        </section>

        <section className="waitlist-analytics-data-panel" aria-labelledby="waitlist-pages-title">
          <header><h3 id="waitlist-pages-title">Pages</h3><span>Visitors</span></header>
          <DimensionPicker label="Page dimension" value={pagesView} onChange={setPagesView} options={[
            { label: "Hostname", value: "hostnames" },
            { label: "Landing page", value: "landingPages" },
          ]} />
          <div className="waitlist-analytics-panel-body"><RankedBars rows={pages.rows} empty={pages.empty} kind="page" /></div>
        </section>

        <section className="waitlist-analytics-data-panel" aria-labelledby="waitlist-technology-title">
          <header><h3 id="waitlist-technology-title">Technology</h3><span>Visitors</span></header>
          <DimensionPicker label="Technology dimension" value={technologyView} onChange={setTechnologyView} options={[
            { label: "Browser", value: "browsers" },
            { label: "OS", value: "operatingSystems" },
            { label: "Device", value: "devices" },
          ]} />
          <div className="waitlist-analytics-panel-body"><RankedBars rows={technology.rows} empty={technology.empty} kind="technology" /></div>
        </section>
      </div>

      {emailsEnabled ? <section className="waitlist-analytics-data-panel waitlist-analytics-wide-panel" aria-labelledby="waitlist-emails-title">
        <header><h3 id="waitlist-emails-title">Email delivery</h3><span>{currentAnalytics.emails.length} {currentAnalytics.emails.length === 1 ? "send" : "sends"}</span></header>
        <p className="waitlist-analytics-section-copy">Delivery results for broadcasts sent during this period.</p>
        {currentAnalytics.emails.length ? <div className="product-table-wrap waitlist-analytics-table-wrap"><table className="product-waitlist-table">
          <caption className="sr-only">Broadcast delivery</caption>
          <thead><tr><th scope="col">Broadcast</th><th scope="col">Sent</th><th scope="col">Delivered</th><th scope="col">Failed</th></tr></thead>
          <tbody>{currentAnalytics.emails.map((email) => <tr key={email.id}><th scope="row">{email.name}<span>{email.sentAt ? formatDate(email.sentAt.slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></th><td>{number.format(email.total)}</td><td>{number.format(email.delivered)}{email.deliveredRate == null ? "" : ` · ${email.deliveredRate}%`}</td><td>{number.format(email.failed)}</td></tr>)}</tbody>
        </table></div> : <p className="waitlist-analytics-panel-empty">No broadcasts were sent during this period.</p>}
      </section> : null}
    </> : null}
  </section>;
}
