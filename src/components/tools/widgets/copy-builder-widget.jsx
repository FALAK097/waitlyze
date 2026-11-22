"use client";

import { useMemo, useRef, useState } from "react";

import { downloadTextFile } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatusBadge,
  ToolTextField,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
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

  const activeHero = {
    ...baseHero,
    eyebrow: customOverrides.eyebrow ?? baseHero.eyebrow,
    heading: customOverrides.heading ?? baseHero.heading,
    subheadline: customOverrides.subheadline ?? baseHero.subheadline,
    buttonText: customOverrides.buttonText ?? baseHero.buttonText,
    privacyNote: baseHero.privacyNote,
  };

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

  return (
    <ToolWorkspace className="grid gap-7">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Left: Structured Inputs */}
        <div className="grid content-start gap-4">
          <div className="flex items-center justify-between">
            <p className="font-product-mono text-micro font-semibold text-product-success-text">
              PRODUCT BRIEF
            </p>
            <button
              type="button"
              onClick={handleResetExample}
              className="text-micro font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
            >
              Load example
            </button>
          </div>

          <ToolTextField
            label="Product name"
            value={inputs.productName}
            onChange={(v) => updateField("productName", v)}
            maxLength={60}
            placeholder="RelayNote"
          />
          <ToolTextField
            label="One-sentence value proposition"
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
            label="Core painful problem"
            value={inputs.painPoint}
            onChange={(v) => updateField("painPoint", v)}
            maxLength={140}
            placeholder="daily status meetings break deep work"
          />
          {!compact ? (
            <>
              <ToolTextField
                label="Unique mechanism / how it works"
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
                label="Available proof (strictly honest)"
                value={inputs.proofType}
                onChange={(v) => updateField("proofType", v)}
                options={COPY_BUILDER_OPTIONS.proofTypes}
                hint="Selecting 'None yet' keeps proof honest with zero invented testimonials."
              />
              {inputs.proofType !== "none_honest" ? (
                <ToolTextField
                  label="Your real proof detail"
                  value={inputs.proofDetail}
                  onChange={(v) => updateField("proofDetail", v)}
                  maxLength={180}
                  placeholder="Paste your real metric, credential, or tester quote"
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <ToolSelectField
                  label="Voice & tone"
                  value={inputs.tone}
                  onChange={(v) => updateField("tone", v)}
                  options={COPY_BUILDER_OPTIONS.tones}
                />
                <ToolSelectField
                  label="Template frame"
                  value={inputs.templateId}
                  onChange={(v) => updateField("templateId", v)}
                  options={COPY_BUILDER_OPTIONS.templates}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Right: Hero Directions, Live Frame, and Full Sections */}
        <div className="grid content-start gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToolSegmentedControl
              label="Choose hero direction"
              value={selectedAngle}
              onChange={(val) => {
                setSelectedAngle(val);
                setCustomOverrides({});
              }}
              options={generated.heroDirections.map((h) => ({ value: h.id, label: h.label }))}
            />
            <ToolSegmentedControl
              label="Preview view"
              value={previewState}
              onChange={setPreviewState}
              options={[
                { value: "signup", label: "Signup hero" },
                { value: "post", label: "Post-signup card" },
              ]}
            />
          </div>

          {/* Live Template Frame Preview */}
          <div
            className={
              isDarkPreview
                ? "rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-white sm:p-8"
                : "rounded-xl border border-product-border-subtle bg-product-bg-inset/45 p-6 text-product-text-primary sm:p-8"
            }
          >
            {previewState === "signup" ? (
              <div className="mx-auto max-w-xl text-center">
                <span
                  className={
                    isDarkPreview
                      ? "inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 font-product-mono text-micro text-lime-300"
                      : "inline-block rounded-full border border-product-border-subtle bg-product-bg-surface px-3 py-1 font-product-mono text-micro font-medium text-product-success-text"
                  }
                >
                  {activeHero.eyebrow}
                </span>
                <h3 className="mt-4 font-product-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
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
                        ? "flex min-h-11 flex-1 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 text-caption text-neutral-400"
                        : "flex min-h-11 flex-1 items-center rounded-lg border border-product-border-control bg-product-bg-surface px-3.5 text-caption text-product-text-muted"
                    }
                  >
                    you@company.com
                  </div>
                  <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-product-accent-solid px-4 text-caption font-semibold text-product-accent-label">
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
                <ToolStatusBadge tone="accent">Verified referral loop preview</ToolStatusBadge>
                <h3 className="mt-3 font-product-display text-xl font-semibold tracking-tight">
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
                <div
                  className={
                    isDarkPreview
                      ? "mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-3.5 text-left"
                      : "mt-4 rounded-lg border border-product-border-subtle bg-product-bg-surface p-3.5 text-left"
                  }
                >
                  <p className="font-product-mono text-micro opacity-75">Pre-filled share post</p>
                  <p className="mt-1 text-caption">{generated.postSignup.sharePostText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Inline Headline & CTA Polish */}
          <div className="grid gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 sm:grid-cols-2">
            <ToolTextField
              label="Edit headline (inline)"
              value={activeHero.heading}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, heading: v }))}
              maxLength={140}
              className="sm:col-span-2"
            />
            <ToolTextField
              label="Edit subheadline"
              value={activeHero.subheadline}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, subheadline: v }))}
              maxLength={320}
            />
            <ToolTextField
              label="Edit CTA button label"
              value={activeHero.buttonText}
              onChange={(v) => setCustomOverrides((prev) => ({ ...prev, buttonText: v }))}
              maxLength={40}
            />
          </div>

          {/* Benefits, Proof & FAQ Summary */}
          {!compact ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {generated.benefits.map((b) => (
                  <div
                    key={b.title}
                    className="rounded-lg border border-product-border-subtle bg-product-bg-surface p-3.5"
                  >
                    <p className="text-caption font-semibold text-product-text-primary">
                      {b.title}
                    </p>
                    <p className="mt-1 text-micro leading-relaxed text-product-text-secondary">
                      {b.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-product-border-subtle bg-product-bg-inset/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-caption font-semibold text-product-text-primary">
                    {generated.proofSection.heading}
                  </p>
                  {generated.proofSection.honestPlaceholder ? (
                    <ToolStatusBadge tone="success">
                      Honest pre-launch · 0 fake quotes
                    </ToolStatusBadge>
                  ) : null}
                </div>
                <p className="mt-1.5 text-caption leading-relaxed text-product-text-secondary">
                  {generated.proofSection.body}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const activeMarkdown = formatCopyMarkdown({
                    productName: inputs.productName,
                    activeHero,
                    heroDirections: generated.heroDirections,
                    benefits: generated.benefits,
                    proofSection: generated.proofSection,
                    faqs: generated.faqs,
                    postSignup: generated.postSignup,
                  });
                  return (
                    <>
                      <ToolCopyButton
                        text={activeMarkdown}
                        label="Copy full page Markdown"
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
                    </>
                  );
                })()}
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
