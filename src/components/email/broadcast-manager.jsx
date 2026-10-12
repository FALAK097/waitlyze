"use client";

import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";

import { formatProductDate } from "@/lib/product-date.mjs";

import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./email-tools.module.css";
import { useRouter } from "next/navigation";
import { EmailToolsNav } from "./email-tools-nav";
import {
  cancelBroadcast,
  createBroadcastDraft,
  getBroadcastRecipients,
  listBroadcasts,
  queueBroadcast,
  saveBroadcastDraft,
} from "@/app/actions/emails";

const emptyDraft = () => ({ name: "New broadcast", subject: "", previewText: "", body: "" });
const formatDate = (date) => formatProductDate(date);
const statusLabel = (status) => ({ DRAFT: "Draft", SENDING: "Sending", SENT: "Complete", CANCELED: "Canceled", FAILED: "Needs attention" })[status] || status;

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
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [reviewCancel, setReviewCancel] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  function requestSelection(broadcast) { if (draftDirty && broadcast.id !== selectedId) setPendingSelection(broadcast); else selectBroadcast(broadcast); }
  function notify(text, failure = false) { setMessage(text); setMessageError(failure); if (failure) toast.error(text); else toast.success(text); }
  function edit(field, value) { setData((current) => ({ ...current, [field]: value })); setDraftDirty(true); setPreviewFresh(false); setReviewSend(false); }

  function selectBroadcast(broadcast) {
    setDraftDirty(false); setReviewCancel(false); setPendingSelection(null);
    setSelectedId(broadcast.id);
    setData({ name: broadcast.name, subject: broadcast.subject, previewText: broadcast.previewText, body: broadcast.body });
    setPreviewFresh(false);
    setReviewSend(false);
    setMessage("");
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
    setMessage("");
    try {
      const draft = await createBroadcastDraft(waitListId);
      setBroadcasts((items) => [draft, ...items]);
      setSelectedId(draft.id);
      setData({ name: draft.name, subject: draft.subject, previewText: draft.previewText, body: draft.body });
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
    if (!selectedId || data.status && data.status !== "DRAFT") return;
    setBusyAction("save");
    setMessage("");
    try {
      const result = await saveBroadcastDraft({ waitListId, broadcastId: selectedId, data });
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
    setMessage("");
    try {
      const nextPreview = await getBroadcastRecipients(waitListId);
      setPreview(nextPreview);
      setPreviewFresh(true);
      setReviewSend(false);
      notify(`Preview updated: ${nextPreview.count} eligible recipient${nextPreview.count === 1 ? "" : "s"}.`);
    } catch {
      notify("Couldn’t refresh the recipient preview. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function sendBroadcast() {
    if (!selectedId || draftDirty || !previewFresh || !preview.count) return;
    setBusyAction("send");
    setMessage("");
    try {
      const result = await queueBroadcast({ waitListId, broadcastId: selectedId, expectedRecipientCount: preview.count });
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

  return <div className={`${styles.scope} product-section`}>
    <EmailToolsNav waitListId={waitListId} current="broadcasts" />
    <div className="product-page-heading">
      <div><h2 className="product-section-title">Broadcasts</h2><p className="product-help">Send a one-time update to verified subscribers who opted in.</p></div>
      <Button type="button" onClick={createDraft} disabled={busy || draftDirty} variant="default">{busyAction === "create" ? "Creating…" : "New broadcast"}</Button>
    </div>
    {pendingSelection && <section className="broadcast-selection-confirm" aria-label="Unsaved broadcast changes"><p>You have unsaved changes. Discard them and open “{pendingSelection.name}”?</p><div><Button type="button" variant="outline" onClick={() => selectBroadcast(pendingSelection)}>Discard changes</Button><Button type="button" variant="ghost" onClick={() => setPendingSelection(null)}>Keep editing</Button></div></section>}
    <div className="broadcast-layout">
      <section className="product-panel broadcast-list" aria-label="Saved broadcasts">
        <h3>Recent</h3>
        {broadcasts.length ? <ul>{broadcasts.map((broadcast) => <li key={broadcast.id}>
          <Button type="button" className="broadcast-list-item" aria-current={selectedId === broadcast.id ? "true" : undefined} variant="ghost" onClick={() => requestSelection(broadcast)} disabled={busy}>
            <strong>{broadcast.name || broadcast.subject || "Untitled broadcast"}</strong>
            <span>{statusLabel(broadcast.status)}{broadcast.status !== "DRAFT" ? ` · ${broadcast.recipientCount} recipients` : ""}</span>
            {broadcast.status !== "DRAFT" ? <span>{broadcast.deliveredCount || 0} delivered · {broadcast.failedCount || 0} failed · {broadcast.skippedCount || 0} skipped · {broadcast.canceledCount || 0} canceled</span> : null}
            <time dateTime={new Date(broadcast.updatedAt).toISOString()}>{formatDate(broadcast.updatedAt)}</time>
          </Button>
        </li>)}</ul> : <p className="product-help">Your saved drafts will appear here.</p>}
      </section>

      {selectedId ? <section className="product-panel broadcast-editor" aria-label="Broadcast editor">
        <form onSubmit={saveDraft}>
          <div className="broadcast-editor-heading"><div><p className="product-eyebrow">{selected ? statusLabel(selected.status) : "DRAFT"}</p><h3>{editable ? "Write your update" : "Delivery summary"}</h3></div></div>
          <Label className="product-field"><span>Internal name</span><Input maxLength={120} value={data.name || ""} disabled={!editable || busy} onChange={(event) => edit("name", event.target.value)} /></Label>
          <Label className="product-field"><span>Subject</span><Input maxLength={160} value={data.subject || ""} disabled={!editable || busy} onChange={(event) => edit("subject", event.target.value)} /></Label>
          <Label className="product-field"><span>Preview text <span className="product-help">Optional</span></span><Input maxLength={180} value={data.previewText || ""} disabled={!editable || busy} onChange={(event) => edit("previewText", event.target.value)} /></Label>
          <Label className="product-field"><span>Message</span><Textarea maxLength={5000} rows={9} value={data.body || ""} disabled={!editable || busy} onChange={(event) => edit("body", event.target.value)} /></Label>
          {editable ? <div className="broadcast-actions"><Button type="submit" disabled={busy} variant="outline">{busyAction === "save" ? "Saving…" : "Save draft"}</Button><Button type="button" onClick={refreshPreview} disabled={busy || draftDirty} variant="outline">{busyAction === "preview" ? "Refreshing…" : "Preview recipients"}</Button></div> : null}
        </form>

        {draftDirty && <p className="product-help">Save your changes before previewing recipients and sending.</p>}
        <section className="broadcast-recipient-preview" aria-labelledby="broadcast-preview-title">
          <div><h4 id="broadcast-preview-title">Recipient preview</h4><p>{editable ? `${preview.count} verified, opted-in subscriber${preview.count === 1 ? "" : "s"} are currently eligible. Unsubscribed and suppressed addresses are excluded.` : `${selected.recipientCount} subscribers were included in this send snapshot. Eligibility is checked again before each delivery.`}</p></div>
          {editable && preview.samples.length ? <p className="broadcast-samples">Examples: {preview.samples.join(", ")}</p> : editable ? <p className="broadcast-samples">No eligible subscribers yet. New subscribers can choose to receive updates when they join.</p> : <p className="broadcast-samples">Email addresses stay private in this delivery view.</p>}
          {editable && previewFresh && !deliveryReady ? <p className="product-status-warning">Email delivery needs setup before you can send.</p> : null}
          {editable && !draftDirty && previewFresh && deliveryReady && preview.count > 0 ? <div className="broadcast-review">
            {!reviewSend ? <Button type="button" variant="default" onClick={() => setReviewSend(true)} disabled={busy || !data.subject?.trim() || !data.body?.trim()}>Review send</Button> : <div role="group" aria-label="Confirm broadcast send">
              <p>Send “{data.subject}” to {preview.count} opted-in subscriber{preview.count === 1 ? "" : "s"}? Delivery starts immediately.</p>
              <Button type="button" onClick={sendBroadcast} disabled={busy} variant="default">{busyAction === "send" ? "Queueing…" : `Send to ${preview.count}`}</Button>
              <Button type="button" variant="ghost" onClick={() => setReviewSend(false)} disabled={busy}>Go back</Button>
            </div>}
          </div> : null}
        </section>
        {!editable ? <p className="broadcast-delivery-results">{selected.deliveredCount || 0} delivered of {selected.recipientCount}; {selected.failedCount || 0} failed, {selected.skippedCount || 0} skipped and {selected.canceledCount || 0} canceled.</p> : null}
        {selected?.status === "SENDING" ? <div className="broadcast-cancel"><p className="product-help">Emails already being handed to the provider may still arrive.</p>{reviewCancel ? <div><p>Cancel all emails that have not been handed to the provider?</p><Button type="button" onClick={stopBroadcast} disabled={busy} variant="outline">{busyAction === "cancel" ? "Canceling…" : "Confirm cancellation"}</Button><Button type="button" variant="ghost" onClick={() => setReviewCancel(false)} disabled={busy}>Keep sending</Button></div> : <Button type="button" variant="outline" onClick={() => setReviewCancel(true)} disabled={busy}>Cancel remaining emails</Button>}</div> : null}
        {selected && selected.status !== "DRAFT" ? <p className="broadcast-updated">Last updated {formatDate(selected.updatedAt)}</p> : null}
        <p className="broadcast-message" role={messageError ? "alert" : "status"} aria-live={messageError ? "assertive" : "polite"}>{message}</p>
      </section> : <section className="product-panel broadcast-empty"><h3>Start with a draft</h3><p>Write one clear update, preview the eligible audience, then confirm before it is queued.</p><Button type="button" onClick={createDraft} disabled={busy} variant="default">{busyAction === "create" ? "Creating…" : "Create a broadcast"}</Button></section>}
    </div>
  </div>;
}
