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
  ToolStatStrip,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      subtitle: `${model.inputs.targetWaitlistSize.toLocaleString()} target list · $${model.inputs.productLtv} LTV · ${model.tiers.length} tiers`,
      metrics: [
        { label: "Baseline (P50)", value: `$${model.budgets.p50.toLocaleString()}` },
        { label: "Breakout (P90)", value: `$${model.budgets.p90.toLocaleString()}` },
        {
          label: "CAC / Ref",
          value: `$${model.effectiveCostPerReferralP50.toFixed(2)}`,
          hint: `${model.costToMarginLtvPct}% of margin LTV`,
        },
        { label: "Fraud Mode", value: model.recommendedFraudMode },
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
    <ToolWorkspace>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ToolSliderField
          label="Product LTV"
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
          label="Target list size"
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
          label="Share rate"
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

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-product-display text-base font-semibold text-product-text-primary">
            Reward tiers
          </h2>
          {inputs.tiers.length < 4 ? (
            <Button type="button" variant="product-outline" size="sm" onClick={addTier}>
              <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden="true" />
              Add tier
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4">
          {inputs.tiers.map((tier, index) => {
            const evaluated = model.tiers.find((t) => t.id === tier.id);
            const activeTypeLabel =
              REWARD_TYPE_OPTIONS.find((opt) => opt.value === tier.rewardType)?.label ??
              tier.rewardType;
            const riskTone =
              evaluated?.fraudRisk.level === "high"
                ? "danger"
                : evaluated?.fraudRisk.level === "medium"
                  ? "warning"
                  : "success";
            return (
              <div
                key={tier.id}
                className="grid gap-3 py-4 lg:grid-cols-[5.5rem_11.5rem_minmax(0,1fr)_6rem_auto] lg:items-end"
              >
                <div className="grid gap-1">
                  <Label className="text-micro text-product-text-secondary">Referrals</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={tier.referrals}
                    onChange={(e) =>
                      updateTier(tier.id, { referrals: Number(e.target.value) || 1 })
                    }
                    className="h-9 bg-product-bg-surface font-product-mono tabular-nums"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-micro text-product-text-secondary">Type</Label>
                  <Select
                    value={tier.rewardType}
                    onValueChange={(val) => val && updateTier(tier.id, { rewardType: val })}
                  >
                    <SelectTrigger className="h-9 w-full bg-product-bg-surface text-caption">
                      <SelectValue>{activeTypeLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {REWARD_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-micro text-product-text-secondary">
                    Tier {index + 1} reward
                  </Label>
                  <Input
                    type="text"
                    maxLength={110}
                    value={tier.label}
                    onChange={(e) => updateTier(tier.id, { label: e.target.value })}
                    className="h-9 bg-product-bg-surface"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-micro text-product-text-secondary">Cost ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    step={0.5}
                    value={tier.unitCost}
                    onChange={(e) => updateTier(tier.id, { unitCost: Number(e.target.value) || 0 })}
                    className="h-9 bg-product-bg-surface font-product-mono tabular-nums"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <ToolStatusBadge tone={riskTone}>
                    {evaluated?.fraudRisk.label || "Low risk"}
                  </ToolStatusBadge>
                  {inputs.tiers.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove tier ${index + 1}`}
                      onClick={() => removeTier(tier.id)}
                      className="text-product-text-secondary hover:text-product-danger-text"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ToolStatStrip>
        <ToolStatTile label="Conservative (P25)" value={`$${model.budgets.p25.toLocaleString()}`} />
        <ToolStatTile
          label="Baseline (P50)"
          value={`$${model.budgets.p50.toLocaleString()}`}
          hint={`~${model.estimatedReferredP50.toLocaleString()} refs`}
          tone="success"
        />
        <ToolStatTile
          label="Breakout (P90)"
          value={`$${model.budgets.p90.toLocaleString()}`}
          tone={model.budgets.p90 > model.budgets.p50 * 1.5 ? "warning" : "neutral"}
        />
        <ToolStatTile
          label="Effective CAC / ref"
          value={`$${model.effectiveCostPerReferralP50.toFixed(2)}`}
          hint={`${model.costToMarginLtvPct}% of margin LTV`}
          tone={model.costToMarginLtvPct > 20 ? "danger" : "success"}
        />
      </ToolStatStrip>

      {!compact ? (
        <Table scrollLabel="Referral tier budget breakdown">
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-b-0">
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">P25</TableHead>
              <TableHead className="text-right">P50</TableHead>
              <TableHead className="text-right">P90</TableHead>
              <TableHead className="text-right">P50 cost</TableHead>
              <TableHead>Fraud note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {model.tiers.map((tier) => (
              <TableRow key={tier.id} className="border-b-0">
                <TableCell className="font-medium text-product-text-primary">
                  {tier.referrals} refs · {tier.label}
                </TableCell>
                <TableCell className="text-right text-product-text-secondary">
                  {tier.p25Earners}
                </TableCell>
                <TableCell className="text-right font-medium text-product-text-primary">
                  {tier.p50Earners}
                </TableCell>
                <TableCell className="text-right text-product-text-secondary">
                  {tier.p90Earners}
                </TableCell>
                <TableCell className="text-right font-product-mono">
                  ${tier.p50Cost.toLocaleString()}
                </TableCell>
                <TableCell className="text-caption whitespace-normal text-product-text-secondary">
                  {tier.fraudRisk.reason}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ToolCopyButton text={tierCopyText} label="Copy tier copy" />
        <ToolActionButton onClick={handleExportCsv}>CSV</ToolActionButton>
        <ToolActionButton onClick={handleExportPng}>PNG</ToolActionButton>
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
