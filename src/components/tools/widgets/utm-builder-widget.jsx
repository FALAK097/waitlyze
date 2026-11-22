"use client";

import { QrCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";

import { downloadCsv, downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  buildUtmMatrix,
  generateQrResult,
  UTM_CHANNEL_PRESETS,
} from "@/lib/tools/engines/utm-builder.mjs";
import { cn } from "@/lib/utils";

export function UtmBuilderWidget({
  initialUrl = "",
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [baseUrl, setBaseUrl] = useState(initialUrl || "https://waitlyze.com/w/your-launch");
  const [campaign, setCampaign] = useState("private-beta");
  const [contentSuffix, setContentSuffix] = useState("");
  const [selectedIds, setSelectedIds] = useState([
    "producthunt",
    "hackernews",
    "x_thread",
    "linkedin",
    "event_qr",
  ]);
  const [activeQrRowId, setActiveQrRowId] = useState("event_qr");
  const startedRef = useRef(false);

  const matrix = useMemo(
    () =>
      buildUtmMatrix({
        baseUrl,
        campaign,
        contentSuffix,
        selectedChannelIds: selectedIds,
      }),
    [baseUrl, campaign, contentSuffix, selectedIds],
  );

  const activeQrRow = matrix.rows.find((r) => r.id === activeQrRowId) || matrix.rows[0] || null;
  const activeQr = useMemo(
    () => (activeQrRow ? generateQrResult(activeQrRow.url, 184) : { svg: "", error: "" }),
    [activeQrRow],
  );
  const activeQrSvg = activeQr.svg;

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-utm-builder",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
  }

  function toggleChannel(id) {
    markStarted();
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }

  function handleExportCsv() {
    downloadCsv(
      `waitlyze-utm-${matrix.campaign}.csv`,
      ["Channel", "utm_source", "utm_medium", "utm_campaign", "utm_content", "Tracking URL"],
      matrix.rows.map((r) => [r.channel, r.source, r.medium, r.campaign, r.content, r.url]),
      [`Waitlyze Launch UTM Matrix (${new Date().toISOString().slice(0, 10)})`],
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-utm-builder",
      entry_surface: entrySurface,
      export_format: "csv",
    });
  }

  function handleDownloadQrSvg() {
    if (!activeQrRow || !activeQrSvg) return;
    downloadTextFile(
      `waitlyze-qr-${activeQrRow.source}-${matrix.campaign}.svg`,
      activeQrSvg,
      "image/svg+xml;charset=utf-8;",
    );
    trackToolEvent("TOOL_RESULT_EXPORTED", {
      tool_slug: "waitlist-utm-builder",
      entry_surface: entrySurface,
      export_format: "qr_svg",
    });
  }

  const allLinksText = matrix.rows.map((r) => `${r.channel}: ${r.url}`).join("\n");

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="grid gap-4 border-b border-product-border-subtle pb-5 md:grid-cols-3">
        <ToolTextField
          label="Destination waitlist URL"
          type="url"
          inputMode="url"
          value={baseUrl}
          onChange={(v) => {
            markStarted();
            setBaseUrl(v);
          }}
          placeholder="https://waitlyze.com/w/your-launch"
        />
        <ToolTextField
          label="Campaign name (auto-normalized)"
          value={campaign}
          onChange={(v) => {
            markStarted();
            setCampaign(v);
          }}
          maxLength={64}
          placeholder="private-beta"
          hint={`Normalized: ${matrix.campaign}`}
        />
        <ToolTextField
          label="Optional variant suffix"
          value={contentSuffix}
          onChange={(v) => {
            markStarted();
            setContentSuffix(v);
          }}
          maxLength={40}
          placeholder="e.g., week-1"
        />
      </div>

      {/* Channel Presets */}
      <div className="grid gap-2">
        <p className="text-caption font-semibold text-product-text-primary">
          Select launch channels ({selectedIds.length} active)
        </p>
        <div className="flex flex-wrap gap-2">
          {UTM_CHANNEL_PRESETS.map((ch) => {
            const active = selectedIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleChannel(ch.id)}
                className={cn(
                  "min-h-9 rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors duration-150",
                  active
                    ? "border-product-text-primary bg-product-text-primary text-product-bg-page"
                    : "border-product-border-subtle bg-product-bg-surface text-product-text-secondary hover:border-product-text-secondary hover:text-product-text-primary",
                )}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hygiene Warnings */}
      {matrix.warnings.length > 0 ? (
        <div
          role="alert"
          className="grid gap-1 rounded-xl border border-product-warning-text/30 bg-product-warning-bg/60 p-4 text-caption text-product-warning-text"
        >
          {matrix.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      ) : null}

      {/* Matrix + Client-Side QR Preview */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="overflow-x-auto rounded-xl border border-product-border-subtle">
          <table className="w-full border-collapse text-left text-caption">
            <thead className="border-b border-product-border-subtle bg-product-bg-inset/60 text-micro font-semibold text-product-text-secondary">
              <tr>
                <th className="px-3.5 py-3">Channel</th>
                <th className="px-3.5 py-3">Normalized URL</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-product-border-subtle bg-product-bg-surface">
              {matrix.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3.5 py-3 align-top whitespace-nowrap">
                    <p className="font-semibold text-product-text-primary">{row.channel}</p>
                    <p className="mt-0.5 font-product-mono text-micro text-product-text-muted">
                      {row.source} / {row.medium}
                    </p>
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <p className="max-w-md font-product-mono text-micro break-all text-product-text-secondary">
                      {row.url}
                    </p>
                  </td>
                  <td className="px-3.5 py-3 text-right align-top">
                    <div className="inline-flex items-center gap-1.5">
                      <ToolCopyButton
                        text={row.url}
                        label="Copy"
                        className="min-h-8 px-2.5 text-micro"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveQrRowId(row.id)}
                        aria-label={`Show QR code for ${row.channel}`}
                        className={cn(
                          "inline-flex min-h-8 items-center gap-1 rounded-lg border px-2.5 text-micro font-medium",
                          activeQrRow?.id === row.id
                            ? "border-product-text-primary bg-product-bg-inset text-product-text-primary"
                            : "border-product-border-control bg-product-bg-surface text-product-text-secondary hover:text-product-text-primary",
                        )}
                      >
                        <HugeiconsIcon icon={QrCodeIcon} size={14} aria-hidden="true" />
                        QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pure Client-Side QR Preview */}
        {activeQrRow ? (
          <div className="flex flex-col items-center justify-between rounded-xl border border-product-border-subtle bg-product-bg-inset/40 p-4 text-center">
            <div className="w-full">
              <ToolStatusBadge tone="neutral">Client-side SVG QR</ToolStatusBadge>
              <p className="mt-2 text-caption font-semibold text-product-text-primary">
                {activeQrRow.channel}
              </p>
            </div>
            {activeQr.error ? (
              <p
                role="alert"
                className="my-3 rounded-lg border border-product-warning-text/30 bg-product-warning-bg/60 p-3 text-micro leading-relaxed text-product-warning-text"
              >
                {activeQr.error}
              </p>
            ) : (
              <div
                className="my-3 overflow-hidden rounded-lg border border-product-border-subtle bg-white p-2"
                dangerouslySetInnerHTML={{ __html: activeQrSvg }}
              />
            )}
            <ToolActionButton
              onClick={handleDownloadQrSvg}
              disabled={!activeQrSvg}
              className="w-full"
            >
              Download QR (.svg)
            </ToolActionButton>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToolCopyButton text={allLinksText} label="Copy all links" />
        <ToolActionButton onClick={handleExportCsv}>Export bulk CSV</ToolActionButton>
      </div>

      <ToolHandoffCta
        toolSlug="waitlist-utm-builder"
        entrySurface={entrySurface}
        compact={compact}
        label="Track these launch channels in Waitlyze"
        onApplyInProduct={onApplyInProduct}
        buildBlueprint={() => ({
          templateId: "simple",
          suggestedSlug: matrix.detectedSlug,
          showReferrals: true,
          utmPlan: {
            campaign: matrix.campaign,
            channels: matrix.rows.map((r) => ({
              channel: r.channel,
              source: r.source,
              medium: r.medium,
              content: r.content,
            })),
          },
          summaryBullets: [
            `Campaign UTM tag: ${matrix.campaign}`,
            `${matrix.rows.length} normalized launch channels attached for attribution tracking`,
            `First-touch UTM analytics enabled automatically on your hosted page`,
          ],
        })}
      />
    </ToolWorkspace>
  );
}
