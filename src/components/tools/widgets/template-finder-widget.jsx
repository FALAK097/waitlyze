"use client";

import { ArrowRight01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { useOpenAuthModal } from "@/components/auth/auth-modal-provider";
import TemplatePreview from "@/components/landing/template-preview";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { authClient } from "@/lib/auth-client";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  recommendTemplates,
  TEMPLATE_FINDER_OPTIONS,
} from "@/lib/tools/engines/template-finder.mjs";
import { cn } from "@/lib/utils";

const DEFAULT_INPUTS = {
  category: "saas",
  motion: "referral_queue",
  assets: "screenshots",
  aesthetic: "clean_editorial",
};

export function TemplateFinderWidget({
  templates = [],
  mode = "full",
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const router = useRouter();
  const openAuthModal = useOpenAuthModal();
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [selectedId, setSelectedId] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const startedRef = useRef(false);

  async function handleUseTemplate(templateId) {
    if (openingId) return;
    setOpeningId(templateId);
    const nextUrl = `/waitlists/new?template=${encodeURIComponent(templateId)}`;
    try {
      const sessionResult = await authClient.getSession().catch(() => null);
      if (sessionResult?.data?.user) {
        router.push(nextUrl);
      } else {
        openAuthModal({
          callbackURL: nextUrl,
          heading: "Start your waitlist with this template.",
          description:
            "Sign in with Google to open your preselected Waitlyze template draft. Free for up to 100 signups, no credit card needed.",
        });
      }
    } finally {
      setOpeningId(null);
    }
  }

  const templateMap = useMemo(() => {
    const map = new Map();
    for (const t of templates) map.set(t.id, t);
    return map;
  }, [templates]);

  const result = useMemo(() => recommendTemplates(inputs), [inputs]);
  const activeRec = useMemo(() => {
    if (selectedId) {
      const found = result.recommendations.find((r) => r.templateId === selectedId);
      if (found) return found;
    }
    return result.recommendations[0];
  }, [result.recommendations, selectedId]);

  function updateField(key, value) {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    setSelectedId(null);
    const nextTop = recommendTemplates(next).recommendations[0];
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "waitlist-template-finder",
        tool_version: "1.0",
        entry_surface: entrySurface,
        template_id: nextTop?.templateId,
      });
    }
    trackToolEvent("TOOL_COMPLETED", {
      tool_slug: "waitlist-template-finder",
      tool_version: "1.0",
      entry_surface: entrySurface,
      template_id: nextTop?.templateId,
      result_band: nextTop?.score >= 88 ? "strong" : "workable",
    });
  }

  if (mode === "compact") {
    const topTwo = result.recommendations.slice(0, 2);
    return (
      <section
        aria-label="Quick waitlist template matcher"
        className="mb-10 rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-semibold text-product-text-primary">
              Not sure which template fits your launch?
            </p>
            <p className="text-caption text-product-text-secondary">
              Narrow down all 14 layouts by product category, asset readiness, and referral style.
            </p>
          </div>
          <Link
            href="/tools/waitlist-template-finder"
            className="inline-flex min-h-9 shrink-0 items-center gap-1 text-caption font-semibold text-product-success-text hover:underline"
          >
            Open full Template Finder
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ToolSelectField
            label="Category"
            value={inputs.category}
            onChange={(val) => updateField("category", val)}
            options={TEMPLATE_FINDER_OPTIONS.categories}
          />
          <ToolSelectField
            label="Visual assets"
            value={inputs.assets}
            onChange={(val) => updateField("assets", val)}
            options={TEMPLATE_FINDER_OPTIONS.assets}
          />
          <ToolSelectField
            label="Conversion motion"
            value={inputs.motion}
            onChange={(val) => updateField("motion", val)}
            options={TEMPLATE_FINDER_OPTIONS.motions}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {topTwo.map((rec, index) => {
            const tmpl = templateMap.get(rec.templateId);
            return (
              <div
                key={rec.templateId}
                className="flex flex-col justify-between gap-3 rounded-lg border border-product-border-subtle bg-product-bg-surface p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ToolStatusBadge tone={index === 0 ? "accent" : "neutral"}>
                      {index === 0 ? "#1 Best match" : "#2 Runner-up"}
                    </ToolStatusBadge>
                    <span className="font-product-mono text-micro font-semibold text-product-text-secondary tabular-nums">
                      {rec.score}% fit
                    </span>
                  </div>
                  <p className="mt-1.5 font-product-display text-body font-semibold text-product-text-primary">
                    {tmpl?.name || rec.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-caption text-product-text-secondary">
                    {rec.whyItFits[0]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={openingId === rec.templateId}
                    onClick={() => handleUseTemplate(rec.templateId)}
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-product-text-primary px-3 py-1.5 text-caption font-semibold text-product-bg-page hover:opacity-90 disabled:opacity-60"
                  >
                    {openingId === rec.templateId ? "Opening…" : "Use template"}
                  </button>
                  <Link
                    prefetch={false}
                    href={`/templates/${rec.templateId}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-product-border-control px-3 py-1.5 text-caption font-medium text-product-text-primary hover:bg-product-bg-inset"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <ToolWorkspace className="grid gap-7">
      <div className="grid gap-5 border-b border-product-border-subtle pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-product-mono text-micro font-semibold text-product-success-text">
              4-AXIS MATCHER
            </p>
            <h2 className="mt-1 font-product-display text-xl font-semibold tracking-tight text-product-text-primary">
              Configure your launch profile
            </h2>
          </div>
          <p className="font-product-mono text-micro text-product-text-muted tabular-nums">
            Evaluating all 14 templates deterministically
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ToolSelectField
            label="1. Product & launch category"
            value={inputs.category}
            onChange={(val) => updateField("category", val)}
            options={TEMPLATE_FINDER_OPTIONS.categories}
            hint="40% weight. Matches layout structure to your buyer expectations."
          />
          <ToolSegmentedControl
            label="2. Visual asset readiness"
            value={inputs.assets}
            onChange={(val) => updateField("assets", val)}
            options={TEMPLATE_FINDER_OPTIONS.assets}
          />
          <ToolSegmentedControl
            label="3. Primary conversion motion"
            value={inputs.motion}
            onChange={(val) => updateField("motion", val)}
            options={TEMPLATE_FINDER_OPTIONS.motions}
          />
          <ToolSegmentedControl
            label="4. Brand aesthetic"
            value={inputs.aesthetic}
            onChange={(val) => updateField("aesthetic", val)}
            options={TEMPLATE_FINDER_OPTIONS.aesthetics}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-product-display text-lg font-semibold tracking-tight text-product-text-primary">
            Top 3 recommended templates
          </h3>
          <p className="text-caption text-product-text-secondary">
            Pick any matched card below to carry its template and section toggles into Waitlyze.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {result.recommendations.map((rec, index) => {
            const tmpl = templateMap.get(rec.templateId);
            const selected = activeRec?.templateId === rec.templateId;
            return (
              <article
                key={rec.templateId}
                className={cn(
                  "flex flex-col rounded-xl border bg-product-bg-surface p-4 transition-colors duration-150",
                  selected
                    ? "border-product-text-primary ring-1 ring-product-text-primary/15"
                    : "border-product-border-subtle hover:border-product-border-control",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <ToolStatusBadge tone={index === 0 ? "accent" : "neutral"}>
                    {index === 0 ? "#1 Best match" : `#${index + 1} ${rec.matchLabel}`}
                  </ToolStatusBadge>
                  <span className="font-product-mono text-caption font-semibold text-product-text-primary tabular-nums">
                    {rec.score}%
                  </span>
                </div>

                {tmpl ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-product-border-subtle">
                    <TemplatePreview template={tmpl} />
                  </div>
                ) : null}

                <h4 className="mt-3.5 font-product-display text-lg font-semibold tracking-tight text-product-text-primary">
                  {tmpl?.name || rec.name}
                </h4>
                <p className="mt-1 text-caption text-product-text-secondary">
                  {tmpl?.description || rec.useCase}
                </p>

                <div className="mt-4 border-t border-product-border-subtle pt-3">
                  <p className="text-micro font-semibold text-product-text-primary">Why it fits</p>
                  <ul className="mt-1.5 grid gap-1.5 text-caption text-product-text-secondary">
                    {rec.whyItFits.map((line) => (
                      <li key={line} className="flex items-start gap-1.5">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={14}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-product-success-text"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 rounded-lg bg-product-bg-inset/60 p-3">
                  <p className="text-micro font-semibold text-product-text-primary">
                    Section & form guidance
                  </p>
                  <p className="mt-1 text-micro leading-relaxed text-product-text-secondary">
                    {rec.formGuidance}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(rec.templateId)}
                    aria-pressed={selected}
                    className={cn(
                      "min-h-10 flex-1 rounded-lg border px-3 py-2 text-caption font-semibold transition-colors duration-150",
                      selected
                        ? "border-product-text-primary bg-product-text-primary text-product-bg-page"
                        : "border-product-border-control bg-product-bg-surface text-product-text-primary hover:bg-product-bg-inset",
                    )}
                  >
                    {selected ? "Selected" : "Select layout"}
                  </button>
                  <Link
                    prefetch={false}
                    href={`/templates/${rec.templateId}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-product-border-control px-3 py-2 text-caption font-medium text-product-text-primary hover:bg-product-bg-inset"
                  >
                    Preview
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {activeRec ? (
        <ToolHandoffCta
          toolSlug="waitlist-template-finder"
          entrySurface={entrySurface}
          label={`Use ${templateMap.get(activeRec.templateId)?.name || activeRec.name} in Waitlyze`}
          resultBand={activeRec.score >= 88 ? "strong" : "workable"}
          onApplyInProduct={onApplyInProduct}
          buildBlueprint={() => activeRec.blueprintPreset}
        />
      ) : null}
    </ToolWorkspace>
  );
}
