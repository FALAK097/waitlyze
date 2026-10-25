"use client";

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
import { EmailPreviewFrame, SpamHintView, VariableChips } from "./email-composer-extras";

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

const hourValue = (minutes) => Number((minutes / 60).toFixed(2));
const waitLabel = (minutes) =>
  minutes === 0
    ? "immediately"
    : minutes % 60 === 0
      ? `${minutes / 60} ${minutes === 60 ? "hour" : "hours"} later`
      : `${minutes} minutes later`;

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

export function AutomationRecipePanel({
  recipe,
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
  const milestoneCount = Number(recipe.milestoneCount ?? recipe.config.milestoneCount);
  const timing =
    recipe.type === "REFERRAL_MILESTONE" && milestoneCount > 0
      ? `At ${milestoneCount} verified referrals · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`
      : recipe.type === "REFERRAL_REMINDER"
        ? `After confirmation, if they still have no referrals · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`
        : recipe.type === "WELCOME_FOLLOWUP"
          ? `Welcome series, second note after confirmation · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`
          : recipe.type === "LAUNCH_COUNTDOWN"
            ? `After confirmation, ahead of launch · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`
            : `After confirmation · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`;

  return (
    <section className={pane} aria-label={recipe.title}>
      <header className={paneHead}>
        <div>
          <h2 className={paneTitle}>{recipe.title}</h2>
          <p className={paneMeta}>{timing}</p>
        </div>
        <div className={paneActions}>
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
                {enabled
                  ? "Sends automatically. Pause to stop until you resume it."
                  : deliveryReady
                    ? dirty
                      ? "Save your changes first, then enable."
                      : "Sends this email automatically to eligible subscribers."
                    : "Set up email delivery first to enable this email."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <div className={fieldCard}>
        {recipe.type !== "REFERRAL_MILESTONE" ? (
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
        ) : (
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
        )}
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

      <div className={canvasShell}>
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

      <div className={metaBar}>
        <VariableChips
          keys={
            recipe.type === "REFERRAL_MILESTONE" || recipe.type === "REFERRAL_REMINDER"
              ? ["waitlist", "name", "referral_count", "referral_link", "points"]
              : ["waitlist", "name", "position", "points", "referral_link"]
          }
        />
        <div className={paneActions}>
          <Button type="button" variant="outline" onClick={onPreview} disabled={busy}>
            Preview & spam check
          </Button>
          <Button type="button" variant="default" onClick={onSave} disabled={busy || !validValues}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {checks ? (
        <div className="flex flex-col gap-4">
          <EmailPreviewFrame html={checks.html} />
          <SpamHintView
            subject={recipe.config.subject}
            previewText=""
            text={checks.text}
            html={checks.html}
          />
        </div>
      ) : null}

      <form className="flex items-center gap-2" onSubmit={(event) => onSendTest(event, recipe)}>
        <input
          className="h-11 w-45 min-w-0 rounded-product-control border border-product-border-control bg-white px-2.5 text-caption max-sm:w-auto max-sm:flex-1 max-sm:text-base"
          type="email"
          placeholder="you@example.com"
          required
          maxLength={320}
          aria-label="Send a test to"
          value={testTo}
          onChange={(event) => onTestToChange(event.target.value)}
        />
        <Button type="submit" variant="outline" className="min-h-11" disabled={busy || dirty}>
          {busy ? "Sending…" : "Send test"}
        </Button>
      </form>

      {recipe.type.startsWith("REFERRAL_") ? (
        <p className={hint}>
          Sharing on the waitlist page is controlled in Settings → Referral sharing. This email just
          includes each subscriber’s personal link.
        </p>
      ) : null}
    </section>
  );
}
