"use client";

import { useState } from "react";
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
const formatDate = (date) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
const statusLabel = (status) => ({ DRAFT: "Draft", SENDING: "Sending", SENT: "Complete", CANCELED: "Canceled", FAILED: "Needs attention" })[status] || status;

export function BroadcastManager({ waitListId, initialBroadcasts, initialPreview, deliveryReady }) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [selectedId, setSelectedId] = useState(initialBroadcasts[0]?.id || null);
  const [data, setData] = useState(initialBroadcasts[0] || emptyDraft());
  const [preview, setPreview] = useState(initialPreview);
  const [previewFresh, setPreviewFresh] = useState(false);
  const [reviewSend, setReviewSend] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function selectBroadcast(broadcast) {
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
    setBusy(true);
    setMessage("");
    try {
      const draft = await createBroadcastDraft(waitListId);
      setBroadcasts((items) => [draft, ...items]);
      setSelectedId(draft.id);
      setData({ name: draft.name, subject: draft.subject, previewText: draft.previewText, body: draft.body });
      setPreviewFresh(false);
      setMessage("Draft created.");
    } catch {
      setMessage("Couldn’t create a draft. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft(event) {
    event.preventDefault();
    if (!selectedId || data.status && data.status !== "DRAFT") return;
    setBusy(true);
    setMessage("");
    try {
      const result = await saveBroadcastDraft({ waitListId, broadcastId: selectedId, data });
      if (result.success) {
        setPreviewFresh(false);
        await refreshBroadcasts(selectedId);
      }
      setMessage(result.message);
    } catch {
      setMessage("Couldn’t save this draft. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshPreview() {
    setBusy(true);
    setMessage("");
    try {
      const nextPreview = await getBroadcastRecipients(waitListId);
      setPreview(nextPreview);
      setPreviewFresh(true);
      setReviewSend(false);
      setMessage(`Preview updated: ${nextPreview.count} eligible recipient${nextPreview.count === 1 ? "" : "s"}.`);
    } catch {
      setMessage("Couldn’t refresh the recipient preview. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendBroadcast() {
    if (!selectedId || !previewFresh || !preview.count) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await queueBroadcast({ waitListId, broadcastId: selectedId, expectedRecipientCount: preview.count });
      setReviewSend(false);
      if (result.success) await refreshBroadcasts(selectedId);
      setMessage(result.message);
    } catch {
      setMessage("Couldn’t queue this broadcast. Refresh the preview and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function stopBroadcast() {
    if (!selectedId) return;
    setBusy(true);
    try {
      const result = await cancelBroadcast({ waitListId, broadcastId: selectedId });
      await refreshBroadcasts(selectedId);
      setMessage(result.message);
    } catch {
      setMessage("Couldn’t cancel the remaining emails. Refresh and check delivery status.");
    } finally {
      setBusy(false);
    }
  }

  const selected = broadcasts.find((item) => item.id === selectedId);
  const editable = !selected || selected.status === "DRAFT";

  return <div className="product-section">
    <EmailToolsNav waitListId={waitListId} current="broadcasts" />
    <div className="product-page-heading">
      <div><h2 className="product-section-title">Broadcasts</h2><p className="product-help">Send a one-time update to verified subscribers who opted in.</p></div>
      <button className="product-button product-button-primary" type="button" onClick={createDraft} disabled={busy}>New broadcast</button>
    </div>
    <div className="broadcast-layout">
      <section className="product-panel broadcast-list" aria-label="Saved broadcasts">
        <h3>Recent</h3>
        {broadcasts.length ? <ul>{broadcasts.map((broadcast) => <li key={broadcast.id}>
          <button type="button" className="broadcast-list-item" aria-current={selectedId === broadcast.id ? "true" : undefined} onClick={() => selectBroadcast(broadcast)}>
            <strong>{broadcast.name || broadcast.subject || "Untitled broadcast"}</strong>
            <span>{statusLabel(broadcast.status)}{broadcast.status !== "DRAFT" ? ` · ${broadcast.recipientCount} recipients` : ""}</span>
            {broadcast.status !== "DRAFT" ? <span>{broadcast.deliveredCount || 0} delivered · {broadcast.failedCount || 0} failed · {broadcast.skippedCount || 0} skipped · {broadcast.canceledCount || 0} canceled</span> : null}
            <time dateTime={new Date(broadcast.updatedAt).toISOString()}>{formatDate(broadcast.updatedAt)}</time>
          </button>
        </li>)}</ul> : <p className="product-help">Your saved drafts will appear here.</p>}
      </section>

      {selectedId ? <section className="product-panel broadcast-editor" aria-label="Broadcast editor">
        <form onSubmit={saveDraft}>
          <div className="broadcast-editor-heading"><div><p className="product-eyebrow">{selected ? statusLabel(selected.status) : "DRAFT"}</p><h3>{editable ? "Write your update" : "Delivery summary"}</h3></div></div>
          <label className="product-field"><span>Internal name</span><input maxLength={120} value={data.name || ""} disabled={!editable} onChange={(event) => setData((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="product-field"><span>Subject</span><input maxLength={160} value={data.subject || ""} disabled={!editable} onChange={(event) => setData((current) => ({ ...current, subject: event.target.value }))} /></label>
          <label className="product-field"><span>Preview text <span className="product-help">Optional</span></span><input maxLength={180} value={data.previewText || ""} disabled={!editable} onChange={(event) => setData((current) => ({ ...current, previewText: event.target.value }))} /></label>
          <label className="product-field"><span>Message</span><textarea maxLength={5000} rows={9} value={data.body || ""} disabled={!editable} onChange={(event) => setData((current) => ({ ...current, body: event.target.value }))} /></label>
          {editable ? <div className="broadcast-actions"><button className="product-button product-button-outline" type="submit" disabled={busy}>{busy ? "Saving…" : "Save draft"}</button><button className="product-button product-button-outline" type="button" onClick={refreshPreview} disabled={busy}>{busy ? "Refreshing…" : "Preview recipients"}</button></div> : null}
        </form>

        <section className="broadcast-recipient-preview" aria-labelledby="broadcast-preview-title">
          <div><h4 id="broadcast-preview-title">Recipient preview</h4><p>{editable ? `${preview.count} verified, opted-in subscriber${preview.count === 1 ? "" : "s"} are currently eligible. Unsubscribed and suppressed addresses are excluded.` : `${selected.recipientCount} subscribers were included in this send snapshot. Eligibility is checked again before each delivery.`}</p></div>
          {editable && preview.samples.length ? <p className="broadcast-samples">Examples: {preview.samples.join(", ")}</p> : editable ? <p className="broadcast-samples">No eligible subscribers yet. New subscribers can choose to receive updates when they join.</p> : <p className="broadcast-samples">Email addresses stay private in this delivery view.</p>}
          {editable && previewFresh && !deliveryReady ? <p className="product-status-warning">Email delivery needs setup before you can send.</p> : null}
          {editable && previewFresh && deliveryReady && preview.count > 0 ? <div className="broadcast-review">
            {!reviewSend ? <button className="product-button product-button-primary" type="button" onClick={() => setReviewSend(true)} disabled={busy || !data.subject?.trim() || !data.body?.trim()}>Review send</button> : <div role="group" aria-label="Confirm broadcast send">
              <p>Send “{data.subject}” to {preview.count} opted-in subscriber{preview.count === 1 ? "" : "s"}? Delivery starts immediately.</p>
              <button className="product-button product-button-primary" type="button" onClick={sendBroadcast} disabled={busy}>{busy ? "Queueing…" : `Send to ${preview.count}`}</button>
              <button className="product-button product-button-ghost" type="button" onClick={() => setReviewSend(false)} disabled={busy}>Go back</button>
            </div>}
          </div> : null}
        </section>
        {!editable ? <p className="broadcast-delivery-results">{selected.deliveredCount || 0} delivered of {selected.recipientCount}; {selected.failedCount || 0} failed, {selected.skippedCount || 0} skipped and {selected.canceledCount || 0} canceled.</p> : null}
        {selected?.status === "SENDING" ? <div className="broadcast-cancel"><p className="product-help">Emails already being handed to the provider may still arrive.</p><button className="product-button product-button-outline" type="button" onClick={stopBroadcast} disabled={busy}>Cancel remaining emails</button></div> : null}
        {selected && selected.status !== "DRAFT" ? <p className="broadcast-updated">Last updated {formatDate(selected.updatedAt)}</p> : null}
        <p className="broadcast-message" role="status" aria-live="polite">{message}</p>
      </section> : <section className="product-panel broadcast-empty"><h3>Start with a draft</h3><p>Write one clear update, preview the eligible audience, then confirm before it is queued.</p><button className="product-button product-button-primary" type="button" onClick={createDraft} disabled={busy}>Create a broadcast</button></section>}
    </div>
  </div>;
}
