"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatProductDate } from "@/lib/product-date.mjs";

const choices = [
  ["MILESTONE_COUNTS", "Milestone counts (1, 10, 100, 1,000)"],
  ["VERIFIED_SIGNUP", "Every verified signup"],
  ["REWARD_TIER_UNLOCKED", "Reward tier unlocked"],
];

async function safeReadJson(response, defaultError = "Request failed") {
  const text = await response.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  if (!response.ok) {
    throw new Error(data?.error || defaultError);
  }
  return data;
}

function useChannel(endpoint, initialRecord = undefined) {
  const [record, setRecord] = useState(initialRecord ?? null);
  const [url, setUrl] = useState("");
  const [triggers, setTriggers] = useState(initialRecord?.triggers || ["MILESTONE_COUNTS"]);
  const [loading, setLoading] = useState(initialRecord === undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    if (initialRecord !== undefined) return;
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await safeReadJson(response, "Could not load this channel.");
        return body;
      })
      .then((body) => {
        if (controller.signal.aborted || !body) return null;
        setRecord(body.data);
        setTriggers(body.data?.triggers || ["MILESTONE_COUNTS"]);
        return null;
      })
      .catch((failure) => {
        if (!controller.signal.aborted && failure.name !== "AbortError")
          setError(failure.message || "Could not load this channel.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint, initialRecord]);

  async function request(method, body) {
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method,
        ...(body
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const result = await safeReadJson(response, "Could not update this channel.");
      if (method === "DELETE") {
        setRecord(null);
        setTriggers(["MILESTONE_COUNTS"]);
        setConfirmDisconnect(false);
      } else {
        setRecord((previous) => ({
          ...previous,
          ...result?.data,
          lastErrorCode: result?.data?.lastErrorCode ?? null,
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
        const refreshed = await safeReadJson(response, "").catch(() => null);
        if (refreshed?.data) setRecord(refreshed.data);
      } catch {
        /* Keep the last known status when offline. */
      }
    } finally {
      setBusy(false);
    }
  }

  return {
    record,
    url,
    setUrl,
    triggers,
    setTriggers,
    loading,
    error,
    busy,
    confirmDisconnect,
    setConfirmDisconnect,
    request,
  };
}

function ChannelRow({ waitListId, provider, name, description, logo, canManage, initialRecord }) {
  const [open, setOpen] = useState(false);
  const endpoint = `/api/wait-lists/${encodeURIComponent(waitListId)}/notifications/${provider.toLowerCase()}`;
  const {
    record,
    url,
    setUrl,
    triggers,
    setTriggers,
    error,
    busy,
    confirmDisconnect,
    setConfirmDisconnect,
    request,
  } = useChannel(endpoint, initialRecord);

  function changeOpen(next) {
    if (busy) return;
    setOpen(next);
    if (!next) {
      setConfirmDisconnect(false);
      if (!record) setUrl("");
    }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <div className="flex items-center justify-between gap-4 py-6 max-[600px]:items-start max-[600px]:gap-3 max-[400px]:flex-col max-[400px]:gap-5">
        <div className="flex items-center gap-4 max-[600px]:gap-3">
          <Image
            src={logo}
            width={32}
            height={32}
            alt=""
            unoptimized
            className="h-8 w-8 shrink-0 bg-transparent object-contain outline-none"
          />
          <div>
            <h3 className="mb-1! text-base font-semibold">{name}</h3>
            <p className="m-0 text-sm text-product-text-secondary">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:items-end max-[600px]:gap-2 max-[400px]:w-full max-[400px]:flex-row max-[400px]:items-center max-[400px]:justify-between [&_button]:max-[400px]:shrink-0 [&_button]:max-[400px]:whitespace-nowrap">
          <SheetTrigger render={<Button variant="outline" />}>
            {canManage ? (record ? "Manage" : "Connect") : "View"}
          </SheetTrigger>
        </div>
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{record ? `Manage ${name}` : `Connect ${name}`}</SheetTitle>
          <SheetDescription>
            {provider === "SLACK"
              ? "Post signup updates to a Slack channel using an incoming webhook."
              : "Post signup updates to a Discord channel using a Discord webhook."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <div className="grid gap-6">
            {error ? (
              <p role="alert" className="text-sm text-product-danger-text">
                {error}
              </p>
            ) : null}

            {record && (
              <div className="rounded-lg border border-product-border-subtle bg-product-bg-inset p-4">
                <p className="m-0 text-sm font-medium text-product-text-primary">Status</p>
                <p className="mt-1 mb-0 text-sm text-product-text-secondary">
                  {record.lastTestedAt
                    ? `Last tested ${formatProductDate(record.lastTestedAt)}`
                    : "Not tested yet"}
                  {record.lastErrorCode ? ` · ${record.lastErrorCode}` : ""}
                </p>
              </div>
            )}

            {canManage ? (
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
                    The URL is encrypted and never displayed again. Saving a URL requires a
                    successful test to activate it.
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
                  <legend className="mb-2 text-sm font-medium">Send a message for</legend>
                  {choices.map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        id={`${provider}-${key}`}
                        checked={triggers.includes(key)}
                        disabled={busy}
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => request("DELETE")}
                        >
                          Confirm disconnect
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => setConfirmDisconnect(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setConfirmDisconnect(true)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="m-0 text-sm text-product-text-secondary">
                Only owners and admins can change notification channels.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ChatNotificationSettings({ waitListId, canManage, initialChannels = [] }) {
  const slackChannel = initialChannels.find((c) => c.provider === "SLACK") || null;
  const discordChannel = initialChannels.find((c) => c.provider === "DISCORD") || null;

  return (
    <div className="divide-y divide-product-border-subtle">
      <ChannelRow
        waitListId={waitListId}
        provider="SLACK"
        name="Slack"
        description="Send new signup and milestone notifications to your Slack channels."
        logo="/integrations/slack.svg"
        canManage={canManage}
        initialRecord={slackChannel}
      />
      <ChannelRow
        waitListId={waitListId}
        provider="DISCORD"
        name="Discord"
        description="Send new signup and milestone notifications to your Discord server."
        logo="/integrations/discord.svg"
        canManage={canManage}
        initialRecord={discordChannel}
      />
    </div>
  );
}
