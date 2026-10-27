"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  cancelBroadcast,
  createBroadcastDraft,
  getBroadcastContent,
  getBroadcastRecipients,
  listBroadcasts,
  queueBroadcast,
  saveBroadcastDraft,
  scheduleBroadcast,
  sendBroadcastTestEmail,
} from "@/app/actions/emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applySeedVars } from "@/lib/email/preview-vars.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";
import { formatProductDate } from "@/lib/product-date.mjs";

import { EmailCanvas } from "./email-canvas";
import { EmailPreviewFrame, SpamHintView, VariableChips } from "./email-composer-extras";
import { emailComposerStyles } from "./email-composer-styles.mjs";
import {
  EmailManagerRailButton,
  EmailUnsavedNotice,
  emailManagerRail,
  emailManagerRailEmpty,
  emailManagerRailMeta,
  emailManagerRailTime,
  emailManagerRailTitle,
  emailManagerScope,
  emailManagerSplit,
  emailManagerTestAction,
} from "./email-manager-controls";
import { EmailToolsNav } from "./email-tools-nav";

const toolbar = "mb-6 flex justify-end gap-2.5";
const {
  pane,
  paneHead,
  paneTitle,
  paneMeta,
  paneActions,
  fieldCard,
  fieldRow,
  fieldInput,
  canvasShell,
  metaBar,
} = emailComposerStyles;
const recipients = "flex flex-wrap items-center gap-x-3 gap-y-2.5 text-body";
const recipientsCount = "font-semibold";
const recipientsSamples = "m-0 basis-full text-xs text-product-text-secondary wrap-anywhere";
const hint = "m-0 text-caption leading-normal text-product-text-secondary";
const confirm =
  "flex flex-wrap items-center gap-2.5 rounded-lg border border-product-border-subtle bg-product-bg-inset px-4 py-3.5 text-body";
const confirmText = "m-0 min-w-50 flex-1";
const summary = "overflow-hidden rounded-lg border border-product-border-subtle bg-white";
const summaryRow =
  "flex min-h-11.5 items-baseline gap-3 px-4 py-3 [&+&]:border-t border-product-border-subtle";
const summaryLabel = "w-27 shrink-0 text-xs text-product-text-secondary";
const summaryValue = "min-w-0 flex-1 text-body font-medium wrap-anywhere";
const stats = "m-0 text-caption text-product-text-secondary";
const sentMessage = "block h-115 w-full rounded-product-control border-0 bg-white";
const testForm = "flex items-center gap-2";
const testInput =
  "h-11 w-45 min-w-0 rounded-product-control border border-product-border-control bg-white px-2.5 text-caption max-sm:w-auto max-sm:flex-1 max-sm:text-base";
const emptyPane = "max-w-107 py-1.5";
const emptyPaneTitle = "m-0 mb-1.5! text-section";
const emptyPaneBody = "m-0 mb-4.5! leading-relaxed text-product-text-secondary";

const emptyDraft = () => ({ name: "New broadcast", subject: "", previewText: "", body: "" });
const formatDate = (date) => formatProductDate(date);
const escapeText = (text) =>
  String(text || "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
// Founder-facing zone label for the schedule picker, and a browser-local
// wall-clock formatter so min/values line up with what datetime-local shows.
const founderTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
  } catch {
    return "your local time";
  }
};
const toLocalInputValue = (date) => {
  const at = new Date(date);
  return new Date(at.getTime() - at.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const starterContent = (draft) =>
  draft.editorDocument ||
  `<p>${escapeText(draft.body || "Write your update…").replaceAll("\n", "<br>")}</p>`;

function BroadcastRail({ broadcasts, selectedId, busy, onRequestSelection }) {
  return (
    <nav className={emailManagerRail} aria-label="Broadcasts">
      {broadcasts.length ? (
        broadcasts.map((broadcast) => (
          <EmailManagerRailButton
            key={broadcast.id}
            current={selectedId === broadcast.id}
            disabled={busy}
            onClick={() => onRequestSelection(broadcast)}
          >
            <strong className={emailManagerRailTitle}>
              {broadcast.name || broadcast.subject || "Untitled broadcast"}
            </strong>
            <span className={emailManagerRailMeta}>
              {emailStatusLabel(broadcast.status, { draft: "Draft", sent: "Complete" })}
              {broadcast.status !== "DRAFT" ? ` · ${broadcast.recipientCount} recipients` : ""}
            </span>
            <time
              dateTime={new Date(broadcast.updatedAt).toISOString()}
              className={emailManagerRailTime}
            >
              {formatDate(broadcast.updatedAt)}
            </time>
          </EmailManagerRailButton>
        ))
      ) : (
        <p className={emailManagerRailEmpty}>No drafts yet.</p>
      )}
    </nav>
  );
}

function DiscardBanner({ pendingSelection, onDiscard, onKeep }) {
  return (
    <EmailUnsavedNotice
      firstAction={{ label: "Discard and open", onClick: onDiscard }}
      secondAction={{ label: "Keep editing", onClick: onKeep, variant: "outline" }}
    >
      Discard your unsaved changes to open “{pendingSelection.name}”?
    </EmailUnsavedNotice>
  );
}

function RecipientsPanel({
  segment,
  segments,
  segmentMeta,
  preview,
  previewFresh,
  deliveryReady,
  draftDirty,
  busy,
  busyAction,
  onSegmentChange,
  onRefreshPreview,
}) {
  return (
    <div className={recipients}>
      <label className={hint} htmlFor="broadcast-segment">
        Segment
      </label>
      <Select value={segment} disabled={busy} onValueChange={onSegmentChange}>
        <SelectTrigger id="broadcast-segment" className={testInput}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {segments.map((item) => (
            <SelectItem key={item.key} value={item.key}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className={recipientsCount}>{preview.count} eligible</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefreshPreview}
        disabled={busy || draftDirty}
      >
        {busyAction === "preview" ? "Checking…" : "Check recipients"}
      </Button>
      {draftDirty && !previewFresh ? <span className={hint}>Save to check recipients.</span> : null}
      {!deliveryReady && previewFresh ? (
        <span className={hint}>Email delivery needs setup before you can send.</span>
      ) : null}
      {segmentMeta?.description ? (
        <p className={recipientsSamples}>{segmentMeta.description}</p>
      ) : null}
      {preview.samples.length ? (
        <p className={recipientsSamples}>e.g. {preview.samples.join(", ")}</p>
      ) : previewFresh ? (
        <p className={recipientsSamples}>No eligible subscribers in this segment yet.</p>
      ) : null}
    </div>
  );
}

function SendConfirmations({
  data,
  preview,
  busy,
  busyAction,
  scheduleAt,
  onScheduleAtChange,
  reviewSend,
  reviewSchedule,
  onSend,
  onSchedule,
  onBack,
  onStartSend,
  onStartSchedule,
}) {
  if (reviewSend) {
    return (
      <div className={confirm} role="group" aria-label="Confirm broadcast send">
        <p className={confirmText}>
          Send “{data.subject}” to {preview.count} opted-in subscriber
          {preview.count === 1 ? "" : "s"}? Delivery starts immediately.
        </p>
        <Button type="button" variant="default" onClick={onSend} disabled={busy}>
          {busyAction === "send" ? "Queueing…" : `Send to ${preview.count}`}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
      </div>
    );
  }
  if (reviewSchedule) {
    return (
      <div className={confirm} role="group" aria-label="Confirm broadcast schedule">
        <p className={confirmText}>
          Schedule “{data.subject}” for {preview.count} subscriber
          {preview.count === 1 ? "" : "s"}? Eligibility is re-checked at send time.
        </p>
        <Input
          type="datetime-local"
          className={testInput}
          aria-label={`Scheduled send time (${founderTimeZone()})`}
          value={scheduleAt}
          // The minimum is derived from the live clock at render time; it is
          // intentionally different between the SSR pass and the browser, so
          // React's hydration warning is suppressed.
          suppressHydrationWarning
          min={toLocalInputValue(Date.now() + 5 * 60 * 1000)}
          onChange={(event) => onScheduleAtChange(event.target.value)}
        />
        <span className={hint}>Times are in {founderTimeZone()}.</span>
        <Button type="button" variant="default" onClick={onSchedule} disabled={busy || !scheduleAt}>
          {busyAction === "schedule" ? "Scheduling…" : "Confirm schedule"}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
      </div>
    );
  }
  return (
    <div className={metaBar}>
      <p className={hint}>Eligibility is checked again before each send.</p>
      <div className={paneActions}>
        <Button
          type="button"
          variant="outline"
          onClick={onStartSchedule}
          disabled={busy || !data.subject?.trim() || !data.body?.trim()}
        >
          Schedule…
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={onStartSend}
          disabled={busy || !data.subject?.trim() || !data.body?.trim()}
        >
          Review send
        </Button>
      </div>
    </div>
  );
}

function DeliverySummary({ selected }) {
  return (
    <>
      <div className={summary}>
        <div className={summaryRow}>
          <span className={summaryLabel}>Subject</span>
          <strong className={summaryValue}>{selected.subject || "-"}</strong>
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
        {selected.segment && selected.segment !== "ALL" ? (
          <div className={summaryRow}>
            <span className={summaryLabel}>Segment</span>
            <strong className={summaryValue}>{selected.segment}</strong>
          </div>
        ) : null}
        {selected.scheduledAt ? (
          <div className={summaryRow}>
            <span className={summaryLabel}>Scheduled</span>
            <strong className={summaryValue}>{formatDate(selected.scheduledAt)}</strong>
          </div>
        ) : null}
        <div className={summaryRow}>
          <span className={summaryLabel}>{selected.status === "SENT" ? "Sent" : "Updated"}</span>
          <strong className={summaryValue}>
            {formatDate(selected.sentAt || selected.updatedAt)}
          </strong>
        </div>
      </div>
      <p className={stats}>
        {selected.deliveredCount || 0} delivered · {selected.failedCount || 0} bounced ·{" "}
        {selected.unsubscribedCount || 0} unsubscribed · {selected.suppressedCount || 0} spam-report
        suppressions · {selected.skippedOtherCount || 0} skipped · {selected.canceledCount || 0}{" "}
        canceled
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
  );
}

function CancelPanel({ selected, reviewCancel, busy, busyAction, onStop, onReviewCancel }) {
  return (
    <div className={confirm}>
      {reviewCancel ? (
        <>
          <p className={confirmText}>
            {selected.status === "SCHEDULED"
              ? "Unschedule this broadcast? Nothing has been sent."
              : "Cancel all emails that have not been handed to the provider?"}
          </p>
          <Button type="button" variant="outline" onClick={onStop} disabled={busy}>
            {busyAction === "cancel"
              ? "Canceling…"
              : selected.status === "SCHEDULED"
                ? "Confirm unschedule"
                : "Confirm cancellation"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onReviewCancel(false)}
            disabled={busy}
          >
            {selected.status === "SCHEDULED" ? "Keep schedule" : "Keep sending"}
          </Button>
        </>
      ) : (
        <>
          <p className={confirmText}>
            {selected.status === "SCHEDULED"
              ? `Scheduled${selected.scheduledAt ? ` for ${formatDate(selected.scheduledAt)}` : ""}. Eligibility is re-checked at send time.`
              : "Emails already handed to the provider may still arrive."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onReviewCancel(true)}
            disabled={busy}
          >
            {selected.status === "SCHEDULED" ? "Unschedule" : "Cancel remaining emails"}
          </Button>
        </>
      )}
    </div>
  );
}

export function BroadcastManager({
  waitListId,
  waitListName,
  initialBroadcasts,
  initialBroadcast,
  initialPreview,
  initialSegments,
  deliveryReady,
}) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const initialSelection = initialBroadcast || initialBroadcasts[0] || null;
  const [selectedId, setSelectedId] = useState(initialSelection?.id || null);
  const [data, setData] = useState(initialSelection || emptyDraft());
  const [preview, setPreview] = useState(initialPreview);
  const [segment, setSegment] = useState(initialSelection?.segment || "ALL");
  const [previewFresh, setPreviewFresh] = useState(false);
  const [reviewSend, setReviewSend] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [reviewSchedule, setReviewSchedule] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const busy = Boolean(busyAction);
  const [draftDirty, setDraftDirty] = useState(false);
  const [reviewCancel, setReviewCancel] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [draftPreview, setDraftPreview] = useState(null);
  const [testTo, setTestTo] = useState("");
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

  async function selectBroadcast(broadcast) {
    setBusyAction("select");
    try {
      const content =
        typeof broadcast.body === "string"
          ? broadcast
          : await getBroadcastContent(waitListId, broadcast.id);
      if (!content) {
        notify("Couldn’t load this broadcast. Try again.", true);
        return;
      }
      setDraftDirty(false);
      setReviewCancel(false);
      setPendingSelection(null);
      setSelectedId(broadcast.id);
      setSegment(content.segment || "ALL");
      setDraftPreview(null);
      setReviewSchedule(false);
      setScheduleAt("");
      setData({
        name: content.name,
        subject: content.subject,
        previewText: content.previewText,
        body: content.body,
        editorDocument: content.editorDocument,
        renderedHtml: content.renderedHtml,
      });
      setPreviewFresh(false);
      setReviewSend(false);
    } catch {
      notify("Couldn’t load this broadcast. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function refreshBroadcasts(selected = selectedId) {
    const { broadcasts: updated } = await listBroadcasts(waitListId);
    setBroadcasts(updated);
    const active = updated.find((item) => item.id === selected);
    if (active) await selectBroadcast(active);
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
      const payload = structuredClone({
        ...data,
        editorDocument: editorRef.current.getJSON(),
        renderedHtml: html,
        renderedText: text,
      });
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

  async function refreshPreview(nextSegment = segment) {
    setBusyAction("preview");
    try {
      const nextPreview = await getBroadcastRecipients(waitListId, nextSegment);
      setPreview(nextPreview);
      setSegment(nextSegment);
      setPreviewFresh(true);
      setReviewSend(false);
      setReviewSchedule(false);
      notify(
        `Preview updated: ${nextPreview.count} eligible recipient${nextPreview.count === 1 ? "" : "s"}.`,
      );
    } catch {
      notify("Couldn’t refresh the recipient preview. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function previewDraft() {
    setBusyAction("draft-preview");
    try {
      if (!editorRef.current?.editor) throw new Error("The message editor is still loading.");
      const { html, text } = await editorRef.current.getEmail();
      setDraftPreview({
        html: applySeedVars(html, waitListName),
        text,
      });
    } catch {
      notify("Couldn’t build the preview. Try again.", true);
    } finally {
      setBusyAction("");
    }
  }

  async function sendTest(event) {
    event.preventDefault();
    if (!selectedId || draftDirty) return;
    setBusyAction("test");
    try {
      const response = await sendBroadcastTestEmail({
        waitListId,
        broadcastId: selectedId,
        to: testTo,
      });
      notify(response.success ? `Test sent to ${testTo}.` : response.message, !response.success);
    } catch {
      notify("Couldn’t send the test. Try again.", true);
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
        segment,
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

  async function scheduleSend() {
    if (!selectedId || draftDirty || !previewFresh || !preview.count || !scheduleAt) return;
    setBusyAction("schedule");
    try {
      // datetime-local carries no zone; interpret it in the founder's browser
      // zone and send explicit UTC so the server never re-interprets the
      // wall clock in its own timezone.
      const at = new Date(scheduleAt);
      if (!Number.isFinite(at.getTime())) {
        notify("Pick a valid date and time to schedule.", true);
        return;
      }
      const result = await scheduleBroadcast({
        waitListId,
        broadcastId: selectedId,
        segment,
        scheduledAt: at.toISOString(),
        expectedRecipientCount: preview.count,
      });
      setReviewSchedule(false);
      if (result.success) await refreshBroadcasts(selectedId);
      notify(result.message, !result.success);
    } catch {
      notify("Couldn’t schedule this broadcast. Refresh the preview and try again.", true);
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
  const scheduled = selected?.status === "SCHEDULED";
  const segmentMeta = (initialSegments || []).find((item) => item.key === segment);

  return (
    <div className={emailManagerScope}>
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
        <DiscardBanner
          pendingSelection={pendingSelection}
          onDiscard={() => selectBroadcast(pendingSelection)}
          onKeep={() => setPendingSelection(null)}
        />
      )}
      <div className={emailManagerSplit}>
        <BroadcastRail
          broadcasts={broadcasts}
          selectedId={selectedId}
          busy={busy}
          onRequestSelection={requestSelection}
        />

        {selectedId ? (
          <section className={pane} aria-label="Broadcast editor">
            <header className={paneHead}>
              <div>
                <h2 className={paneTitle}>
                  {editable
                    ? data.name || "Untitled broadcast"
                    : scheduled
                      ? "Scheduled send"
                      : "Delivery summary"}
                </h2>
                {editable ? (
                  <p className={paneMeta}>Draft - nothing is sent until you confirm.</p>
                ) : null}
              </div>
              <div className={paneActions}>
                {editable && (
                  <Button
                    type="submit"
                    form="broadcast-draft-form"
                    variant="default"
                    disabled={busy}
                  >
                    {busyAction === "save" ? "Saving…" : "Save draft"}
                  </Button>
                )}
              </div>
            </header>

            {editable ? (
              <>
                <form
                  id="broadcast-draft-form"
                  className="flex flex-col gap-5"
                  onSubmit={saveDraft}
                >
                  <div className={fieldCard}>
                    <div className={fieldRow}>
                      <Input
                        type="text"
                        className={fieldInput}
                        maxLength={120}
                        aria-label="Internal name"
                        placeholder="Name - only you see this"
                        value={data.name || ""}
                        onChange={(event) => edit("name", event.target.value)}
                      />
                    </div>
                    <div className={fieldRow}>
                      <Input
                        type="text"
                        className={fieldInput}
                        maxLength={160}
                        aria-label="Subject"
                        placeholder="Subject - what subscribers see in the inbox"
                        value={data.subject || ""}
                        onChange={(event) => edit("subject", event.target.value)}
                      />
                    </div>
                    <div className={fieldRow}>
                      <Input
                        type="text"
                        className={fieldInput}
                        maxLength={180}
                        aria-label="Preview text"
                        placeholder="Preview text - shown after the subject"
                        value={data.previewText || ""}
                        onChange={(event) => edit("previewText", event.target.value)}
                      />
                    </div>
                  </div>
                </form>
                <div className={canvasShell}>
                  <EmailCanvas
                    key={selectedId}
                    editorRef={editorRef}
                    content={starterContent(data)}
                    onChange={(document) => edit("editorDocument", document)}
                  />
                </div>
                <div className={recipients}>
                  <RecipientsPanel
                    segment={segment}
                    segments={initialSegments || [{ key: "ALL", label: "Everyone opted in" }]}
                    segmentMeta={segmentMeta}
                    preview={preview}
                    previewFresh={previewFresh}
                    deliveryReady={deliveryReady}
                    draftDirty={draftDirty}
                    busy={busy}
                    busyAction={busyAction}
                    onSegmentChange={(next) => {
                      setSegment(next);
                      setPreviewFresh(false);
                      setReviewSend(false);
                      setReviewSchedule(false);
                    }}
                    onRefreshPreview={() => refreshPreview()}
                  />
                </div>
                {previewFresh && deliveryReady && !draftDirty && preview.count > 0 ? (
                  <SendConfirmations
                    data={data}
                    preview={preview}
                    busy={busy}
                    busyAction={busyAction}
                    scheduleAt={scheduleAt}
                    onScheduleAtChange={setScheduleAt}
                    reviewSend={reviewSend}
                    reviewSchedule={reviewSchedule}
                    onSend={sendBroadcast}
                    onSchedule={scheduleSend}
                    onBack={() => {
                      setReviewSend(false);
                      setReviewSchedule(false);
                    }}
                    onStartSend={() => setReviewSend(true)}
                    onStartSchedule={() => setReviewSchedule(true)}
                  />
                ) : null}
                <div className={metaBar}>
                  <VariableChips
                    keys={["name", "position", "referral_link", "points", "rewards"]}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={previewDraft}
                    disabled={busy || draftDirty}
                  >
                    {busyAction === "draft-preview" ? "Building…" : "Preview & spam check"}
                  </Button>
                </div>
                {draftPreview ? (
                  <div className="flex flex-col gap-4">
                    <EmailPreviewFrame html={draftPreview.html} />
                    <SpamHintView
                      subject={data.subject}
                      previewText={data.previewText}
                      text={draftPreview.text}
                      html={draftPreview.html}
                    />
                  </div>
                ) : null}
                <form className={testForm} onSubmit={sendTest}>
                  <Input
                    className={testInput}
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
                    variant="secondary"
                    size="xl"
                    className={emailManagerTestAction}
                    disabled={busy || draftDirty}
                  >
                    {busyAction === "test" ? "Sending…" : "Send test"}
                  </Button>
                </form>
              </>
            ) : (
              <DeliverySummary selected={selected} />
            )}

            {selected?.status === "SENDING" || selected?.status === "SCHEDULED" ? (
              <CancelPanel
                selected={selected}
                reviewCancel={reviewCancel}
                busy={busy}
                busyAction={busyAction}
                onStop={stopBroadcast}
                onReviewCancel={setReviewCancel}
              />
            ) : null}
          </section>
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
