"use client";

import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { downloadJson, downloadSummaryPng } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatStrip,
  ToolStatTile,
  ToolStatusBadge,
  ToolTextareaField,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  GOAL_OPTIONS,
  gradeWaitlistHtml,
  LAUNCH_TYPE_OPTIONS,
  SAMPLE_AUDIT_HTML,
} from "@/lib/tools/engines/page-grader.mjs";

const TEMPLATE_LABELS = Object.freeze({
  simple: "Simple form",
  saas: "SaaS beta",
  ai: "AI product",
  mobile: "Mobile app",
  creator: "Creator",
  community: "Community",
  event: "Event",
  commerce: "Pre-order",
  developer: "Developer tool",
  podcast: "Podcast",
  restaurant: "Restaurant",
  fitness: "Fitness",
  agency: "Agency",
  gaming: "Gaming",
});

export function PageGraderWidget({
  initialUrl = "",
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
  onAuditComplete = null,
}) {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState(initialUrl);
  const [pastedHtml, setPastedHtml] = useState("");
  const [launchType, setLaunchType] = useState("saas");
  const [goal, setGoal] = useState("signups");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(() =>
    initialUrl
      ? null
      : gradeWaitlistHtml({
          html: SAMPLE_AUDIT_HTML,
          launchType: "saas",
          goal: "signups",
        }),
  );
  const [isSample, setIsSample] = useState(!initialUrl);

  async function runAudit(overrideUrl = null) {
    const targetUrl = overrideUrl ?? url;
    if (busy) return;
    setError("");
    setBusy(true);
    trackToolEvent("TOOL_STARTED", {
      tool_slug: "waitlist-landing-page-grader",
      tool_version: "1.0",
      entry_surface: entrySurface,
    });

    try {
      const payload =
        mode === "html" && !overrideUrl
          ? { mode: "html", html: pastedHtml, launchType, goal }
          : { mode: "url", url: targetUrl, launchType, goal };

      const response = await fetch("/api/tools/grade-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Could not grade that page.");
      }

      setResult(data.result);
      setIsSample(false);
      onAuditComplete?.(data.result);
      trackToolEvent(overrideUrl ? "TOOL_RECHECK_COMPLETED" : "TOOL_COMPLETED", {
        tool_slug: "waitlist-landing-page-grader",
        tool_version: "1.0",
        entry_surface: entrySurface,
        result_band: data.result.band,
      });
    } catch (err) {
      setError(err?.message || "Could not complete the audit. Try pasting your page copy instead.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  function handleLoadSample() {
    setError("");
    setIsSample(true);
    setResult(
      gradeWaitlistHtml({
        html: SAMPLE_AUDIT_HTML,
        launchType,
        goal,
      }),
    );
  }

  function handleExportPng() {
    if (!result) return;
    downloadSummaryPng({
      filename: "waitlyze-page-audit.png",
      title: `Waitlist Page Audit: ${result.score}/100 (${result.grade})`,
      subtitle: `${result.auditedHost} · Top fix: ${result.topFixes[0]?.label || "fundamentals strong"}`,
      metrics: result.pillars.slice(0, 4).map((p) => ({
        label: p.name.split("&")[0].trim(),
        value: `${p.earned}/${p.maxPoints}`,
        hint: `${p.pct}% score`,
      })),
      formula: "6-Pillar HTML & Copy Rubric",
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-landing-page-grader",
      entry_surface: entrySurface,
      export_format: "png",
      result_band: result.band,
    });
  }

  return (
    <ToolWorkspace>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runAudit();
        }}
        className="grid gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToolSegmentedControl
            value={mode}
            onChange={(val) => {
              setMode(val);
              setError("");
            }}
            options={[
              { value: "url", label: "Live URL" },
              { value: "html", label: "Paste HTML / copy" },
            ]}
          />
          <Button type="button" variant="product-inline-link" size="sm" onClick={handleLoadSample}>
            Load sample
          </Button>
        </div>

        {mode === "url" ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <ToolTextField
              label="Waitlist URL"
              type="url"
              inputMode="url"
              value={url}
              onChange={setUrl}
              placeholder="https://yourproduct.com/waitlist"
              error={error}
            />
            <Button
              type="submit"
              variant="product-accent"
              size="md"
              disabled={busy || !url.trim()}
              className="h-10 px-5 font-semibold"
            >
              {busy ? (
                <>
                  <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
                  <span>Grading…</span>
                </>
              ) : (
                <span>Grade page</span>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <ToolTextareaField
              label="HTML or page copy"
              rows={5}
              mono
              value={pastedHtml}
              onChange={setPastedHtml}
              placeholder="Paste your waitlist HTML or hero headline, subheadline, and CTA..."
              error={error}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="product-accent"
                size="md"
                disabled={busy || pastedHtml.trim().length < 20}
                className="h-10 px-5 font-semibold"
              >
                {busy ? "Grading…" : "Grade copy"}
              </Button>
            </div>
          </div>
        )}

        {!compact ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ToolSelectField
              label="Launch type"
              value={launchType}
              onChange={setLaunchType}
              options={LAUNCH_TYPE_OPTIONS}
            />
            <ToolSelectField
              label="Primary goal"
              value={goal}
              onChange={setGoal}
              options={GOAL_OPTIONS}
            />
          </div>
        ) : null}
      </form>

      {result ? (
        <div className="grid gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToolStatusBadge
              tone={
                result.band === "strong"
                  ? "success"
                  : result.band === "workable"
                    ? "warning"
                    : "danger"
              }
            >
              {isSample ? "Sample audit" : result.auditedHost}
            </ToolStatusBadge>
            <div className="flex items-center gap-2">
              <ToolActionButton onClick={handleExportPng}>PNG</ToolActionButton>
              <ToolActionButton onClick={() => downloadJson("waitlyze-page-audit.json", result)}>
                JSON
              </ToolActionButton>
            </div>
          </div>

          <ToolStatStrip>
            <ToolStatTile
              label="Score"
              value={`${result.score}/100`}
              hint={`Grade ${result.grade}`}
              tone={
                result.band === "strong"
                  ? "success"
                  : result.band === "workable"
                    ? "warning"
                    : "danger"
              }
            />
            <ToolStatTile label="Top fixes" value={String(result.topFixes.length)} />
            <ToolStatTile
              label="Form fields"
              value={String(result.extractedSignals.visibleInputCount)}
            />
            <ToolStatTile
              label="Suggested layout"
              value={TEMPLATE_LABELS[result.recommendedTemplateId] || result.recommendedTemplateId}
            />
          </ToolStatStrip>

          {result.topFixes.length > 0 ? (
            <div className="grid gap-3">
              <h3 className="font-product-display text-base font-semibold text-product-text-primary">
                Highest-impact fixes
              </h3>
              <ol className="grid gap-3">
                {result.topFixes.map((fix, idx) => (
                  <li key={fix.id} className="grid gap-1 py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-body font-medium text-product-text-primary">
                        {idx + 1}. {fix.label}
                      </span>
                      <span className="font-product-mono text-caption text-product-warning-text tabular-nums">
                        +{fix.potentialGain} pts
                      </span>
                    </div>
                    <p className="text-caption text-product-text-secondary">{fix.fix}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {result.pillars.map((pillar) => (
              <div key={pillar.id} className="grid content-start gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-body font-semibold text-product-text-primary">{pillar.name}</p>
                  <span className="font-product-mono text-caption text-product-text-secondary tabular-nums">
                    {pillar.earned}/{pillar.maxPoints}
                  </span>
                </div>
                <Progress value={Math.max(4, pillar.pct)} />
                <ul className="grid gap-2">
                  {pillar.checks.map((check) => (
                    <li key={check.id} className="grid gap-0.5 py-2.5 text-caption">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-product-text-primary">{check.label}</span>
                        <ToolStatusBadge
                          tone={
                            check.status === "pass"
                              ? "success"
                              : check.status === "warn"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {check.status === "pass"
                            ? "Pass"
                            : check.status === "warn"
                              ? "Warn"
                              : "Fix"}
                        </ToolStatusBadge>
                      </div>
                      <p className="text-micro text-product-text-secondary">{check.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid gap-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-product-display text-base font-semibold text-product-text-primary">
                Suggested rewrite
              </h3>
              <ToolCopyButton
                text={[
                  result.rewrittenCopy.heading,
                  result.rewrittenCopy.subheadline,
                  `CTA: ${result.rewrittenCopy.buttonText}`,
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                label="Copy rewrite"
              />
            </div>
            <div>
              <p className="font-product-display text-xl font-semibold text-product-text-primary">
                {result.rewrittenCopy.heading}
              </p>
              <p className="mt-1 text-body text-product-text-secondary">
                {result.rewrittenCopy.subheadline}
              </p>
              <p className="mt-2 font-product-mono text-caption text-product-text-primary">
                CTA: {result.rewrittenCopy.buttonText}
              </p>
            </div>
          </div>

          <ToolHandoffCta
            toolSlug="waitlist-landing-page-grader"
            entrySurface={entrySurface}
            compact={compact}
            label="Build the corrected version in Waitlyze"
            resultBand={result.band}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: result.recommendedTemplateId,
              showReferrals: true,
              formFields: {
                doubleOptIn: true,
                buttonText: result.rewrittenCopy.buttonText,
              },
              heroCopy: {
                eyebrow: result.rewrittenCopy.eyebrow,
                heading: result.rewrittenCopy.heading,
                body: result.rewrittenCopy.subheadline,
                buttonText: result.rewrittenCopy.buttonText,
              },
              auditSummary: {
                score: result.score,
                grade: result.grade.slice(0, 8),
                topFixes: result.topFixes.map((f) => f.fix.slice(0, 190)),
              },
              summaryBullets: [
                `Audit score: ${result.score}/100 (Grade ${result.grade})`,
                `Rewritten Hero headline & outcome-focused CTA applied to draft`,
                `Low-friction email form + double opt-in & referral sharing enabled`,
              ],
            })}
          />
        </div>
      ) : null}
    </ToolWorkspace>
  );
}
