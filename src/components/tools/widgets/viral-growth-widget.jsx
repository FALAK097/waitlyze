"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  copyToClipboard,
  downloadCsv,
  downloadSummaryPng,
} from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolSegmentedControl,
  ToolSliderField,
  ToolStatStrip,
  ToolStatTile,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Progress } from "@/components/ui/progress";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  calculateViralGrowth,
  DEFAULT_VIRAL_INPUTS,
  VIRAL_SCENARIO_PRESETS,
} from "@/lib/tools/engines/viral-growth.mjs";

function ViralGrowthChart({ cycles }) {
  const maxVal = Math.max(10, ...cycles.map((c) => c.cumulativeTotal));
  const chartW = 640;
  const chartH = 220;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barSlot = innerW / Math.max(1, cycles.length);
  const barW = Math.max(10, Math.min(34, barSlot * 0.62));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption font-medium text-product-text-primary">
          Cumulative verified signups
        </p>
        <div className="flex items-center gap-4 text-micro text-product-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-xs bg-product-text-primary" />
            Direct
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-xs bg-product-accent-solid ring-1 ring-product-text-primary/20" />
            Referred
          </span>
        </div>
      </div>

      <div
        className="min-w-0 overflow-x-auto overscroll-x-contain"
        tabIndex={0}
        aria-label="Scrollable weekly signup projection chart"
      >
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          role="img"
          aria-label="Weekly cumulative verified signups split between direct and referred signups"
          className="h-auto min-w-[36rem] sm:w-full sm:min-w-0"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padT + innerH * (1 - ratio);
            const tickVal = Math.round(maxVal * ratio);
            return (
              <g key={ratio}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
                </text>
              </g>
            );
          })}

          {cycles.map((cycle, index) => {
            const x = padL + index * barSlot + (barSlot - barW) / 2;
            const directH = (cycle.cumulativeDirect / maxVal) * innerH;
            const refH = (cycle.cumulativeReferred / maxVal) * innerH;
            const directY = padT + innerH - directH;
            const refY = directY - refH;

            return (
              <g key={cycle.week}>
                <rect
                  x={x}
                  y={directY}
                  width={barW}
                  height={Math.max(1, directH)}
                  rx="2"
                  fill="#00160d"
                />
                {refH > 0.5 ? (
                  <rect
                    x={x}
                    y={refY}
                    width={barW}
                    height={Math.max(1, refH)}
                    rx="2"
                    fill="#c6fe1e"
                    stroke="#00160d"
                    strokeOpacity="0.25"
                    strokeWidth="0.75"
                  />
                ) : null}
                <text
                  x={x + barW / 2}
                  y={chartH - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  W{cycle.week}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sr-only">
        <table>
          <caption>Projected weekly waitlist signups</caption>
          <thead>
            <tr>
              <th>Week</th>
              <th>Cumulative Direct</th>
              <th>Cumulative Referred</th>
              <th>Total Verified</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.week}>
                <td>Week {c.week}</td>
                <td>{c.cumulativeDirect}</td>
                <td>{c.cumulativeReferred}</td>
                <td>{c.cumulativeTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ViralGrowthWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [presetId, setPresetId] = useState("baseline");
  const [inputs, setInputs] = useState(DEFAULT_VIRAL_INPUTS);
  const startedRef = useRef(false);

  useEffect(() => {
    if (compact || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("wv")) return;
    setInputs((prev) => ({
      ...prev,
      startingList: Number(params.get("sl") ?? prev.startingList),
      weeklyVisitors: Number(params.get("wv") ?? prev.weeklyVisitors),
      conversionRatePct: Number(params.get("cr") ?? prev.conversionRatePct),
      verificationRatePct: Number(params.get("vr") ?? prev.verificationRatePct),
      shareRatePct: Number(params.get("sr") ?? prev.shareRatePct),
      clicksPerSharer: Number(params.get("cs") ?? prev.clicksPerSharer),
      referredConversionPct: Number(params.get("rc") ?? prev.referredConversionPct),
      weeks: Number(params.get("wk") ?? prev.weeks),
      launchEmailOpenRatePct: Number(params.get("or") ?? prev.launchEmailOpenRatePct),
      referralTier1: Number(params.get("t1") ?? prev.referralTier1),
      referralTier2: Number(params.get("t2") ?? prev.referralTier2),
      referralTier3: Number(params.get("t3") ?? prev.referralTier3),
    }));
  }, [compact]);

  const result = useMemo(() => calculateViralGrowth(inputs), [inputs]);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "viral-coefficient-calculator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
  }

  function updateInput(key, value) {
    markStarted();
    setPresetId("custom");
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(id) {
    const found = VIRAL_SCENARIO_PRESETS.find((p) => p.id === id);
    if (!found) return;
    markStarted();
    setPresetId(id);
    setInputs({ ...found.inputs });
  }

  function handleExportCsv() {
    const headers = [
      "Week",
      "New Direct Verified",
      "New Referred Verified",
      "Cumulative Direct",
      "Cumulative Referred",
      "Cumulative Total Verified",
    ];
    const rows = result.cycles.map((c) => [
      `Week ${c.week}`,
      c.direct,
      c.referred,
      c.cumulativeDirect,
      c.cumulativeReferred,
      c.cumulativeTotal,
    ]);
    downloadCsv("waitlyze-viral-growth-model.csv", headers, rows, [
      `Waitlyze Viral Waitlist Growth Model (${new Date().toISOString().slice(0, 10)})`,
      `Formula: ${result.formula}`,
      `Effective K-Factor: ${result.effectiveK}`,
    ]);
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "viral-coefficient-calculator",
      entry_surface: entrySurface,
      export_format: "csv",
      result_band: result.resultBand,
    });
  }

  function handleExportPng() {
    downloadSummaryPng({
      filename: "waitlyze-viral-growth-card.png",
      title: "Viral Waitlist Growth Forecast",
      subtitle: `${result.inputs.weeks}-week scenario · ${result.inputs.weeklyVisitors.toLocaleString()} weekly visitors`,
      metrics: [
        {
          label: "Total Verified Signups",
          value: result.totalVerified.toLocaleString(),
          hint: `${result.directAdded.toLocaleString()} direct + ${result.referredTotal.toLocaleString()} referred`,
        },
        {
          label: "Effective K-Factor",
          value: result.effectiveK.toFixed(2),
          hint: `+${result.referralLiftPct}% referral lift`,
        },
        {
          label: "Launch-Day Opened",
          value: result.launchDayAudience.toLocaleString(),
          hint: `At ${result.inputs.launchEmailOpenRatePct}% open rate`,
        },
        {
          label: "#1 Highest Lever (+10%)",
          value: `+${result.highestLever?.extraSignups.toLocaleString() || 0}`,
          hint: result.highestLever?.label || "",
        },
      ],
      formula: result.formula,
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "viral-coefficient-calculator",
      entry_surface: entrySurface,
      export_format: "png",
      result_band: result.resultBand,
    });
  }

  async function handleCopyShareLink() {
    if (typeof window === "undefined") return;
    const url = new URL("/tools/viral-coefficient-calculator", window.location.origin);
    url.searchParams.set("sl", String(result.inputs.startingList));
    url.searchParams.set("wv", String(result.inputs.weeklyVisitors));
    url.searchParams.set("cr", String(result.inputs.conversionRatePct));
    url.searchParams.set("vr", String(result.inputs.verificationRatePct));
    url.searchParams.set("sr", String(result.inputs.shareRatePct));
    url.searchParams.set("cs", String(result.inputs.clicksPerSharer));
    url.searchParams.set("rc", String(result.inputs.referredConversionPct));
    url.searchParams.set("wk", String(result.inputs.weeks));
    url.searchParams.set("or", String(result.inputs.launchEmailOpenRatePct));
    url.searchParams.set("t1", String(result.inputs.referralTier1));
    url.searchParams.set("t2", String(result.inputs.referralTier2));
    url.searchParams.set("t3", String(result.inputs.referralTier3));
    const ok = await copyToClipboard(url.toString());
    if (ok) {
      toast.success("Scenario link copied");
      trackToolEvent("TOOL_RESULT_SHARED", {
        tool_slug: "viral-coefficient-calculator",
        entry_surface: entrySurface,
        result_band: result.resultBand,
      });
    }
  }

  const maxSensitivity = Math.max(1, ...result.sensitivity.map((s) => s.extraSignups));

  return (
    <ToolWorkspace>
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <ToolSegmentedControl
          ariaLabel="Growth scenario"
          value={presetId}
          onChange={applyPreset}
          options={VIRAL_SCENARIO_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
        {compact ? (
          <Link
            href="/tools/viral-coefficient-calculator"
            className="inline-flex items-center gap-1 text-caption font-medium text-product-text-primary underline-offset-4 hover:underline"
          >
            Full calculator
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <ToolSliderField
            label="Weekly visitors"
            value={inputs.weeklyVisitors}
            onChange={(v) => updateInput("weeklyVisitors", v)}
            min={50}
            max={50000}
            step={50}
            inputMode="numeric"
          />
          <ToolSliderField
            label="Direct conversion"
            value={inputs.conversionRatePct}
            onChange={(v) => updateInput("conversionRatePct", v)}
            min={1}
            max={65}
            step={0.5}
            suffix="%"
          />
          <ToolSliderField
            label="Email verification"
            value={inputs.verificationRatePct}
            onChange={(v) => updateInput("verificationRatePct", v)}
            min={30}
            max={100}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Share rate"
            value={inputs.shareRatePct}
            onChange={(v) => updateInput("shareRatePct", v)}
            min={0}
            max={70}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Clicks per sharer"
            value={inputs.clicksPerSharer}
            onChange={(v) => updateInput("clicksPerSharer", v)}
            min={0.5}
            max={12}
            step={0.5}
          />
          {!compact ? (
            <>
              <ToolSliderField
                label="Referred conversion"
                value={inputs.referredConversionPct}
                onChange={(v) => updateInput("referredConversionPct", v)}
                min={1}
                max={65}
                step={1}
                suffix="%"
              />
              <ToolSliderField
                label="Starting list"
                value={inputs.startingList}
                onChange={(v) => updateInput("startingList", v)}
                min={0}
                max={10000}
                step={25}
                inputMode="numeric"
              />
              <ToolSliderField
                label="Horizon"
                value={inputs.weeks}
                onChange={(v) => updateInput("weeks", v)}
                min={2}
                max={20}
                step={1}
                suffix="wks"
                inputMode="numeric"
              />
              <ToolSliderField
                label="Launch email open rate"
                value={inputs.launchEmailOpenRatePct}
                onChange={(v) => updateInput("launchEmailOpenRatePct", v)}
                min={10}
                max={85}
                step={1}
                suffix="%"
              />
              <ToolSliderField
                label="Reward cost / referral"
                value={inputs.rewardCostPerReferral}
                onChange={(v) => updateInput("rewardCostPerReferral", v)}
                min={0}
                max={25}
                step={0.5}
                prefix="$"
              />
              <fieldset className="grid gap-4 pt-2">
                <legend className="text-caption font-semibold text-product-text-primary">
                  Referral milestones
                </legend>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {[1, 2, 3].map((tier) => (
                    <ToolSliderField
                      key={tier}
                      label={`Tier ${tier} referrals`}
                      value={inputs[`referralTier${tier}`]}
                      onChange={(value) => updateInput(`referralTier${tier}`, value)}
                      min={1}
                      max={100}
                      step={1}
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}
        </div>

        <div className="grid content-start gap-7">
          <ToolStatStrip>
            <ToolStatTile
              label="Total verified"
              value={result.totalVerified.toLocaleString()}
              hint={`${result.inputs.weeks} weeks`}
              tone="success"
            />
            <ToolStatTile
              label="K-factor"
              value={result.effectiveK.toFixed(2)}
              hint={result.effectiveK < 0.15 ? "Conversion-first" : "Compounding"}
              tone={result.effectiveK < 0.15 ? "warning" : "neutral"}
            />
            <ToolStatTile
              label="Launch opens"
              value={result.launchDayAudience.toLocaleString()}
              hint={`${result.inputs.launchEmailOpenRatePct}% open rate`}
            />
            <ToolStatTile
              label={result.estimatedRewardBudget > 0 ? "Reward budget" : "Referred"}
              value={
                result.estimatedRewardBudget > 0
                  ? `$${result.estimatedRewardBudget.toLocaleString()}`
                  : `+${result.referredTotal.toLocaleString()}`
              }
              hint={
                result.estimatedRewardBudget > 0
                  ? `$${result.effectiveCostPerVerifiedReferral}/ref`
                  : `+${result.referralLiftPct}% lift`
              }
            />
          </ToolStatStrip>

          <ViralGrowthChart cycles={result.cycles} />

          {!compact ? (
            <section className="grid gap-3" aria-labelledby="referral-milestones-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3
                  id="referral-milestones-heading"
                  className="text-caption font-semibold text-product-text-primary"
                >
                  Expected milestone unlocks
                </h3>
                <span className="text-micro text-product-text-muted">Directional estimate</span>
              </div>
              <dl className="grid gap-3 sm:grid-cols-3">
                {result.referralTiers.map((tier, index) => (
                  <div key={`${tier.referrals}-${index}`} className="min-w-0">
                    <dt className="text-micro text-product-text-secondary">
                      Tier {index + 1} · {tier.referrals} referrals
                    </dt>
                    <dd className="mt-1 font-product-mono text-caption font-medium text-product-text-primary tabular-nums">
                      {tier.estimatedUnlocks.toLocaleString()} unlocks
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {!compact ? (
            <div className="grid gap-3 pt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-caption font-semibold text-product-text-primary">
                  +10% lever sensitivity
                </p>
                <span className="text-caption text-product-text-secondary">
                  Top lever:{" "}
                  <strong className="font-medium text-product-text-primary">
                    {result.highestLever?.label}
                  </strong>
                </span>
              </div>
              <div className="grid gap-3">
                {result.sensitivity.map((item) => {
                  const pct = Math.max(6, Math.round((item.extraSignups / maxSensitivity) * 100));
                  return (
                    <div key={item.key} className="grid gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-caption">
                        <span className="min-w-0 text-product-text-primary">{item.label}</span>
                        <span className="shrink-0 font-product-mono text-micro text-product-text-secondary tabular-nums">
                          +{item.extraSignups.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </div>
              <p className="text-caption text-product-text-secondary">{result.recommendation}</p>
            </div>
          ) : null}

          {!compact ? (
            <div className="flex flex-wrap items-center gap-2">
              <ToolActionButton onClick={handleExportCsv}>CSV</ToolActionButton>
              <ToolActionButton onClick={handleExportPng}>PNG</ToolActionButton>
              <ToolActionButton icon="share" onClick={handleCopyShareLink}>
                Copy link
              </ToolActionButton>
            </div>
          ) : null}

          <ToolHandoffCta
            toolSlug="viral-coefficient-calculator"
            entrySurface={entrySurface}
            compact={compact}
            label={
              result.effectiveK < 0.15
                ? "Start conversion-first waitlist in Waitlyze"
                : "Launch this referral model in Waitlyze"
            }
            resultBand={result.resultBand}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: result.effectiveK < 0.15 ? "simple" : "community",
              showReferrals: result.effectiveK >= 0.1,
              formFields: { doubleOptIn: true },
              referralConfig: {
                enabled: result.effectiveK >= 0.1,
                pointsSignup: 50,
                pointsReferral: 30,
                modeledKFactor: result.effectiveK,
                rewardTiers: result.referralTiers.map((tier, index) => ({
                  referrals: tier.referrals,
                  reward: `Referral milestone ${index + 1}`,
                })),
              },
              summaryBullets: [
                `Modeled K-factor: ${result.effectiveK.toFixed(2)} (${result.totalVerified.toLocaleString()} projected verified signups over ${result.inputs.weeks} weeks)`,
                `Top leverage point: ${result.highestLever?.label || "Landing-page conversion"}`,
                result.effectiveK < 0.15
                  ? "Configured with focused Simple layout to lift base conversion first"
                  : "Configured with verified double opt-in referral sharing enabled",
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
