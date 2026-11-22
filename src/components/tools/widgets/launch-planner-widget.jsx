"use client";

import { useMemo, useRef, useState } from "react";

import { downloadCsv, downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolSliderField,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  buildLaunchCalendarIcs,
  buildLaunchMarkdown,
  DEFAULT_LAUNCH_PLANNER_INPUTS,
  LAUNCH_PLANNER_OPTIONS,
  planLaunchReadiness,
} from "@/lib/tools/engines/launch-planner.mjs";
import { cn } from "@/lib/utils";

export function LaunchPlannerWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [inputs, setInputs] = useState(DEFAULT_LAUNCH_PLANNER_INPUTS);
  const [manualDoneIds, setManualDoneIds] = useState([]);
  const startedRef = useRef(false);

  const plan = useMemo(() => planLaunchReadiness(inputs), [inputs]);
  const tasksWithManual = useMemo(() => {
    const manualSet = new Set(manualDoneIds);
    return plan.tasks.map((task) => ({
      ...task,
      completed: task.completed || manualSet.has(task.id),
    }));
  }, [plan.tasks, manualDoneIds]);

  const markdown = useMemo(
    () => buildLaunchMarkdown({ ...plan, tasks: tasksWithManual }),
    [plan, tasksWithManual],
  );

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "product-launch-checklist",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
  }

  function toggleAsset(assetId) {
    markStarted();
    setInputs((prev) => {
      const has = prev.existingAssets.includes(assetId);
      return {
        ...prev,
        existingAssets: has
          ? prev.existingAssets.filter((id) => id !== assetId)
          : [...prev.existingAssets, assetId],
      };
    });
  }

  function toggleTaskManual(taskId) {
    setManualDoneIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }

  const phases = useMemo(() => {
    const grouped = new Map();
    for (const task of tasksWithManual) {
      if (!grouped.has(task.phase)) grouped.set(task.phase, []);
      grouped.get(task.phase).push(task);
    }
    return [...grouped.entries()];
  }, [tasksWithManual]);

  const incompleteCount = tasksWithManual.filter((t) => !t.completed).length;

  function handleDownloadIcs() {
    const ics = buildLaunchCalendarIcs({ ...plan, tasks: tasksWithManual });
    downloadTextFile("waitlyze-launch-plan.ics", ics, "text/calendar;charset=utf-8;");
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "product-launch-checklist",
      entry_surface: entrySurface,
      export_format: "ics",
      result_band: plan.band,
    });
  }

  function handleDownloadCsv() {
    downloadCsv(
      "waitlyze-launch-checklist.csv",
      ["Due Date", "Phase", "Task", "Priority", "Est Hours", "Status", "Dependency"],
      tasksWithManual.map((t) => [
        t.dueDate,
        t.phase,
        t.title,
        t.priority,
        t.hours,
        t.completed ? "Done" : "Pending",
        t.dependency,
      ]),
      [`Waitlyze Launch Readiness Plan — Readiness Score ${plan.readinessScore}/100`],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "product-launch-checklist",
      entry_surface: entrySurface,
      export_format: "csv",
      result_band: plan.band,
    });
  }

  return (
    <ToolWorkspace className="grid gap-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Inputs */}
        <div className="grid content-start gap-4">
          <ToolSelectField
            label="Product category"
            value={inputs.category}
            onChange={(val) => {
              markStarted();
              setInputs((prev) => ({ ...prev, category: val }));
            }}
            options={LAUNCH_PLANNER_OPTIONS.categories}
          />
          <ToolSelectField
            label="Launch type"
            value={inputs.launchType}
            onChange={(val) => {
              markStarted();
              setInputs((prev) => ({ ...prev, launchType: val }));
            }}
            options={LAUNCH_PLANNER_OPTIONS.launchTypes}
          />
          <ToolSegmentedControl
            label="Launch horizon"
            value={String(inputs.horizonDays)}
            onChange={(val) => {
              markStarted();
              setInputs((prev) => ({ ...prev, horizonDays: Number(val), targetLaunchDate: "" }));
            }}
            options={LAUNCH_PLANNER_OPTIONS.horizons.map((h) => ({
              value: String(h.value),
              label: `${h.value}d`,
            }))}
          />
          <div className="grid gap-1.5">
            <label
              htmlFor="planner-target-date"
              className="text-caption font-semibold text-product-text-primary"
            >
              Or exact target launch date
            </label>
            <input
              id="planner-target-date"
              type="date"
              value={inputs.targetLaunchDate || plan.inputs.targetLaunchDate}
              onChange={(event) => {
                markStarted();
                setInputs((prev) => ({ ...prev, targetLaunchDate: event.target.value }));
              }}
              className="min-h-11 w-full rounded-lg border border-product-border-control bg-product-bg-surface px-3 py-2 text-body text-product-text-primary"
            />
          </div>

          {!compact ? (
            <ToolSliderField
              label="Weekly launch hours available"
              value={inputs.weeklyHours}
              onChange={(v) => {
                markStarted();
                setInputs((prev) => ({ ...prev, weeklyHours: v }));
              }}
              min={2}
              max={50}
              step={1}
              suffix="hrs"
              inputMode="numeric"
            />
          ) : null}

          <fieldset className="grid gap-2">
            <legend className="text-caption font-semibold text-product-text-primary">
              What you already have ready
            </legend>
            <div className="grid gap-1.5">
              {LAUNCH_PLANNER_OPTIONS.existingAssets.map((asset) => {
                const checked = inputs.existingAssets.includes(asset.id);
                return (
                  <label
                    key={asset.id}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-caption transition-colors duration-150",
                      checked
                        ? "border-product-text-primary/35 bg-product-bg-inset/70 font-medium text-product-text-primary"
                        : "border-product-border-subtle bg-product-bg-surface text-product-text-secondary hover:bg-product-bg-inset/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAsset(asset.id)}
                      className="size-4 accent-product-text-primary"
                    />
                    <span>{asset.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Outputs */}
        <div className="grid content-start gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ToolStatTile
              label="Readiness score"
              value={`${plan.readinessScore}/100`}
              hint={
                plan.band === "ready"
                  ? "Launch ready"
                  : plan.band === "in_progress"
                    ? "In progress"
                    : "Early setup"
              }
              tone={
                plan.band === "ready"
                  ? "success"
                  : plan.band === "in_progress"
                    ? "warning"
                    : "neutral"
              }
            />
            <ToolStatTile
              label="Target launch"
              value={plan.inputs.targetLaunchDate.slice(5)}
              hint={`${plan.inputs.horizonDays} days runway`}
            />
            <ToolStatTile
              label="Pending tasks"
              value={String(incompleteCount)}
              hint={`${plan.remainingHours} hrs est.`}
            />
            <ToolStatTile
              label="Bandwidth check"
              value={plan.bandwidthWarning ? "Tight" : "Healthy"}
              hint={`${plan.availableTotalHours} hrs available`}
              tone={plan.bandwidthWarning ? "warning" : "success"}
            />
          </div>

          {/* 6-Pillar Breakdown */}
          <div className="grid gap-3 rounded-xl border border-product-border-subtle bg-product-bg-inset/40 p-4 sm:grid-cols-2">
            {plan.pillars.map((pillar) => {
              const pct = Math.round((pillar.score / pillar.max) * 100);
              return (
                <div key={pillar.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-caption">
                    <span className="font-medium text-product-text-primary">{pillar.label}</span>
                    <span className="font-product-mono text-micro text-product-text-secondary tabular-nums">
                      {pillar.score}/{pillar.max}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-product-bg-surface">
                    <div
                      className="h-full rounded-full bg-product-text-primary transition-all duration-200"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* First Incomplete Critical Task CTA */}
          <ToolHandoffCta
            toolSlug="product-launch-checklist"
            entrySurface={entrySurface}
            compact={compact}
            label="Create your waitlist now"
            sublabel={`Next critical dependency: ${plan.firstIncompleteTask?.title} (due ${plan.firstIncompleteTask?.dueDate})`}
            resultBand={plan.band}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: plan.recommendedTemplateId,
              showReferrals: true,
              launchChecklist: tasksWithManual.map((t) => ({
                id: t.id,
                phase: t.phase,
                title: t.title,
                dueDate: t.dueDate,
                completed: t.completed,
              })),
              summaryBullets: [
                `Launch Readiness Score: ${plan.readinessScore}/100 (target ${plan.inputs.targetLaunchDate})`,
                `${incompleteCount} dated tasks attached to your campaign overview`,
                `First critical action: ${plan.firstIncompleteTask?.title}`,
              ],
            })}
          />

          {/* Phase-by-phase Timeline */}
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-product-display text-lg font-semibold text-product-text-primary">
                Dated critical-path timeline
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <ToolActionButton onClick={handleDownloadIcs}>Download .ics</ToolActionButton>
                <ToolActionButton onClick={handleDownloadCsv}>Export CSV</ToolActionButton>
                <ToolCopyButton text={markdown} label="Copy Markdown" />
              </div>
            </div>

            {phases.map(([phaseName, phaseTasks]) => (
              <div
                key={phaseName}
                className="overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-surface"
              >
                <div className="border-b border-product-border-subtle bg-product-bg-inset/50 px-4 py-2.5">
                  <p className="font-product-mono text-micro font-semibold text-product-text-primary">
                    {phaseName}
                  </p>
                </div>
                <ul className="divide-y divide-product-border-subtle">
                  {phaseTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskManual(task.id)}
                          className="mt-1 size-4 shrink-0 accent-product-text-primary"
                        />
                        <span
                          className={cn(
                            "text-caption font-medium",
                            task.completed
                              ? "text-product-text-muted line-through"
                              : "text-product-text-primary",
                          )}
                        >
                          {task.title}
                        </span>
                      </label>
                      <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
                        <ToolStatusBadge
                          tone={
                            task.priority === "Critical"
                              ? "warning"
                              : task.priority === "High"
                                ? "neutral"
                                : "neutral"
                          }
                        >
                          {task.priority}
                        </ToolStatusBadge>
                        <span className="font-product-mono text-micro text-product-text-secondary tabular-nums">
                          {task.dueDate}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolWorkspace>
  );
}
