"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { saveAutomationRecipe, setAutomationStatus } from "@/app/actions/automations";
import { sendAutomationTestEmail } from "@/app/actions/emails";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";

import { EmailCanvas } from "./email-canvas";
import {
  EmailPreviewFrame,
  SpamHintView,
  VariableChips,
  applySeedVars,
} from "./email-composer-extras";

const scope = "min-w-0 bg-white text-product-text-primary";
const notice =
  "m-0 rounded-lg bg-product-bg-inset px-3.5 py-2.75 text-caption leading-relaxed text-product-text-primary";
const split = "flex flex-col gap-6 md:gap-8 xl:gap-10 lg:flex-row lg:items-start";
const rail =
  "flex w-full shrink-0 flex-col gap-1 self-start sticky top-22 max-lg:static max-lg:flex-row max-lg:flex-wrap max-lg:gap-1.5 lg:w-52";
const railItem =
  "flex w-full flex-col gap-0.75 rounded-product-control border-0 bg-transparent p-3 text-left cursor-pointer hover:bg-product-bg-inset aria-[current=true]:bg-product-bg-inset disabled:cursor-default disabled:opacity-60 max-lg:min-w-38 max-lg:flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";
const railItemTitle = "text-body font-semibold wrap-anywhere";
const railItemMeta = "text-micro leading-normal text-product-text-secondary";
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
const emptyPane = "max-w-107 py-1.5";
const emptyPaneTitle = "m-0 mb-1.5! text-section";
const emptyPaneBody = "m-0 mb-4.5! leading-relaxed text-product-text-secondary";

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

export function AutomationManager({ waitListId, waitListName, initialRecipes, deliveryReady }) {
  const editorRef = useRef(null);
  const router = useRouter();
  const [recipes, setRecipes] = useState(() =>
    initialRecipes.map((recipe) => ({ ...recipe, savedConfig: recipe.config })),
  );
  const [busyId, setBusyId] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(initialRecipes[0]?.id || null);
  const [checks, setChecks] = useState(null);
  const [testTo, setTestTo] = useState("");

  async function previewChecks(recipe) {
    setBusyId(recipe.id);
    try {
      if (!editorRef.current?.editor) throw new Error("The message editor is still loading.");
      const { html, text } = await editorRef.current.getEmail();
      setChecks({
        html: applySeedVars(JSON.parse(JSON.stringify(html)), waitListName),
        text,
      });
    } catch (error) {
      toast.error(error.message || "Couldn’t build the preview. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function sendTest(event, recipe) {
    event.preventDefault();
    if (hasUnsavedChanges(recipe)) {
      toast.error("Save your changes before sending a test.");
      return;
    }
    setBusyId(recipe.id);
    try {
      const result = await sendAutomationTestEmail({
        waitListId,
        recipeId: recipe.id,
        to: testTo,
      });
      if (result.success) toast.success(`Test sent to ${testTo}.`);
      else toast.error(result.message);
    } catch (error) {
      toast.error(error.message || "Couldn’t send the test. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function updateRecipe(recipeId, update) {
    setRecipes((items) =>
      items.map((recipe) => (recipe.id === recipeId ? { ...recipe, ...update } : recipe)),
    );
  }

  function hasUnsavedChanges(recipe) {
    const delayMinutes = Math.round(
      Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes)) * 60,
    );
    return (
      recipe.config.subject !== recipe.savedConfig.subject ||
      JSON.stringify(recipe.config.editorDocument) !==
        JSON.stringify(recipe.savedConfig.editorDocument) ||
      delayMinutes !== recipe.savedConfig.delayMinutes ||
      (recipe.type === "REFERRAL_MILESTONE" &&
        Number(recipe.milestoneCount ?? recipe.config.milestoneCount) !==
          recipe.savedConfig.milestoneCount)
    );
  }

  function hasValidValues(recipe) {
    const delayHours = Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes));
    const milestoneCount = Number(recipe.milestoneCount ?? recipe.config.milestoneCount);
    return (
      Number.isInteger(delayHours) &&
      delayHours >= 0 &&
      delayHours <= 168 &&
      (recipe.type !== "REFERRAL_MILESTONE" ||
        (Number.isInteger(milestoneCount) && milestoneCount >= 1 && milestoneCount <= 100))
    );
  }

  async function save(recipe) {
    setBusyId(recipe.id);
    try {
      if (!editorRef.current?.editor) throw new Error("The message editor is still loading.");
      const { html, text } = await editorRef.current.getEmail();
      const data = JSON.parse(
        JSON.stringify({
          ...recipe.config,
          editorDocument: editorRef.current.getJSON(),
          renderedHtml: html,
          renderedText: text,
          body: text,
          delayMinutes: Math.round(
            Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes)) * 60,
          ),
          ...(recipe.type === "REFERRAL_MILESTONE"
            ? { milestoneCount: Number(recipe.milestoneCount ?? recipe.config.milestoneCount) }
            : {}),
        }),
      );
      const result = await saveAutomationRecipe({ waitListId, recipeId: recipe.id, data });
      if (result.success) {
        setChecks(null);
        updateRecipe(recipe.id, {
          config: result.config,
          savedConfig: result.config,
          version: result.version,
          delayHours: undefined,
          milestoneCount: undefined,
        });
        toast.success(result.message);
      } else toast.error(result.message);
    } catch (error) {
      toast.error(error.message || "Couldn’t save this recipe. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(recipe) {
    const nextStatus = recipe.status === "ENABLED" ? "PAUSED" : "ENABLED";
    setBusyId(recipe.id);
    try {
      const result = await setAutomationStatus({
        waitListId,
        recipeId: recipe.id,
        status: nextStatus,
      });
      if (result.success) {
        updateRecipe(recipe.id, { status: nextStatus });
        toast.success(result.message);
        router.refresh();
      } else toast.error(result.message);
    } catch {
      toast.error("Couldn’t update this recipe. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const recipe = recipes.find((item) => item.id === activeRecipe);

  return (
    <div className={scope}>
      {!deliveryReady ? (
        <p className={notice}>
          Email delivery needs setup before a recipe can be enabled. Saved recipes stay off until
          then.
        </p>
      ) : null}
      <div className={split}>
        <nav className={rail} aria-label="Automations">
          {recipes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={railItem}
              aria-current={activeRecipe === item.id ? "true" : undefined}
              disabled={Boolean(busyId)}
              onClick={() => {
                setActiveRecipe(item.id);
                setChecks(null);
              }}
            >
              <strong className={railItemTitle}>{item.title}</strong>
              <span className={railItemMeta}>{emailStatusLabel(item.status)}</span>
            </button>
          ))}
        </nav>

        {recipe ? (
          (() => {
            const delay = recipe.delayHours ?? hourValue(recipe.config.delayMinutes);
            const enabled = recipe.status === "ENABLED";
            const dirty = hasUnsavedChanges(recipe);
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
                              onClick={() => changeStatus(recipe)}
                              disabled={
                                busyId === recipe.id || (!enabled && (!deliveryReady || dirty))
                              }
                            >
                              {busyId === recipe.id
                                ? "Saving…"
                                : enabled
                                  ? "Pause"
                                  : dirty
                                    ? "Save first"
                                    : "Enable"}
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
                        disabled={busyId === recipe.id}
                        onChange={(next) => updateRecipe(recipe.id, { delayHours: next })}
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
                          disabled={busyId === recipe.id}
                          onChange={(next) => updateRecipe(recipe.id, { milestoneCount: next })}
                        />
                        <span className={fieldUnit}>verified referrals</span>
                      </div>
                      <div className={fieldRow}>
                        <AutomationNumberField
                          label="Hours after the milestone"
                          value={delay}
                          min={0}
                          max={168}
                          disabled={busyId === recipe.id}
                          onChange={(next) => updateRecipe(recipe.id, { delayHours: next })}
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
                      disabled={busyId === recipe.id}
                      onChange={(event) =>
                        updateRecipe(recipe.id, {
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
                      updateRecipe(recipe.id, {
                        config: { ...recipe.config, editorDocument: document },
                      })
                    }
                    editable={busyId !== recipe.id}
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => previewChecks(recipe)}
                      disabled={busyId === recipe.id}
                    >
                      Preview & spam check
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => save(recipe)}
                      disabled={busyId === recipe.id || !hasValidValues(recipe)}
                    >
                      {busyId === recipe.id ? "Saving…" : "Save changes"}
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

                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => sendTest(event, recipe)}
                >
                  <input
                    className="h-11 w-45 min-w-0 rounded-product-control border border-product-border-control bg-white px-2.5 text-caption max-sm:w-auto max-sm:flex-1 max-sm:text-base"
                    type="email"
                    placeholder="you@example.com"
                    required
                    maxLength={320}
                    aria-label="Send a test to"
                    value={testTo}
                    onChange={(event) => setTestTo(event.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="min-h-11"
                    disabled={busyId === recipe.id || hasUnsavedChanges(recipe)}
                  >
                    {busyId === recipe.id ? "Sending…" : "Send test"}
                  </Button>
                </form>

                {recipe.type.startsWith("REFERRAL_") ? (
                  <p className={hint}>
                    Sharing on the waitlist page is controlled in Settings → Referral sharing. This
                    email just includes each subscriber’s personal link.
                  </p>
                ) : null}
              </section>
            );
          })()
        ) : (
          <div className={emptyPane}>
            <h2 className={emptyPaneTitle}>No automations yet</h2>
            <p className={emptyPaneBody}>Welcome and referral follow-ups will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
