"use client";

import { Copy01Icon, Loading03Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function ResendIntegration({ initialConnection, accountEmail, canManage, appOrigin, logo }) {
  const [connection, setConnection] = useState(initialConnection);
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [fromEmail, setFromEmail] = useState(initialConnection?.fromEmail || "");
  const [busy, setBusy] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const webhookUrl =
    connection?.workspaceId && appOrigin
      ? `${String(appOrigin).replace(/\/$/, "")}/api/webhooks/resend/${encodeURIComponent(connection.workspaceId)}`
      : null;

  async function request(path, method, body) {
    const init = body
      ? { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
      : { method };
    const response = await fetch(path, init);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "The request could not be completed. Try again.");
    return data;
  }
  async function perform(action, callback) {
    setBusy(action);
    try {
      await callback();
    } catch (failure) {
      toast.error(failure.message || "Check your connection and try again.");
    } finally {
      setBusy("");
    }
  }
  function changeOpen(next) {
    if (busy) return;
    setOpen(next);
    if (!next) {
      setApiKey("");
      setWebhookSecret("");
      setRevealed(false);
      setConfirmDisconnect(false);
    }
  }
  function save(event) {
    event.preventDefault();
    perform("save", async () => {
      const data = await request("/api/settings/integrations/resend", "PUT", {
        apiKey,
        fromEmail,
        webhookSecret,
      });
      setConnection(data.data);
      setApiKey("");
      setWebhookSecret("");
      setRevealed(false);
      toast.success(
        data.data?.webhookConfigured
          ? "Saved. Send a test email to activate Resend."
          : "Saved. Add the webhook in Resend, then save its signing secret.",
      );
    });
  }
  function test() {
    perform("test", async () => {
      const data = await request("/api/settings/integrations/resend/test", "POST");
      setConnection((current) => ({ ...current, ...data.data }));
      toast.success(`Test email sent to ${data.data.sentTo}.`);
    });
  }
  function disconnect() {
    perform("disconnect", async () => {
      await request("/api/settings/integrations/resend", "DELETE");
      setConnection(null);
      setApiKey("");
      setWebhookSecret("");
      setFromEmail("");
      setConfirmDisconnect(false);
      toast.success("Resend disconnected.");
    });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success("Key copied.");
    } catch {
      toast.error("Copy is unavailable. Select the key and copy it manually.");
    }
  }
  async function copyWebhookUrl() {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied.");
    } catch {
      toast.error("Copy is unavailable. Select the URL and copy it manually.");
    }
  }
  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <div className="settings-integration-row">
        <div className="settings-integration-brand">
          {logo}
          <div>
            <h3>Resend</h3>
            <p>Send your waitlist email from your own domain.</p>
          </div>
        </div>
        <div className="settings-integration-row-actions">
          <SheetTrigger render={<Button variant="outline" />}>
            {canManage ? (connection ? "Manage" : "Connect") : "View"}
          </SheetTrigger>
        </div>
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Connect Resend</SheetTitle>
          <SheetDescription>
            Use a sending-only API key and a verified sender address.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 pt-0">
          <div className="integration-drawer-content">
            <div className="integration-note">
              <p>
                <strong>Waitlist email</strong> (confirmation, broadcasts, automations) sends from
                your domain once connected. If this connection needs attention, sending pauses until
                you fix or disconnect it.
              </p>
              <p>
                <strong>Account email</strong> like workspace invitations always comes from
                Waitlyze, so connect this only when you want your own sender.
              </p>
            </div>
            {webhookUrl && (
              <div className="integration-note">
                <p>
                  <strong>Webhook endpoint</strong> — add this URL in your Resend account and
                  subscribe to <code>email.bounced</code> and <code>email.complained</code>. Copy
                  the signing secret Resend shows you and save it below.
                </p>
                <p className="break-all select-all">{webhookUrl}</p>
                {canManage && (
                  <Button type="button" variant="outline" onClick={copyWebhookUrl}>
                    Copy webhook URL
                  </Button>
                )}
              </div>
            )}
            {canManage ? (
              <form onSubmit={save} className="integration-drawer-form">
                <label className="product-field" htmlFor="resend-api-key">
                  <span>Sending API key</span>
                </label>
                <div className="integration-secret-input">
                  <Input
                    id="resend-api-key"
                    type={revealed ? "text" : "password"}
                    autoComplete="new-password"
                    spellCheck="false"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={connection ? "Saved key · enter a replacement" : "re_…"}
                    required={!connection}
                    maxLength={512}
                    disabled={Boolean(busy)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={revealed ? "Hide API key" : "Show API key"}
                    aria-pressed={revealed}
                    onClick={() => setRevealed(!revealed)}
                    disabled={!apiKey || Boolean(busy)}
                  >
                    {revealed ? (
                      <HugeiconsIcon icon={ViewOffIcon} size={18} />
                    ) : (
                      <HugeiconsIcon icon={ViewIcon} size={18} />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Copy entered API key"
                    disabled={!apiKey || Boolean(busy)}
                    onClick={copy}
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={18} />
                  </Button>
                </div>
                {connection && (
                  <p className="product-help">
                    Your saved key stays encrypted and cannot be viewed or copied.
                  </p>
                )}
                <label className="product-field">
                  <span>Sender email</span>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={fromEmail}
                    onChange={(event) => setFromEmail(event.target.value)}
                    placeholder="hello@example.com"
                    required
                    disabled={Boolean(busy)}
                  />
                </label>
                <label className="product-field">
                  <span>Webhook signing secret</span>
                  <Input
                    type="password"
                    autoComplete="off"
                    spellCheck="false"
                    value={webhookSecret}
                    onChange={(event) => setWebhookSecret(event.target.value)}
                    placeholder={
                      connection?.webhookConfigured
                        ? "Saved secret · enter a replacement"
                        : "whsec_…"
                    }
                    maxLength={512}
                    disabled={Boolean(busy)}
                  />
                </label>
                {connection && !connection.webhookConfigured && (
                  <p className="product-help">
                    Save the signing secret before testing or sending waitlist email.
                  </p>
                )}
                <Button type="submit" disabled={Boolean(busy)}>
                  {busy === "save" && (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="animate-spin"
                      size={16}
                      aria-hidden="true"
                    />
                  )}
                  {busy === "save" ? "Saving…" : connection ? "Save changes" : "Save connection"}
                </Button>
              </form>
            ) : (
              <p>Only workspace owners and admins can change this connection.</p>
            )}
            {canManage && connection && (
              <div className="integration-test">
                <p className="product-help">
                  Tests go to {accountEmail}. After saving the webhook signing secret, test this
                  connection before sending waitlist email.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy) || !connection.webhookConfigured}
                  onClick={test}
                >
                  {busy === "test" ? "Sending…" : "Send test email"}
                </Button>
              </div>
            )}
            {canManage && connection && (
              <div className="integration-disconnect">
                {confirmDisconnect ? (
                  <>
                    <p>Disconnect Resend? Waitlist emails will use the deployment sender.</p>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirmDisconnect(false)}
                        disabled={Boolean(busy)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={disconnect}
                        disabled={Boolean(busy)}
                      >
                        {busy === "disconnect" ? "Disconnecting…" : "Disconnect Resend"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDisconnect(true)}
                    disabled={Boolean(busy)}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
