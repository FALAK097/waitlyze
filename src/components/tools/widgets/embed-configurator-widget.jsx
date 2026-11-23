"use client";

import { useId, useMemo, useRef, useState } from "react";

import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolCopyButton,
  ToolSegmentedControl,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  EMBED_DEFAULTS,
  EMBED_FRAMEWORKS,
  EMBED_LAYOUT_MODES,
  generateEmbedSnippet,
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
  const accentColorId = useId();
  const buttonTextColorId = useId();

  const snippet = useMemo(
    () => generateEmbedSnippet(config, waitlistKeyId),
    [config, waitlistKeyId],
  );

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
          <p className="font-product-display text-xl font-semibold">Position #142</p>
          <p
            className={cn(
              "mt-1 text-caption",
              isDark ? "text-neutral-300" : "text-product-text-secondary",
            )}
          >
            Confirm your email, then share your link to move up.
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
              className="shrink-0 font-sans text-micro font-medium underline"
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
      </form>
    );
  }

  return (
    <ToolWorkspace>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <ToolSegmentedControl
            label="Mode"
            value={config.mode}
            onChange={(val) => {
              update("mode", val);
              setOverlayOpen(false);
            }}
            options={EMBED_LAYOUT_MODES}
          />
          <ToolSegmentedControl
            label="Theme"
            value={config.theme}
            onChange={(val) => update("theme", val)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={accentColorId} className="text-caption font-medium">
                Accent
              </Label>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-product-bg-surface px-2.5">
                <input
                  id={accentColorId}
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => update("accentColor", e.target.value)}
                  className="size-6 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-product-mono text-micro text-product-text-secondary">
                  {config.accentColor}
                </span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={buttonTextColorId} className="text-caption font-medium">
                Button text
              </Label>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-product-bg-surface px-2.5">
                <input
                  id={buttonTextColorId}
                  type="color"
                  value={config.buttonTextColor}
                  onChange={(e) => update("buttonTextColor", e.target.value)}
                  className="size-6 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-product-mono text-micro text-product-text-secondary">
                  {config.buttonTextColor}
                </span>
              </div>
            </div>
          </div>
          <ToolSegmentedControl
            label="Radius"
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
            label="Button label"
            value={config.buttonText}
            onChange={(v) => update("buttonText", v)}
            maxLength={36}
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-caption text-product-text-primary">
            <Checkbox
              checked={config.showNameField}
              onCheckedChange={(checked) => update("showNameField", Boolean(checked))}
            />
            <span>Include Name / Role field</span>
          </label>
        </div>

        <div className="grid content-start gap-6">
          <div className="grid gap-2 sm:grid-cols-2">
            <ToolSegmentedControl
              ariaLabel="Preview state"
              value={previewPhase}
              onChange={setPreviewPhase}
              options={[
                { value: "form", label: "Form" },
                { value: "status", label: "Post-signup" },
              ]}
            />
            <ToolSegmentedControl
              ariaLabel="Preview viewport"
              value={viewport}
              onChange={setViewport}
              options={[
                { value: "desktop", label: "Desktop" },
                { value: "mobile", label: "Mobile" },
              ]}
            />
          </div>

          <div className="relative flex min-h-56 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-product-bg-inset/50 p-3 sm:p-6">
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
                    className={cn("min-h-10 px-5 text-body font-semibold", rClass)}
                  >
                    Preview {config.mode}
                  </button>
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setOverlayOpen(false)}
                    className="mb-2"
                  >
                    Close
                  </Button>
                  {renderWidgetCard()}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 pt-2">
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ToolSegmentedControl
                ariaLabel="Embed framework"
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
                className="w-full sm:w-auto"
              />
            </div>

            <pre className="overflow-x-auto rounded-lg bg-product-bg-inset/60 p-4 font-product-mono text-micro leading-relaxed text-product-text-primary">
              <code>{snippet.code}</code>
            </pre>
            <p className="text-caption leading-relaxed text-product-text-secondary">
              {snippet.installNote}
            </p>
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
