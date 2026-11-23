"use client";

import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";

import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolCopyButton,
  ToolStatStrip,
  ToolStatTile,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  COMMON_DKIM_SELECTORS,
  SAMPLE_DNS_RESULT,
} from "@/lib/tools/engines/dns-deliverability.mjs";

const CUSTOM_SELECTOR_VALUE = "__custom__";
const SKIP_SELECTOR_VALUE = "__none__";

const DKIM_DROPDOWN_OPTIONS = [
  ...COMMON_DKIM_SELECTORS,
  { value: CUSTOM_SELECTOR_VALUE, label: "Custom selector (type your own)" },
  { value: SKIP_SELECTOR_VALUE, label: "Skip DKIM check" },
];

export function DnsDeliverabilityWidget({
  initialDomain = "",
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const selectorFieldId = useId();
  const customSelectorId = useId();
  const [domain, setDomain] = useState(initialDomain);
  const [selectorMode, setSelectorMode] = useState("resend");
  const [customSelector, setCustomSelector] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isSample, setIsSample] = useState(false);

  const effectiveSelector =
    selectorMode === SKIP_SELECTOR_VALUE
      ? ""
      : selectorMode === CUSTOM_SELECTOR_VALUE
        ? customSelector.trim()
        : selectorMode;

  const activeSelectorLabel =
    DKIM_DROPDOWN_OPTIONS.find((opt) => opt.value === selectorMode)?.label ?? selectorMode;

  async function inspectDomain(event) {
    event?.preventDefault();
    if (busy || !domain.trim()) return;
    setError("");
    setBusy(true);
    trackToolEvent("TOOL_STARTED", {
      tool_slug: "email-deliverability-checker",
      tool_version: "1.0",
      entry_surface: entrySurface,
    });

    try {
      const res = await fetch("/api/tools/check-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, selector: effectiveSelector }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Could not check DNS records.");
      }
      setResult(data.result);
      setIsSample(false);
      trackToolEvent("TOOL_COMPLETED", {
        tool_slug: "email-deliverability-checker",
        tool_version: "1.0",
        entry_surface: entrySurface,
        result_band: data.result.band,
      });
    } catch (err) {
      setError(err?.message || "DNS lookup failed. Check the domain and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolWorkspace>
      <form onSubmit={inspectDomain} className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto] md:items-start">
          <ToolTextField
            label="Sending domain"
            value={domain}
            onChange={setDomain}
            placeholder="acme.com"
            error={error}
          />
          <div className="grid gap-1.5">
            <Label
              htmlFor={selectorFieldId}
              className="text-caption font-medium text-product-text-primary"
            >
              DKIM selector
            </Label>
            <Select value={selectorMode} onValueChange={(next) => next && setSelectorMode(next)}>
              <SelectTrigger
                id={selectorFieldId}
                className="h-10 w-full bg-product-bg-surface px-3 text-body text-product-text-primary"
              >
                <SelectValue>{activeSelectorLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {DKIM_DROPDOWN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectorMode === CUSTOM_SELECTOR_VALUE ? (
              <Input
                id={customSelectorId}
                type="text"
                value={customSelector}
                onChange={(event) => setCustomSelector(event.target.value)}
                placeholder="Type selector (e.g., mailo, s2, pm)"
                maxLength={63}
                aria-label="Custom DKIM selector"
                className="h-10 bg-product-bg-surface px-3 font-product-mono text-caption"
              />
            ) : null}
          </div>
          <div className="md:pt-[22px]">
            <Button
              type="submit"
              variant="product-accent"
              size="md"
              disabled={
                busy ||
                !domain.trim() ||
                (selectorMode === CUSTOM_SELECTOR_VALUE && !customSelector.trim())
              }
              className="h-10 w-full px-5 font-semibold whitespace-nowrap md:w-auto"
            >
              {busy ? (
                <>
                  <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
                  <span>Checking…</span>
                </>
              ) : (
                <span>Check DNS</span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-micro text-product-text-muted">
            Pick your email provider’s DKIM selector, or choose Custom selector to enter your own.
          </p>
          <Button
            type="button"
            variant="product-inline-link"
            size="sm"
            onClick={() => {
              setError("");
              setResult(SAMPLE_DNS_RESULT);
              setIsSample(true);
            }}
            className="whitespace-nowrap"
          >
            Load sample
          </Button>
        </div>
      </form>

      {result ? (
        <div className="grid gap-7">
          <ToolStatusBadge
            tone={
              result.band === "ready"
                ? "success"
                : result.band === "needs_attention"
                  ? "warning"
                  : "danger"
            }
          >
            {isSample ? `Sample · ${result.domain}` : result.domain}
          </ToolStatusBadge>

          <ToolStatStrip>
            <ToolStatTile
              label="Deliverability"
              value={`${result.score}/100`}
              hint={`Grade ${result.grade}`}
              tone={
                result.band === "ready"
                  ? "success"
                  : result.band === "needs_attention"
                    ? "warning"
                    : "danger"
              }
            />
            {result.checks.slice(0, 3).map((chk) => (
              <ToolStatTile
                key={chk.id}
                label={chk.id.toUpperCase()}
                value={chk.status === "pass" ? "Pass" : chk.status === "warn" ? "Warn" : "Fix"}
                hint={`${chk.points}/${chk.maxPoints}`}
                tone={
                  chk.status === "pass" ? "success" : chk.status === "warn" ? "warning" : "danger"
                }
              />
            ))}
          </ToolStatStrip>

          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {result.checks.map((chk) => (
              <div key={chk.id} className="flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body font-semibold text-product-text-primary">{chk.name}</p>
                    <ToolStatusBadge
                      tone={
                        chk.status === "pass"
                          ? "success"
                          : chk.status === "warn"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {chk.status === "pass" ? "Pass" : chk.status === "warn" ? "Warn" : "Fail"}
                    </ToolStatusBadge>
                  </div>
                  <p className="mt-1 text-caption text-product-text-secondary">{chk.summary}</p>
                  <pre className="mt-2.5 overflow-x-auto rounded-md bg-product-bg-inset/70 p-2.5 font-product-mono text-micro text-product-text-primary">
                    <code>{chk.rawRecord}</code>
                  </pre>
                  <p className="mt-2 text-micro text-product-text-secondary">{chk.remediation}</p>
                </div>
                {chk.copyableFix ? (
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <code className="truncate font-product-mono text-micro text-product-text-muted">
                      {chk.copyableFix}
                    </code>
                    <ToolCopyButton text={chk.copyableFix} label="Copy" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <ToolHandoffCta
            toolSlug="email-deliverability-checker"
            entrySurface={entrySurface}
            compact={compact}
            label="Connect this sending domain in Waitlyze"
            resultBand={result.band}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: "saas",
              showReferrals: true,
              domainConfig: {
                domain: result.domain,
                score: result.score,
              },
              summaryBullets: [
                `Inspected sending domain: ${result.domain} (${result.score}/100 readiness)`,
                `SPF, DMARC, MX, and DKIM remediation steps saved with your campaign`,
                `Connect a verified Resend sender inside Waitlyze Email settings`,
              ],
            })}
          />
        </div>
      ) : null}
    </ToolWorkspace>
  );
}
