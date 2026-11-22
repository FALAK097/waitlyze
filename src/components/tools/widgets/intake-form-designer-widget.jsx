"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";

import { downloadJson } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatTile,
  ToolStatusBadge,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { trackToolEvent } from "@/lib/tools/analytics";
import {
  designBetaIntakeForm,
  evaluateFormFriction,
  FRICTION_BUDGETS,
  INTAKE_SEGMENTS,
  QUALIFICATION_GOALS,
} from "@/lib/tools/engines/intake-form-designer.mjs";

export function IntakeFormDesignerWidget({
  compact = false,
  entrySurface = "public_tool",
  onApplyInProduct = null,
}) {
  const [segment, setSegment] = useState("b2b_saas");
  const [goal, setGoal] = useState("identify_icp");
  const [frictionBudget, setFrictionBudget] = useState("balanced");
  const [fields, setFields] = useState(
    () =>
      designBetaIntakeForm({
        segment: "b2b_saas",
        goal: "identify_icp",
        frictionBudget: "balanced",
      }).fields,
  );
  const startedRef = useRef(false);

  function rebuildFields(nextSegment, nextGoal, nextBudget) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("TOOL_STARTED", {
        tool_slug: "beta-application-questions",
        tool_version: "1.0",
        entry_surface: entrySurface,
      });
    }
    const next = designBetaIntakeForm({
      segment: nextSegment,
      goal: nextGoal,
      frictionBudget: nextBudget,
    });
    setFields(next.fields);
  }

  const friction = useMemo(() => evaluateFormFriction(fields), [fields]);
  const activeFields = useMemo(() => fields.filter((f) => f.enabled), [fields]);
  const segmentObj = INTAKE_SEGMENTS.find((s) => s.value === segment) || INTAKE_SEGMENTS[0];

  function toggleField(id) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  }

  function toggleRequired(id) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f)));
  }

  function moveField(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  }

  const schemaExport = useMemo(
    () =>
      activeFields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: Boolean(f.required),
        placeholder: f.placeholder || "",
        options: f.type === "select" ? f.options || [] : [],
      })),
    [activeFields],
  );

  const markdownExport = useMemo(
    () =>
      [
        `# Beta Intake Form (${segmentObj.label})`,
        `- **Email** (required, type: email)`,
        ...activeFields.map(
          (f) =>
            `- **${f.label}** (${f.required ? "required" : "optional"}, type: ${f.type}${f.options?.length ? ` — ${f.options.join(", ")}` : ""})`,
        ),
      ].join("\n"),
    [activeFields, segmentObj.label],
  );

  return (
    <ToolWorkspace className="grid gap-6">
      <div className="grid gap-4 border-b border-product-border-subtle pb-5 lg:grid-cols-3">
        <ToolSelectField
          label="Launch segment"
          value={segment}
          onChange={(val) => {
            setSegment(val);
            rebuildFields(val, goal, frictionBudget);
          }}
          options={INTAKE_SEGMENTS}
        />
        <ToolSelectField
          label="Primary qualification goal"
          value={goal}
          onChange={(val) => {
            setGoal(val);
            rebuildFields(segment, val, frictionBudget);
          }}
          options={QUALIFICATION_GOALS}
        />
        <ToolSegmentedControl
          label="Friction budget"
          value={frictionBudget}
          onChange={(val) => {
            setFrictionBudget(val);
            rebuildFields(segment, goal, val);
          }}
          options={FRICTION_BUDGETS.map((b) => ({
            value: b.value,
            label:
              b.value === "ultra_fast"
                ? "1 field"
                : b.value === "balanced"
                  ? "2–3 fields"
                  : "4–5 fields",
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Field Builder & VIP Rules */}
        <div className="grid content-start gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ToolStatTile
              label="Active fields"
              value={`Email + ${friction.activeCount}`}
              hint="Total intake inputs"
            />
            <ToolStatTile
              label="Friction meter"
              value={`${friction.score}/100`}
              hint={friction.label}
              tone={friction.tone}
            />
            <ToolStatTile
              label="VIP scoring rules"
              value={String(activeFields.filter((f) => f.vipRule).length)}
              hint="Fast-track triggers"
            />
          </div>

          <p className="text-caption text-product-text-secondary">{friction.impactNote}</p>

          <div className="grid gap-2.5">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl border border-product-border-subtle bg-product-bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-body font-semibold text-product-text-primary">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={() => toggleField(field.id)}
                        className="size-4 accent-product-text-primary"
                      />
                      <span>{field.label}</span>
                    </label>
                    <ToolStatusBadge tone="neutral">{field.type}</ToolStatusBadge>
                    {field.vipRule ? (
                      <ToolStatusBadge tone="accent">
                        +{field.vipRule.bonusPoints} pts · {field.vipRule.tag}
                      </ToolStatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-1 pl-6 text-caption text-product-text-secondary">
                    {field.rationale}
                  </p>
                  {field.options?.length ? (
                    <p className="mt-1 pl-6 font-product-mono text-micro text-product-text-muted">
                      Options: {field.options.join(" · ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5 pl-6 sm:pl-0">
                  <button
                    type="button"
                    disabled={!field.enabled}
                    onClick={() => toggleRequired(field.id)}
                    className="min-h-8 rounded-md border border-product-border-control px-2.5 text-micro font-medium text-product-text-primary hover:bg-product-bg-inset disabled:opacity-40"
                  >
                    {field.required ? "Required" : "Optional"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${field.label} up`}
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-product-border-subtle text-product-text-secondary hover:bg-product-bg-inset disabled:opacity-35"
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${field.label} down`}
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-product-border-subtle text-product-text-secondary hover:bg-product-bg-inset disabled:opacity-35"
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToolCopyButton text={markdownExport} label="Copy Markdown" />
            <ToolActionButton
              onClick={() => {
                downloadJson("waitlyze-beta-intake-schema.json", schemaExport);
                trackToolEvent("TOOL_RESULT_EXPORTED", {
                  tool_slug: "beta-application-questions",
                  entry_surface: entrySurface,
                  export_format: "json",
                });
              }}
            >
              Download JSON schema
            </ToolActionButton>
          </div>
        </div>

        {/* Live Form Preview */}
        <div className="rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-5">
          <p className="font-product-mono text-micro font-semibold text-product-success-text">
            LIVE FORM PREVIEW
          </p>
          <p className="mt-1 font-product-display text-lg font-semibold text-product-text-primary">
            Apply for early beta access
          </p>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <span className="text-caption font-medium text-product-text-primary">
                Work email <span className="text-product-danger-text">*</span>
              </span>
              <div className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-3 py-2 text-caption text-product-text-muted">
                you@company.com
              </div>
            </div>

            {activeFields.map((field) => (
              <div key={field.id} className="grid gap-1">
                <span className="text-caption font-medium text-product-text-primary">
                  {field.label}{" "}
                  {field.required ? (
                    <span className="text-product-danger-text">*</span>
                  ) : (
                    <span className="text-micro font-normal text-product-text-muted">
                      (optional)
                    </span>
                  )}
                </span>
                {field.type === "select" ? (
                  <select
                    aria-label={field.label}
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-3 text-caption text-product-text-primary"
                  >
                    <option value="">{field.placeholder || "Select an option"}</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="inline-flex items-center gap-2 text-caption text-product-text-secondary">
                    <input type="checkbox" className="size-4 accent-product-text-primary" />
                    <span>Yes, count me in</span>
                  </label>
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={2}
                    readOnly
                    placeholder={field.placeholder}
                    className="rounded-lg border border-product-border-control bg-product-bg-surface p-2.5 text-caption text-product-text-muted"
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    readOnly
                    placeholder={field.placeholder || "Enter value"}
                    className="min-h-10 rounded-lg border border-product-border-control bg-product-bg-surface px-3 text-caption text-product-text-muted"
                  />
                )}
              </div>
            ))}

            <div className="mt-2 flex min-h-11 items-center justify-center rounded-lg border border-product-text-primary bg-product-accent-solid text-caption font-semibold text-product-accent-label">
              Request beta invite
            </div>
          </div>
        </div>
      </div>

      <ToolHandoffCta
        toolSlug="beta-application-questions"
        entrySurface={entrySurface}
        compact={compact}
        label="Build this intake form in Waitlyze"
        resultBand={friction.tone}
        onApplyInProduct={onApplyInProduct}
        buildBlueprint={() => ({
          templateId: segmentObj.templateId,
          showReferrals: true,
          formFields: {
            doubleOptIn: true,
            layout: "stacked",
            buttonText: "Request beta invite",
            customFields: schemaExport,
          },
          summaryBullets: [
            `Segment: ${segmentObj.label} (Email + ${schemaExport.length} custom fields)`,
            `Friction profile: ${friction.label} (${friction.score}/100)`,
            `Custom field schema pre-wired into Waitlyze Builder`,
          ],
        })}
      />
    </ToolWorkspace>
  );
}
