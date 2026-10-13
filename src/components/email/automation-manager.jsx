"use client";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import { formatProductDate } from "@/lib/product-date.mjs";

import { useState } from "react";
import { toast } from "sonner";
import styles from "./email-tools.module.css";
import { useRouter } from "next/navigation";
import { saveAutomationRecipe, setAutomationStatus } from "@/app/actions/automations";

const hourValue = (minutes) => Number((minutes / 60).toFixed(2));
const waitLabel = (minutes) => minutes === 0 ? "Immediately" : minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? "hour" : "hours"} later` : `${minutes} minutes later`;
const statusLabel = (status) => ({ DRAFT: "Off", ENABLED: "Enabled", PAUSED: "Paused", PENDING: "Scheduled", PROCESSING: "Sending", SENT: "Sent", SKIPPED: "Skipped", FAILED: "Needs attention", CANCELED: "Canceled" })[status] || status;
const reasonLabel = (value) => value ? value.toLowerCase().replaceAll("_", " ") : "";
const formatTime = (value) => formatProductDate(value);

export function AutomationManager({ waitListId, initialRecipes, initialRuns, deliveryReady }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(() => initialRecipes.map((recipe) => ({ ...recipe, savedConfig: recipe.config })));
  const [runs] = useState(initialRuns);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(initialRecipes[0]?.id || null);
  function notify(text, failure = false) { setMessage(text); setMessageError(failure); if (failure) toast.error(text); else toast.success(text); }

  function updateRecipe(recipeId, update) {
    setRecipes((items) => items.map((recipe) => recipe.id === recipeId ? { ...recipe, ...update } : recipe));
  }

  function hasUnsavedChanges(recipe) {
    const delayMinutes = Math.round(Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes)) * 60);
    return recipe.config.subject !== recipe.savedConfig.subject || recipe.config.body !== recipe.savedConfig.body || delayMinutes !== recipe.savedConfig.delayMinutes ||
      (recipe.type === "REFERRAL_MILESTONE" && Number(recipe.milestoneCount ?? recipe.config.milestoneCount) !== recipe.savedConfig.milestoneCount);
  }

  function hasValidValues(recipe) {
    const delayHours = Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes));
    const milestoneCount = Number(recipe.milestoneCount ?? recipe.config.milestoneCount);
    return Number.isInteger(delayHours) && delayHours >= 0 && delayHours <= 168 &&
      (recipe.type !== "REFERRAL_MILESTONE" || Number.isInteger(milestoneCount) && milestoneCount >= 1 && milestoneCount <= 100);
  }

  async function save(recipe) {
    setBusyId(recipe.id);
    setMessage("");
    const data = {
      ...recipe.config,
      delayMinutes: Math.round(Number(recipe.delayHours ?? hourValue(recipe.config.delayMinutes)) * 60),
      ...(recipe.type === "REFERRAL_MILESTONE" ? { milestoneCount: Number(recipe.milestoneCount ?? recipe.config.milestoneCount) } : {}),
    };
    try {
      const result = await saveAutomationRecipe({ waitListId, recipeId: recipe.id, data });
      notify(result.message, !result.success);
      if (result.success) updateRecipe(recipe.id, { config: result.config, savedConfig: result.config, version: result.version, delayHours: undefined, milestoneCount: undefined });
    } catch {
      notify("Couldn’t save this recipe. Try again.", true);
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(recipe) {
    const nextStatus = recipe.status === "ENABLED" ? "PAUSED" : "ENABLED";
    setBusyId(recipe.id);
    setMessage("");
    try {
      const result = await setAutomationStatus({ waitListId, recipeId: recipe.id, status: nextStatus });
      notify(result.message, !result.success);
      if (result.success) {
        updateRecipe(recipe.id, { status: nextStatus });
        router.refresh();
      }
    } catch {
      notify("Couldn’t update this recipe. Try again.", true);
    } finally {
      setBusyId(null);
    }
  }

  return <div className={`${styles.scope} product-section automation-console`}>
    <div className="product-page-heading automation-heading">
      <div><h2 className="product-section-title">Automations</h2><p className="product-help">Follow up with verified subscribers who opted in.</p></div>
    </div>
    {!deliveryReady ? <section className="automation-setup" aria-label="Email setup required"><span aria-hidden="true">i</span><p>Email delivery needs setup before a recipe can be enabled. Your saved recipes stay off until then.</p></section> : null}

    <div className={styles.recipeWorkspace}>
      <nav aria-label="Automation recipes" className={styles.recipeNav}>{recipes.map((recipe) => <Button key={recipe.id} type="button" aria-current={activeRecipe === recipe.id ? "true" : undefined} disabled={Boolean(busyId)} onClick={() => setActiveRecipe(recipe.id)}><strong>{recipe.title}</strong><span>{statusLabel(recipe.status)}</span></Button>)}</nav>
      <div className="automation-recipe-list">
      {!recipes.length && <p className="product-help">No automation recipes are available yet.</p>}
      {recipes.filter((recipe) => recipe.id === activeRecipe).map((recipe) => {
        const delay = recipe.delayHours ?? hourValue(recipe.config.delayMinutes);
        const enabled = recipe.status === "ENABLED";
        const dirty = hasUnsavedChanges(recipe);
        const timing = recipe.type === "REFERRAL_MILESTONE" && Number(recipe.milestoneCount ?? recipe.config.milestoneCount) > 0
          ? `When they reach ${recipe.milestoneCount ?? recipe.config.milestoneCount} verified referrals`
          : `${recipe.type === "WELCOME" ? "After email confirmation" : "After email confirmation, if they have no verified referrals"} · ${waitLabel(Number.isFinite(delay) ? delay * 60 : 0)}`;
        return <article className="product-panel automation-recipe" key={recipe.id} aria-labelledby={`recipe-${recipe.id}`}>
          <div className="automation-recipe-top">
            <div><div className="automation-recipe-title"><h3 id={`recipe-${recipe.id}`}>{recipe.title}</h3><span className={`automation-status automation-status-${recipe.status.toLowerCase()}`}>{statusLabel(recipe.status)}</span></div><p className="product-help">{recipe.description}</p></div>
            <Button type="button" variant={enabled ? "outline" : "default"} onClick={() => changeStatus(recipe)} disabled={busyId === recipe.id || (!enabled && (!deliveryReady || dirty))}>{busyId === recipe.id ? "Saving…" : enabled ? "Pause" : dirty ? "Save changes first" : "Enable"}</Button>
          </div>
          <dl className="automation-recipe-summary"><div><dt>Starts</dt><dd>{recipe.type === "REFERRAL_MILESTONE" ? "A referred subscriber confirms their email" : "The subscriber confirms their email"}</dd></div><div><dt>Condition</dt><dd>{recipe.type === "REFERRAL_REMINDER" ? "Still has no verified referrals when the message is due" : recipe.type === "REFERRAL_MILESTONE" ? "Referral is eligible and the recipient opted in" : "Recipient opted in to launch updates"}</dd></div><div><dt>Timing</dt><dd>{timing}</dd></div><div><dt>Action</dt><dd>Send one email · version {recipe.version}</dd></div></dl>
          <Collapsible className="automation-editor" defaultOpen>
            <CollapsibleTrigger>Edit timing and email</CollapsibleTrigger><CollapsibleContent>
            <div className="automation-editor-fields">
              {recipe.type !== "REFERRAL_MILESTONE" ? <Label className="product-field"><span>Wait after confirmation (hours)</span><Input type="number" min="0" max="168" step="1" value={delay} disabled={busyId === recipe.id} onChange={(event) => updateRecipe(recipe.id, { delayHours: event.target.value })} /></Label> : <>
                <Label className="product-field"><span>Verified referrals to celebrate</span><Input type="number" min="1" max="100" step="1" value={recipe.milestoneCount ?? recipe.config.milestoneCount} disabled={busyId === recipe.id} onChange={(event) => updateRecipe(recipe.id, { milestoneCount: event.target.value })} /></Label>
                <Label className="product-field"><span>Wait after milestone (hours)</span><Input type="number" min="0" max="168" step="1" value={delay} disabled={busyId === recipe.id} onChange={(event) => updateRecipe(recipe.id, { delayHours: event.target.value })} /></Label>
              </>}
              <Label className="product-field"><span>Email subject</span><Input maxLength="160" value={recipe.config.subject} disabled={busyId === recipe.id} onChange={(event) => updateRecipe(recipe.id, { config: { ...recipe.config, subject: event.target.value } })} /></Label>
              <Label className="product-field automation-body-field"><span>Email message</span><Textarea rows="4" maxLength="3000" value={recipe.config.body} disabled={busyId === recipe.id} onChange={(event) => updateRecipe(recipe.id, { config: { ...recipe.config, body: event.target.value } })} /><small>Use <code>{"{{waitlist}}"}</code>{recipe.type === "REFERRAL_MILESTONE" ? <> and <code>{"{{referral_count}}"}</code></> : null} to personalize.</small></Label>
              <div className="automation-editor-actions"><Button type="button" variant="outline" onClick={() => save(recipe)} disabled={busyId === recipe.id || !hasValidValues(recipe)}>{busyId === recipe.id ? "Saving…" : "Save recipe"}</Button><span>Changes create a version; scheduled runs keep their saved version.</span></div>
            </div>
          </CollapsibleContent></Collapsible>
        </article>;
      })}
      </div>
    </div>
    <p className="automation-feedback" role={messageError ? "alert" : "status"} aria-live={messageError ? "assertive" : "polite"}>{message}</p>

    <section className="product-panel automation-history" aria-labelledby="automation-history-title">
      <div className="automation-history-heading"><div><h3 id="automation-history-title">Recent runs</h3><p className="product-help">A clear record of sent messages and skipped follow-ups.</p></div><span>{runs.length} shown</span></div>
      {runs.length ? <ul className="automation-run-list">{runs.map((run) => <li key={run.id}>
        <div><strong>{run.recipe}</strong><span>{run.recipient}</span></div><div><span className={`automation-status automation-status-${run.status.toLowerCase()}`}>{statusLabel(run.status)}</span>{run.reason ? <small>{reasonLabel(run.reason)}</small> : null}</div><time dateTime={run.scheduledAt}>{formatTime(run.scheduledAt)}</time>
      </li>)}</ul> : <p className="automation-empty">No runs yet. Recipes start only after you enable them.</p>}
    </section>
    <p className="automation-policy">All recipes require verified email and explicit marketing consent. Unsubscribe and workspace suppressions are checked again immediately before sending. Pausing cancels scheduled messages; a message already being handed to the provider may still arrive.</p>
  </div>;
}
