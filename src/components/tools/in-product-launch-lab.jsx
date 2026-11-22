"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

import { ToolSegmentedControl, ToolStatusBadge } from "@/components/tools/tool-ui";
import { CopyBuilderWidget } from "@/components/tools/widgets/copy-builder-widget";
import { DnsDeliverabilityWidget } from "@/components/tools/widgets/dns-deliverability-widget";
import { EmailSequenceWidget } from "@/components/tools/widgets/email-sequence-widget";
import { EmbedConfiguratorWidget } from "@/components/tools/widgets/embed-configurator-widget";
import { LaunchPlannerWidget } from "@/components/tools/widgets/launch-planner-widget";
import { PageGraderWidget } from "@/components/tools/widgets/page-grader-widget";
import { QueueSimulatorWidget } from "@/components/tools/widgets/queue-simulator-widget";
import { RewardDesignerWidget } from "@/components/tools/widgets/reward-designer-widget";
import { UtmBuilderWidget } from "@/components/tools/widgets/utm-builder-widget";
import { ViralGrowthWidget } from "@/components/tools/widgets/viral-growth-widget";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SURFACE_CONFIG = {
  builder: {
    triggerLabel: "Audit & Copy Lab",
    title: "Builder Launch Lab",
    description:
      "Recheck your published waitlist page or refine hero, benefits, and FAQ copy without leaving Builder.",
    tools: [
      { value: "grader", label: "Page Grader" },
      { value: "copy", label: "Copy Builder" },
    ],
  },
  analytics: {
    triggerLabel: "Growth & Queue Lab",
    title: "Growth & Referral Lab",
    description:
      "Model K-factor sensitivity, stress-test reward budgets, and simulate queue rank jumps.",
    tools: [
      { value: "viral", label: "Viral Growth" },
      { value: "rewards", label: "Reward Tiers" },
      { value: "queue", label: "Queue Simulator" },
    ],
  },
  emails: {
    triggerLabel: "Email & DNS Lab",
    title: "Email & Deliverability Lab",
    description:
      "Draft your 5-stage pre-launch sequence and verify SPF, DMARC, MX, and DKIM DNS records.",
    tools: [
      { value: "sequence", label: "Email Sequence" },
      { value: "dns", label: "DNS Checker" },
    ],
  },
  settings: {
    triggerLabel: "Launch Ops Lab",
    title: "Launch Operations Lab",
    description:
      "Plan your dated launch timeline, normalize channel UTM links, and test embed snippets.",
    tools: [
      { value: "planner", label: "Launch Planner" },
      { value: "utm", label: "UTM Builder" },
      { value: "embed", label: "Embed Sandbox" },
    ],
  },
};

export function InProductToolDrawer({
  surface = "builder",
  waitlistUrl = "",
  waitlistKeyId = "",
  customDomain = "",
}) {
  const config = SURFACE_CONFIG[surface] || SURFACE_CONFIG.builder;
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(config.tools[0].value);

  function handleInProductApply() {
    toast.success(
      "Copied into your Launch Lab workflow — apply any updates right in this workspace.",
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button type="button" variant="product-outline" size="sm" className="gap-1.5" />}
      >
        <HugeiconsIcon icon={SparklesIcon} size={15} aria-hidden="true" />
        <span>{config.triggerLabel}</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-3xl! overflow-y-auto bg-product-bg-page p-0 sm:max-w-3xl!"
      >
        <SheetHeader className="border-b border-product-border-subtle px-6 py-5">
          <SheetTitle className="font-product-display text-xl font-semibold text-product-text-primary">
            {config.title}
          </SheetTitle>
          <SheetDescription className="text-caption text-product-text-secondary">
            {config.description}
          </SheetDescription>
          <div className="pt-2">
            <ToolSegmentedControl
              value={activeTool}
              onChange={setActiveTool}
              options={config.tools}
            />
          </div>
        </SheetHeader>

        <div className="p-5 sm:p-6">
          {activeTool === "grader" ? (
            <PageGraderWidget
              initialUrl={waitlistUrl}
              compact
              entrySurface="in_product_builder"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "copy" ? (
            <CopyBuilderWidget
              compact
              entrySurface="in_product_builder"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "viral" ? (
            <ViralGrowthWidget
              compact
              entrySurface="in_product_analytics"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "rewards" ? (
            <RewardDesignerWidget
              compact
              entrySurface="in_product_analytics"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "queue" ? (
            <QueueSimulatorWidget
              compact
              entrySurface="in_product_analytics"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "sequence" ? (
            <EmailSequenceWidget
              compact
              entrySurface="in_product_emails"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "dns" ? (
            <DnsDeliverabilityWidget
              initialDomain={customDomain}
              compact
              entrySurface="in_product_emails"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "planner" ? (
            <LaunchPlannerWidget
              compact
              entrySurface="in_product_settings"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "utm" ? (
            <UtmBuilderWidget
              initialUrl={waitlistUrl}
              compact
              entrySurface="in_product_settings"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
          {activeTool === "embed" ? (
            <EmbedConfiguratorWidget
              waitlistKeyId={waitlistKeyId || "YOUR_PUBLIC_WAITLIST_ID"}
              compact
              entrySurface="in_product_settings"
              onApplyInProduct={handleInProductApply}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Quiet collapsible banner shown on /waitlists/[id] when a campaign originated
 * from a Launch Lab ToolBlueprint, preserving audit findings or checklist tasks.
 */
export function OriginatingBlueprintBanner({ blueprint, toolTitle }) {
  if (!blueprint?.payload) return null;
  const { payload } = blueprint;
  const checklist = payload.launchChecklist || [];
  const topFixes = payload.auditSummary?.topFixes || [];
  const bullets = payload.summaryBullets || [];

  return (
    <details className="mb-4 rounded-xl border border-product-border-subtle bg-product-bg-inset/50 px-4 py-3">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-caption font-semibold text-product-text-primary">
        <span className="inline-flex items-center gap-2">
          <ToolStatusBadge tone="accent">Launch Lab Blueprint</ToolStatusBadge>
          <span>Originating plan from {toolTitle || blueprint.toolSlug}</span>
        </span>
        <span className="text-micro font-medium text-product-text-secondary">Toggle reference</span>
      </summary>
      <div className="mt-3 grid gap-3 border-t border-product-border-subtle pt-3 text-caption text-product-text-secondary">
        {bullets.length > 0 ? (
          <ul className="grid list-disc gap-1 pl-4">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        {topFixes.length > 0 ? (
          <div>
            <p className="font-semibold text-product-text-primary">
              Audit fixes to verify before publish
            </p>
            <ul className="mt-1 grid list-disc gap-1 pl-4">
              {topFixes.map((fix) => (
                <li key={fix}>{fix}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {checklist.length > 0 ? (
          <div>
            <p className="font-semibold text-product-text-primary">
              Launch checklist ({checklist.filter((c) => !c.completed).length} remaining)
            </p>
            <ul className="mt-1 grid gap-1">
              {checklist.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className={item.completed ? "line-through opacity-60" : ""}>
                    {item.title}
                  </span>
                  {item.dueDate ? (
                    <span className="font-product-mono text-micro text-product-text-muted">
                      {item.dueDate}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
