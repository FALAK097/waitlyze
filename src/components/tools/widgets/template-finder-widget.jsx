"use client";

import { ArrowRight01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { useOpenAuthModal } from "@/components/auth/auth-modal-provider";
import TemplatePreview from "@/components/landing/template-preview";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import { ToolSegmentedControl, ToolSelectField, ToolWorkspace } from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
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
      <section aria-label="Quick waitlist template matcher" className="mb-10 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-product-display text-base font-semibold text-product-text-primary">
            Match your launch to a template
          </p>
          <Link
            href="/tools/waitlist-template-finder"
            className="inline-flex items-center gap-1 text-caption font-medium text-product-text-secondary underline-offset-4 hover:text-product-text-primary hover:underline"
          >
            Full finder
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          {topTwo.map((rec) => {
            const tmpl = templateMap.get(rec.templateId);
            return (
              <div
                key={rec.templateId}
                className="flex flex-col justify-between gap-3 py-2 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="font-product-display text-body font-semibold text-product-text-primary">
                      {tmpl?.name || rec.name}
                    </p>
                    <span className="font-product-mono text-micro text-product-text-muted tabular-nums">
                      {rec.score}%
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-caption text-product-text-secondary">
                    {rec.whyItFits[0]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="product-apply"
                    size="sm"
                    disabled={openingId === rec.templateId}
                    onClick={() => handleUseTemplate(rec.templateId)}
                  >
                    {openingId === rec.templateId ? "Opening…" : "Use"}
                  </Button>
                  <Button
                    variant="product-outline"
                    size="sm"
                    render={<Link prefetch={false} href={`/templates/${rec.templateId}`} />}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <ToolWorkspace>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSelectField
          label="Product category"
          value={inputs.category}
          onChange={(val) => updateField("category", val)}
          options={TEMPLATE_FINDER_OPTIONS.categories}
        />
        <ToolSegmentedControl
          label="Visual assets"
          value={inputs.assets}
          onChange={(val) => updateField("assets", val)}
          options={TEMPLATE_FINDER_OPTIONS.assets}
        />
        <ToolSegmentedControl
          label="Conversion motion"
          value={inputs.motion}
          onChange={(val) => updateField("motion", val)}
          options={TEMPLATE_FINDER_OPTIONS.motions}
        />
        <ToolSegmentedControl
          label="Brand aesthetic"
          value={inputs.aesthetic}
          onChange={(val) => updateField("aesthetic", val)}
          options={TEMPLATE_FINDER_OPTIONS.aesthetics}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {result.recommendations.map((rec, index) => {
          const tmpl = templateMap.get(rec.templateId);
          const selected = activeRec?.templateId === rec.templateId;
          return (
            <article
              key={rec.templateId}
              className={cn(
                "flex flex-col transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-70 hover:opacity-100",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-product-display text-lg font-semibold tracking-tight text-product-text-primary">
                  {tmpl?.name || rec.name}
                </h3>
                <span className="font-product-mono text-caption text-product-text-secondary tabular-nums">
                  {index === 0 ? `Best · ${rec.score}%` : `${rec.score}%`}
                </span>
              </div>

              {tmpl ? (
                <div className="mt-3 overflow-hidden rounded-lg bg-product-bg-inset/50">
                  <TemplatePreview template={tmpl} />
                </div>
              ) : null}

              <p className="mt-3 text-caption text-product-text-secondary">
                {tmpl?.description || rec.useCase}
              </p>

              <ul className="mt-3 grid gap-1.5 text-caption text-product-text-secondary">
                {rec.whyItFits.map((line) => (
                  <li key={line} className="flex items-start gap-1.5">
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      size={14}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-product-success-text"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center gap-2 pt-5">
                <Button
                  type="button"
                  variant={selected ? "product-apply" : "product-outline"}
                  size="sm"
                  onClick={() => setSelectedId(rec.templateId)}
                  aria-pressed={selected}
                  className="h-9 flex-1"
                >
                  {selected ? "Selected" : "Select"}
                </Button>
                <Button
                  variant="product-outline"
                  size="sm"
                  className="h-9"
                  render={<Link prefetch={false} href={`/templates/${rec.templateId}`} />}
                >
                  Preview
                </Button>
              </div>
            </article>
          );
        })}
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
