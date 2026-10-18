"use client";

import { Button } from "@/components/ui/button";
import { formatProductDate } from "@/lib/product-date.mjs";
import { useRef, useState } from "react";
import { toast } from "sonner";
import styles from "./email-tools.module.css";
import { useRouter } from "next/navigation";
import { EmailToolsNav } from "./email-tools-nav";
import { EmailCanvas } from "./email-canvas";
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
const escapeText = (text) => String(text || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const starterContent = (draft) => draft.editorDocument || `<p>${escapeText(draft.body || "Write your update…").replaceAll("\n", "<br>")}</p>`;

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
  const [messagePreview, setMessagePreview] = useState("");
  const editorRef = useRef(null);

  function notify(text, failure = false) { if (failure) toast.error(text); else toast.success(text); }
  function requestSelection(broadcast) { if (draftDirty && broadcast.id !== selectedId) setPendingSelection(broadcast); else selectBroadcast(broadcast); }
  function edit(field, value) { setData((current) => ({ ...current, [field]: value })); setDraftDirty(true); setPreviewFresh(false); setReviewSend(false); }

  function selectBroadcast(broadcast) {
    setDraftDirty(false); setReviewCancel(false); setPendingSelection(null);
    setSelectedId(broadcast.id);
    setData({ name: broadcast.name, subject: broadcast.subject, previewText: broadcast.previewText, body: broadcast.body, editorDocument: broadcast.editorDocument, renderedHtml: broadcast.renderedHtml });
    setPreviewFresh(false); setMessagePreview("");
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
      setData({ name: draft.name, subject: draft.subject, previewText: draft.previewText, body: draft.body, editorDocument: draft.editorDocument, renderedHtml: draft.renderedHtml });
      setPreviewFresh(false); setMessagePreview("");
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
    try {
      if (!editorRef.current?.editor) throw new Error("The message editor is still loading.");
      const { html, text } = await editorRef.current.getEmail();
      const payload = JSON.parse(JSON.stringify({ ...data, editorDocument: editorRef.current.getJSON(), renderedHtml: html, renderedText: text }));
      const result = await saveBroadcastDraft({ waitListId, broadcastId: selectedId, data: payload });
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

  async function showMessagePreview() {
    try {
      if (!editorRef.current?.editor) throw new Error("The editor is still loading.");
      setMessagePreview(await editorRef.current.getEmailHTML());
    } catch (error) { notify(error.message || "Could not preview this email.", true); }
  }

  const selected = broadcasts.find((item) => item.id === selectedId);
  const editable = !selected || selected.status === "DRAFT";

  return <div className={styles.scope}>
    <EmailToolsNav waitListId={waitListId} current="broadcasts" />
    {broadcasts.length ? <div className={styles.toolbar}>
      <Button type="button" onClick={createDraft} disabled={busy || draftDirty} variant="default">{busyAction === "create" ? "Creating…" : "New broadcast"}</Button>
    </div> : null}
    {pendingSelection && <div className={styles.unsaved} role="alert"><span>Discard your unsaved changes to open “{pendingSelection.name}”?</span><button type="button" onClick={() => selectBroadcast(pendingSelection)}>Discard and open</button><button type="button" onClick={() => setPendingSelection(null)}>Keep editing</button></div>}
    <div className={styles.split}>
      <nav className={styles.rail} aria-label="Broadcasts">
        {broadcasts.length ? broadcasts.map((broadcast) => <button key={broadcast.id} type="button" className={styles.railItem} aria-current={selectedId === broadcast.id ? "true" : undefined} disabled={busy} onClick={() => requestSelection(broadcast)}>
          <strong>{broadcast.name || broadcast.subject || "Untitled broadcast"}</strong>
          <span>{statusLabel(broadcast.status)}{broadcast.status !== "DRAFT" ? ` · ${broadcast.recipientCount} recipients` : ""}</span>
          <time dateTime={new Date(broadcast.updatedAt).toISOString()}>{formatDate(broadcast.updatedAt)}</time>
        </button>) : <p className={styles.railEmpty}>No drafts yet.</p>}
      </nav>

      {selectedId ? <form className={styles.pane} aria-label="Broadcast editor" onSubmit={saveDraft}>
        <header className={styles.paneHead}>
          <div>
            <h2 className={styles.paneTitle}>{editable ? (data.name || "Untitled broadcast") : "Delivery summary"}</h2>
            <p className={styles.paneMeta}>{editable ? "Draft — nothing is sent until you confirm." : `${selected.recipientCount} recipients · ${formatDate(selected.updatedAt)}`}</p>
          </div>
          <div className={styles.paneActions}>
            {!editable && <span className={`automation-status automation-status-${selected.status.toLowerCase()}`}>{statusLabel(selected.status)}</span>}
            {editable && <>
              <span role="status" className={styles.state}>{draftDirty ? "Unsaved" : "Saved"}</span>
              <Button type="button" variant="outline" onClick={showMessagePreview} disabled={busy}>Preview email</Button>
              <Button type="submit" variant="default" disabled={busy}>{busyAction === "save" ? "Saving…" : "Save draft"}</Button>
            </>}
          </div>
        </header>

        {editable ? <>
          <div className={styles.fieldCard}>
            <div className={styles.fieldRow}><input maxLength={120} aria-label="Internal name" placeholder="Name — only you see this" value={data.name || ""} onChange={(event) => edit("name", event.target.value)} /></div>
            <div className={styles.fieldRow}><input maxLength={160} aria-label="Subject" placeholder="Subject — what subscribers see in the inbox" value={data.subject || ""} onChange={(event) => edit("subject", event.target.value)} /></div>
            <div className={styles.fieldRow}><input maxLength={180} aria-label="Preview text" placeholder="Preview text — shown after the subject" value={data.previewText || ""} onChange={(event) => edit("previewText", event.target.value)} /></div>
          </div>
          <div className={styles.canvasShell}>
            <EmailCanvas key={selectedId} editorRef={editorRef} content={starterContent(data)} onChange={(document) => edit("editorDocument", document)} />
          </div>
          {messagePreview && <div className={styles.broadcastPreview}>
            <div><strong>Email preview</strong><Button type="button" variant="ghost" onClick={() => setMessagePreview("")}>Close</Button></div>
            <iframe title="Broadcast email preview" sandbox="" srcDoc={messagePreview} />
          </div>}
          <div className={styles.recipients}>
            <span className={styles.count}>{preview.count} eligible</span>
            <Button type="button" variant="outline" size="sm" onClick={refreshPreview} disabled={busy || draftDirty}>{busyAction === "preview" ? "Checking…" : "Check recipients"}</Button>
            {draftDirty && !previewFresh ? <span className={styles.hint}>Save to check recipients.</span> : null}
            {!deliveryReady && previewFresh ? <span className={styles.hint}>Email delivery needs setup before you can send.</span> : null}
            {preview.samples.length ? <p className={styles.samples}>e.g. {preview.samples.join(", ")}</p> : previewFresh ? <p className={styles.samples}>No eligible subscribers yet.</p> : null}
          </div>
          {previewFresh && deliveryReady && !draftDirty && preview.count > 0
            ? (reviewSend
              ? <div className={styles.confirm} role="group" aria-label="Confirm broadcast send">
                  <p>Send “{data.subject}” to {preview.count} opted-in subscriber{preview.count === 1 ? "" : "s"}? Delivery starts immediately.</p>
                  <Button type="button" variant="default" onClick={sendBroadcast} disabled={busy}>{busyAction === "send" ? "Queueing…" : `Send to ${preview.count}`}</Button>
                  <Button type="button" variant="ghost" onClick={() => setReviewSend(false)} disabled={busy}>Back</Button>
                </div>
              : <div className={styles.metaBar}>
                  <p className={styles.hint}>Eligibility is checked again before each send.</p>
                  <Button type="button" variant="default" onClick={() => setReviewSend(true)} disabled={busy || !data.subject?.trim() || !data.body?.trim()}>Review send</Button>
                </div>)
            : null}
        </> : <>
          {selected.renderedHtml
            ? <iframe className={styles.sentMessage} title="Sent email" sandbox="" srcDoc={selected.renderedHtml} />
            : <p className={`${styles.hint} whitespace-pre-line`}>{selected.body}</p>}
          <p className={styles.hint}>{selected.deliveredCount || 0} delivered · {selected.failedCount || 0} failed · {selected.skippedCount || 0} skipped · {selected.canceledCount || 0} canceled of {selected.recipientCount}</p>
        </>}

        {selected?.status === "SENDING" ? <div className={styles.confirm}>
          {reviewCancel
            ? <><p>Cancel all emails that have not been handed to the provider?</p>
                <Button type="button" variant="outline" onClick={stopBroadcast} disabled={busy}>{busyAction === "cancel" ? "Canceling…" : "Confirm cancellation"}</Button>
                <Button type="button" variant="ghost" onClick={() => setReviewCancel(false)} disabled={busy}>Keep sending</Button></>
            : <><p>Emails already handed to the provider may still arrive.</p>
                <Button type="button" variant="outline" onClick={() => setReviewCancel(true)} disabled={busy}>Cancel remaining emails</Button></>}
        </div> : null}
      </form> : <div className={styles.emptyPane}>
        <h2>No broadcasts yet</h2>
        <p>Write one update, check who is eligible, then confirm to send it.</p>
        <Button type="button" variant="default" onClick={createDraft} disabled={busy}>{busyAction === "create" ? "Creating…" : "New broadcast"}</Button>
      </div>}
    </div>
  </div>;
}
