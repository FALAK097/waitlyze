"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { downloadCsv, downloadSummaryPng } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolSelectField,
  ToolSliderField,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  BENCHMARK_CATEGORIES,
  compareMetricToQuartile,
  getBenchmarkCohort,
  METRIC_DEFINITIONS,
  MIN_COHORT_SAMPLE_SIZE,
  REFERRAL_MODES,
  TRAFFIC_CHANNELS,
} from "@/lib/tools/benchmarks.mjs";

function QuartileCard({ label, unit, quartile, userValue, maxScale }) {
  const comparison = compareMetricToQuartile(userValue, quartile);
  const p25Left = Math.min(95, (quartile.p25 / maxScale) * 100);
  const p50Left = Math.min(96, (quartile.p50 / maxScale) * 100);
  const p75Left = Math.min(98, (quartile.p75 / maxScale) * 100);
  const userLeft = Math.min(98, Math.max(2, (Number(userValue) / maxScale) * 100));

  return (
    <div className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption font-semibold text-product-text-primary">{label}</p>
        <ToolStatusBadge tone={comparison.tone}>{comparison.label}</ToolStatusBadge>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-product-display text-2xl font-semibold text-product-text-primary tabular-nums">
          {quartile.p50}
          {unit}
        </span>
        <span className="text-micro text-product-text-secondary">
          median (IQR {quartile.p25}–{quartile.p75}
          {unit})
        </span>
      </div>

      {/* Visual P25-P75 interquartile bar + user marker */}
      <div className="relative mt-4 h-3 rounded-full bg-product-bg-inset">
        <div
          className="absolute top-0 bottom-0 rounded-full bg-product-text-secondary/30"
          style={{ left: `${p25Left}%`, width: `${Math.max(4, p75Left - p25Left)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-product-text-primary"
          style={{ left: `${p50Left}%` }}
        />
        <div
          title={`Your metric: ${userValue}${unit}`}
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-product-text-primary bg-product-accent-solid"
          style={{ left: `${userLeft}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between font-product-mono text-micro text-product-text-muted tabular-nums">
        <span>
          P25: {quartile.p25}
          {unit}
        </span>
        <span>
          You: {userValue}
          {unit}
        </span>
        <span>
          P75: {quartile.p75}
          {unit}
        </span>
      </div>
    </div>
  );
}

export function BenchmarksExplorerWidget({
  liveCampaignCount = 0,
  minSampleThreshold = MIN_COHORT_SAMPLE_SIZE,
  entrySurface = "research_hub",
  onApplyInProduct = null,
}) {
  const [category, setCategory] = useState("saas");
  const [referralMode, setReferralMode] = useState("referrals_enabled");
  const [channel, setChannel] = useState("all");
  const [userMetrics, setUserMetrics] = useState({
    conversionRatePct: 18,
    verificationRatePct: 76,
    shareRatePct: 15,
    effectiveKFactor: 0.14,
  });

  const cohort = useMemo(
    () => getBenchmarkCohort({ category, referralMode, channel }),
    [category, referralMode, channel],
  );

  const categoryObj =
    BENCHMARK_CATEGORIES.find((c) => c.value === category) || BENCHMARK_CATEGORIES[0];

  function handleDownloadCsv() {
    const m = cohort.metrics;
    downloadCsv(
      `waitlyze-benchmarks-${category}-${channel}.csv`,
      ["Metric", "P25", "P50 (Median)", "P75", "Cohort Source"],
      [
        [
          "Conversion Rate (%)",
          m.conversionRatePct.p25,
          m.conversionRatePct.p50,
          m.conversionRatePct.p75,
          cohort.sourceType,
        ],
        [
          "Verification Rate (%)",
          m.verificationRatePct.p25,
          m.verificationRatePct.p50,
          m.verificationRatePct.p75,
          cohort.sourceType,
        ],
        [
          "Share Rate (%)",
          m.shareRatePct.p25,
          m.shareRatePct.p50,
          m.shareRatePct.p75,
          cohort.sourceType,
        ],
        [
          "Effective K-Factor",
          m.effectiveKFactor.p25,
          m.effectiveKFactor.p50,
          m.effectiveKFactor.p75,
          cohort.sourceType,
        ],
      ],
      [
        `Waitlyze Waitlist Benchmark Explorer (${cohort.lastUpdated})`,
        `Segment: ${category} | ${referralMode} | ${channel}`,
        cohort.disclosure,
      ],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-benchmarks",
      entry_surface: entrySurface,
      export_format: "csv",
    });
  }

  function handleExportPng() {
    const m = cohort.metrics;
    downloadSummaryPng({
      filename: `waitlyze-benchmarks-${category}.png`,
      title: `Waitlist Benchmarks: ${categoryObj.label}`,
      subtitle: `${cohort.disclosure.slice(0, 92)}`,
      metrics: [
        {
          label: "Conversion Median",
          value: `${m.conversionRatePct.p50}%`,
          hint: `IQR ${m.conversionRatePct.p25}–${m.conversionRatePct.p75}%`,
        },
        {
          label: "Verification Median",
          value: `${m.verificationRatePct.p50}%`,
          hint: `IQR ${m.verificationRatePct.p25}–${m.verificationRatePct.p75}%`,
        },
        {
          label: "Share Rate Median",
          value: `${m.shareRatePct.p50}%`,
          hint: `IQR ${m.shareRatePct.p25}–${m.shareRatePct.p75}%`,
        },
        {
          label: "K-Factor Median",
          value: `${m.effectiveKFactor.p50}`,
          hint: `IQR ${m.effectiveKFactor.p25}–${m.effectiveKFactor.p75}`,
        },
      ],
      formula: "Interquartile reporting (P25 / P50 / P75) · Minimum live cohort N >= 30",
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-benchmarks",
      entry_surface: entrySurface,
      export_format: "png",
    });
  }

  const convCompare = compareMetricToQuartile(
    userMetrics.conversionRatePct,
    cohort.metrics.conversionRatePct,
  );
  const verCompare = compareMetricToQuartile(
    userMetrics.verificationRatePct,
    cohort.metrics.verificationRatePct,
  );

  return (
    <ToolWorkspace className="grid gap-6">
      {/* Transparent Cohort Policy Disclosure */}
      <div className="flex flex-col gap-2 rounded-xl border border-product-border-subtle bg-product-bg-inset/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ToolStatusBadge tone="neutral">Reference Planning Model</ToolStatusBadge>
            <span className="font-product-mono text-micro text-product-text-secondary">
              Cohort minimum: N &gt;= {minSampleThreshold} eligible campaigns (current eligible:{" "}
              {liveCampaignCount})
            </span>
          </div>
          <p className="mt-1.5 text-caption text-product-text-secondary">{cohort.disclosure}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ToolActionButton onClick={handleDownloadCsv}>Download CSV</ToolActionButton>
          <ToolActionButton onClick={handleExportPng}>Export PNG</ToolActionButton>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ToolSelectField
          label="Launch category"
          value={category}
          onChange={setCategory}
          options={BENCHMARK_CATEGORIES}
        />
        <ToolSelectField
          label="Referral mode"
          value={referralMode}
          onChange={setReferralMode}
          options={REFERRAL_MODES}
        />
        <ToolSelectField
          label="Primary traffic channel"
          value={channel}
          onChange={setChannel}
          options={TRAFFIC_CHANNELS}
        />
      </div>

      {/* Quartile Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuartileCard
          label="Landing-page conversion rate"
          unit="%"
          quartile={cohort.metrics.conversionRatePct}
          userValue={userMetrics.conversionRatePct}
          maxScale={55}
        />
        <QuartileCard
          label="Email verification rate"
          unit="%"
          quartile={cohort.metrics.verificationRatePct}
          userValue={userMetrics.verificationRatePct}
          maxScale={100}
        />
        <QuartileCard
          label="Verified subscriber share rate"
          unit="%"
          quartile={cohort.metrics.shareRatePct}
          userValue={userMetrics.shareRatePct}
          maxScale={55}
        />
        <QuartileCard
          label="Effective viral coefficient (K-factor)"
          unit=""
          quartile={cohort.metrics.effectiveKFactor}
          userValue={userMetrics.effectiveKFactor}
          maxScale={0.7}
        />
      </div>

      {/* Interactive Self-Comparison */}
      <div className="grid gap-4 rounded-xl border border-product-border-subtle bg-product-bg-inset/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-product-display text-lg font-semibold text-product-text-primary">
              Compare your current campaign metrics
            </h2>
            <p className="text-caption text-product-text-secondary">
              Slide your metrics to move the lime dot across each quartile bar above.
            </p>
          </div>
          {convCompare.band === "below_p25" ? (
            <Link
              href="/tools/waitlist-landing-page-grader"
              className="text-caption font-semibold text-product-success-text hover:underline"
            >
              Diagnose low conversion with Page Grader →
            </Link>
          ) : verCompare.band === "below_p25" ? (
            <Link
              href="/tools/email-deliverability-checker"
              className="text-caption font-semibold text-product-success-text hover:underline"
            >
              Inspect DNS deliverability →
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ToolSliderField
            label="Your conversion"
            value={userMetrics.conversionRatePct}
            onChange={(v) => setUserMetrics((p) => ({ ...p, conversionRatePct: v }))}
            min={1}
            max={55}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Your verification"
            value={userMetrics.verificationRatePct}
            onChange={(v) => setUserMetrics((p) => ({ ...p, verificationRatePct: v }))}
            min={20}
            max={100}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Your share rate"
            value={userMetrics.shareRatePct}
            onChange={(v) => setUserMetrics((p) => ({ ...p, shareRatePct: v }))}
            min={0}
            max={55}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Your K-factor"
            value={userMetrics.effectiveKFactor}
            onChange={(v) => setUserMetrics((p) => ({ ...p, effectiveKFactor: v }))}
            min={0}
            max={0.7}
            step={0.01}
          />
        </div>
      </div>

      {/* Explicit Metric Definitions */}
      <details className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-4">
        <summary className="cursor-pointer text-caption font-semibold text-product-text-primary">
          Metric definitions & exclusion criteria (7 standardized definitions)
        </summary>
        <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {METRIC_DEFINITIONS.map((def) => (
            <div key={def.name} className="rounded-lg bg-product-bg-inset/50 p-3">
              <dt className="text-caption font-semibold text-product-text-primary">{def.name}</dt>
              <dd className="mt-0.5 text-micro text-product-text-secondary">{def.formula}</dd>
            </div>
          ))}
        </dl>
      </details>

      <ToolHandoffCta
        toolSlug="waitlist-benchmarks"
        entrySurface={entrySurface}
        label="Benchmark your live waitlist in Waitlyze"
        onApplyInProduct={onApplyInProduct}
        buildBlueprint={() => ({
          templateId: categoryObj.templateId,
          showReferrals: referralMode !== "no_referrals",
          formFields: { doubleOptIn: true },
          summaryBullets: [
            `Benchmarked against ${categoryObj.label} cohort medians`,
            `Waitlyze Analytics tracks visitors, verified conversion, sources, and referral lift`,
          ],
        })}
      />
    </ToolWorkspace>
  );
}
