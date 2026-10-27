"use client";

import { ArrowUpDownIcon, CalendarIcon, ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { differenceInCalendarDays, format } from "date-fns";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

import { EvilBarRows } from "@/components/product/evil-bar-chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SIGNUP_POINTS, REFERRAL_POINTS } from "@/lib/referrals/points.mjs";

import { number } from "./waitlist-analytics-formatters";
import {
  EmailDeliveryChart,
  EvilAreaChart,
  EvilPieChart,
  EvilWorldMap,
  FunnelChart,
  RankedBars,
} from "./waitlist-analytics-visualizations";

const COMPARISON =
  "flex min-w-0 items-center gap-1 pt-0.75 text-micro font-medium leading-snug text-product-text-secondary";
const METRIC = [
  "relative grid min-h-27.5 min-w-0 content-start gap-0.5",
  "border-s border-product-border-subtle px-4 pt-4.25 pb-3.5",
  "nth-[4]:border-s-0 nth-[7]:border-s-0 nth-[n+4]:border-t",
  "max-[600px]:min-h-25.5 max-[600px]:px-2.75 max-[600px]:pt-3.5 max-[600px]:pb-3",
  "@min-[33rem]:nth-[4]:border-s @min-[33rem]:nth-[4]:border-t-0",
  "@min-[33rem]:nth-[5]:border-s-0 @min-[33rem]:nth-[7]:border-s",
  "@min-[41.25rem]:nth-[5]:border-s @min-[41.25rem]:nth-[5]:border-t-0",
  "@min-[41.25rem]:nth-[6]:border-s-0",
  "@min-[49.5rem]:nth-[6]:border-s @min-[49.5rem]:nth-[6]:border-t-0",
  "@min-[49.5rem]:nth-[7]:border-s-0",
  "@min-[57.75rem]:nth-[7]:border-s @min-[57.75rem]:nth-[7]:border-t-0",
].join(" ");
const BENCHMARK =
  "mt-1.25 inline-flex w-fit rounded-full bg-product-bg-inset px-2 py-0.5 text-micro font-semibold leading-normal tracking-wider text-product-text-secondary uppercase";
const DIMENSIONS =
  "inline-flex max-w-full items-center gap-0.5 overflow-x-auto px-3 pb-2.5 no-scrollbar";
const ANALYTICS_CHART =
  "w-full px-2.5 pb-2 pl-1 text-xs text-product-text-secondary [&>[data-chart]]:h-80 [&>[data-chart]]:w-full [&>[data-chart]]:aspect-auto";
const DATA_PANEL = [
  "min-w-0 overflow-hidden rounded-xl border border-product-border-subtle",
  "bg-product-bg-surface shadow-xs has-[data-analytics-map]:overflow-visible",
].join(" ");
const PANEL_BODY = "h-61.5 overflow-y-auto border-t border-product-border-subtle no-scrollbar";
const ANALYTICS_TABLE_WRAP = [
  "relative max-h-120 overflow-x-auto rounded-none border-0 bg-product-bg-surface no-scrollbar",
  "[&_th]:px-3.25 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs",
  "[&_th]:border-b [&_th]:border-product-border-subtle",
  "[&_thead_th]:font-medium [&_thead_th]:text-product-text-secondary",
  "[&_tbody_th]:font-medium",
  "[&_td]:px-3.25 [&_td]:py-2.5 [&_td]:text-xs",
  "[&_td]:border-b [&_td]:border-product-border-subtle",
  "[&_th_span]:block [&_th_span]:pt-0.5 [&_th_span]:text-micro",
  "[&_th_span]:font-normal [&_th_span]:text-product-text-secondary",
].join(" ");
const ANALYTICS_TABLE = [
  "w-full border-collapse text-xs",
  "[&_th]:px-3.25 [&_th]:py-2.5 [&_th]:text-left [&_th]:border-b",
  "[&_th]:border-product-border-subtle",
  "[&_thead_th]:font-medium [&_thead_th]:text-product-text-secondary",
  "[&_tbody_th]:w-7/10 [&_tbody_th]:font-medium",
  "[&_td]:px-3.25 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-product-border-subtle",
  "[&_th_span]:block [&_th_span]:pt-0.5 [&_th_span]:text-micro",
  "[&_th_span]:font-normal [&_th_span]:text-product-text-secondary",
].join(" ");
const REFERRAL_COL_TITLE =
  "px-3.5 pt-3 pb-1.5 text-micro font-semibold tracking-wider text-product-text-secondary uppercase";
const REFERRAL_EMPTY = "p-3.5 text-xs text-product-text-secondary";

const rangePresets = [
  { label: "Daily", days: "1" },
  { label: "Last 7 days", days: "7" },
  { label: "Last 30 days", days: "30" },
  { label: "Last 90 days", days: "90" },
];
const MAX_RANGE_DAYS = 90;
// Rough in-product medians for orientation only. These are illustrative
// constants, not measured benchmarks - keep them round and never present
// them with fake precision.
const CONVERSION_MEDIAN_PCT = 11;
const VERIFICATION_MEDIAN_PCT = 55;
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const rangeQueryOptions = {
  range: parseAsStringLiteral(["1", "7", "30", "90", "custom"]).withDefault("30"),
  from: parseAsString,
  to: parseAsString,
};

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function countryLabel(code) {
  const clean = String(code || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return code || "Unknown";
  return regionNames.of(clean) || clean;
}

function parseIsoDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function rangeLabel(range, from, to) {
  if (range !== "custom")
    return rangePresets.find((option) => option.days === range)?.label ?? "Last 30 days";
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (!fromDate || !toDate) return "Custom";
  return `${format(fromDate, "LLL d")} – ${format(toDate, "LLL d, y")}`;
}

function Comparison({ value }) {
  if (value == null) return <small className={COMPARISON}>No prior baseline</small>;
  const tone =
    value > 0 ? "text-product-success-text" : value < 0 ? "text-product-danger-text" : "";
  return (
    <small className={`${COMPARISON} ${tone}`}>
      <span>{Math.abs(value)}%</span>
      <span aria-hidden="true">{value > 0 ? "↑" : value < 0 ? "↓" : "–"}</span>
      <span className="sr-only">
        {value > 0 ? "increase" : value < 0 ? "decrease" : "no change"} from the previous period
      </span>
    </small>
  );
}

function Metric({ label, value, change, detail, badge, hint }) {
  return (
    <div className={METRIC}>
      <dt className="flex items-center gap-1 truncate text-xs text-product-text-secondary">
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 truncate font-product-display text-2xl leading-tight font-semibold tracking-tighter text-product-text-primary max-[600px]:text-xl">
        {hint ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="metric-hint"
                    size="metric-hint"
                    aria-label={`More about ${label}: ${value}`}
                  />
                }
              >
                {value}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-60 whitespace-normal">
                {hint}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          value
        )}
      </dd>
      {change !== undefined ? (
        <Comparison value={change} />
      ) : (
        <small className={COMPARISON}>{detail}</small>
      )}
      {badge}
    </div>
  );
}

function BenchmarkBadge({ rate, benchmark, note }) {
  const verdict = rate >= benchmark ? "above" : "below";
  return (
    <small
      className={`${BENCHMARK} ${
        verdict === "above"
          ? "bg-product-success-text/14 text-product-success-text"
          : "bg-product-danger-text/10 text-product-danger-text"
      }`}
      title={note}
    >
      {verdict === "above" ? "Above" : "Below"} ~{benchmark}%
    </small>
  );
}

function DimensionPicker({ label, options, value, onChange }) {
  return (
    <div className={DIMENSIONS} role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="product-ghost"
          size="dimension"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function PanelMetricSwitch({ metric, onChange }) {
  const next = metric === "visitors" ? "signups" : "visitors";
  const label = metric === "visitors" ? "Visitors" : "Signups";
  return (
    <Button
      type="button"
      variant="product-ghost"
      size="metric-switch"
      onClick={() => onChange(next)}
      aria-label={`Metric: ${label}. Switch to ${next}.`}
    >
      {label}
      <HugeiconsIcon icon={ArrowUpDownIcon} size={12} className="size-3" aria-hidden="true" />
    </Button>
  );
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

  const draftDays =
    draft?.from && draft?.to ? differenceInCalendarDays(draft.to, draft.from) + 1 : null;
  const canApply = Boolean(
    draft?.from && draft?.to && draftDays >= 1 && draftDays <= MAX_RANGE_DAYS,
  );

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

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setView("presets");
          setDraft(undefined);
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="product-outline"
            size="date-trigger"
            className="[&_svg]:size-3.75!"
            aria-label={`Date range: ${rangeLabel(range, from, to)}`}
          >
            <HugeiconsIcon icon={CalendarIcon} aria-hidden="true" />
            {rangeLabel(range, from, to)}
          </Button>
        }
      />
      <PopoverContent align="end" className={view === "calendar" ? "w-120" : "w-48"}>
        <div className="-m-2.5 grid gap-2">
          {view === "presets" ? (
            <div
              className="grid gap-0.5 border-b border-product-border-subtle px-1 pt-1 pb-2"
              role="group"
              aria-label="Date range presets"
            >
              {rangePresets.map((option) => (
                <Button
                  key={option.days}
                  type="button"
                  variant="product-ghost"
                  size="menu-item"
                  aria-pressed={range === option.days}
                  onClick={() => {
                    onChange({ range: option.days, from: null, to: null });
                    setOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="product-ghost"
                size="menu-item"
                aria-pressed={false}
                onClick={openPicker}
              >
                Custom…
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 px-2 pt-0.5 text-xs font-medium text-product-text-secondary">
                <Button
                  type="button"
                  variant="product-ghost"
                  size="date-back"
                  onClick={() => setView("presets")}
                >
                  ← Presets
                </Button>
                <span>
                  {canApply
                    ? `${format(draft.from, "LLL d")} – ${format(draft.to, "LLL d, y")}`
                    : "Select start and end"}
                </span>
              </div>
              <Calendar
                mode="range"
                defaultMonth={draft?.from ?? addDaysSafe(today, -14)}
                selected={draft}
                onSelect={setDraft}
                disabled={disabled}
                numberOfMonths={2}
              />
              <div className="flex flex-wrap items-end justify-between gap-2.5 border-t border-product-border-subtle px-2 pt-2 pb-1">
                <div className="flex gap-2.5">
                  <label className="grid gap-0.75 text-micro font-medium text-product-text-secondary">
                    <span>Start</span>
                    <output className="block min-w-30 rounded-lg border border-product-border-subtle bg-product-bg-surface px-2 py-1.25 text-xs text-product-text-primary tabular-nums">
                      {draft?.from ? format(draft.from, "yyyy-MM-dd") : "-"}
                    </output>
                  </label>
                  <label className="grid gap-0.75 text-micro font-medium text-product-text-secondary">
                    <span>End</span>
                    <output className="block min-w-30 rounded-lg border border-product-border-subtle bg-product-bg-surface px-2 py-1.25 text-xs text-product-text-primary tabular-nums">
                      {draft?.to ? format(draft.to, "yyyy-MM-dd") : "-"}
                    </output>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="product-ghost"
                    size="date-action"
                    onClick={() => setDraft(undefined)}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="product-apply"
                    size="date-action"
                    disabled={!canApply}
                    onClick={applyDraft}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function addDaysSafe(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function AnalyticsSkeleton() {
  return (
    <div
      className="grid gap-4 rounded-xl border border-product-border-subtle p-4.5"
      aria-hidden="true"
    >
      <div className="grid grid-cols-5 gap-4 max-[840px]:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div className="grid gap-2.5" key={item}>
            <i className="block h-2.75 w-3/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            <i className="block h-6.25 w-3/4 rounded bg-product-bg-inset motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex min-h-70 items-end gap-3 px-5 py-6">
        <i className="h-19.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        <i className="h-36.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        <i className="h-26.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        <i className="h-50.5 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
        <i className="h-42 min-w-2 flex-1 rounded bg-product-bg-inset motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

/** Overview dashboard with KPI metrics, benchmark badges, and range-scoped activity charts. */
export function WaitlistAnalytics({ waitListId, emailsEnabled = false }) {
  const [{ range, from, to }, setRangeState] = useQueryStates(rangeQueryOptions, {
    history: "push",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [mode, setMode] = useState("chart");
  const [acquisitionMetric, setAcquisitionMetric] = useState("visitors");
  const [audienceMetric, setAudienceMetric] = useState("visitors");
  const [technologyMetric, setTechnologyMetric] = useState("visitors");
  const [acquisitionView, setAcquisitionView] = useState("channels");
  const [audienceView, setAudienceView] = useState("map");
  const [technologyView, setTechnologyView] = useState("browsers");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const requestDays =
    range === "custom"
      ? (() => {
          const fromDate = parseIsoDate(from);
          const toDate = parseIsoDate(to);
          if (!fromDate || !toDate) return 30;
          return Math.min(
            Math.max(differenceInCalendarDays(toDate, fromDate) + 1, 1),
            MAX_RANGE_DAYS,
          );
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
      const response = await fetch(`/api/wait-lists/${waitListId}/analytics?${query}`, {
        signal,
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load analytics.");
      if (!signal.aborted)
        setAnalytics({ ...result, requestKey: { days: requestDays, end: requestEnd ?? null } });
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

  const rangeMatches = (result) =>
    result?.requestKey &&
    result.requestKey.days === requestDays &&
    result.requestKey.end === (requestEnd ?? null);
  const currentAnalytics = analytics && rangeMatches(analytics) ? analytics : null;
  const summary = currentAnalytics?.summary;
  const referrals = currentAnalytics?.referrals;
  const kFactor = currentAnalytics?.kFactor;
  const series = currentAnalytics?.series ?? [];
  const noActivity = summary && summary.visitors === 0 && summary.signups === 0;
  const conversion = summary?.conversionRate == null ? "-" : `${summary.conversionRate}%`;
  const verification = summary?.verificationRate == null ? "-" : `${summary.verificationRate}%`;
  const kFactorValue =
    kFactor?.value == null ? "-" : kFactor.value >= 0.01 ? kFactor.value.toFixed(2) : "<0.01";
  const invitesPerSignup = kFactor?.invitesPerSignup ?? 0;
  const invitesLabel =
    invitesPerSignup === 0
      ? "0.00"
      : invitesPerSignup >= 0.01
        ? invitesPerSignup.toFixed(2)
        : "<0.01";
  const kFactorDetail =
    kFactor?.value == null
      ? "No share or link data yet"
      : `${invitesLabel} share × ${(kFactor.shareConversion ?? 0).toFixed(1)}% join`;
  const acquisition = currentAnalytics
    ? {
        referrers: {
          rows: currentAnalytics.sources.referrers,
          empty: "No referrer data in this period.",
        },
        campaigns: {
          rows: currentAnalytics.sources.campaigns,
          empty: "No campaign data in this period.",
        },
        sources: {
          rows: currentAnalytics.sources.sources,
          empty: "No UTM source data in this period.",
        },
      }[acquisitionView]
    : null;
  const countryRows =
    currentAnalytics?.geo.countries.map((row) => ({
      ...row,
      code: row.label,
      label: countryLabel(row.label),
    })) ?? [];
  const audience = currentAnalytics
    ? {
        countries: { rows: countryRows, empty: "No country data in this period." },
        regions: { rows: currentAnalytics.geo.regions, empty: "No region data in this period." },
        cities: { rows: currentAnalytics.geo.cities, empty: "No city data in this period." },
      }[audienceView]
    : null;
  const technology = currentAnalytics
    ? {
        browsers: {
          rows: currentAnalytics.technology.browsers,
          empty: "No browser data in this period.",
        },
        operatingSystems: {
          rows: currentAnalytics.technology.operatingSystems,
          empty: "No operating system data in this period.",
        },
        devices: {
          rows: currentAnalytics.technology.devices,
          empty: "No device data in this period.",
        },
      }[technologyView]
    : null;
  const referralSplit = referrals
    ? [
        { label: "Referred", visitors: 0, signups: referrals.referred },
        { label: "Organic", visitors: 0, signups: referrals.organic },
      ].sort((a, b) => b.signups - a.signups)
    : [];
  const referralTop =
    referrals?.top.map((row) => ({ label: row.label, visitors: 0, signups: row.signups })) ?? [];
  const referralShareLabel =
    referrals?.share == null ? "No signups yet" : `${referrals.share}% of signups`;
  const summarySentence =
    currentAnalytics && !noActivity && summary?.conversionRate != null
      ? `${number.format(summary.signups)} signups from ${number.format(summary.visitors)} visitors - ${summary.conversionRate}% conversion vs a ~${CONVERSION_MEDIAN_PCT}% typical median.`
      : null;
  const funnelSteps = summary
    ? [
        {
          label: "Visited",
          value: summary.visitors,
          detail: "Distinct stored browsers",
        },
        {
          label: "Signed up",
          value: summary.signups,
          detail: `${number.format(summary.convertedVisitors)} linked to a tracked visit`,
        },
        {
          label: "Verified",
          value: summary.verifiedSignups,
          detail: `${number.format(summary.signups - summary.verifiedSignups)} awaiting verification`,
        },
      ]
    : [];

  return (
    <section
      className="mt-7 grid gap-4 max-[600px]:mt-6"
      aria-labelledby="waitlist-analytics-title"
      aria-busy={loading}
    >
      <header className="flex items-end justify-between gap-5 pb-1 max-[600px]:flex-col max-[600px]:items-stretch">
        <div>
          <h2 id="waitlist-analytics-title">Analytics</h2>
          <p className="pt-1.25 text-caption text-product-text-secondary">
            Understand how people discover, join, and share this waitlist.
          </p>
          {summarySentence ? (
            <p className="pt-1 text-caption font-medium text-product-text-primary">
              <a href="#waitlist-funnel" className="underline-offset-4 hover:underline">
                {summarySentence}
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 max-[600px]:justify-between">
          <RangePicker
            range={range}
            from={from}
            to={to}
            onChange={(next) => setRangeState({ range: next.range, from: next.from, to: next.to })}
          />
        </div>
      </header>

      {error ? (
        <div
          className="rounded-xl border border-product-border-subtle px-5 py-14 text-center text-product-text-secondary [&_button]:min-h-10 [&_button]:rounded-lg [&_button]:border [&_button]:border-product-border-control [&_button]:bg-product-bg-surface [&_button]:px-3.25 [&_button]:py-1.75 [&_button]:text-caption [&_button]:text-product-text-primary"
          role="alert"
        >
          <p className="pb-1.25 font-medium text-product-text-primary">{error}</p>
          <Button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </Button>
        </div>
      ) : null}
      {!error && !requestValid ? (
        <div
          className="rounded-xl border border-product-border-subtle px-5 py-14 text-center text-product-text-secondary"
          role="status"
        >
          <p className="pb-1.25 font-medium text-product-text-primary">
            Pick a complete custom range
          </p>
          <span>Choose both a start and end date (up to 90 days).</span>
        </div>
      ) : null}
      {!error && requestValid && loading && !currentAnalytics ? (
        <>
          <p className="sr-only" role="status">
            Loading analytics…
          </p>
          <AnalyticsSkeleton />
        </>
      ) : null}
      {!error && currentAnalytics ? (
        <>
          {loading ? (
            <p className="sr-only" role="status">
              Updating analytics…
            </p>
          ) : null}
          <section
            className="@container min-w-0 overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-surface shadow-xs"
            aria-labelledby="waitlist-trend-title"
          >
            <dl className="m-0 grid grid-cols-3 border-b border-product-border-subtle @min-[33rem]:grid-cols-4 @min-[41.25rem]:grid-cols-5 @min-[49.5rem]:grid-cols-6 @min-[57.75rem]:grid-cols-7">
              <Metric
                label="Visitors"
                value={number.format(summary.visitors)}
                change={summary.change?.visitors}
                detail="Distinct stored browsers"
                hint="Distinct browsers seen in this period. One person on two devices counts twice."
              />
              <Metric
                label="Signups"
                value={number.format(summary.signups)}
                change={summary.change?.signups}
                detail="People who joined"
                hint="People who joined in this period, confirmed or not."
              />
              <Metric
                label="Conversion"
                value={conversion}
                change={summary.change?.conversionRate}
                detail="Visitors who signed up"
                hint="Signups divided by visitors. The industry median for waitlists is about 11%."
                badge={
                  summary.conversionRate == null ? null : (
                    <BenchmarkBadge
                      rate={summary.conversionRate}
                      benchmark={CONVERSION_MEDIAN_PCT}
                      note={`Industry median conversion ≈ ${CONVERSION_MEDIAN_PCT}%`}
                    />
                  )
                }
              />
              <Metric
                label="Verification"
                value={verification}
                change={summary.change?.verificationRate}
                detail={`${number.format(summary.verifiedSignups)} verified`}
                hint="Share of signups who confirmed their email. The industry median is about 55%."
                badge={
                  summary.verificationRate == null ? null : (
                    <BenchmarkBadge
                      rate={summary.verificationRate}
                      benchmark={VERIFICATION_MEDIAN_PCT}
                      note={`Industry median verification ≈ ${VERIFICATION_MEDIAN_PCT}%`}
                    />
                  )
                }
              />
              <Metric
                label="Referrals"
                value={number.format(referrals?.referred ?? 0)}
                detail={referralShareLabel}
                hint="Verified signups who joined through someone's referral link. Counts only while the referral is marked clear or approved."
              />
              <Metric
                label="K-factor"
                value={kFactorValue}
                detail={kFactorDetail}
                hint="Viral coefficient: average new signups generated per signup - invites sent times the share-to-join rate. Above 1.0 means self-sustaining growth."
              />
              <Metric
                label="Points awarded"
                value={number.format(summary.pointsTotal)}
                detail={`${number.format(summary.pointsSignup)} join · ${number.format(summary.pointsReferral)} referral`}
                hint={`Total points issued in this period. A verified signup earns ${SIGNUP_POINTS} points and each verified referral earns the referrer ${REFERRAL_POINTS}.`}
              />
            </dl>

            <div className="flex items-center justify-between gap-4 px-4.5 pt-4.25 pb-0.5 max-[600px]:flex-col max-[600px]:items-start">
              <div>
                <h3 id="waitlist-trend-title" className="text-sm font-semibold">
                  Activity
                </h3>
                <p className="pt-0.5 text-micro text-product-text-secondary">
                  {formatDate(currentAnalytics.range.startDate)} –{" "}
                  {formatDate(currentAnalytics.range.endDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {timeZone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 max-[600px]:self-stretch">
                <div
                  className="inline-flex items-center gap-0.5 rounded-lg border border-product-border-subtle bg-product-bg-surface p-0.75 max-[600px]:flex-1 [&_button]:inline-flex [&_button]:min-h-9 [&_button]:cursor-pointer [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-xs [&_button]:font-medium [&_button]:text-product-text-secondary [&_button:hover]:bg-transparent [&_button[aria-pressed=true]]:bg-product-bg-inset [&_button[aria-pressed=true]]:text-product-text-primary"
                  role="group"
                  aria-label="Activity display"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={mode === "chart"}
                    onClick={() => setMode("chart")}
                  >
                    <HugeiconsIcon icon={ChartLineData01Icon} aria-hidden="true" />
                    Chart
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={mode === "table"}
                    onClick={() => setMode("table")}
                  >
                    Table
                  </Button>
                </div>
              </div>
            </div>

            {mode === "table" ? (
              <div className={ANALYTICS_TABLE_WRAP}>
                <Table>
                  <caption className="sr-only">
                    Daily visitors and signups from {formatDate(currentAnalytics.range.startDate)}{" "}
                    to{" "}
                    {formatDate(currentAnalytics.range.endDate, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Date</TableHead>
                      <TableHead scope="col">Visitors</TableHead>
                      <TableHead scope="col">Signups</TableHead>
                      <TableHead scope="col">Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...series].reverse().map((day) => (
                      <TableRow key={day.date}>
                        <TableHead scope="row">
                          {formatDate(day.date, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableHead>
                        <TableCell>{number.format(day.visitors)}</TableCell>
                        <TableCell>{number.format(day.signups)}</TableCell>
                        <TableCell>{number.format(day.verifiedSignups)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : noActivity ? (
              <div className="grid justify-items-center gap-2 px-5 py-16 text-center text-product-text-secondary">
                <p className="pb-1.25 font-medium text-product-text-primary">No activity yet</p>
                <span className="block text-sm">
                  Share your page to start learning about your audience.
                </span>
                <Link
                  prefetch={false}
                  href={`/waitlists/${waitListId}`}
                  className="mt-3 inline-block font-medium text-product-text-primary underline-offset-4"
                >
                  Open your page
                </Link>
              </div>
            ) : (
              <>
                <div className={ANALYTICS_CHART}>
                  <EvilAreaChart series={series} formatDate={formatDate} />
                </div>
              </>
            )}
          </section>

          <section
            id="waitlist-funnel"
            className={DATA_PANEL}
            aria-labelledby="waitlist-funnel-title"
          >
            <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
              <h3 id="waitlist-funnel-title" className="text-sm font-semibold">
                Funnel
              </h3>
              <span className="text-micro font-medium text-product-text-secondary">
                Views → joins → verified
              </span>
            </header>
            {noActivity ? (
              <p className="grid h-61.5 place-items-center border-t border-product-border-subtle p-6 text-center text-xs text-product-text-secondary">
                No funnel data yet. Joins and verifications will appear here once visitors arrive.
              </p>
            ) : (
              <div className="border-t border-product-border-subtle">
                <FunnelChart data={funnelSteps} showLabels showPercentage showValues />
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-4 max-[840px]:grid-cols-1">
            <section className={DATA_PANEL} aria-labelledby="waitlist-sources-title">
              <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <h3 id="waitlist-sources-title" className="text-sm font-semibold">
                  Acquisition
                </h3>
                <PanelMetricSwitch metric={acquisitionMetric} onChange={setAcquisitionMetric} />
              </header>
              <DimensionPicker
                label="Acquisition dimension"
                value={acquisitionView}
                onChange={setAcquisitionView}
                options={[
                  { label: "Channel", value: "channels" },
                  { label: "Referrer", value: "referrers" },
                  { label: "Campaign", value: "campaigns" },
                  { label: "Source", value: "sources" },
                ]}
              />
              <div className={PANEL_BODY}>
                {acquisitionView === "channels" ? (
                  <EvilPieChart
                    rows={currentAnalytics.sources.channels}
                    metric={acquisitionMetric}
                  />
                ) : (
                  <RankedBars
                    rows={acquisition.rows}
                    empty={acquisition.empty}
                    kind="acquisition"
                    metric={acquisitionMetric}
                  />
                )}
              </div>
            </section>

            <section className={DATA_PANEL} aria-labelledby="waitlist-technology-title">
              <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <h3 id="waitlist-technology-title" className="text-sm font-semibold">
                  Technology
                </h3>
                <PanelMetricSwitch metric={technologyMetric} onChange={setTechnologyMetric} />
              </header>
              <DimensionPicker
                label="Technology dimension"
                value={technologyView}
                onChange={setTechnologyView}
                options={[
                  { label: "Browser", value: "browsers" },
                  { label: "OS", value: "operatingSystems" },
                  { label: "Device", value: "devices" },
                ]}
              />
              <div className={PANEL_BODY}>
                <RankedBars
                  rows={technology.rows}
                  empty={technology.empty}
                  kind="technology"
                  metric={technologyMetric}
                />
              </div>
            </section>

            <section
              className={`${DATA_PANEL} col-span-full pb-4`}
              aria-labelledby="waitlist-audience-title"
            >
              <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <h3 id="waitlist-audience-title" className="text-sm font-semibold">
                  Audience
                </h3>
                <PanelMetricSwitch metric={audienceMetric} onChange={setAudienceMetric} />
              </header>
              <DimensionPicker
                label="Audience dimension"
                value={audienceView}
                onChange={setAudienceView}
                options={[
                  { label: "Map", value: "map" },
                  { label: "Country", value: "countries" },
                  { label: "Region", value: "regions" },
                  { label: "City", value: "cities" },
                ]}
              />
              <div
                className={`${PANEL_BODY} h-auto max-h-none min-h-95 has-[data-analytics-map]:min-h-0`}
              >
                {audienceView === "map" ? (
                  <EvilWorldMap
                    countries={currentAnalytics.geo.mapCountries ?? currentAnalytics.geo.countries}
                    metric={audienceMetric}
                  />
                ) : (
                  <RankedBars
                    rows={audience.rows}
                    empty={audience.empty}
                    kind={
                      audienceView === "countries"
                        ? "country"
                        : audienceView === "regions"
                          ? "region"
                          : "city"
                    }
                    metric={audienceMetric}
                  />
                )}
              </div>
            </section>
          </div>

          {referrals ? (
            <section className={`${DATA_PANEL} pb-4`} aria-labelledby="waitlist-referrals-title">
              <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <h3 id="waitlist-referrals-title" className="text-sm font-semibold">
                  Referrals
                </h3>
                <span className="text-micro font-medium text-product-text-secondary">
                  {referralShareLabel}
                </span>
              </header>
              <div className={`${PANEL_BODY} h-auto max-h-85 min-h-35`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 [&>div+div]:border-s [&>div+div]:border-product-border-subtle max-[600px]:[&>div+div]:border-s-0 max-[600px]:[&>div+div]:border-t max-[600px]:[&>div+div]:border-product-border-subtle">
                  <div>
                    <p className={REFERRAL_COL_TITLE}>Organic vs referred</p>
                    {referralSplit.some((row) => row.signups > 0) ? (
                      <EvilBarRows rows={referralSplit} kind="acquisition" metric="signups" />
                    ) : (
                      <p className={REFERRAL_EMPTY}>No signups in this period.</p>
                    )}
                  </div>
                  <div>
                    <p className={REFERRAL_COL_TITLE}>Top referrers</p>
                    {referralTop.length ? (
                      <EvilBarRows rows={referralTop} kind="acquisition" metric="signups" />
                    ) : (
                      <p className={REFERRAL_EMPTY}>No referral signups in this period.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {emailsEnabled ? (
            <section className={`${DATA_PANEL} pb-4`} aria-labelledby="waitlist-emails-title">
              <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <h3 id="waitlist-emails-title" className="text-sm font-semibold">
                  Email delivery
                </h3>
                <span className="text-micro font-medium text-product-text-secondary">
                  {currentAnalytics.emails.length}{" "}
                  {currentAnalytics.emails.length === 1 ? "send" : "sends"}
                </span>
              </header>
              <p className="max-w-prose px-4 pb-3.5 text-xs text-product-text-secondary">
                Delivery results for broadcasts sent during this period.
              </p>
              {currentAnalytics.emails.length ? (
                <>
                  <EmailDeliveryChart emails={currentAnalytics.emails} formatDate={formatDate} />
                  <div className={ANALYTICS_TABLE_WRAP}>
                    <table className={ANALYTICS_TABLE}>
                      <caption className="sr-only">Broadcast delivery outcomes by send</caption>
                      <thead>
                        <tr>
                          <th scope="col">Broadcast</th>
                          <th scope="col">Total</th>
                          <th scope="col">Delivered</th>
                          <th scope="col">Failed</th>
                          <th scope="col">In progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAnalytics.emails.map((email) => (
                          <tr key={email.id}>
                            <th scope="row">
                              {email.name}
                              <span>
                                {email.sentAt
                                  ? formatDate(email.sentAt.slice(0, 10), {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "-"}
                              </span>
                            </th>
                            <td>{number.format(email.total)}</td>
                            <td>
                              {number.format(email.delivered)}
                              {email.deliveredRate == null ? "" : ` · ${email.deliveredRate}%`}
                            </td>
                            <td>{number.format(email.failed)}</td>
                            <td>
                              {number.format(
                                Math.max(email.total - email.delivered - email.failed, 0),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="grid min-h-52 content-center justify-items-center gap-2 border-t border-product-border-subtle px-5 py-10 text-center text-xs text-product-text-secondary">
                  <p className="font-medium text-product-text-primary">
                    No broadcasts were sent in this period.
                  </p>
                  <span>
                    Once a broadcast goes out, delivered and failed recipients will appear here.
                  </span>
                  <Link
                    prefetch={false}
                    href={`/waitlists/${waitListId}/emails/broadcasts`}
                    className="mt-1 inline-block font-medium text-product-text-primary underline-offset-4 hover:underline"
                  >
                    View broadcasts
                  </Link>
                </div>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
