"use client";

import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolCopyButton,
  ToolStatTile,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  COMMON_DKIM_SELECTORS,
  SAMPLE_DNS_RESULT,
} from "@/lib/tools/engines/dns-deliverability.mjs";

export function DnsDeliverabilityWidget({
  initialDomain = "",
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [domain, setDomain] = useState(initialDomain);
  const [selector, setSelector] = useState("resend");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(() => (initialDomain ? null : SAMPLE_DNS_RESULT));
  const [isSample, setIsSample] = useState(!initialDomain);

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
        body: JSON.stringify({ domain, selector }),
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
    <ToolWorkspace className="grid gap-6">
      <form
        onSubmit={inspectDomain}
        className="grid gap-4 border-b border-product-border-subtle pb-6"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end">
          <ToolTextField
            label="Launch sending domain"
            value={domain}
            onChange={setDomain}
            placeholder="acme.com"
            error={error}
            hint="Queries public TXT & MX records via DNS-over-HTTPS."
          />
          <ToolTextField
            label="DKIM selector (optional)"
            value={selector}
            onChange={setSelector}
            placeholder="resend"
            maxLength={63}
            hint="e.g., resend, google, s1"
          />
          <button
            type="submit"
            disabled={busy || !domain.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-product-text-primary bg-product-accent-solid px-5 py-2.5 text-body font-semibold text-product-accent-label hover:bg-product-accent-hover disabled:opacity-60"
          >
            {busy ? (
              <>
                <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
                <span>Checking…</span>
              </>
            ) : (
              <span>Inspect DNS</span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-micro">
            <span className="text-product-text-secondary">Common selectors:</span>
            {COMMON_DKIM_SELECTORS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelector(item.value)}
                className="rounded-full border border-product-border-subtle bg-product-bg-inset/70 px-2.5 py-0.5 font-product-mono text-micro text-product-text-primary hover:border-product-text-secondary"
              >
                {item.value}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setResult(SAMPLE_DNS_RESULT);
              setIsSample(true);
            }}
            className="text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
          >
            Load sample report
          </button>
        </div>
      </form>

      {result ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <ToolStatusBadge
              tone={
                result.band === "ready"
                  ? "success"
                  : result.band === "needs_attention"
                    ? "warning"
                    : "danger"
              }
            >
              {isSample ? `Sample report · ${result.domain}` : `Inspected · ${result.domain}`}
            </ToolStatusBadge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ToolStatTile
              label="Deliverability score"
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
                hint={`${chk.points}/${chk.maxPoints} pts`}
                tone={
                  chk.status === "pass" ? "success" : chk.status === "warn" ? "warning" : "danger"
                }
              />
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {result.checks.map((chk) => (
              <div
                key={chk.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4"
              >
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
                  <p className="mt-1.5 text-caption text-product-text-secondary">{chk.summary}</p>
                  <pre className="mt-2.5 overflow-x-auto rounded-lg bg-product-bg-inset/70 p-2.5 font-product-mono text-micro text-product-text-primary">
                    <code>{chk.rawRecord}</code>
                  </pre>
                  <p className="mt-2 text-micro text-product-text-secondary">{chk.remediation}</p>
                </div>
                {chk.copyableFix ? (
                  <div className="flex items-center justify-between gap-2 border-t border-product-border-subtle pt-3">
                    <code className="truncate font-product-mono text-micro text-product-text-primary">
                      {chk.copyableFix}
                    </code>
                    <ToolCopyButton
                      text={chk.copyableFix}
                      label="Copy record"
                      className="min-h-8 px-2.5 text-micro"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {!compact ? (
            <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/45 p-4">
              <p className="text-caption font-semibold text-product-text-primary">
                Pre-launch sending warm-up checklist
              </p>
              <ul className="mt-2 grid list-disc gap-1.5 pl-4 text-caption text-product-text-secondary">
                {result.warmupChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <ToolHandoffCta
            toolSlug="email-deliverability-checker"
            entrySurface={entrySurface}
            compact={compact}
            label="Connect this sending domain in Waitlyze"
            sublabel="Carries your inspected domain into Waitlyze setup. Custom sender emails use a connected verified Resend sender."
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
