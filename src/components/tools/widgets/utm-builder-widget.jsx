"use client";

import {
  CodeIcon,
  Mail01Icon,
  QrCodeIcon,
  Rocket01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { downloadCsv, downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  buildUtmMatrix,
  generateQrResult,
  UTM_CHANNEL_PRESETS,
} from "@/lib/tools/engines/utm-builder.mjs";
import { cn } from "@/lib/utils";

const CHANNEL_PRESENTATION = {
  producthunt: {
    logoSrc: "/assets/icons/product-hunt.svg",
    label: "Product Hunt",
  },
  hackernews: { icon: CodeIcon, label: "Show HN", iconClass: "text-[#ff6600]" },
  x_thread: { logoSrc: "/assets/icons/x.svg", logoOnDark: true, label: "X launch" },
  x_bio: { logoSrc: "/assets/icons/x.svg", logoOnDark: true, label: "X bio" },
  linkedin: { logoSrc: "/assets/icons/linkedin.svg", label: "LinkedIn" },
  reddit: { logoSrc: "/assets/icons/reddit.svg", label: "Reddit" },
  newsletter: { icon: Mail01Icon, label: "Newsletter", iconClass: "text-product-text-secondary" },
  partner: {
    icon: UserMultiple02Icon,
    label: "Partner",
    iconClass: "text-product-text-secondary",
  },
  event_qr: { icon: QrCodeIcon, label: "Event QR", iconClass: "text-product-text-secondary" },
};

function ChannelIcon({ presentation }) {
  if (presentation.logoSrc) {
    const logo = (
      <Image
        src={presentation.logoSrc}
        alt=""
        width={16}
        height={16}
        aria-hidden="true"
        className={cn("size-4 shrink-0 object-contain", presentation.logoOnDark && "size-3")}
      />
    );

    return presentation.logoOnDark ? (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-black"
      >
        {logo}
      </span>
    ) : (
      logo
    );
  }

  return (
    <HugeiconsIcon
      icon={presentation.icon}
      size={16}
      aria-hidden="true"
      className={presentation.iconClass}
    />
  );
}

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
    <ToolWorkspace>
      <div className="grid gap-4 md:grid-cols-3">
        <ToolTextField
          label="Destination URL"
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
          label="Campaign"
          value={campaign}
          onChange={(v) => {
            markStarted();
            setCampaign(v);
          }}
          maxLength={64}
          placeholder="private-beta"
        />
        <ToolTextField
          label="Variant suffix"
          value={contentSuffix}
          onChange={(v) => {
            markStarted();
            setContentSuffix(v);
          }}
          maxLength={40}
          placeholder="week-1"
        />
      </div>

      <div className="grid gap-2.5">
        <p className="text-caption font-medium text-product-text-primary">Channels</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {UTM_CHANNEL_PRESETS.map((ch) => {
            const active = selectedIds.includes(ch.id);
            const presentation = CHANNEL_PRESENTATION[ch.id] ?? {
              icon: Rocket01Icon,
              label: ch.label,
              iconClass: "text-product-text-secondary",
            };
            return (
              <Toggle
                key={ch.id}
                size="sm"
                pressed={active}
                onPressedChange={() => toggleChannel(ch.id)}
                aria-label={ch.label}
                className={cn(
                  "h-auto min-h-11 min-w-0 justify-start gap-2 rounded-lg px-3 py-2 text-left text-caption whitespace-normal",
                  active
                    ? "bg-product-bg-inset text-product-text-primary aria-pressed:bg-product-bg-inset"
                    : "text-product-text-secondary hover:bg-product-bg-inset/60",
                )}
              >
                <ChannelIcon presentation={presentation} />
                <span className="min-w-0 leading-tight">{presentation.label}</span>
              </Toggle>
            );
          })}
        </div>
      </div>

      {matrix.warnings.length > 0 ? (
        <div role="alert" className="grid gap-1 text-caption text-product-warning-text">
          {matrix.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <Table scrollLabel="Generated UTM tracking links">
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-b-0">
              <TableHead>Channel</TableHead>
              <TableHead>Tracking URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.rows.map((row) => (
              <TableRow key={row.id} className="border-b-0">
                <TableCell className="align-top">
                  <p className="font-medium text-product-text-primary">{row.channel}</p>
                  <p className="font-product-mono text-micro text-product-text-muted">
                    {row.source} / {row.medium}
                  </p>
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <p className="max-w-md font-product-mono text-micro break-all text-product-text-secondary">
                    {row.url}
                  </p>
                </TableCell>
                <TableCell className="text-right align-top">
                  <div className="inline-flex items-center gap-1.5">
                    <ToolCopyButton text={row.url} label="Copy" className="h-8 px-2.5 text-micro" />
                    <Button
                      type="button"
                      variant={activeQrRow?.id === row.id ? "secondary" : "product-outline"}
                      size="xs"
                      onClick={() => setActiveQrRowId(row.id)}
                      aria-label={`Show QR code for ${row.channel}`}
                      className="h-8 gap-1 px-2.5"
                    >
                      <HugeiconsIcon icon={QrCodeIcon} size={14} aria-hidden="true" />
                      QR
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {activeQrRow ? (
          <div className="flex flex-col items-center justify-between gap-3 pt-2 text-center lg:pt-0 lg:pl-6">
            <p className="text-caption font-medium text-product-text-primary">
              {activeQrRow.channel}
            </p>
            {activeQr.error ? (
              <p role="alert" className="text-micro text-product-warning-text">
                {activeQr.error}
              </p>
            ) : (
              <div className="bg-white p-1" dangerouslySetInnerHTML={{ __html: activeQrSvg }} />
            )}
            <ToolActionButton
              onClick={handleDownloadQrSvg}
              disabled={!activeQrSvg}
              className="w-full"
            >
              Download SVG
            </ToolActionButton>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToolCopyButton text={allLinksText} label="Copy all links" />
        <ToolActionButton onClick={handleExportCsv}>CSV</ToolActionButton>
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
