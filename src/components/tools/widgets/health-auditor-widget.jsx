"use client";

import Papa from "papaparse";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { downloadCsv } from "@/components/tools/tool-export-utils";
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
  auditManualMetrics,
  auditParsedRows,
  SAMPLE_WAITLIST_CSV,
} from "@/lib/tools/engines/health-auditor.mjs";

function parseSampleCsv() {
  const parsed = Papa.parse(SAMPLE_WAITLIST_CSV, { header: true, skipEmptyLines: true });
  return auditParsedRows(parsed.data);
}

export function HealthAuditorWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [mode, setMode] = useState("csv");
  const [fileName, setFileName] = useState("sample-waitlist-25-rows.csv");
  const [csvAudit, setCsvAudit] = useState(() => parseSampleCsv());
  const [manualInputs, setManualInputs] = useState({
    totalSubscribers: 1500,
    verifiedPct: 68,
    disposableEstimatePct: 6,
    duplicateEstimatePct: 5,
    averageAgeDays: 45,
  });
  const fileInputRef = useRef(null);

  const manualAudit = useMemo(() => auditManualMetrics(manualInputs), [manualInputs]);
  const activeAudit = mode === "csv" ? csvAudit : manualAudit;

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Please choose a CSV file under 15 MB.");
      return;
    }

    trackToolEvent("TOOL_STARTED", {
      tool_slug: "waitlist-health-check",
      tool_version: "1.0",
      entry_surface: entrySurface,
    });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const audited = auditParsedRows(results.data);
        if (!audited) {
          toast.error("No rows detected. Make sure your CSV includes an email column header.");
          return;
        }
        setFileName(file.name);
        setCsvAudit(audited);
        toast.success(`Audited ${audited.totalRows.toLocaleString()} rows locally in browser`);
        trackToolEvent("TOOL_COMPLETED", {
          tool_slug: "waitlist-health-check",
          tool_version: "1.0",
          entry_surface: entrySurface,
          result_band: audited.band,
        });
      },
      error: () => {
        toast.error("Could not parse that CSV file locally.");
      },
    });
  }

  function handleDownloadCleanedCsv() {
    if (!csvAudit?.cleanRows?.length) return;
    downloadCsv(
      "waitlyze-cleaned-waitlist.csv",
      ["email", "created_at", "verified"],
      csvAudit.cleanRows.map((r) => [r.email, r.created_at, r.verified]),
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-health-check",
      entry_surface: entrySurface,
      export_format: "cleaned_csv",
    });
  }

  function handleDownloadTaggedCsv() {
    if (!csvAudit) return;
    const combined = [...csvAudit.cleanRows, ...csvAudit.flaggedRows];
    downloadCsv(
      "waitlyze-tagged-audit.csv",
      ["email", "created_at", "verified", "audit_status", "audit_reason"],
      combined.map((r) => [r.email, r.created_at, r.verified, r.audit_status, r.audit_reason]),
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-health-check",
      entry_surface: entrySurface,
      export_format: "tagged_csv",
    });
  }

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-product-success-text/20 bg-product-success-bg/50 px-4 py-3 text-caption text-product-success-text">
        <span>
          <strong>Zero-upload privacy guarantee:</strong> CSV parsing, normalization, and cleaning
          run 100% locally inside your browser. Zero email addresses leave your device.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-product-border-subtle pb-4">
        <ToolSegmentedControl
          label="Audit input mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "csv", label: "Audit CSV (Local Browser)" },
            { value: "manual", label: "Manual Aggregate Metrics" },
          ]}
        />
        {mode === "csv" ? (
          <button
            type="button"
            onClick={() => {
              setFileName("sample-waitlist-25-rows.csv");
              setCsvAudit(parseSampleCsv());
            }}
            className="text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
          >
            Load sample CSV (25 rows)
          </button>
        ) : null}
      </div>

      {mode === "csv" ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-product-border-control bg-product-bg-inset/40 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-body font-semibold text-product-text-primary">
              Select a subscriber CSV file
            </p>
            <p className="mt-1 text-caption text-product-text-secondary">
              Active file:{" "}
              <span className="font-product-mono text-product-text-primary">{fileName}</span>{" "}
              (recognizes <code className="font-product-mono">email</code>,{" "}
              <code className="font-product-mono">created_at</code>,{" "}
              <code className="font-product-mono">verified</code>,{" "}
              <code className="font-product-mono">referred_by</code>)
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
              id="health-csv-upload"
            />
            <label
              htmlFor="health-csv-upload"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-product-text-primary bg-product-bg-surface px-4 py-2 text-caption font-semibold text-product-text-primary hover:bg-product-bg-inset"
            >
              Choose local CSV
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolSliderField
            label="Total subscribers"
            value={manualInputs.totalSubscribers}
            onChange={(v) => setManualInputs((p) => ({ ...p, totalSubscribers: v }))}
            min={50}
            max={100000}
            step={50}
            inputMode="numeric"
          />
          <ToolSliderField
            label="Verified rate"
            value={manualInputs.verifiedPct}
            onChange={(v) => setManualInputs((p) => ({ ...p, verifiedPct: v }))}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Estimated disposable domains"
            value={manualInputs.disposableEstimatePct}
            onChange={(v) => setManualInputs((p) => ({ ...p, disposableEstimatePct: v }))}
            min={0}
            max={40}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Estimated alias duplicates"
            value={manualInputs.duplicateEstimatePct}
            onChange={(v) => setManualInputs((p) => ({ ...p, duplicateEstimatePct: v }))}
            min={0}
            max={35}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Average list age"
            value={manualInputs.averageAgeDays}
            onChange={(v) => setManualInputs((p) => ({ ...p, averageAgeDays: v }))}
            min={1}
            max={240}
            step={5}
            suffix="days"
            inputMode="numeric"
          />
        </div>
      )}

      {activeAudit ? (
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ToolStatTile
              label="Waitlist Health Score"
              value={`${activeAudit.score}/100`}
              hint={`Grade ${activeAudit.grade}`}
              tone={
                activeAudit.band === "clean"
                  ? "success"
                  : activeAudit.band === "moderate"
                    ? "warning"
                    : "danger"
              }
            />
            <ToolStatTile
              label="Clean deliverable"
              value={`${activeAudit.cleanPct}%`}
              hint={`${activeAudit.cleanCount.toLocaleString()} of ${activeAudit.totalRows.toLocaleString()}`}
              tone="success"
            />
            <ToolStatTile
              label="Disposable domains"
              value={String(activeAudit.disposableCount)}
              hint="Burner inboxes"
              tone={activeAudit.disposableCount > 0 ? "warning" : "neutral"}
            />
            <ToolStatTile
              label="Alias & burst flags"
              value={String(activeAudit.duplicateAliasCount + activeAudit.velocityBurstCount)}
              hint="Self-referral / velocity"
              tone={
                activeAudit.duplicateAliasCount + activeAudit.velocityBurstCount > 0
                  ? "danger"
                  : "neutral"
              }
            />
          </div>

          {/* Clean vs Risky proportion bar */}
          <div className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-4">
            <div className="flex items-center justify-between text-caption">
              <span className="font-semibold text-product-text-primary">
                List hygiene breakdown
              </span>
              <span className="font-product-mono text-micro text-product-text-secondary tabular-nums">
                {activeAudit.cleanCount.toLocaleString()} clean ·{" "}
                {activeAudit.flaggedCount.toLocaleString()} flagged
              </span>
            </div>
            <div className="mt-2.5 flex h-3 overflow-hidden rounded-full bg-product-bg-inset">
              <div
                className="h-full bg-product-text-primary"
                style={{ width: `${activeAudit.cleanPct}%` }}
              />
              <div
                className="h-full bg-product-danger-text/75"
                style={{ width: `${Math.max(0, 100 - activeAudit.cleanPct)}%` }}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption font-semibold text-product-text-primary">
                Recommended anti-fraud posture
              </p>
              <ToolStatusBadge tone={activeAudit.score < 85 ? "warning" : "success"}>
                {activeAudit.score < 85
                  ? "STRICT fraud mode recommended"
                  : "STANDARD mode sufficient"}
              </ToolStatusBadge>
            </div>
            <ul className="mt-2.5 grid list-disc gap-1.5 pl-4 text-caption text-product-text-secondary">
              {activeAudit.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
          </div>

          {mode === "csv" && activeAudit.cleanRows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <ToolActionButton onClick={handleDownloadCleanedCsv}>
                Download Cleaned CSV ({activeAudit.cleanCount} rows)
              </ToolActionButton>
              <ToolActionButton onClick={handleDownloadTaggedCsv}>
                Download Full Tagged Audit CSV
              </ToolActionButton>
            </div>
          ) : null}

          <ToolHandoffCta
            toolSlug="waitlist-health-check"
            entrySurface={entrySurface}
            compact={compact}
            label="Migrate cleaned audience into Waitlyze"
            resultBand={activeAudit.band}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: "saas",
              showReferrals: true,
              fraudMode: activeAudit.score < 85 ? "STRICT" : "STANDARD",
              formFields: { doubleOptIn: true },
              auditSummary: {
                score: activeAudit.score,
                grade: activeAudit.grade,
                topFixes: activeAudit.recommendations.slice(0, 3),
              },
              summaryBullets: [
                `List Health Score: ${activeAudit.score}/100 (${activeAudit.cleanPct}% clean deliverable)`,
                `Double opt-in email verification + ${activeAudit.score < 85 ? "STRICT" : "STANDARD"} fraud velocity limits pre-enabled`,
                `Zero raw subscriber emails transmitted during free audit`,
              ],
            })}
          />
        </div>
      ) : null}
    </ToolWorkspace>
  );
}
