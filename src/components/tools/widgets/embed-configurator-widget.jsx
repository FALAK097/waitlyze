"use client";

import { useMemo, useRef, useState } from "react";

import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolCopyButton,
  ToolSegmentedControl,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  EMBED_DEFAULTS,
  EMBED_FRAMEWORKS,
  EMBED_LAYOUT_MODES,
  generateEmbedSnippet,
  getCspChecklist,
} from "@/lib/tools/engines/embed-configurator.mjs";
import { cn } from "@/lib/utils";

const RADIUS_CLASS = {
  sharp: "rounded-none",
  soft: "rounded-md",
  round: "rounded-xl",
  pill: "rounded-full",
};

export function EmbedConfiguratorWidget({
  waitlistKeyId = "YOUR_PUBLIC_WAITLIST_ID",
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [config, setConfig] = useState(EMBED_DEFAULTS);
  const [viewport, setViewport] = useState("desktop");
  const [previewPhase, setPreviewPhase] = useState("form");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [sampleEmail, setSampleEmail] = useState("");
  const startedRef = useRef(false);

  const snippet = useMemo(
    () => generateEmbedSnippet(config, waitlistKeyId),
    [config, waitlistKeyId],
  );
  const cspChecklist = useMemo(() => getCspChecklist(), []);

  function update(key, value) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-embed-generator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const isDark = config.theme === "dark";
  const rClass = RADIUS_CLASS[config.radius] || "rounded-xl";

  function renderWidgetCard() {
    if (previewPhase === "status") {
      return (
        <div
          className={cn(
            "w-full border p-5 text-left transition-colors",
            rClass === "rounded-full" ? "rounded-2xl" : rClass,
            isDark
              ? "border-neutral-800 bg-neutral-950 text-white"
              : "border-product-border-subtle bg-white text-product-text-primary",
          )}
        >
          <p className="font-product-mono text-micro font-semibold text-product-success-text">
            YOU ARE ON THE LIST
          </p>
          <p className="mt-1 font-product-display text-xl font-semibold">Position #142</p>
          <p
            className={cn(
              "mt-1 text-caption",
              isDark ? "text-neutral-300" : "text-product-text-secondary",
            )}
          >
            Confirm your email, then share your link to earn +30 pts per verified referral.
          </p>
          <div
            className={cn(
              "mt-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 font-product-mono text-micro",
              isDark
                ? "border-neutral-800 bg-neutral-900 text-neutral-200"
                : "border-product-border-subtle bg-product-bg-inset/70 text-product-text-primary",
            )}
          >
            <span className="truncate">waitlyze.com/w/launch?r=a8f2k9</span>
            <button
              type="button"
              onClick={() => setPreviewPhase("form")}
              className="shrink-0 font-sans text-micro font-semibold underline"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPreviewPhase("status");
        }}
        className={cn(
          "w-full border p-4 transition-colors",
          rClass === "rounded-full" && config.mode !== "pill" ? "rounded-2xl" : rClass,
          isDark
            ? "border-neutral-800 bg-neutral-950 text-white"
            : "border-product-border-subtle bg-white text-product-text-primary",
        )}
      >
        <div
          className={cn(
            "flex gap-2",
            config.mode === "pill" && !config.showNameField ? "flex-col sm:flex-row" : "flex-col",
          )}
        >
          {config.showNameField ? (
            <input
              type="text"
              placeholder="Your name or role"
              className={cn(
                "min-h-10 w-full border px-3.5 text-caption",
                rClass,
                isDark
                  ? "border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-400"
                  : "border-product-border-control bg-white text-product-text-primary",
              )}
            />
          ) : null}
          <input
            type="email"
            value={sampleEmail}
            onChange={(e) => setSampleEmail(e.target.value)}
            placeholder={config.placeholder}
            className={cn(
              "min-h-10 flex-1 border px-3.5 text-caption",
              rClass,
              isDark
                ? "border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-400"
                : "border-product-border-control bg-white text-product-text-primary",
            )}
          />
          <button
            type="submit"
            style={{ backgroundColor: config.accentColor, color: config.buttonTextColor }}
            className={cn(
              "min-h-10 shrink-0 px-4 text-caption font-semibold transition-opacity hover:opacity-90",
              rClass,
            )}
          >
            {config.buttonText}
          </button>
        </div>
        <p
          className={cn("mt-2 text-micro", isDark ? "text-neutral-400" : "text-product-text-muted")}
        >
          Local sandbox preview — submissions are not stored.
        </p>
      </form>
    );
  }

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Controls */}
        <div className="grid content-start gap-4">
          <ToolSegmentedControl
            label="Presentation mode"
            value={config.mode}
            onChange={(val) => {
              update("mode", val);
              setOverlayOpen(false);
            }}
            options={EMBED_LAYOUT_MODES}
          />
          <ToolSegmentedControl
            label="Widget theme"
            value={config.theme}
            onChange={(val) => update("theme", val)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-caption font-semibold text-product-text-primary">
              Accent color
              <div className="flex min-h-10 items-center gap-2 rounded-lg border border-product-border-control bg-product-bg-surface px-2.5">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => update("accentColor", e.target.value)}
                  className="size-6 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-product-mono text-micro text-product-text-secondary">
                  {config.accentColor}
                </span>
              </div>
            </label>
            <label className="grid gap-1 text-caption font-semibold text-product-text-primary">
              Button text
              <div className="flex min-h-10 items-center gap-2 rounded-lg border border-product-border-control bg-product-bg-surface px-2.5">
                <input
                  type="color"
                  value={config.buttonTextColor}
                  onChange={(e) => update("buttonTextColor", e.target.value)}
                  className="size-6 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-product-mono text-micro text-product-text-secondary">
                  {config.buttonTextColor}
                </span>
              </div>
            </label>
          </div>
          <ToolSegmentedControl
            label="Corner radius"
            value={config.radius}
            onChange={(val) => update("radius", val)}
            options={[
              { value: "sharp", label: "Sharp" },
              { value: "soft", label: "Soft" },
              { value: "round", label: "Round" },
              { value: "pill", label: "Pill" },
            ]}
          />
          <ToolTextField
            label="CTA button label"
            value={config.buttonText}
            onChange={(v) => update("buttonText", v)}
            maxLength={36}
          />
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-product-border-subtle px-3 text-caption font-medium text-product-text-primary">
            <input
              type="checkbox"
              checked={config.showNameField}
              onChange={(e) => update("showNameField", e.target.checked)}
              className="size-4 accent-product-text-primary"
            />
            <span>Include optional Name / Role field</span>
          </label>
        </div>

        {/* Interactive Sandbox + Code */}
        <div className="grid content-start gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToolSegmentedControl
              value={previewPhase}
              onChange={setPreviewPhase}
              options={[
                { value: "form", label: "Pre-signup form" },
                { value: "status", label: "Post-signup referral card" },
              ]}
            />
            <ToolSegmentedControl
              value={viewport}
              onChange={setViewport}
              options={[
                { value: "desktop", label: "Desktop" },
                { value: "mobile", label: "Mobile (375px)" },
              ]}
            />
          </div>

          {/* Live Sandbox Canvas */}
          <div className="relative flex min-h-60 items-center justify-center overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-inset/60 p-5">
            <div
              className={cn(
                "w-full transition-all",
                viewport === "mobile" ? "max-w-[345px]" : "max-w-lg",
              )}
            >
              {config.mode === "modal" || config.mode === "drawer" ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setOverlayOpen(true)}
                    style={{ backgroundColor: config.accentColor, color: config.buttonTextColor }}
                    className={cn("min-h-11 px-5 text-body font-semibold shadow-2xs", rClass)}
                  >
                    Open {config.mode === "modal" ? "popup modal" : "slide-over drawer"} preview
                  </button>
                  <p className="mt-2 text-micro text-product-text-secondary">
                    Click to test the {config.mode} interaction inside this sandbox.
                  </p>
                </div>
              ) : (
                renderWidgetCard()
              )}
            </div>

            {overlayOpen && (config.mode === "modal" || config.mode === "drawer") ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 p-4">
                <div
                  className={cn(
                    "relative w-full max-w-md",
                    config.mode === "drawer"
                      ? "ml-auto h-full max-w-sm bg-white p-4 shadow-lg"
                      : "",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOverlayOpen(false)}
                    className="mb-2 inline-flex min-h-8 items-center rounded-md bg-white px-2.5 text-micro font-semibold text-product-text-primary shadow-2xs"
                  >
                    Close preview
                  </button>
                  {renderWidgetCard()}
                </div>
              </div>
            ) : null}
          </div>

          {/* Framework Snippets */}
          <div className="grid gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ToolSegmentedControl
                value={config.framework}
                onChange={(val) => update("framework", val)}
                options={EMBED_FRAMEWORKS}
              />
              <ToolCopyButton
                text={snippet.code}
                label="Copy snippet"
                onCopied={() =>
                  trackToolEvent("TOOL_RESULT_EXPORTED", {
                    tool_slug: "waitlist-embed-generator",
                    entry_surface: entrySurface,
                    export_format: config.framework,
                  })
                }
              />
            </div>

            <pre className="overflow-x-auto rounded-lg border border-product-border-subtle bg-product-bg-inset/60 p-4 font-product-mono text-micro leading-relaxed text-product-text-primary">
              <code>{snippet.code}</code>
            </pre>
            <p className="text-micro text-product-text-secondary">{snippet.installNote}</p>

            {!compact ? (
              <div className="grid gap-2 border-t border-product-border-subtle pt-3 sm:grid-cols-3">
                {cspChecklist.map((item) => (
                  <div key={item.directive} className="rounded-lg bg-product-bg-inset/50 p-2.5">
                    <ToolStatusBadge tone="neutral">{item.directive}</ToolStatusBadge>
                    <p className="mt-1 font-product-mono text-micro text-product-text-primary">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-micro text-product-text-secondary">{item.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <ToolHandoffCta
            toolSlug="waitlist-embed-generator"
            entrySurface={entrySurface}
            compact={compact}
            label="Connect this widget to a live waitlist"
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: "simple",
              showReferrals: true,
              brandPatch: {
                accentColor: config.accentColor,
                buttonColor: config.accentColor,
                buttonTextColor: config.buttonTextColor,
                radius: config.radius,
              },
              formFields: {
                buttonText: config.buttonText,
                placeholder: config.placeholder,
                layout: config.mode === "pill" ? "inline" : "stacked",
                customFields: config.showNameField
                  ? [
                      {
                        id: "name-role",
                        label: "Name or role",
                        type: "text",
                        required: false,
                        placeholder: "Your name or role",
                        options: [],
                      },
                    ]
                  : [],
              },
              embedConfig: {
                mode: config.mode,
                framework: config.framework,
              },
              summaryBullets: [
                `Widget mode: ${config.mode} (${config.framework}) with custom accent ${config.accentColor}`,
                `Radius: ${config.radius} · CTA: "${config.buttonText}"`,
                `Live public key ID ready immediately after creating draft`,
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
