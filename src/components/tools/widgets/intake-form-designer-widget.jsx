"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { downloadJson } from "@/components/tools/tool-export-utils";
import { ToolHandoffCta } from "@/components/tools/tool-handoff-cta";
import {
  ToolActionButton,
  ToolCopyButton,
  ToolSegmentedControl,
  ToolSelectField,
  ToolStatStrip,
  ToolStatTile,
  ToolWorkspace,
} from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const previewEmailId = useId();
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
            `- **${f.label}** (${f.required ? "required" : "optional"}, type: ${f.type}${f.options?.length ? `: ${f.options.join(", ")}` : ""})`,
        ),
      ].join("\n"),
    [activeFields, segmentObj.label],
  );

  return (
    <ToolWorkspace>
      <div className="grid gap-4 lg:grid-cols-3">
        <ToolSelectField
          label="Segment"
          value={segment}
          onChange={(val) => {
            setSegment(val);
            rebuildFields(val, goal, frictionBudget);
          }}
          options={INTAKE_SEGMENTS}
        />
        <ToolSelectField
          label="Qualification goal"
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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid content-start gap-6">
          <ToolStatStrip className="sm:grid-cols-3">
            <ToolStatTile label="Active fields" value={`Email + ${friction.activeCount}`} />
            <ToolStatTile
              label="Friction"
              value={`${friction.score}/100`}
              hint={friction.label}
              tone={friction.tone}
            />
            <ToolStatTile
              label="VIP rules"
              value={String(activeFields.filter((f) => f.vipRule).length)}
            />
          </ToolStatStrip>

          <ul className="grid gap-3">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-body font-medium text-product-text-primary">
                      <Checkbox
                        checked={field.enabled}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <span>{field.label}</span>
                    </label>
                    <span className="font-product-mono text-micro text-product-text-muted">
                      {field.type}
                    </span>
                    {field.vipRule ? (
                      <span className="font-product-mono text-micro text-product-success-text">
                        +{field.vipRule.bonusPoints} pts
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 pl-6 text-caption text-product-text-secondary">
                    {field.rationale}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 pl-6 sm:pl-0">
                  <Button
                    type="button"
                    variant="product-outline"
                    size="xs"
                    disabled={!field.enabled}
                    onClick={() => toggleRequired(field.id)}
                  >
                    {field.required ? "Required" : "Optional"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${field.label} up`}
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                  >
                    <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${field.label} down`}
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

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
              JSON schema
            </ToolActionButton>
          </div>
        </div>

        {/* Live Form Preview */}
        <div className="grid content-start gap-4 pt-2 lg:pt-0 lg:pl-8">
          <h3 className="font-product-display text-base font-semibold text-product-text-primary">
            Preview
          </h3>
          <div className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor={previewEmailId} className="text-caption">
                Work email <span className="text-product-danger-text">*</span>
              </Label>
              <Input
                id={previewEmailId}
                readOnly
                placeholder="you@company.com"
                className="h-9 bg-product-bg-surface"
              />
            </div>

            {activeFields.map((field) => (
              <div key={field.id} className="grid gap-1.5">
                <Label className="text-caption">
                  {field.label}
                  {field.required ? (
                    <span className="text-product-danger-text">*</span>
                  ) : (
                    <span className="font-normal text-product-text-muted">(optional)</span>
                  )}
                </Label>
                {field.type === "select" ? (
                  <select
                    aria-label={field.label}
                    className="h-9 rounded-lg border border-input bg-product-bg-surface px-2.5 text-caption text-product-text-primary"
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
                    <Checkbox />
                    <span>Yes, count me in</span>
                  </label>
                ) : field.type === "textarea" ? (
                  <Textarea
                    rows={2}
                    readOnly
                    placeholder={field.placeholder}
                    className="bg-product-bg-surface text-caption"
                  />
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    readOnly
                    placeholder={field.placeholder || "Enter value"}
                    className="h-9 bg-product-bg-surface text-caption"
                  />
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="product-accent"
              onClick={() =>
                toast.info(
                  "Interactive preview — click “Build this intake form in Waitlyze” below to launch.",
                )
              }
              className="mt-1 h-10 w-full font-semibold"
            >
              Request beta invite
            </Button>
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
