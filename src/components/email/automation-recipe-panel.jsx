"use client";

import { useState } from "react";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { EmailCanvas } from "./email-canvas";
import {
  EmailPreviewResult,
  EmailTestSendForm,
  HtmlSourceEditor,
  VariableChips,
} from "./email-composer-extras";
import { EmailComposerModeBar } from "./email-composer-mode-bar";
import { SavedTemplateSelect } from "./saved-template-select";

const pane = "min-w-0 max-w-195 flex flex-col gap-5 lg:flex-1";
const paneHead = "flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch";
const paneTitle = "m-0 text-section font-semibold";
const paneMeta = "m-0 text-caption leading-normal text-product-text-secondary";
const paneActions = "flex shrink-0 flex-wrap items-center justify-end gap-2 max-sm:justify-start";
const fieldCard = "overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const fieldRow =
  "relative flex min-h-13 items-center gap-3 px-4 [&+&]:border-t border-product-border-subtle focus-within:bg-product-bg-inset focus-within:before:absolute focus-within:before:inset-y-0 focus-within:before:left-0 focus-within:before:w-0.5 focus-within:before:bg-product-success-text";
const fieldUnit = "shrink-0 text-xs text-product-text-secondary";
const fieldInput =
  "min-w-0 flex-1 border-0 bg-transparent py-3.5 text-body text-product-text-primary focus-visible:outline-none!";
const numberField = "w-33 flex-none gap-0";
const numberGroup = "h-8.5 rounded-product-control border-product-border-control bg-white";
const numberInput = "tabular-nums";
const numberButton = "text-product-text-secondary hover:bg-product-bg-inset";
const canvasShell = "overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const metaBar =
  "flex flex-wrap items-center justify-between gap-3.5 max-sm:flex-col max-sm:items-stretch";
const hint = "m-0 text-caption leading-normal text-product-text-secondary";
const EMPTY_TEMPLATES = {};

const hourValue = (minutes) => Number((minutes / 60).toFixed(2));
const waitLabel = (minutes) =>
  minutes === 0
    ? "immediately"
    : minutes % 60 === 0
      ? `${minutes / 60} ${minutes === 60 ? "hour" : "hours"} later`
      : `${minutes} minutes later`;

// One-line summary under the recipe title. Mirrors the recipe-type chain:
// milestone recipes need a positive count, otherwise the generic text applies.
function recipeTiming(recipe) {
  const delay = recipe.delayHours ?? hourValue(recipe.config.delayMinutes);
  const minutes = Number.isFinite(delay) ? delay * 60 : 0;
  const milestoneCount = Number(recipe.milestoneCount ?? recipe.config.milestoneCount);
  if (recipe.type === "REFERRAL_MILESTONE" && milestoneCount > 0)
    return `At ${milestoneCount} verified referrals · ${waitLabel(minutes)}`;
  switch (recipe.type) {
    case "REFERRAL_REMINDER":
      return `After confirmation, if they still have no referrals · ${waitLabel(minutes)}`;
    case "WELCOME_FOLLOWUP":
      return `Welcome series, second note after confirmation · ${waitLabel(minutes)}`;
    case "LAUNCH_COUNTDOWN":
      return `After confirmation, ahead of launch · ${waitLabel(minutes)}`;
    default:
      return `After confirmation · ${waitLabel(minutes)}`;
  }
}

function statusTooltipText({ enabled, deliveryReady, dirty }) {
  if (enabled) return "Sends automatically. Pause to stop until you resume it.";
  if (!deliveryReady) return "Set up email delivery first to enable this email.";
  return dirty
    ? "Save your changes first, then enable."
    : "Sends this email automatically to eligible subscribers.";
}

function AutomationNumberField({ label, value, min, max, disabled, onChange }) {
  return (
    <NumberField
      className={numberField}
      aria-label={label}
      value={Number(value)}
      min={min}
      max={max}
      step={1}
      disabled={disabled}
      onValueChange={(nextValue) => onChange(String(nextValue ?? min))}
    >
      <NumberFieldGroup className={numberGroup}>
        <NumberFieldDecrement className={numberButton} aria-label={`Decrease ${label}`} />
        <NumberFieldInput className={numberInput} aria-label={label} />
        <NumberFieldIncrement className={numberButton} aria-label={`Increase ${label}`} />
      </NumberFieldGroup>
    </NumberField>
  );
}

function TimingFields({ recipe, delay, busy, onUpdateRecipe }) {
  if (recipe.type !== "REFERRAL_MILESTONE") {
    return (
      <div className={fieldRow}>
        <AutomationNumberField
          label="Hours after confirmation"
          value={delay}
          min={0}
          max={168}
          disabled={busy}
          onChange={(next) => onUpdateRecipe(recipe.id, { delayHours: next })}
        />
        <span className={fieldUnit}>hours after confirmation</span>
      </div>
    );
  }
  return (
    <>
      <div className={fieldRow}>
        <AutomationNumberField
          label="Verified referrals to celebrate"
          value={recipe.milestoneCount ?? recipe.config.milestoneCount}
          min={1}
          max={100}
          disabled={busy}
          onChange={(next) => onUpdateRecipe(recipe.id, { milestoneCount: next })}
        />
        <span className={fieldUnit}>verified referrals</span>
      </div>
      <div className={fieldRow}>
        <AutomationNumberField
          label="Hours after the milestone"
          value={delay}
          min={0}
          max={168}
          disabled={busy}
          onChange={(next) => onUpdateRecipe(recipe.id, { delayHours: next })}
        />
        <span className={fieldUnit}>hours after the milestone</span>
      </div>
    </>
  );
}

function TestSendForm({ busy, dirty, testTo, onTestToChange, onSendTest, recipe }) {
  return (
    <EmailTestSendForm
      value={testTo}
      onChange={onTestToChange}
      busy={busy}
      disabled={dirty}
      onSubmit={(event) => onSendTest(event, recipe)}
    />
  );
}

export function AutomationRecipePanel({
  recipe,
  templates = EMPTY_TEMPLATES,
  checks,
  busy,
  deliveryReady,
  dirty,
  validValues,
  editorRef,
  testTo,
  onTestToChange,
  onUpdateRecipe,
  onPreview,
  onSave,
  onChangeStatus,
  onSendTest,
}) {
  const delay = recipe.delayHours ?? hourValue(recipe.config.delayMinutes);
  const enabled = recipe.status === "ENABLED";
  const timing = recipeTiming(recipe);
  const [mode, setMode] = useState("visual");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [templateChoice, setTemplateChoice] = useState("");

  function applyTemplate() {
    const template = templates[templateChoice];
    if (!template) return;
    const content =
      template.editorDocument || template.renderedHtml || template.starterHtml || "<p></p>";
    editorRef.current?.editor?.commands?.setContent(content);
    const document = editorRef.current?.getJSON?.() || content;
    onUpdateRecipe(recipe.id, {
      config: { ...recipe.config, subject: template.subject, editorDocument: document },
    });
    setTemplateChoice("");
  }

  async function changeMode(nextMode) {
    if (nextMode === "html") {
      try {
        if (!editorRef.current?.editor) throw new Error("The editor is still loading.");
        const { html } = await editorRef.current.getEmail();
        setHtmlDraft(html);
      } catch {
        return;
      }
    }
    setMode(nextMode);
  }
  function applyHtml() {
    editorRef.current?.editor?.commands?.setContent(htmlDraft || "<p></p>");
    setMode("visual");
  }

  return (
    <section className={pane} aria-label={recipe.title}>
      <header className={paneHead}>
        <div>
          <h2 className={paneTitle}>{recipe.title}</h2>
          <p className={paneMeta}>{timing}</p>
        </div>
        <div className={paneActions}>
          <Button type="button" variant="default" onClick={onSave} disabled={busy || !validValues}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
          <TooltipProvider delay={100}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant={enabled ? "outline" : "default"}
                    onClick={onChangeStatus}
                    disabled={busy || (!enabled && (!deliveryReady || dirty))}
                  >
                    {busy ? "Saving…" : enabled ? "Pause" : dirty ? "Save first" : "Enable"}
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                {statusTooltipText({ enabled, deliveryReady, dirty })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <div className={fieldCard}>
        <TimingFields recipe={recipe} delay={delay} busy={busy} onUpdateRecipe={onUpdateRecipe} />
        <div className={fieldRow}>
          <input
            className={fieldInput}
            maxLength={160}
            aria-label="Subject"
            placeholder="Subject — what subscribers see in the inbox"
            value={recipe.config.subject}
            disabled={busy}
            onChange={(event) =>
              onUpdateRecipe(recipe.id, {
                config: { ...recipe.config, subject: event.target.value },
              })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SavedTemplateSelect
          value={templateChoice}
          onValueChange={setTemplateChoice}
          templates={templates}
          disabled={busy}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!templateChoice || busy}
          onClick={applyTemplate}
        >
          Use template
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <EmailComposerModeBar mode={mode} setMode={changeMode} />
        <Button type="button" variant="outline" onClick={onPreview} disabled={busy}>
          Preview email
        </Button>
      </div>
      {mode === "html" ? (
        <div className="flex flex-col gap-3">
          <HtmlSourceEditor value={htmlDraft} onChange={setHtmlDraft} />
          <div className={metaBar}>
            <p className={hint}>Paste or edit HTML, then apply it to the visual editor.</p>
            <Button type="button" variant="default" onClick={applyHtml}>
              Apply HTML
            </Button>
          </div>
        </div>
      ) : null}
      <div className={canvasShell} hidden={mode === "html"}>
        <EmailCanvas
          key={recipe.id}
          editorRef={editorRef}
          content={
            recipe.config.editorDocument ||
            `<p>${String(recipe.config.body || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])}</p>`
          }
          onChange={(document) =>
            onUpdateRecipe(recipe.id, {
              config: { ...recipe.config, editorDocument: document },
            })
          }
          editable={!busy}
        />
      </div>

      {checks ? (
        <EmailPreviewResult
          html={checks.html}
          text={checks.text}
          subject={recipe.config.subject}
          viewport={viewport}
          onViewportChange={setViewport}
        />
      ) : null}

      <div className={metaBar}>
        <VariableChips
          keys={
            recipe.type === "REFERRAL_MILESTONE" || recipe.type === "REFERRAL_REMINDER"
              ? ["waitlist", "name", "referral_count", "referral_link", "points"]
              : ["waitlist", "name", "position", "points", "referral_link"]
          }
        />
        <TestSendForm
          recipe={recipe}
          busy={busy}
          dirty={dirty}
          testTo={testTo}
          onTestToChange={onTestToChange}
          onSendTest={onSendTest}
        />
      </div>

      {recipe.type.startsWith("REFERRAL_") ? (
        <p className={hint}>
          Sharing on the waitlist page is controlled in Settings → Referral sharing. This email just
          includes each subscriber’s personal link.
        </p>
      ) : null}
    </section>
  );
}
