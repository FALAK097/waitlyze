"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const choices = [
  ["MILESTONE_COUNTS", "Milestone counts (1, 10, 100, 1,000)"],
  ["VERIFIED_SIGNUP", "Every verified signup"],
  ["REWARD_TIER_UNLOCKED", "Reward tier unlocked"],
];

function Channel({ waitListId, provider, canManage }) {
  const [record, setRecord] = useState(null);
  const [url, setUrl] = useState("");
  const [triggers, setTriggers] = useState(["MILESTONE_COUNTS"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const endpoint = `/api/wait-lists/${encodeURIComponent(waitListId)}/notifications/${provider.toLowerCase()}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load this channel.");
        if (controller.signal.aborted) return;
        setRecord(body.data);
        setTriggers(body.data?.triggers || ["MILESTONE_COUNTS"]);
      } catch (failure) {
        if (failure.name !== "AbortError")
          setError(failure.message || "Could not load this channel.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [endpoint]);

  async function request(method, body) {
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method,
        ...(body
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update this channel.");
      if (method === "DELETE") {
        setRecord(null);
        setTriggers(["MILESTONE_COUNTS"]);
        setConfirmDisconnect(false);
      } else {
        setRecord((previous) => ({
          ...previous,
          ...result.data,
          lastErrorCode: result.data.lastErrorCode ?? null,
        }));
      }
      if (method === "PUT") setUrl("");
      toast.success(
        method === "POST"
          ? "Test message sent. Channel connected."
          : method === "DELETE"
            ? "Channel disconnected."
            : "Channel settings saved.",
      );
    } catch (failure) {
      toast.error(failure.message || "Please try again.");
      // A failed test can move the channel to NEEDS_ATTENTION on the server.
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (response.ok) setRecord((await response.json()).data);
      } catch {
        /* Keep the last known status when offline. */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="grid gap-4 rounded-xl border border-product-border-subtle p-5"
      aria-label={`${provider} notifications`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-lg font-semibold">{provider === "SLACK" ? "Slack" : "Discord"}</h3>
        <span className="rounded-full bg-product-bg-inset px-3 py-1 text-xs font-medium text-product-text-secondary">
          {loading
            ? "Loading…"
            : record?.status === "CONNECTED"
              ? "Connected"
              : record?.status === "NEEDS_ATTENTION"
                ? "Needs attention"
                : record
                  ? "Test needed"
                  : "Not connected"}
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-product-danger-text">
          {error}
        </p>
      ) : null}
      {record && (
        <p className="m-0 text-sm text-product-text-secondary">
          {record.lastTestedAt
            ? `Last tested ${new Date(record.lastTestedAt).toLocaleString()}`
            : "Not tested yet"}
          {record.lastErrorCode ? ` · ${record.lastErrorCode}` : ""}
        </p>
      )}
      {!loading && !error && canManage && (
        <>
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              request("PUT", { webhookUrl: url, triggers });
            }}
          >
            <Label htmlFor={`${provider}-webhook`}>
              {record ? "Replace webhook URL" : "Webhook URL"}
            </Label>
            <Input
              id={`${provider}-webhook`}
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={
                provider === "SLACK"
                  ? "https://hooks.slack.com/services/…"
                  : "https://discord.com/api/webhooks/…"
              }
              autoComplete="off"
              required
              maxLength={2048}
              disabled={busy}
            />
            <p className="m-0 text-xs text-product-text-secondary">
              The URL is encrypted and never displayed again. Saving a URL requires a successful
              test to activate it.
            </p>
            <Button
              type="submit"
              className="justify-self-start"
              disabled={busy || triggers.length === 0}
            >
              {record ? "Replace URL" : "Save URL"}
            </Button>
          </form>
          <fieldset
            className="grid gap-3 border-t border-product-border-subtle pt-4"
            disabled={busy}
          >
            <legend className="mb-2 font-medium">Send a message for</legend>
            {choices.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`${provider}-${key}`}
                  checked={triggers.includes(key)}
                  onCheckedChange={(checked) =>
                    setTriggers((previous) =>
                      checked ? [...previous, key] : previous.filter((item) => item !== key),
                    )
                  }
                />
                <Label htmlFor={`${provider}-${key}`}>{label}</Label>
              </div>
            ))}
            <p className="m-0 text-xs text-product-text-secondary">
              Choose at least one trigger. Messages never include subscriber contact details.
            </p>
            {record && (
              <Button
                variant="outline"
                className="justify-self-start"
                disabled={busy || triggers.length === 0}
                onClick={() => request("PATCH", { triggers })}
              >
                Save triggers
              </Button>
            )}
          </fieldset>
          {record && (
            <div className="flex flex-wrap items-center gap-2 border-t border-product-border-subtle pt-4">
              <Button variant="outline" disabled={busy} onClick={() => request("POST")}>
                Send test
              </Button>
              {confirmDisconnect ? (
                <>
                  <span className="text-sm">Disconnect {provider}?</span>
                  <Button variant="destructive" disabled={busy} onClick={() => request("DELETE")}>
                    Confirm disconnect
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirmDisconnect(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" disabled={busy} onClick={() => setConfirmDisconnect(true)}>
                  Disconnect
                </Button>
              )}
            </div>
          )}
        </>
      )}
      {!canManage && !loading && !error && (
        <p className="m-0 text-sm text-product-text-secondary">
          Only owners and admins can change notification channels.
        </p>
      )}
    </section>
  );
}

export function ChatNotificationSettings({ waitListId, canManage }) {
  return (
    <div className="grid gap-5">
      <Channel waitListId={waitListId} provider="SLACK" canManage={canManage} />
      <Channel waitListId={waitListId} provider="DISCORD" canManage={canManage} />
    </div>
  );
}
