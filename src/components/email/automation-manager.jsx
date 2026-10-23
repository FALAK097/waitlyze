"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { saveAutomationRecipe, setAutomationStatus } from "@/app/actions/automations";
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

import styles from "./email-tools.module.css";

const hourValue = (minutes) => Number((minutes / 60).toFixed(2));
const waitLabel = (minutes) =>
  minutes === 0
    ? "immediately"
    : minutes % 60 === 0
      ? `${minutes / 60} ${minutes === 60 ? "hour" : "hours"} later`
      : `${minutes} minutes later`;
const statusLabel = (status) =>
  ({
    DRAFT: "Off",
    ENABLED: "Enabled",
    PAUSED: "Paused",
    PENDING: "Scheduled",
    PROCESSING: "Sending",
    SENT: "Sent",
    SKIPPED: "Skipped",
    FAILED: "Needs attention",
    CANCELED: "Canceled",
  })[status] || status;

function AutomationNumberField({ label, value, min, max, disabled, onChange }) {
  return (
    <NumberField
      className={styles.numberField}
      aria-label={label}
      value={Number(value)}
      min={min}
      max={max}
      step={1}
      disabled={disabled}
      onValueChange={(nextValue) => onChange(String(nextValue ?? min))}
    >
      <NumberFieldGroup className={styles.numberGroup}>
        <NumberFieldDecrement aria-label={`Decrease ${label}`} />
        <NumberFieldInput className={styles.numberInput} aria-label={label} />
        <NumberFieldIncrement aria-label={`Increase ${label}`} />
      </NumberFieldGroup>
    </NumberField>
  );
}

export function AutomationManager({ waitListId, initialRecipes, deliveryReady }) {
  const editorRef = useRef(null);
  const router = useRouter();
  const [recipes, setRecipes] = useState(() =>
    initialRecipes.map((recipe) => ({ ...recipe, savedConfig: recipe.config })),
  );
  const [busyId, setBusyId] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(initialRecipes[0]?.id || null);

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
    <div className={styles.scope}>
      {!deliveryReady ? (
        <p className={styles.notice}>
          Email delivery needs setup before a recipe can be enabled. Saved recipes stay off until
          then.
        </p>
      ) : null}
      <div className={styles.split}>
        <nav className={styles.rail} aria-label="Automations">
          {recipes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.railItem}
              aria-current={activeRecipe === item.id ? "true" : undefined}
              disabled={Boolean(busyId)}
              onClick={() => setActiveRecipe(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{statusLabel(item.status)}</span>
            </button>
          ))}
        </nav>

        {recipe ? (
          (() => {
            const delay = recipe.delayHours ?? hourValue(recipe.config.delayMinutes);
            const enabled = recipe.status === "ENABLED";
            const dirty = hasUnsavedChanges(recipe);
            const timing =
              recipe.type === "REFERRAL_MILESTONE" &&
              Number(recipe.milestoneCount ?? recipe.config.milestoneCount) > 0
                ? `At ${recipe.milestoneCount ?? recipe.config.milestoneCount} verified referrals · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`
                : `${recipe.type === "WELCOME" ? "After confirmation" : "After confirmation, if they still have no referrals"} · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`;
            return (
              <section className={styles.pane} aria-label={recipe.title}>
                <header className={styles.paneHead}>
                  <div>
                    <h2 className={styles.paneTitle}>{recipe.title}</h2>
                    <p className={styles.paneMeta}>{timing}</p>
                  </div>
                  <div className={styles.paneActions}>
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

                <div className={styles.fieldCard}>
                  {recipe.type !== "REFERRAL_MILESTONE" ? (
                    <div className={styles.fieldRow}>
                      <AutomationNumberField
                        label="Hours after confirmation"
                        value={delay}
                        min={0}
                        max={168}
                        disabled={busyId === recipe.id}
                        onChange={(next) => updateRecipe(recipe.id, { delayHours: next })}
                      />
                      <span className={styles.unit}>hours after confirmation</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.fieldRow}>
                        <AutomationNumberField
                          label="Verified referrals to celebrate"
                          value={recipe.milestoneCount ?? recipe.config.milestoneCount}
                          min={1}
                          max={100}
                          disabled={busyId === recipe.id}
                          onChange={(next) => updateRecipe(recipe.id, { milestoneCount: next })}
                        />
                        <span className={styles.unit}>verified referrals</span>
                      </div>
                      <div className={styles.fieldRow}>
                        <AutomationNumberField
                          label="Hours after the milestone"
                          value={delay}
                          min={0}
                          max={168}
                          disabled={busyId === recipe.id}
                          onChange={(next) => updateRecipe(recipe.id, { delayHours: next })}
                        />
                        <span className={styles.unit}>hours after the milestone</span>
                      </div>
                    </>
                  )}
                  <div className={styles.fieldRow}>
                    <input
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

                <div className={styles.canvasShell}>
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

                <div className={styles.metaBar}>
                  <p className={styles.chips}>
                    Personalize <code>{"{{waitlist}}"}</code>
                    <code>{"{{referral_link}}"}</code>
                    {recipe.type === "REFERRAL_MILESTONE" ? (
                      <code>{"{{referral_count}}"}</code>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => save(recipe)}
                    disabled={busyId === recipe.id || !hasValidValues(recipe)}
                  >
                    {busyId === recipe.id ? "Saving…" : "Save changes"}
                  </Button>
                </div>

                {recipe.type.startsWith("REFERRAL_") ? (
                  <p className={styles.hint}>
                    Sharing on the waitlist page is controlled in Settings → Referral sharing. This
                    email just includes each subscriber’s personal link.
                  </p>
                ) : null}
              </section>
            );
          })()
        ) : (
          <div className={styles.emptyPane}>
            <h2>No automations yet</h2>
            <p>Welcome and referral follow-ups will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
