"use client";

import { ArrowDown01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { saveLaunchLabPlanToWaitlist } from "@/app/actions/waitLists";
import { ToolCopyButton, ToolSegmentedControl, ToolStatusBadge } from "@/components/tools/tool-ui";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
    description: "Audit your published page or refine waitlist copy without leaving Builder.",
    tools: [
      { value: "grader", label: "Page Grader" },
      { value: "copy", label: "Copy Builder" },
    ],
  },
  analytics: {
    triggerLabel: "Growth & Queue Lab",
    title: "Growth & Referral Lab",
    description: "Model K-factor sensitivity, reward budgets, and queue rank jumps.",
    tools: [
      { value: "viral", label: "Viral Growth" },
      { value: "rewards", label: "Reward Tiers" },
      { value: "queue", label: "Queue Simulator" },
    ],
  },
  emails: {
    triggerLabel: "Email & DNS Lab",
    title: "Email & Deliverability Lab",
    description: "Draft your 5-stage sequence and verify SPF, DMARC, MX, and DKIM records.",
    tools: [
      { value: "sequence", label: "Email Sequence" },
      { value: "dns", label: "DNS Checker" },
    ],
  },
  settings: {
    triggerLabel: "Launch Ops Lab",
    title: "Launch Operations Lab",
    description: "Plan your launch timeline, normalize UTMs, and configure embed snippets.",
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
  const router = useRouter();
  const config = SURFACE_CONFIG[surface] || SURFACE_CONFIG.builder;
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(config.tools[0].value);

  async function handleInProductApply(blueprint) {
    if (!waitlistKeyId || !blueprint) {
      toast.error("Could not attach this plan because no campaign is selected.");
      return;
    }
    try {
      const result = await saveLaunchLabPlanToWaitlist({
        waitListId: waitlistKeyId,
        blueprint,
      });
      if (!result?.ok) {
        toast.error(result?.message || "Could not save this Launch Lab plan to your campaign.");
        return;
      }
      toast.success("Saved to this campaign.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not save this Launch Lab plan to your campaign. Try signing in again.");
    }
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
        <SheetHeader className="px-6 py-5">
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
 * from a Launch Lab ToolBlueprint.
 */
export function OriginatingBlueprintBanner({ blueprint, toolTitle }) {
  if (!blueprint?.payload) return null;
  const { payload } = blueprint;
  const checklist = payload.launchChecklist || [];
  const topFixes = payload.auditSummary?.topFixes || [];
  const bullets = payload.summaryBullets || [];
  const emailDrafts = payload.emailDrafts || [];
  const utmChannels = payload.utmPlan?.channels || [];
  const domainConfig = payload.domainConfig || null;

  return (
    <Collapsible className="mb-6 py-3">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-caption font-medium text-product-text-primary">
        <span>Saved plan from {toolTitle || blueprint.toolSlug}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={15}
          aria-hidden="true"
          className="text-product-text-secondary"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 grid gap-4 pt-2 text-caption text-product-text-secondary">
        {bullets.length > 0 ? (
          <ul className="grid list-disc gap-1 pl-4">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        {topFixes.length > 0 ? (
          <div>
            <p className="font-medium text-product-text-primary">Audit fixes to verify</p>
            <ul className="mt-1 grid list-disc gap-1 pl-4">
              {topFixes.map((fix) => (
                <li key={fix}>{fix}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {emailDrafts.length > 0 ? (
          <div className="grid gap-2">
            <p className="font-medium text-product-text-primary">
              Saved email drafts ({emailDrafts.length})
            </p>
            <div className="grid gap-2">
              {emailDrafts.map((draft) => (
                <div
                  key={`${draft.stage}-${draft.subject}`}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-product-text-primary">
                      {draft.subject}
                    </p>
                    <p className="text-micro text-product-text-muted">
                      {draft.stage}
                      {draft.timing ? ` · ${draft.timing}` : ""}
                    </p>
                  </div>
                  <ToolCopyButton
                    text={`Subject: ${draft.subject}\n\n${draft.body}`}
                    label="Copy"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {utmChannels.length > 0 ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-product-text-primary">
                UTM campaign: {payload.utmPlan?.campaign || "launch"} ({utmChannels.length}{" "}
                channels)
              </p>
              <ToolCopyButton
                text={utmChannels
                  .map(
                    (c) =>
                      `${c.channel}: utm_source=${c.source}&utm_medium=${c.medium}&utm_campaign=${payload.utmPlan?.campaign || "launch"}${c.content ? `&utm_content=${c.content}` : ""}`,
                  )
                  .join("\n")}
                label="Copy UTMs"
              />
            </div>
          </div>
        ) : null}
        {domainConfig?.domain ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-caption text-product-text-primary">
              Sending domain: <strong className="font-product-mono">{domainConfig.domain}</strong>
            </span>
            {typeof domainConfig.score === "number" ? (
              <ToolStatusBadge tone={domainConfig.score >= 80 ? "success" : "warning"}>
                DNS {domainConfig.score}/100
              </ToolStatusBadge>
            ) : null}
          </div>
        ) : null}
        {checklist.length > 0 ? (
          <div>
            <p className="font-medium text-product-text-primary">
              Launch checklist ({checklist.filter((c) => !c.completed).length} remaining)
            </p>
            <ul className="mt-1 grid gap-1">
              {checklist.slice(0, 8).map((item) => (
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
      </CollapsibleContent>
    </Collapsible>
  );
}
