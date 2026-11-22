"use client";

import { useMemo, useRef, useState } from "react";

import { downloadCsv, downloadSummaryPng } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolSegmentedControl,
  ToolSliderField,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  QUEUE_SIMULATOR_DEFAULTS,
  SHARER_SKEW_OPTIONS,
  simulateWaitlistQueue,
} from "@/lib/tools/engines/queue-simulator.mjs";

function QueueJumpChart({ jumpCurve, waitlistSize }) {
  const w = 620;
  const h = 210;
  const padL = 56;
  const padR = 24;
  const padT = 18;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const points = jumpCurve.map((row, idx) => {
    const x = padL + (idx / Math.max(1, jumpCurve.length - 1)) * innerW;
    // Higher rank (#1) near top, #N near bottom
    const y = padT + ((row.rank - 1) / Math.max(1, waitlistSize - 1)) * innerH;
    return { ...row, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption font-semibold text-product-text-primary">
          Simulated queue rank curve (new subscriber starting at #{waitlistSize.toLocaleString()})
        </p>
        <span className="font-product-mono text-micro text-product-text-secondary">
          Higher = closer to #1
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Queue rank jump curve by verified referrals"
        className="mt-3 h-auto w-full"
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = padT + innerH * ratio;
          const rankLabel = Math.max(1, Math.round(1 + ratio * (waitlistSize - 1)));
          return (
            <g key={ratio}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
                fontFamily="ui-monospace, monospace"
              >
                #{rankLabel >= 1000 ? `${(rankLabel / 1000).toFixed(1)}k` : rankLabel}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#00160d"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={polylinePoints}
        />

        {points.map((pt) => (
          <g key={pt.referrals}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill={pt.referrals === 1 || pt.referrals === 3 ? "#c6fe1e" : "#ffffff"}
              stroke="#00160d"
              strokeWidth="2"
            />
            <text
              x={pt.x}
              y={h - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              fontFamily="ui-monospace, monospace"
            >
              {pt.referrals} ref
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function QueueSimulatorWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [inputs, setInputs] = useState(QUEUE_SIMULATOR_DEFAULTS);
  const startedRef = useRef(false);

  const sim = useMemo(() => simulateWaitlistQueue(inputs), [inputs]);

  function update(key, value) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-queue-simulator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleExportCsv() {
    downloadCsv(
      "waitlyze-queue-simulation.csv",
      ["Verified Referrals", "Total Points", "Simulated Rank", "Places Jumped", "Top Percentile"],
      sim.jumpCurve.map((r) => [
        r.referrals,
        r.points,
        `#${r.rank}`,
        r.placesJumped,
        `Top ${r.topPercentile}%`,
      ]),
      [sim.formula, sim.tieBreakerNote],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-queue-simulator",
      entry_surface: entrySurface,
      export_format: "csv",
    });
  }

  function handleExportPng() {
    downloadSummaryPng({
      filename: "waitlyze-queue-simulator.png",
      title: "Waitlist Queue & Points Simulation",
      subtitle: `${sim.inputs.waitlistSize.toLocaleString()} subscribers · ${sim.inputs.pointsSignup} base / +${sim.inputs.pointsReferral} per verified referral`,
      metrics: [
        {
          label: "After 1 Referral",
          value: `#${sim.oneRefJump.rank.toLocaleString()}`,
          hint: `Top ${sim.oneRefJump.topPercentile}%`,
        },
        {
          label: "After 3 Referrals",
          value: `#${sim.threeRefJump.rank.toLocaleString()}`,
          hint: `Top ${sim.threeRefJump.topPercentile}%`,
        },
        {
          label: "Top 1% Cutoff",
          value: `${sim.cutoffs[1].referralsRequired} refs`,
          hint: `Rank <= #${sim.cutoffs[1].targetRank}`,
        },
        {
          label: "Top 10 Cutoff",
          value: `${sim.cutoffs[3].referralsRequired} refs`,
          hint: "Leaderboard elite",
        },
      ],
      formula: sim.formula,
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-queue-simulator",
      entry_surface: entrySurface,
      export_format: "png",
    });
  }

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <ToolSliderField
            label="Projected waitlist size"
            value={inputs.waitlistSize}
            onChange={(v) => update("waitlistSize", v)}
            min={500}
            max={50000}
            step={500}
            inputMode="numeric"
          />
          <ToolSliderField
            label="Base signup points"
            value={inputs.pointsSignup}
            onChange={(v) => update("pointsSignup", v)}
            min={0}
            max={200}
            step={5}
            suffix="pts"
            hint="Waitlyze default: 50 pts on email verification."
          />
          <ToolSliderField
            label="Points per verified referral"
            value={inputs.pointsReferral}
            onChange={(v) => update("pointsReferral", v)}
            min={5}
            max={200}
            step={5}
            suffix="pts"
            hint="Waitlyze default: +30 pts per confirmed referral."
          />
          {!compact ? (
            <>
              <ToolSliderField
                label="Optional profile / action bonus"
                value={inputs.pointsBonus}
                onChange={(v) => update("pointsBonus", v)}
                min={0}
                max={100}
                step={5}
                suffix="pts"
              />
              <ToolSegmentedControl
                label="Sharer distribution skew"
                value={inputs.sharerSkew}
                onChange={(v) => update("sharerSkew", v)}
                options={SHARER_SKEW_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.value.charAt(0).toUpperCase() + o.value.slice(1),
                }))}
              />
            </>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ToolStatTile
              label="After 1 referral"
              value={`#${sim.oneRefJump.rank.toLocaleString()}`}
              hint={`Jumps ${sim.oneRefJump.placesJumped.toLocaleString()} spots`}
              tone="success"
            />
            <ToolStatTile
              label="After 3 referrals"
              value={`#${sim.threeRefJump.rank.toLocaleString()}`}
              hint={`Top ${sim.threeRefJump.topPercentile}%`}
            />
            <ToolStatTile
              label="Top 1% cutoff"
              value={`${sim.cutoffs[1].referralsRequired} refs`}
              hint={`Rank <= #${sim.cutoffs[1].targetRank}`}
            />
            <ToolStatTile
              label="Top 10 cutoff"
              value={`${sim.cutoffs[3].referralsRequired} refs`}
              hint="Leaderboard"
            />
          </div>

          <QueueJumpChart jumpCurve={sim.jumpCurve} waitlistSize={sim.inputs.waitlistSize} />

          {/* Fairness & Display Recommendation */}
          <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption font-semibold text-product-text-primary">
                Fairness & display diagnosis
              </p>
              <ToolStatusBadge tone={sim.fairnessStatus === "healthy" ? "success" : "warning"}>
                {sim.recommendedDisplay}
              </ToolStatusBadge>
            </div>
            <p className="mt-2 text-caption leading-relaxed text-product-text-secondary">
              {sim.fairnessSummary}
            </p>
            <p className="mt-2 font-product-mono text-micro text-product-text-muted">
              {sim.tieBreakerNote}
            </p>
          </div>

          {!compact ? (
            <div className="flex flex-wrap items-center gap-2">
              <ToolActionButton onClick={handleExportCsv}>Export CSV</ToolActionButton>
              <ToolActionButton onClick={handleExportPng}>Export PNG</ToolActionButton>
            </div>
          ) : null}

          <ToolHandoffCta
            toolSlug="waitlist-queue-simulator"
            entrySurface={entrySurface}
            compact={compact}
            label="Configure this queue model in Waitlyze"
            resultBand={sim.fairnessStatus}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: "community",
              showReferrals: true,
              referralConfig: {
                enabled: true,
                pointsSignup: sim.inputs.pointsSignup,
                pointsReferral: sim.inputs.pointsReferral,
                pointsFollow: 5,
                hideCounts: sim.hideCounts,
                showPoints: true,
                showProgress: true,
              },
              summaryBullets: [
                `Points engine: ${sim.inputs.pointsSignup} base + ${sim.inputs.pointsReferral} per verified referral`,
                `1 verified referral jumps #${sim.inputs.waitlistSize.toLocaleString()} → #${sim.oneRefJump.rank.toLocaleString()}`,
                `Display mode: ${sim.recommendedDisplay}`,
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
