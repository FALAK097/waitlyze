"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { upsertEmailTemplate, sendTestEmail } from "@/app/actions/emails";
import { Button } from "@/components/ui/button";
import { applySeedVars } from "@/lib/email/preview-vars.mjs";

import { EmailCanvas } from "./email-canvas";
import {
  EmailPreviewFrame,
  HtmlSourceEditor,
  SpamHintView,
  VariableChips,
} from "./email-composer-extras";
import { EmailComposerModeBar } from "./email-composer-mode-bar";

const scope = "min-w-0 bg-white text-product-text-primary";
const unsaved =
  "mb-5.5 flex flex-wrap items-center gap-3 rounded-product-control bg-product-warning-bg px-4 py-3 text-caption";
const unsavedText = "min-w-45 flex-1";
const unsavedButton =
  "min-h-8.5 rounded-product-control px-3 text-caption font-semibold text-product-text-primary cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";
const unsavedGhost = `${unsavedButton} border-0 bg-transparent`;
const unsavedSolid = `${unsavedButton} border border-product-border-subtle bg-white`;
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
const fieldInput =
  "min-w-0 flex-1 border-0 bg-transparent py-3.5 text-body text-product-text-primary focus-visible:outline-none!";
const canvasShell = "overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const metaBar =
  "flex flex-wrap items-center justify-between gap-3.5 max-sm:flex-col max-sm:items-stretch";
const testForm = "flex items-center gap-2";
const testInput =
  "h-9 w-45 min-w-0 rounded-product-control border border-product-border-control bg-white px-2.5 text-caption max-sm:w-auto max-sm:flex-1 max-sm:text-base";
const testButton =
  "min-h-9 rounded-product-control border border-transparent bg-product-bg-inset px-3.5 text-caption font-semibold text-product-text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";
const hint = "m-0 text-caption leading-normal text-product-text-secondary";

const kinds = [
  {
    key: "signup",
    label: "Welcome",
    timing: "Sent after confirmation",
    note: "Classic waitlist pages. Snapshot pages can use the Welcome automation.",
  },
  {
    key: "referral-congrats",
    label: "Referral congrats",
    timing: "Sent by hand or broadcast",
    note: "Celebrate a subscriber's referrals — pairs with the milestone automation.",
  },
  {
    key: "launch-invite",
    label: "Launch invite",
    timing: "Sent by hand or broadcast",
    note: "The doors are open — invite the list with their position and points.",
  },
  {
    key: "offboarding",
    label: "Offboarding",
    timing: "Never sent on its own",
    note: "A saved draft. To reach subscribers today, use Broadcasts.",
  },
];

const VARIABLE_SETS = {
  signup: ["waitlist", "name", "position", "referral_link", "points"],
  "referral-congrats": ["name", "referral_count", "position", "points", "referral_link"],
  "launch-invite": ["name", "position", "points", "waitlist_url", "referral_link"],
  offboarding: ["waitlist", "name", "referral_link"],
};

export function EmailTemplatesManager({ waitListId, waitListName, initialTemplates }) {
  const [current, setCurrent] = useState("signup");
  const [drafts, setDrafts] = useState(initialTemplates);
  // Last-saved copy, read only in handlers (never rendered): a ref avoids
  // redrawing the whole manager on every save.
  const savedRef = useRef(initialTemplates);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState("");
  const [testTo, setTestTo] = useState("");
  const [mode, setMode] = useState("write");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [preview, setPreview] = useState(null);
  const [viewport, setViewport] = useState("desktop");
  const editorRef = useRef(null);
  const template = drafts[current];
  const kind = kinds.find((item) => item.key === current);

  function edit(field, value) {
    setDrafts((items) => ({ ...items, [current]: { ...items[current], [field]: value } }));
    setDirty(true);
  }
  function select(key) {
    if (dirty) {
      setPending(key);
      return;
    }
    setCurrent(key);
    setPending(null);
    setMode("write");
    setPreview(null);
  }
  function discard() {
    setDrafts((items) => ({ ...items, [current]: savedRef.current[current] }));
    setDirty(false);
    setCurrent(pending);
    setPending(null);
    setMode("write");
    setPreview(null);
  }
  async function exportMessage() {
    if (!editorRef.current?.editor) throw new Error("The editor is still loading.");
    const { html, text } = await editorRef.current.getEmail();
    return JSON.parse(
      JSON.stringify({
        editorDocument: editorRef.current.getJSON(),
        renderedHtml: html,
        renderedText: text,
      }),
    );
  }
  async function save() {
    setBusy("save");
    try {
      const content = await exportMessage();
      const response = await upsertEmailTemplate({
        waitListId,
        templateType: current,
        data: { subject: template.subject, previewText: template.previewText, ...content },
      });
      if (!response.success) throw new Error(response.message);
      const savedTemplate = { ...template, ...response.template };
      setDrafts((items) => ({ ...items, [current]: savedTemplate }));
      savedRef.current = { ...savedRef.current, [current]: savedTemplate };
      setDirty(false);
      setPreview(null);
      toast.success("Email saved.");
    } catch (error) {
      toast.error(error.message || "Couldn't save the email.");
    } finally {
      setBusy("");
    }
  }
  async function enterHtmlMode() {
    try {
      const content = await exportMessage();
      setHtmlDraft(content.renderedHtml);
      setMode("html");
    } catch (error) {
      toast.error(error.message || "The editor is still loading.");
    }
  }
  async function applyHtmlToEditor() {
    try {
      editorRef.current?.editor?.commands?.setContent(htmlDraft || "<p></p>");
      // TipTap fires onUpdate, which marks the draft dirty via onChange.
      setMode("write");
      toast.success("HTML applied to the editor. Save to keep it.");
    } catch {
      toast.error("Couldn't apply that HTML. Check the markup and try again.");
    }
  }
  async function enterPreview() {
    try {
      const content = await exportMessage();
      setPreview({
        html: applySeedVars(content.renderedHtml, waitListName),
        text: content.renderedText,
      });
      setMode("write");
    } catch (error) {
      toast.error(error.message || "The editor is still loading.");
    }
  }
  async function sendTest(event) {
    event.preventDefault();
    if (dirty) return toast.error("Save your changes before sending a test.");
    setBusy("test");
    try {
      const response = await sendTestEmail({ waitListId, templateType: current, to: testTo });
      if (!response.success) throw new Error(response.message);
      toast.success(`Test sent to ${testTo}.`);
    } catch (error) {
      toast.error(error.message || "Couldn't send the test.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className={scope}>
      {pending && (
        <div className={unsaved} role="alert">
          <span className={unsavedText}>
            Save this email before switching, or discard your edits.
          </span>
          <button type="button" className={unsavedGhost} onClick={() => setPending(null)}>
            Keep editing
          </button>
          <button type="button" className={unsavedSolid} onClick={discard}>
            Discard edits
          </button>
        </div>
      )}
      <div className={split}>
        <nav className={rail} aria-label="Email templates">
          {kinds.map((item) => (
            <button
              key={item.key}
              type="button"
              className={railItem}
              aria-current={current === item.key ? "true" : undefined}
              onClick={() => select(item.key)}
            >
              <strong className={railItemTitle}>{item.label}</strong>
              <span className={railItemMeta}>{item.timing}</span>
            </button>
          ))}
        </nav>
        <section className={pane} aria-label={`${kind.label} email`}>
          <header className={paneHead}>
            <div>
              <h2 className={paneTitle}>{kind.label}</h2>
              <p className={paneMeta}>{kind.note}</p>
            </div>
            <div className={paneActions}>
              <Button type="button" variant="default" onClick={save} disabled={Boolean(busy)}>
                {busy === "save" ? "Saving…" : "Save"}
              </Button>
            </div>
          </header>
          <div className={fieldCard}>
            <div className={fieldRow}>
              <input
                className={fieldInput}
                type="text"
                maxLength={160}
                aria-label="Subject"
                placeholder="Subject — what subscribers see in the inbox"
                value={template.subject}
                onChange={(event) => edit("subject", event.target.value)}
              />
            </div>
            <div className={fieldRow}>
              <input
                className={fieldInput}
                type="text"
                maxLength={180}
                aria-label="Preview text"
                placeholder="Preview text — shown after the subject"
                value={template.previewText}
                onChange={(event) => edit("previewText", event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EmailComposerModeBar
              mode={mode === "html" ? "html" : "visual"}
              setMode={(next) => (next === "html" ? enterHtmlMode() : setMode("write"))}
              viewport={viewport}
              setViewport={setViewport}
            />
            <Button type="button" variant="outline" onClick={enterPreview}>
              Preview email
            </Button>
          </div>
          {mode === "html" ? (
            <div className="flex flex-col gap-3">
              <HtmlSourceEditor value={htmlDraft} onChange={setHtmlDraft} />
              <div className={metaBar}>
                <p className={hint}>
                  Raw HTML mode — apply it back to the visual editor, then save.
                </p>
                <Button type="button" variant="default" onClick={applyHtmlToEditor}>
                  Apply to editor
                </Button>
              </div>
            </div>
          ) : null}
          {preview ? (
            <div className="flex flex-col gap-4">
              <EmailPreviewFrame
                html={preview.html}
                viewport={viewport}
                onViewportChange={setViewport}
              />
              <SpamHintView
                subject={template.subject}
                previewText={template.previewText}
                text={preview.text}
                html={preview.html}
              />
            </div>
          ) : null}
          {/* The live editor stays mounted in every mode: `applyHtmlToEditor`
              (setContent) and `save` → `exportMessage` both go through
              `editorRef.current`, which would be null if we unmounted the
              canvas for HTML/Preview modes. Hide it instead. */}
          <div className={mode === "html" ? `${canvasShell} hidden` : canvasShell}>
            <EmailCanvas
              key={current}
              editorRef={editorRef}
              content={
                template.editorDocument || template.starterHtml || "<p>Write your message…</p>"
              }
              onChange={(value) => edit("editorDocument", value)}
            />
          </div>
          <div className={metaBar}>
            <VariableChips keys={VARIABLE_SETS[current] || VARIABLE_SETS.signup} />
            <form className={testForm} onSubmit={sendTest}>
              <input
                className={testInput}
                id="subscriber-test-address"
                type="email"
                placeholder="you@example.com"
                required
                maxLength={320}
                aria-label="Send a test to"
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
              />
              <button type="submit" className={testButton} disabled={Boolean(busy) || dirty}>
                {busy === "test" ? "Sending…" : "Send test"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
