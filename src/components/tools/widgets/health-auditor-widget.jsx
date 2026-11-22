"use client";

import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Papa from "papaparse";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { downloadCsv } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolSegmentedControl,
  ToolSliderField,
  ToolStatStrip,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
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
        toast.success(`Audited ${audited.totalRows.toLocaleString()} rows locally`);
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
      csvAudit.exportColumns,
      csvAudit.cleanRows.map((row) => csvAudit.exportColumns.map((column) => row[column] ?? "")),
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
      [...csvAudit.exportColumns, "audit_status", "audit_reason"],
      combined.map((row) => [
        ...csvAudit.exportColumns.map((column) => row[column] ?? ""),
        row.audit_status,
        row.audit_reason,
      ]),
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-health-check",
      entry_surface: entrySurface,
      export_format: "tagged_csv",
    });
  }

  return (
    <ToolWorkspace>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToolSegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "csv", label: "CSV file (local)" },
            { value: "manual", label: "Manual metrics" },
          ]}
        />
        {mode === "csv" ? (
          <Button
            type="button"
            variant="product-inline-link"
            size="sm"
            onClick={() => {
              setFileName("sample-waitlist-25-rows.csv");
              setCsvAudit(parseSampleCsv());
            }}
          >
            Load sample CSV
          </Button>
        ) : null}
      </div>

      {mode === "csv" ? (
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-body font-medium text-product-text-primary">{fileName}</p>
            <p className="mt-0.5 text-caption text-product-text-secondary">
              Runs locally in your browser. Zero emails leave your device.
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
            <Button
              type="button"
              variant="product-outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <HugeiconsIcon icon={Upload01Icon} size={16} aria-hidden="true" />
              <span>Choose CSV</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            label="Disposable domains"
            value={manualInputs.disposableEstimatePct}
            onChange={(v) => setManualInputs((p) => ({ ...p, disposableEstimatePct: v }))}
            min={0}
            max={40}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Alias duplicates"
            value={manualInputs.duplicateEstimatePct}
            onChange={(v) => setManualInputs((p) => ({ ...p, duplicateEstimatePct: v }))}
            min={0}
            max={35}
            step={1}
            suffix="%"
          />
          <ToolSliderField
            label="Average age"
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
        <div className="grid gap-7">
          <ToolStatStrip>
            <ToolStatTile
              label="Health score"
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
              label="Clean"
              value={`${activeAudit.cleanPct}%`}
              hint={`${activeAudit.cleanCount.toLocaleString()} of ${activeAudit.totalRows.toLocaleString()}`}
              tone="success"
            />
            <ToolStatTile
              label="Disposable"
              value={String(activeAudit.disposableCount)}
              tone={activeAudit.disposableCount > 0 ? "warning" : "neutral"}
            />
            <ToolStatTile
              label="Alias & burst"
              value={String(activeAudit.duplicateAliasCount + activeAudit.velocityBurstCount)}
              tone={
                activeAudit.duplicateAliasCount + activeAudit.velocityBurstCount > 0
                  ? "danger"
                  : "neutral"
              }
            />
          </ToolStatStrip>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-caption">
              <span className="font-medium text-product-text-primary">Hygiene split</span>
              <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
                {activeAudit.cleanCount.toLocaleString()} clean /{" "}
                {activeAudit.flaggedCount.toLocaleString()} flagged
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-product-bg-inset">
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

          <div className="grid gap-2">
            <ToolStatusBadge tone={activeAudit.score < 85 ? "warning" : "success"}>
              {activeAudit.score < 85
                ? "Strict fraud mode recommended"
                : "Standard mode sufficient"}
            </ToolStatusBadge>
            <ul className="grid list-disc gap-1 pl-4 text-caption text-product-text-secondary">
              {activeAudit.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
          </div>

          {mode === "csv" ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeAudit.cleanRows.length > 0 ? (
                <ToolActionButton onClick={handleDownloadCleanedCsv}>
                  Cleaned CSV ({activeAudit.cleanCount})
                </ToolActionButton>
              ) : null}
              <ToolActionButton onClick={handleDownloadTaggedCsv}>Full tagged CSV</ToolActionButton>
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
