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
  ToolStatStrip,
  ToolStatTile,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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

  const incompleteTasks = useMemo(
    () => tasksWithManual.filter((t) => !t.completed),
    [tasksWithManual],
  );
  const incompleteCount = incompleteTasks.length;
  const liveRemainingHours = useMemo(
    () => incompleteTasks.reduce((sum, task) => sum + (Number(task.hours) || 0), 0),
    [incompleteTasks],
  );
  const liveBandwidthWarning = liveRemainingHours > plan.availableTotalHours;
  const liveFirstIncompleteTask = incompleteTasks[0] || null;
  const liveReadinessScore = useMemo(() => {
    const basePending = plan.tasks.filter((t) => !t.completed).length;
    if (basePending === 0) return plan.readinessScore;
    const manualCompleted = Math.max(0, basePending - incompleteCount);
    if (manualCompleted === 0) return plan.readinessScore;
    const remainingHeadroom = Math.max(0, 100 - plan.readinessScore);
    return Math.min(
      100,
      plan.readinessScore + Math.round((manualCompleted / basePending) * remainingHeadroom),
    );
  }, [plan.tasks, plan.readinessScore, incompleteCount]);
  const liveBand =
    liveReadinessScore >= 75 ? "ready" : liveReadinessScore >= 45 ? "in_progress" : "early_setup";

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
      [`Waitlyze Launch Readiness Plan (Readiness Score ${liveReadinessScore}/100)`],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "product-launch-checklist",
      entry_surface: entrySurface,
      export_format: "csv",
      result_band: liveBand,
    });
  }

  return (
    <ToolWorkspace>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <ToolSelectField
            label="Category"
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
            label="Runway"
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
            <Label htmlFor="planner-target-date" className="text-caption font-medium">
              Target date
            </Label>
            <Input
              id="planner-target-date"
              type="date"
              value={inputs.targetLaunchDate || plan.inputs.targetLaunchDate}
              onChange={(event) => {
                markStarted();
                setInputs((prev) => ({ ...prev, targetLaunchDate: event.target.value }));
              }}
              className="h-10 bg-product-bg-surface px-3"
            />
          </div>

          {!compact ? (
            <ToolSliderField
              label="Weekly hours"
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

          <fieldset className="grid gap-2.5 pt-2">
            <legend className="text-caption font-medium text-product-text-primary">
              Already ready
            </legend>
            <div className="grid gap-2">
              {LAUNCH_PLANNER_OPTIONS.existingAssets.map((asset) => {
                const checked = inputs.existingAssets.includes(asset.id);
                return (
                  <label
                    key={asset.id}
                    className="flex cursor-pointer items-center gap-2.5 py-0.5 text-caption text-product-text-primary"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleAsset(asset.id)} />
                    <span>{asset.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="grid content-start gap-7">
          <ToolStatStrip>
            <ToolStatTile
              label="Readiness"
              value={`${liveReadinessScore}/100`}
              tone={
                liveBand === "ready"
                  ? "success"
                  : liveBand === "in_progress"
                    ? "warning"
                    : "neutral"
              }
            />
            <ToolStatTile
              label="Target launch"
              value={plan.inputs.targetLaunchDate.slice(5)}
              hint={`${plan.inputs.horizonDays}d runway`}
            />
            <ToolStatTile
              label="Pending"
              value={String(incompleteCount)}
              hint={`${liveRemainingHours} hrs`}
            />
            <ToolStatTile
              label="Bandwidth"
              value={liveBandwidthWarning ? "Tight" : "On track"}
              tone={liveBandwidthWarning ? "warning" : "success"}
            />
          </ToolStatStrip>

          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {plan.pillars.map((pillar) => {
              const pct = Math.round((pillar.score / pillar.max) * 100);
              return (
                <div key={pillar.id} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-product-text-primary">{pillar.label}</span>
                    <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
                      {pillar.score}/{pillar.max}
                    </span>
                  </div>
                  <Progress value={Math.max(4, pct)} />
                </div>
              );
            })}
          </div>

          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-product-display text-base font-semibold text-product-text-primary">
                Dated checklist
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <ToolActionButton onClick={handleDownloadIcs}>.ics</ToolActionButton>
                <ToolActionButton onClick={handleDownloadCsv}>CSV</ToolActionButton>
                <ToolCopyButton text={markdown} label="Copy Markdown" />
              </div>
            </div>

            {phases.map(([phaseName, phaseTasks]) => (
              <div key={phaseName} className="grid gap-2">
                <p className="font-product-mono text-micro font-medium text-product-text-secondary">
                  {phaseName}
                </p>
                <ul className="grid gap-2">
                  {phaseTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskManual(task.id)}
                          className="mt-0.5"
                        />
                        <span
                          className={cn(
                            "text-caption",
                            task.completed
                              ? "text-product-text-muted line-through"
                              : "text-product-text-primary",
                          )}
                        >
                          {task.title}
                        </span>
                      </label>
                      <div className="flex shrink-0 items-center gap-3 pl-6 font-product-mono text-micro text-product-text-muted tabular-nums sm:pl-0">
                        <span
                          className={
                            task.priority === "Critical" ? "text-product-warning-text" : ""
                          }
                        >
                          {task.priority}
                        </span>
                        <span>{task.dueDate}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <ToolHandoffCta
            toolSlug="product-launch-checklist"
            entrySurface={entrySurface}
            compact={compact}
            label="Create your waitlist now"
            sublabel={
              liveFirstIncompleteTask
                ? `Next step: ${liveFirstIncompleteTask.title} (due ${liveFirstIncompleteTask.dueDate})`
                : "All checklist items complete."
            }
            resultBand={liveBand}
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
                `Launch Readiness Score: ${liveReadinessScore}/100 (target ${plan.inputs.targetLaunchDate})`,
                `${incompleteCount} pending dated tasks (${liveRemainingHours} hrs remaining)`,
                liveFirstIncompleteTask
                  ? `First critical action: ${liveFirstIncompleteTask.title}`
                  : "All pre-launch checklist items completed",
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
