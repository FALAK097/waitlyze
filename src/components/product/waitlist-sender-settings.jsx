"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatProductDate } from "@/lib/product-date.mjs";

const sourceLabel = {
  waitlist: "This waitlist",
  workspace: "Workspace Resend connection",
  default: "Deployment default",
  "needs-attention": "Needs attention",
};
const statusLabel = {
  NEEDS_TEST: "Test needed",
  CONNECTED: "Connected",
  NEEDS_ATTENTION: "Needs attention",
};

function SenderStatus({ sender, resolved }) {
  return (
    <div className="rounded-lg border border-product-border-subtle bg-product-bg-inset p-4">
      <p className="m-0 text-sm font-medium text-product-text-primary">Current sending identity</p>
      <p className="mt-1 mb-0 text-sm text-product-text-secondary">
        {resolved
          ? `${sourceLabel[resolved.source] || resolved.source} · ${resolved.fromEmail || "No sender"}`
          : "No sender configured"}
      </p>
      {sender && (
        <p className="mt-2 mb-0 text-sm text-product-text-secondary">
          Waitlist override: {statusLabel[sender.status] || sender.status}
          {sender.lastTestedAt ? ` · Last tested ${formatProductDate(sender.lastTestedAt)}` : ""}
          {sender.lastErrorCode ? ` · ${sender.lastErrorCode}` : ""}
        </p>
      )}
    </div>
  );
}

function SenderActions({
  sender,
  fromEmail,
  setFromEmail,
  apiKey,
  setApiKey,
  busy,
  perform,
  confirmRemove,
  setConfirmRemove,
}) {
  return (
    <>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          perform("save", "PUT", "", { fromEmail, apiKey });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="waitlist-sender-email">From email on a verified domain</Label>
          <Input
            id="waitlist-sender-email"
            type="email"
            value={fromEmail}
            onChange={(event) => setFromEmail(event.target.value)}
            autoComplete="email"
            maxLength={254}
            placeholder="hello@example.com"
            disabled={Boolean(busy)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="waitlist-sender-key">Resend sending API key</Label>
          <Input
            id="waitlist-sender-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            maxLength={512}
            placeholder={sender ? "Saved securely · leave blank to keep" : "re_…"}
            disabled={Boolean(busy)}
            required={!sender}
          />
          <p className="m-0 text-sm text-product-text-secondary">
            Use a sending-only key. Saved keys are encrypted and never shown again.
          </p>
        </div>
        <Button type="submit" className="justify-self-start" disabled={Boolean(busy)}>
          {busy === "save" ? "Saving…" : sender ? "Save changes" : "Save sender"}
        </Button>
      </form>
      {sender && (
        <div className="flex flex-wrap items-center gap-3 border-t border-product-border-subtle pt-5">
          <Button
            variant="outline"
            disabled={Boolean(busy)}
            onClick={() => perform("test", "POST", "/test")}
          >
            {busy === "test" ? "Sending…" : "Send test email"}
          </Button>
          {confirmRemove ? (
            <>
              <span className="text-sm text-product-text-secondary">
                Use the inherited sender instead?
              </span>
              <Button
                variant="destructive"
                disabled={Boolean(busy)}
                onClick={() => perform("remove", "DELETE")}
              >
                {busy === "remove" ? "Removing…" : "Remove sender"}
              </Button>
              <Button
                variant="ghost"
                disabled={Boolean(busy)}
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" disabled={Boolean(busy)} onClick={() => setConfirmRemove(true)}>
              Remove sender
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export function WaitlistSenderSettings({ waitListId, canManage }) {
  const [sender, setSender] = useState(null);
  const [resolved, setResolved] = useState(null);
  const [fromEmail, setFromEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const url = `/api/wait-lists/${encodeURIComponent(waitListId)}/email-sender`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load sender settings.");
        return response.json();
      })
      .then((body) => {
        if (controller.signal.aborted) return null;
        setSender(body.data);
        setResolved(body.resolved);
        setFromEmail(body.data?.fromEmail || "");
        setError("");
        return null;
      })
      .catch((failure) => {
        if (!controller.signal.aborted && failure.name !== "AbortError")
          setError(failure.message || "Unable to load sender.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url]);

  async function refresh() {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to refresh sender settings.");
    setSender(body.data);
    setResolved(body.resolved);
    setFromEmail(body.data?.fromEmail || "");
    setError("");
  }

  async function perform(action, method, path = "", body) {
    setBusy(action);
    try {
      const response = await fetch(`${url}${path}`, {
        method,
        ...(body
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update sender settings.");
      await refresh();
      if (action === "save") {
        setApiKey("");
        toast.success("Sender saved. Send a test email to activate it.");
      } else if (action === "test") {
        toast.success(`Test email sent to ${result.data.sentTo}.`);
      } else {
        setConfirmRemove(false);
        setApiKey("");
        toast.success("Waitlist sender removed. The inherited sender is now active.");
      }
    } catch (failure) {
      toast.error(failure.message || "Try again shortly.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <p className="text-sm text-product-text-secondary">Loading sender…</p>;
  if (error)
    return (
      <div role="alert" className="grid justify-items-start gap-3 text-sm">
        <p>{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            refresh()
              .catch((failure) => setError(failure.message))
              .finally(() => setLoading(false));
          }}
        >
          Try again
        </Button>
      </div>
    );

  return (
    <div className="grid gap-6">
      <SenderStatus sender={sender} resolved={resolved} />
      <p className="m-0 text-sm leading-relaxed text-product-text-secondary">
        A connected waitlist sender takes priority over your workspace Resend connection and the
        deployment default. Until its test succeeds, the inherited sender stays active. A sender
        that needs attention pauses mail instead of silently falling back.
      </p>
      {canManage ? (
        <SenderActions
          sender={sender}
          fromEmail={fromEmail}
          setFromEmail={setFromEmail}
          apiKey={apiKey}
          setApiKey={setApiKey}
          busy={busy}
          perform={perform}
          confirmRemove={confirmRemove}
          setConfirmRemove={setConfirmRemove}
        />
      ) : (
        <p className="m-0 text-sm text-product-text-secondary">
          Only owners and admins can manage this sender.
        </p>
      )}
    </div>
  );
}
