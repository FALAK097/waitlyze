"use client";

import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";

import { downloadCsv, downloadSummaryPng } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSliderField,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  DEFAULT_REWARD_INPUTS,
  designReferralRewards,
  REWARD_TYPE_OPTIONS,
} from "@/lib/tools/engines/reward-designer.mjs";

export function RewardDesignerWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [inputs, setInputs] = useState(DEFAULT_REWARD_INPUTS);
  const startedRef = useRef(false);

  const model = useMemo(() => designReferralRewards(inputs), [inputs]);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "referral-reward-calculator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
  }

  function updateTier(id, patch) {
    markStarted();
    setInputs((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }

  function addTier() {
    if (inputs.tiers.length >= 4) return;
    markStarted();
    const lastRef = inputs.tiers[inputs.tiers.length - 1]?.referrals || 10;
    setInputs((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          id: `tier-${Date.now()}`,
          referrals: lastRef + 10,
          rewardType: "extended_trial",
          label: "Bonus milestone perk",
          unitCost: 10,
        },
      ],
    }));
  }

  function removeTier(id) {
    if (inputs.tiers.length <= 1) return;
    setInputs((prev) => ({ ...prev, tiers: prev.tiers.filter((t) => t.id !== id) }));
  }

  const tierCopyText = model.tiers.map((t) => `• ${t.microcopy}`).join("\n");

  function handleExportCsv() {
    downloadCsv(
      "waitlyze-referral-reward-tiers.csv",
      [
        "Referrals Required",
        "Reward Label",
        "Unit Cost ($)",
        "P25 Earners",
        "P50 Earners",
        "P90 Earners",
        "P50 Cost ($)",
        "Fraud Risk",
      ],
      model.tiers.map((t) => [
        t.referrals,
        t.label,
        t.unitCost,
        t.p25Earners,
        t.p50Earners,
        t.p90Earners,
        t.p50Cost,
        t.fraudRisk.label,
      ]),
      [
        `Waitlyze Referral Reward ROI Model (LTV $${model.inputs.productLtv}, Size ${model.inputs.targetWaitlistSize})`,
        `P25 Budget: $${model.budgets.p25} | P50 Budget: $${model.budgets.p50} | P90 Budget: $${model.budgets.p90}`,
      ],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "referral-reward-calculator",
      entry_surface: entrySurface,
      export_format: "csv",
    });
  }

  function handleExportPng() {
    downloadSummaryPng({
      filename: "waitlyze-reward-roi.png",
      title: "Referral Reward Tier & ROI Model",
      subtitle: `${model.inputs.targetWaitlistSize.toLocaleString()} target list · $${model.inputs.productLtv} LTV · ${model.tiers.length} milestone tiers`,
      metrics: [
        { label: "Baseline Budget (P50)", value: `$${model.budgets.p50.toLocaleString()}` },
        { label: "Breakout Stress (P90)", value: `$${model.budgets.p90.toLocaleString()}` },
        {
          label: "Effective CAC / Ref",
          value: `$${model.effectiveCostPerReferralP50.toFixed(2)}`,
          hint: `${model.costToMarginLtvPct}% of gross-margin LTV`,
        },
        { label: "Fraud Posture", value: model.recommendedFraudMode },
      ],
      formula: model.formula,
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "referral-reward-calculator",
      entry_surface: entrySurface,
      export_format: "png",
    });
  }

  return (
    <ToolWorkspace className="grid gap-7">
      <div className="grid gap-5 border-b border-product-border-subtle pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ToolSliderField
          label="Product price / LTV"
          value={inputs.productLtv}
          onChange={(v) => {
            markStarted();
            setInputs((prev) => ({ ...prev, productLtv: v }));
          }}
          min={10}
          max={2500}
          step={10}
          prefix="$"
        />
        <ToolSliderField
          label="Gross margin"
          value={inputs.grossMarginPct}
          onChange={(v) => {
            markStarted();
            setInputs((prev) => ({ ...prev, grossMarginPct: v }));
          }}
          min={15}
          max={95}
          step={5}
          suffix="%"
        />
        <ToolSliderField
          label="Target waitlist size"
          value={inputs.targetWaitlistSize}
          onChange={(v) => {
            markStarted();
            setInputs((prev) => ({ ...prev, targetWaitlistSize: v }));
          }}
          min={200}
          max={50000}
          step={200}
          inputMode="numeric"
        />
        <ToolSliderField
          label="Expected share rate"
          value={inputs.shareRatePct}
          onChange={(v) => {
            markStarted();
            setInputs((prev) => ({ ...prev, shareRatePct: v }));
          }}
          min={5}
          max={55}
          step={1}
          suffix="%"
        />
      </div>

      {/* Editable Milestone Tiers */}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-product-display text-lg font-semibold text-product-text-primary">
            Milestone reward tiers (up to 4)
          </h2>
          {inputs.tiers.length < 4 ? (
            <button
              type="button"
              onClick={addTier}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-product-border-control bg-product-bg-surface px-3 py-1.5 text-caption font-medium text-product-text-primary hover:bg-product-bg-inset"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden="true" />
              Add tier
            </button>
          ) : null}
        </div>

        <div className="grid gap-3">
          {inputs.tiers.map((tier, index) => {
            const evaluated = model.tiers.find((t) => t.id === tier.id);
            const riskTone =
              evaluated?.fraudRisk.level === "high"
                ? "danger"
                : evaluated?.fraudRisk.level === "medium"
                  ? "warning"
                  : "success";
            return (
              <div
                key={tier.id}
                className="grid gap-3 rounded-xl border border-product-border-subtle bg-product-bg-inset/35 p-4 lg:grid-cols-[6rem_12rem_minmax(0,1fr)_6.5rem_auto] lg:items-end"
              >
                <label className="grid gap-1 text-micro font-semibold text-product-text-secondary">
                  Referrals
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={tier.referrals}
                    onChange={(e) =>
                      updateTier(tier.id, { referrals: Number(e.target.value) || 1 })
                    }
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-2.5 font-product-mono text-caption text-product-text-primary tabular-nums"
                  />
                </label>
                <label className="grid gap-1 text-micro font-semibold text-product-text-secondary">
                  Reward type
                  <select
                    value={tier.rewardType}
                    onChange={(e) => updateTier(tier.id, { rewardType: e.target.value })}
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-2.5 text-caption text-product-text-primary"
                  >
                    {REWARD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-micro font-semibold text-product-text-secondary">
                  Public reward description (Tier {index + 1})
                  <input
                    type="text"
                    maxLength={110}
                    value={tier.label}
                    onChange={(e) => updateTier(tier.id, { label: e.target.value })}
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-3 text-caption text-product-text-primary"
                  />
                </label>
                <label className="grid gap-1 text-micro font-semibold text-product-text-secondary">
                  Unit cost ($)
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step={0.5}
                    value={tier.unitCost}
                    onChange={(e) => updateTier(tier.id, { unitCost: Number(e.target.value) || 0 })}
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-2.5 font-product-mono text-caption text-product-text-primary tabular-nums"
                  />
                </label>
                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <ToolStatusBadge tone={riskTone}>
                    {evaluated?.fraudRisk.label || "Low risk"}
                  </ToolStatusBadge>
                  {inputs.tiers.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Remove tier ${index + 1}`}
                      onClick={() => removeTier(tier.id)}
                      className="inline-flex size-10 items-center justify-center rounded-lg border border-product-border-subtle bg-product-bg-surface text-product-text-secondary hover:text-product-danger-text"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget & CAC Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ToolStatTile
          label="Conservative (P25)"
          value={`$${model.budgets.p25.toLocaleString()}`}
          hint="Low viral intensity"
        />
        <ToolStatTile
          label="Baseline budget (P50)"
          value={`$${model.budgets.p50.toLocaleString()}`}
          hint={`~${model.estimatedReferredP50.toLocaleString()} verified refs`}
          tone="success"
        />
        <ToolStatTile
          label="Breakout stress (P90)"
          value={`$${model.budgets.p90.toLocaleString()}`}
          hint="Budget cap check"
          tone={model.budgets.p90 > model.budgets.p50 * 1.5 ? "warning" : "neutral"}
        />
        <ToolStatTile
          label="Effective CAC / ref"
          value={`$${model.effectiveCostPerReferralP50.toFixed(2)}`}
          hint={`${model.costToMarginLtvPct}% of gross-margin LTV`}
          tone={model.costToMarginLtvPct > 20 ? "danger" : "success"}
        />
      </div>

      {/* Earner Breakdown Table */}
      {!compact ? (
        <div className="overflow-x-auto rounded-xl border border-product-border-subtle">
          <table className="w-full border-collapse text-left text-caption">
            <thead className="border-b border-product-border-subtle bg-product-bg-inset/60 text-micro font-semibold text-product-text-secondary">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">P25 Earners</th>
                <th className="px-4 py-3">P50 Earners</th>
                <th className="px-4 py-3">P90 Earners</th>
                <th className="px-4 py-3">P50 Cost</th>
                <th className="px-4 py-3">Fraud Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-product-border-subtle bg-product-bg-surface tabular-nums">
              {model.tiers.map((tier) => (
                <tr key={tier.id}>
                  <td className="px-4 py-3 font-medium text-product-text-primary">
                    {tier.referrals} refs · {tier.label}
                  </td>
                  <td className="px-4 py-3 text-product-text-secondary">{tier.p25Earners}</td>
                  <td className="px-4 py-3 font-semibold text-product-text-primary">
                    {tier.p50Earners}
                  </td>
                  <td className="px-4 py-3 text-product-text-secondary">{tier.p90Earners}</td>
                  <td className="px-4 py-3 font-product-mono">${tier.p50Cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-micro text-product-text-secondary">
                    {tier.fraudRisk.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ToolCopyButton text={tierCopyText} label="Copy tier microcopy" />
        <ToolActionButton onClick={handleExportCsv}>Export CSV</ToolActionButton>
        <ToolActionButton onClick={handleExportPng}>Export PNG</ToolActionButton>
      </div>

      <ToolHandoffCta
        toolSlug="referral-reward-calculator"
        entrySurface={entrySurface}
        compact={compact}
        label="Apply these reward tiers in Waitlyze"
        resultBand={model.hasHighRisk ? "high_fraud_risk" : "healthy"}
        onApplyInProduct={onApplyInProduct}
        buildBlueprint={() => ({
          templateId: "community",
          showReferrals: true,
          fraudMode: model.recommendedFraudMode,
          formFields: { doubleOptIn: true },
          referralConfig: {
            enabled: true,
            pointsSignup: 50,
            pointsReferral: 30,
            rewardTiers: model.tiers.map((t) => ({
              referrals: t.referrals,
              reward: t.label.slice(0, 115),
            })),
          },
          summaryBullets: [
            `${model.tiers.length} milestone tiers configured (${model.tiers.map((t) => t.referrals).join(" / ")} referrals)`,
            `P50 fulfillment exposure: $${model.budgets.p50.toLocaleString()} ($${model.effectiveCostPerReferralP50}/verified ref)`,
            `Anti-abuse posture: Double opt-in + ${model.recommendedFraudMode} fraud mode`,
          ],
        })}
      />
    </ToolWorkspace>
  );
}
