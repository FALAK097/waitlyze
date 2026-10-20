"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  cancelBroadcast,
  createBroadcastDraft,
  getBroadcastRecipients,
  listBroadcasts,
  queueBroadcast,
  saveBroadcastDraft,
} from "@/app/actions/emails";
import { Button } from "@/components/ui/button";
import { formatProductDate } from "@/lib/product-date.mjs";
import { cn } from "@/lib/utils";

import { EmailCanvas } from "./email-canvas";
import { EmailToolsNav } from "./email-tools-nav";

const statusBadge =
  "inline-flex min-h-6 items-center rounded-full border border-product-border-subtle px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-product-text-secondary";
const statusBadgeTone = {
  enabled: "border-product-success-text/34 text-product-success-text",
  sent: "border-product-success-text/34 text-product-success-text",
  failed: "border-product-danger-text/34 text-product-danger-text",
  canceled: "bg-product-bg-inset",
  skipped: "bg-product-bg-inset",
};

const scope = "min-w-0 bg-white text-product-text-primary";
const toolbar = "mb-6 flex justify-end gap-2.5";
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
const railItemTime = "text-micro text-product-text-secondary";
const railEmpty =
  "m-0 px-3 py-1 text-caption leading-relaxed text-product-text-secondary max-lg:px-1 max-lg:py-0";
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
const recipients = "flex flex-wrap items-center gap-x-3 gap-y-2.5 text-body";
const recipientsCount = "font-semibold";
const recipientsSamples = "m-0 basis-full text-xs text-product-text-secondary wrap-anywhere";
const hint = "m-0 text-caption leading-normal text-product-text-secondary";
const confirm =
  "flex flex-wrap items-center gap-2.5 rounded-lg border border-product-border-subtle bg-product-bg-inset px-4 py-3.5 text-body";
const confirmText = "m-0 min-w-50 flex-1";
const metaBar =
  "flex flex-wrap items-center justify-between gap-3.5 max-sm:flex-col max-sm:items-stretch";
const summary = "overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const summaryRow =
  "flex min-h-11.5 items-baseline gap-3 px-4 py-3 [&+&]:border-t border-product-border-subtle";
const summaryLabel = "w-27 shrink-0 text-xs text-product-text-secondary";
const summaryValue = "min-w-0 flex-1 text-body font-medium wrap-anywhere";
const stats = "m-0 text-caption text-product-text-secondary";
const sentMessage = "block h-115 w-full rounded-product-control border-0 bg-white";
const emptyPane = "max-w-107 py-1.5";
const emptyPaneTitle = "m-0 mb-1.5! text-section";
const emptyPaneBody = "m-0 mb-4.5! leading-relaxed text-product-text-secondary";

const emptyDraft = () => ({ name: "New broadcast", subject: "", previewText: "", body: "" });
const formatDate = (date) => formatProductDate(date);
const statusLabel = (status) =>
  ({
    DRAFT: "Draft",
    SENDING: "Sending",
    SENT: "Complete",
    CANCELED: "Canceled",
    FAILED: "Needs attention",
  })[status] || status;
const escapeText = (text) =>
  String(text || "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
const starterContent = (draft) =>
  draft.editorDocument ||
  `<p>${escapeText(draft.body || "Write your update…").replaceAll("\n", "<br>")}</p>`;

export function BroadcastManager({ waitListId, initialBroadcasts, initialPreview, deliveryReady }) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [selectedId, setSelectedId] = useState(initialBroadcasts[0]?.id || null);
  const [data, setData] = useState(initialBroadcasts[0] || emptyDraft());
  const [preview, setPreview] = useState(initialPreview);
  const [previewFresh, setPreviewFresh] = useState(false);
  const [reviewSend, setReviewSend] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const busy = Boolean(busyAction);
  const [draftDirty, setDraftDirty] = useState(false);
  const [reviewCancel, setReviewCancel] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const editorRef = useRef(null);

  function notify(text, failure = false) {
    if (failure) toast.error(text);
    else toast.success(text);
  }
  function requestSelection(broadcast) {
    if (draftDirty && broadcast.id !== selectedId) setPendingSelection(broadcast);
    else selectBroadcast(broadcast);
  }
  function edit(field, value) {
    setData((current) => ({ ...current, [field]: value }));
    setDraftDirty(true);
    setPreviewFresh(false);
    setReviewSend(false);
  }

  function selectBroadcast(broadcast) {
    setDraftDirty(false);
    setReviewCancel(false);
    setPendingSelection(null);
    setSelectedId(broadcast.id);
    setData({
      name: broadcast.name,
      subject: broadcast.subject,
      previewText: broadcast.previewText,
      body: broadcast.body,
      editorDocument: broadcast.editorDocument,
      renderedHtml: broadcast.renderedHtml,
    });
    setPreviewFresh(false);
    setReviewSend(false);
  }

  async function refreshBroadcasts(selected = selectedId) {
    const updated = await listBroadcasts(waitListId);
    setBroadcasts(updated);
    const active = updated.find((item) => item.id === selected);
    if (active) selectBroadcast(active);
    router.refresh();
  }

  async function createDraft() {
    setBusyAction("create");
    try {
      const draft = await createBroadcastDraft(waitListId);
      setBroadcasts((items) => [draft, ...items]);
      setSelectedId(draft.id);
      setData({
        name: draft.name,
        subject: draft.subject,
        previewText: draft.previewText,
        body: draft.body,
        editorDocument: draft.editorDocument,
        renderedHtml: draft.renderedHtml,
      });
      setPreviewFresh(false);
      setDraftDirty(false);
      notify("Draft created.");
    } catch {
      notify("Couldn’t create a draft. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function saveDraft(event) {
    event.preventDefault();
    if (!selectedId || (data.status && data.status !== "DRAFT")) return;
    setBusyAction("save");
    try {
      if (!editorRef.current?.editor) throw new Error("The message editor is still loading.");
      const { html, text } = await editorRef.current.getEmail();
      const payload = JSON.parse(
        JSON.stringify({
          ...data,
          editorDocument: editorRef.current.getJSON(),
          renderedHtml: html,
          renderedText: text,
        }),
      );
      const result = await saveBroadcastDraft({
        waitListId,
        broadcastId: selectedId,
        data: payload,
      });
      if (result.success) {
        setPreviewFresh(false);
        await refreshBroadcasts(selectedId);
      }
      notify(result.message, !result.success);
    } catch {
      notify("Couldn’t save this draft. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function refreshPreview() {
    setBusyAction("preview");
    try {
      const nextPreview = await getBroadcastRecipients(waitListId);
      setPreview(nextPreview);
      setPreviewFresh(true);
      setReviewSend(false);
      notify(
        `Preview updated: ${nextPreview.count} eligible recipient${nextPreview.count === 1 ? "" : "s"}.`,
      );
    } catch {
      notify("Couldn’t refresh the recipient preview. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function sendBroadcast() {
    if (!selectedId || draftDirty || !previewFresh || !preview.count) return;
    setBusyAction("send");
    try {
      const result = await queueBroadcast({
        waitListId,
        broadcastId: selectedId,
        expectedRecipientCount: preview.count,
      });
      setReviewSend(false);
      if (result.success) await refreshBroadcasts(selectedId);
      notify(result.message, !result.success);
    } catch {
      notify("Couldn’t queue this broadcast. Refresh the preview and try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function stopBroadcast() {
    if (!selectedId) return;
    setBusyAction("cancel");
    try {
      const result = await cancelBroadcast({ waitListId, broadcastId: selectedId });
      await refreshBroadcasts(selectedId);
      notify(result.message, !result.success);
    } catch {
      notify("Couldn’t cancel the remaining emails. Refresh and check delivery status.", true);
    } finally {
      setBusyAction("");
    }
  }

  const selected = broadcasts.find((item) => item.id === selectedId);
  const editable = !selected || selected.status === "DRAFT";

  return (
    <div className={scope}>
      <EmailToolsNav waitListId={waitListId} current="broadcasts" />
      {broadcasts.length ? (
        <div className={toolbar}>
          <Button
            type="button"
            onClick={createDraft}
            disabled={busy || draftDirty}
            variant="default"
          >
            {busyAction === "create" ? "Creating…" : "New broadcast"}
          </Button>
        </div>
      ) : null}
      {pendingSelection && (
        <div className={unsaved} role="alert">
          <span className={unsavedText}>
            Discard your unsaved changes to open “{pendingSelection.name}”?
          </span>
          <button
            type="button"
            className={unsavedGhost}
            onClick={() => selectBroadcast(pendingSelection)}
          >
            Discard and open
          </button>
          <button type="button" className={unsavedSolid} onClick={() => setPendingSelection(null)}>
            Keep editing
          </button>
        </div>
      )}
      <div className={split}>
        <nav className={rail} aria-label="Broadcasts">
          {broadcasts.length ? (
            broadcasts.map((broadcast) => (
              <button
                key={broadcast.id}
                type="button"
                className={railItem}
                aria-current={selectedId === broadcast.id ? "true" : undefined}
                disabled={busy}
                onClick={() => requestSelection(broadcast)}
              >
                <strong className={railItemTitle}>
                  {broadcast.name || broadcast.subject || "Untitled broadcast"}
                </strong>
                <span className={railItemMeta}>
                  {statusLabel(broadcast.status)}
                  {broadcast.status !== "DRAFT" ? ` · ${broadcast.recipientCount} recipients` : ""}
                </span>
                <time
                  dateTime={new Date(broadcast.updatedAt).toISOString()}
                  className={railItemTime}
                >
                  {formatDate(broadcast.updatedAt)}
                </time>
              </button>
            ))
          ) : (
            <p className={railEmpty}>No drafts yet.</p>
          )}
        </nav>

        {selectedId ? (
          <form className={pane} aria-label="Broadcast editor" onSubmit={saveDraft}>
            <header className={paneHead}>
              <div>
                <h2 className={paneTitle}>
                  {editable ? data.name || "Untitled broadcast" : "Delivery summary"}
                </h2>
                {editable ? (
                  <p className={paneMeta}>Draft — nothing is sent until you confirm.</p>
                ) : null}
              </div>
              <div className={paneActions}>
                {!editable && (
                  <span
                    className={cn(
                      statusBadge,
                      statusBadgeTone[String(selected.status).toLowerCase()],
                    )}
                  >
                    {statusLabel(selected.status)}
                  </span>
                )}
                {editable && (
                  <Button type="submit" variant="default" disabled={busy}>
                    {busyAction === "save" ? "Saving…" : "Save draft"}
                  </Button>
                )}
              </div>
            </header>

            {editable ? (
              <>
                <div className={fieldCard}>
                  <div className={fieldRow}>
                    <input
                      className={fieldInput}
                      maxLength={120}
                      aria-label="Internal name"
                      placeholder="Name — only you see this"
                      value={data.name || ""}
                      onChange={(event) => edit("name", event.target.value)}
                    />
                  </div>
                  <div className={fieldRow}>
                    <input
                      className={fieldInput}
                      maxLength={160}
                      aria-label="Subject"
                      placeholder="Subject — what subscribers see in the inbox"
                      value={data.subject || ""}
                      onChange={(event) => edit("subject", event.target.value)}
                    />
                  </div>
                  <div className={fieldRow}>
                    <input
                      className={fieldInput}
                      maxLength={180}
                      aria-label="Preview text"
                      placeholder="Preview text — shown after the subject"
                      value={data.previewText || ""}
                      onChange={(event) => edit("previewText", event.target.value)}
                    />
                  </div>
                </div>
                <div className={canvasShell}>
                  <EmailCanvas
                    key={selectedId}
                    editorRef={editorRef}
                    content={starterContent(data)}
                    onChange={(document) => edit("editorDocument", document)}
                  />
                </div>
                <div className={recipients}>
                  <span className={recipientsCount}>{preview.count} eligible</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshPreview}
                    disabled={busy || draftDirty}
                  >
                    {busyAction === "preview" ? "Checking…" : "Check recipients"}
                  </Button>
                  {draftDirty && !previewFresh ? (
                    <span className={hint}>Save to check recipients.</span>
                  ) : null}
                  {!deliveryReady && previewFresh ? (
                    <span className={hint}>Email delivery needs setup before you can send.</span>
                  ) : null}
                  {preview.samples.length ? (
                    <p className={recipientsSamples}>e.g. {preview.samples.join(", ")}</p>
                  ) : previewFresh ? (
                    <p className={recipientsSamples}>No eligible subscribers yet.</p>
                  ) : null}
                </div>
                {previewFresh && deliveryReady && !draftDirty && preview.count > 0 ? (
                  reviewSend ? (
                    <div className={confirm} role="group" aria-label="Confirm broadcast send">
                      <p className={confirmText}>
                        Send “{data.subject}” to {preview.count} opted-in subscriber
                        {preview.count === 1 ? "" : "s"}? Delivery starts immediately.
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        onClick={sendBroadcast}
                        disabled={busy}
                      >
                        {busyAction === "send" ? "Queueing…" : `Send to ${preview.count}`}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setReviewSend(false)}
                        disabled={busy}
                      >
                        Back
                      </Button>
                    </div>
                  ) : (
                    <div className={metaBar}>
                      <p className={hint}>Eligibility is checked again before each send.</p>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => setReviewSend(true)}
                        disabled={busy || !data.subject?.trim() || !data.body?.trim()}
                      >
                        Review send
                      </Button>
                    </div>
                  )
                ) : null}
              </>
            ) : (
              <>
                <div className={summary}>
                  <div className={summaryRow}>
                    <span className={summaryLabel}>Subject</span>
                    <strong className={summaryValue}>{selected.subject || "—"}</strong>
                  </div>
                  {selected.previewText ? (
                    <div className={summaryRow}>
                      <span className={summaryLabel}>Preview text</span>
                      <strong className={summaryValue}>{selected.previewText}</strong>
                    </div>
                  ) : null}
                  <div className={summaryRow}>
                    <span className={summaryLabel}>Recipients</span>
                    <strong className={summaryValue}>{selected.recipientCount}</strong>
                  </div>
                  <div className={summaryRow}>
                    <span className={summaryLabel}>
                      {selected.status === "SENT" ? "Sent" : "Updated"}
                    </span>
                    <strong className={summaryValue}>
                      {formatDate(selected.sentAt || selected.updatedAt)}
                    </strong>
                  </div>
                </div>
                <p className={stats}>
                  {selected.deliveredCount || 0} delivered · {selected.failedCount || 0} failed ·{" "}
                  {selected.skippedCount || 0} skipped · {selected.canceledCount || 0} canceled
                </p>
                {selected.renderedHtml ? (
                  <iframe
                    className={sentMessage}
                    title="Sent email"
                    sandbox=""
                    srcDoc={selected.renderedHtml}
                  />
                ) : (
                  <p className={`${hint} whitespace-pre-line`}>{selected.body}</p>
                )}
              </>
            )}

            {selected?.status === "SENDING" ? (
              <div className={confirm}>
                {reviewCancel ? (
                  <>
                    <p className={confirmText}>
                      Cancel all emails that have not been handed to the provider?
                    </p>
                    <Button type="button" variant="outline" onClick={stopBroadcast} disabled={busy}>
                      {busyAction === "cancel" ? "Canceling…" : "Confirm cancellation"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setReviewCancel(false)}
                      disabled={busy}
                    >
                      Keep sending
                    </Button>
                  </>
                ) : (
                  <>
                    <p className={confirmText}>
                      Emails already handed to the provider may still arrive.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewCancel(true)}
                      disabled={busy}
                    >
                      Cancel remaining emails
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </form>
        ) : (
          <div className={emptyPane}>
            <h2 className={emptyPaneTitle}>No broadcasts yet</h2>
            <p className={emptyPaneBody}>
              Write one update, check who is eligible, then confirm to send it.
            </p>
            <Button type="button" variant="default" onClick={createDraft} disabled={busy}>
              {busyAction === "create" ? "Creating…" : "New broadcast"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
