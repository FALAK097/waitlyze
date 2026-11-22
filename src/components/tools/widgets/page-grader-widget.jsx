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
  ToolStatTile,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
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
      subtitle: `${result.auditedHost} · Top fix: ${result.topFixes[0]?.label || " fundamentals strong"}`,
      metrics: result.pillars.slice(0, 4).map((p) => ({
        label: p.name.split("&")[0].trim(),
        value: `${p.earned}/${p.maxPoints}`,
        hint: `${p.pct}% score`,
      })),
      formula:
        "6-Pillar HTML & Copy Rubric · Value Prop + CTA + Form + Waitlist + SEO/AEO + Mobile",
    });
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-landing-page-grader",
      entry_surface: entrySurface,
      export_format: "png",
      result_band: result.band,
    });
  }

  return (
    <ToolWorkspace className="grid gap-6">
      {/* Input Form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runAudit();
        }}
        className="grid gap-4 border-b border-product-border-subtle pb-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToolSegmentedControl
            label="Audit source"
            value={mode}
            onChange={(val) => {
              setMode(val);
              setError("");
            }}
            options={[
              { value: "url", label: "Audit live HTTPS URL" },
              { value: "html", label: "Paste HTML / Page copy" },
            ]}
          />
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
          >
            Load sample audit
          </button>
        </div>

        {mode === "url" ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <ToolTextField
              label="Public waitlist URL"
              type="url"
              inputMode="url"
              value={url}
              onChange={setUrl}
              placeholder="https://yourproduct.com/waitlist"
              error={error}
              hint="HTTPS only. Static HTML fetch with SSRF guards; zero raw HTML stored."
            />
            <button
              type="submit"
              disabled={busy || !url.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-product-text-primary bg-product-accent-solid px-5 py-2.5 text-body font-semibold text-product-accent-label transition-colors duration-150 hover:bg-product-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
                  <span>Grading…</span>
                </>
              ) : (
                <span>Grade waitlist page</span>
              )}
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <label
              htmlFor="grader-html-input"
              className="text-caption font-semibold text-product-text-primary"
            >
              Paste HTML or plain landing page copy
            </label>
            <textarea
              id="grader-html-input"
              rows={6}
              value={pastedHtml}
              onChange={(event) => setPastedHtml(event.target.value)}
              placeholder="Paste your waitlist page HTML or hero headline, subheadline, and CTA text..."
              className="w-full rounded-lg border border-product-border-control bg-product-bg-surface p-3.5 font-product-mono text-caption text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus"
            />
            {error ? (
              <p role="alert" className="text-caption text-product-danger-text">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy || pastedHtml.trim().length < 20}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-product-text-primary bg-product-accent-solid px-5 py-2.5 text-body font-semibold text-product-accent-label hover:bg-product-accent-hover disabled:opacity-60"
              >
                {busy ? "Grading…" : "Grade pasted copy"}
              </button>
            </div>
          </div>
        )}

        {!compact ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ToolSelectField
              label="Launch type (context)"
              value={launchType}
              onChange={setLaunchType}
              options={LAUNCH_TYPE_OPTIONS}
            />
            <ToolSelectField
              label="Primary conversion goal"
              value={goal}
              onChange={setGoal}
              options={GOAL_OPTIONS}
            />
          </div>
        ) : null}
      </form>

      {/* Results */}
      {result ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <ToolStatusBadge
                tone={
                  result.band === "strong"
                    ? "success"
                    : result.band === "workable"
                      ? "warning"
                      : "danger"
                }
              >
                {isSample ? "Sample audit preview" : `Audited: ${result.auditedHost}`}
              </ToolStatusBadge>
              <span className="font-product-mono text-micro text-product-text-secondary">
                {result.extractedSignals.visibleInputCount} inputs ·{" "}
                {result.extractedSignals.wordCount} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ToolActionButton onClick={handleExportPng}>Export PNG</ToolActionButton>
              <ToolActionButton onClick={() => downloadJson("waitlyze-page-audit.json", result)}>
                Export JSON
              </ToolActionButton>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ToolStatTile
              label="Overall score"
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
            <ToolStatTile
              label="Top fixes found"
              value={String(result.topFixes.length)}
              hint="Ordered by point impact"
            />
            <ToolStatTile
              label="Form fields"
              value={String(result.extractedSignals.visibleInputCount)}
              hint="Ideal: 1–2 above fold"
            />
            <ToolStatTile
              label="Recommended template"
              value={TEMPLATE_LABELS[result.recommendedTemplateId] || result.recommendedTemplateId}
              hint="Ready for blueprint"
            />
          </div>

          {/* Top 3 Highest-Impact Fixes */}
          {result.topFixes.length > 0 ? (
            <div className="rounded-xl border border-product-warning-text/25 bg-product-warning-bg/45 p-5">
              <h3 className="font-product-display text-body font-semibold text-product-text-primary">
                Top {result.topFixes.length} highest-impact fixes
              </h3>
              <ol className="mt-3 grid gap-3">
                {result.topFixes.map((fix, idx) => (
                  <li
                    key={fix.id}
                    className="rounded-lg border border-product-border-subtle bg-product-bg-surface p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-caption font-semibold text-product-text-primary">
                        {idx + 1}. {fix.label}
                      </span>
                      <ToolStatusBadge tone="warning">
                        +{fix.potentialGain} pts potential
                      </ToolStatusBadge>
                    </div>
                    <p className="mt-1 text-caption text-product-text-secondary">{fix.fix}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* 6-Pillar Breakdown */}
          <div className="grid gap-3 md:grid-cols-2">
            {result.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-caption font-semibold text-product-text-primary">
                    {pillar.name}
                  </p>
                  <span className="font-product-mono text-caption font-semibold text-product-text-primary tabular-nums">
                    {pillar.earned}/{pillar.maxPoints}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-product-bg-inset">
                  <div
                    className="h-full rounded-full bg-product-text-primary"
                    style={{ width: `${Math.max(4, pillar.pct)}%` }}
                  />
                </div>
                <ul className="mt-3 grid gap-2">
                  {pillar.checks.map((check) => (
                    <li key={check.id} className="grid gap-0.5 text-micro">
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
                      <p className="text-product-text-secondary">{check.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Proposed Rewritten Copy */}
          <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-product-display text-body font-semibold text-product-text-primary">
                Proposed corrected Hero & CTA copy
              </h3>
              <ToolCopyButton
                text={[
                  result.rewrittenCopy.heading,
                  result.rewrittenCopy.subheadline,
                  `CTA: ${result.rewrittenCopy.buttonText}`,
                  result.rewrittenCopy.privacyNote
                    ? `Note: ${result.rewrittenCopy.privacyNote}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                label="Copy rewrite"
              />
            </div>
            <p className="mt-3 font-product-display text-xl font-semibold text-product-text-primary">
              {result.rewrittenCopy.heading}
            </p>
            <p className="mt-1.5 text-body text-product-text-secondary">
              {result.rewrittenCopy.subheadline}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-caption">
              <span className="rounded-md bg-product-accent-solid px-3 py-1 font-semibold text-product-accent-label">
                {result.rewrittenCopy.buttonText}
              </span>
              {result.rewrittenCopy.privacyNote ? (
                <span className="text-micro text-product-text-secondary">
                  {result.rewrittenCopy.privacyNote}
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-micro text-product-text-secondary">{result.disclaimer}</p>

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
