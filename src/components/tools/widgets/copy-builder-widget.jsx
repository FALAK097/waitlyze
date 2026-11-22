"use client";

import { useMemo, useRef, useState } from "react";

import { downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  COPY_BUILDER_DEFAULTS,
  COPY_BUILDER_OPTIONS,
  formatCopyMarkdown,
  generateWaitlistCopy,
} from "@/lib/tools/engines/copy-builder.mjs";

export function CopyBuilderWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [inputs, setInputs] = useState(COPY_BUILDER_DEFAULTS);
  const [selectedAngle, setSelectedAngle] = useState("value");
  const [previewState, setPreviewState] = useState("signup");
  const [customOverrides, setCustomOverrides] = useState({});
  const startedRef = useRef(false);

  const generated = useMemo(() => generateWaitlistCopy(inputs), [inputs]);
  const baseHero =
    generated.heroDirections.find((h) => h.id === selectedAngle) || generated.heroDirections[0];

  const activeHero = useMemo(
    () => ({
      ...baseHero,
      eyebrow: customOverrides.eyebrow ?? baseHero.eyebrow,
      heading: customOverrides.heading ?? baseHero.heading,
      subheadline: customOverrides.subheadline ?? baseHero.subheadline,
      buttonText: customOverrides.buttonText ?? baseHero.buttonText,
      privacyNote: baseHero.privacyNote,
    }),
    [baseHero, customOverrides],
  );

  function updateField(key, value) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-landing-page-generator",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
    setCustomOverrides({});
  }

  function handleResetExample() {
    setInputs(COPY_BUILDER_DEFAULTS);
    setSelectedAngle("value");
    setCustomOverrides({});
  }

  const isDarkPreview = inputs.templateId === "ai" || inputs.templateId === "developer";
  const activeMarkdown = useMemo(
    () =>
      formatCopyMarkdown({
        productName: inputs.productName,
        activeHero,
        heroDirections: generated.heroDirections,
        benefits: generated.benefits,
        proofSection: generated.proofSection,
        faqs: generated.faqs,
        postSignup: generated.postSignup,
      }),
    [inputs.productName, activeHero, generated],
  );

  return (
    <ToolWorkspace>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-product-text-primary">Brief</span>
            <Button
              type="button"
              variant="product-inline-link"
              size="sm"
              onClick={handleResetExample}
            >
              Reset
            </Button>
          </div>

          <ToolTextField
            label="Product name"
            value={inputs.productName}
            onChange={(v) => updateField("productName", v)}
            maxLength={60}
            placeholder="RelayNote"
          />
          <ToolTextField
            label="One-line value prop"
            value={inputs.oneLiner}
            onChange={(v) => updateField("oneLiner", v)}
            maxLength={160}
            placeholder="Async engineering standups from merged PRs."
          />
          <ToolTextField
            label="Target audience"
            value={inputs.audience}
            onChange={(v) => updateField("audience", v)}
            maxLength={80}
            placeholder="10–60 person engineering teams"
          />
          <ToolTextField
            label="Core problem"
            value={inputs.painPoint}
            onChange={(v) => updateField("painPoint", v)}
            maxLength={140}
            placeholder="daily status meetings break deep work"
          />
          {!compact ? (
            <>
              <ToolTextField
                label="How it works"
                value={inputs.uniqueMechanism}
                onChange={(v) => updateField("uniqueMechanism", v)}
                maxLength={140}
              />
              <ToolSelectField
                label="Launch motion"
                value={inputs.launchMotion}
                onChange={(v) => updateField("launchMotion", v)}
                options={COPY_BUILDER_OPTIONS.launchMotions}
              />
              <ToolSelectField
                label="Available proof"
                value={inputs.proofType}
                onChange={(v) => updateField("proofType", v)}
                options={COPY_BUILDER_OPTIONS.proofTypes}
              />
              {inputs.proofType !== "none_honest" ? (
                <ToolTextField
                  label="Proof detail"
                  value={inputs.proofDetail}
                  onChange={(v) => updateField("proofDetail", v)}
                  maxLength={180}
                  placeholder="Paste your real metric, credential, or tester quote"
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <ToolSelectField
                  label="Tone"
                  value={inputs.tone}
                  onChange={(v) => updateField("tone", v)}
                  options={COPY_BUILDER_OPTIONS.tones}
                />
                <ToolSelectField
                  label="Preview theme"
                  value={inputs.templateId}
                  onChange={(v) => updateField("templateId", v)}
                  options={COPY_BUILDER_OPTIONS.templates}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="grid content-start gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToolSegmentedControl
              value={selectedAngle}
              onChange={(val) => {
                setSelectedAngle(val);
                setCustomOverrides({});
              }}
              options={generated.heroDirections.map((h) => ({ value: h.id, label: h.label }))}
            />
            <ToolSegmentedControl
              value={previewState}
              onChange={setPreviewState}
              options={[
                { value: "signup", label: "Hero" },
                { value: "post", label: "Post-signup" },
              ]}
            />
          </div>

          <div
            className={
              isDarkPreview
                ? "rounded-lg bg-neutral-950 p-7 text-white sm:p-9"
                : "rounded-lg bg-product-bg-inset/50 p-7 text-product-text-primary sm:p-9"
            }
          >
            {previewState === "signup" ? (
              <div className="mx-auto max-w-xl text-center">
                <h3 className="font-product-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
                  {activeHero.heading}
                </h3>
                <p
                  className={
                    isDarkPreview
                      ? "mt-3 text-body leading-relaxed text-neutral-300"
                      : "mt-3 text-body leading-relaxed text-product-text-secondary"
                  }
                >
                  {activeHero.subheadline}
                </p>
                <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
                  <div
                    className={
                      isDarkPreview
                        ? "flex h-10 flex-1 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-caption text-neutral-400"
                        : "flex h-10 flex-1 items-center rounded-lg border border-product-border-control bg-product-bg-surface px-3 text-caption text-product-text-muted"
                    }
                  >
                    you@company.com
                  </div>
                  <span className="inline-flex h-10 items-center justify-center rounded-lg bg-product-accent-solid px-4 text-caption font-semibold text-product-accent-label">
                    {activeHero.buttonText}
                  </span>
                </div>
                <p
                  className={
                    isDarkPreview
                      ? "mt-3 text-micro text-neutral-400"
                      : "mt-3 text-micro text-product-text-muted"
                  }
                >
                  {activeHero.privacyNote}
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-lg text-center">
                <h3 className="font-product-display text-xl font-semibold tracking-tight">
                  {generated.postSignup.confirmationHeading}
                </h3>
                <p
                  className={
                    isDarkPreview
                      ? "mt-2 text-caption text-neutral-300"
                      : "mt-2 text-caption text-product-text-secondary"
                  }
                >
                  {generated.postSignup.confirmationBody}
                </p>
                <p
                  className={
                    isDarkPreview
                      ? "mt-4 text-left text-caption text-neutral-200"
                      : "mt-4 text-left text-caption text-product-text-primary"
                  }
                >
                  {generated.postSignup.sharePostText}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToolTextField
              label="Headline"
              value={activeHero.heading}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, heading: v }))}
              maxLength={140}
              className="sm:col-span-2"
            />
            <ToolTextField
              label="Subheadline"
              value={activeHero.subheadline}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, subheadline: v }))}
              maxLength={320}
            />
            <ToolTextField
              label="CTA label"
              value={activeHero.buttonText}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, buttonText: v }))}
              maxLength={40}
            />
          </div>

          {!compact ? (
            <div className="grid gap-6 pt-2">
              <div className="grid gap-6 sm:grid-cols-3">
                {generated.benefits.map((b) => (
                  <div key={b.title}>
                    <p className="text-caption font-semibold text-product-text-primary">
                      {b.title}
                    </p>
                    <p className="mt-1 text-micro leading-relaxed text-product-text-secondary">
                      {b.body}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-caption font-semibold text-product-text-primary">
                  {generated.proofSection.heading}
                </p>
                <p className="mt-1 text-caption leading-relaxed text-product-text-secondary">
                  {generated.proofSection.body}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ToolCopyButton
                  text={activeMarkdown}
                  label="Copy Markdown"
                  onCopied={() =>
                    trackToolEvent("TOOL_RESULT_EXPORTED", {
                      tool_slug: "waitlist-landing-page-generator",
                      entry_surface: entrySurface,
                      export_format: "markdown_copy",
                    })
                  }
                />
                <ToolActionButton
                  onClick={() => {
                    downloadTextFile(
                      `${inputs.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "waitlist"}-copy.md`,
                      activeMarkdown,
                      "text/markdown;charset=utf-8;",
                    );
                    trackToolEvent("TOOL_RESULT_EXPORTED", {
                      tool_slug: "waitlist-landing-page-generator",
                      entry_surface: entrySurface,
                      export_format: "markdown_file",
                    });
                  }}
                >
                  Download .md
                </ToolActionButton>
              </div>
            </div>
          ) : null}

          <ToolHandoffCta
            toolSlug="waitlist-landing-page-generator"
            entrySurface={entrySurface}
            compact={compact}
            label="Open this page in Waitlyze Builder"
            resultBand={selectedAngle}
            onApplyInProduct={onApplyInProduct}
            buildBlueprint={() => ({
              templateId: inputs.templateId,
              campaignName: inputs.productName,
              campaignDescription: inputs.oneLiner,
              showReferrals:
                inputs.launchMotion === "referral_queue" || inputs.launchMotion === "early_access",
              heroCopy: {
                eyebrow: activeHero.eyebrow,
                heading: activeHero.heading,
                body: activeHero.subheadline,
                buttonText: activeHero.buttonText,
              },
              sectionsPatch: {
                features: generated.benefits,
                faqs: generated.faqs,
                statusHeading: generated.postSignup.confirmationHeading,
                statusBody: generated.postSignup.confirmationBody,
                shareMessage: generated.postSignup.sharePostText,
              },
              summaryBullets: [
                `Hero (${selectedAngle} angle): "${activeHero.heading.slice(0, 72)}"`,
                `3 benefit blocks + 4 launch FAQs populated automatically`,
                `Post-signup confirmation and referral share copy attached`,
              ],
            })}
          />
        </div>
      </div>
    </ToolWorkspace>
  );
}
