"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { saveAutomationRecipe, setAutomationStatus } from "@/app/actions/automations";
import { sendAutomationTestEmail } from "@/app/actions/emails";
import { applySeedVars } from "@/lib/email/preview-vars.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";

import { AutomationRecipePanel } from "./automation-recipe-panel";

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
const emptyPane = "max-w-107 py-1.5";
const emptyPaneTitle = "m-0 mb-1.5! text-section";
const emptyPaneBody = "m-0 mb-4.5! leading-relaxed text-product-text-secondary";

const hourValue = (minutes) => Number((minutes / 60).toFixed(2));
const EMPTY_TEMPLATES = {};

export function AutomationManager({
  waitListId,
  waitListName,
  initialRecipes,
  initialTemplates = EMPTY_TEMPLATES,
  deliveryReady,
}) {
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
        html: applySeedVars(html, waitListName),
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
    setChecks(null);
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
      const data = structuredClone({
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
      });
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
          <AutomationRecipePanel
            recipe={recipe}
            templates={initialTemplates}
            checks={checks}
            busy={busyId === recipe.id}
            deliveryReady={deliveryReady}
            dirty={hasUnsavedChanges(recipe)}
            validValues={hasValidValues(recipe)}
            editorRef={editorRef}
            testTo={testTo}
            onTestToChange={setTestTo}
            onUpdateRecipe={updateRecipe}
            onPreview={() => previewChecks(recipe)}
            onSave={() => save(recipe)}
            onChangeStatus={() => changeStatus(recipe)}
            onSendTest={sendTest}
          />
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
