"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const statusLabel = {
  CONNECTED: "Connected",
  NEEDS_TEST: "Test required",
  NEEDS_ATTENTION: "Needs attention",
};

export function CloudflareEmailIntegration({ initialConnection, accountEmail, canManage }) {
  const [connection, setConnection] = useState(initialConnection);
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(initialConnection?.accountId || "");
  const [apiToken, setApiToken] = useState("");
  const [fromEmail, setFromEmail] = useState(initialConnection?.fromEmail || "");
  const [busy, setBusy] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  async function request(path, method, body) {
    const response = await fetch(path, {
      method,
      ...(body
        ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The request could not be completed.");
    return result;
  }

  async function perform(action, operation) {
    setBusy(action);
    try {
      await operation();
    } catch (error) {
      toast.error(error.message || "Check the Cloudflare connection and try again.");
    } finally {
      setBusy("");
    }
  }

  function save(event) {
    event.preventDefault();
    void perform("save", async () => {
      const result = await request("/api/settings/integrations/cloudflare-email", "PUT", {
        accountId,
        apiToken,
        fromEmail,
      });
      setConnection(result.data);
      setAccountId(result.data.accountId || "");
      setFromEmail(result.data.fromEmail || "");
      setApiToken("");
      toast.success("Saved. Send a test email to verify the Cloudflare sender.");
    });
  }

  function test() {
    void perform("test", async () => {
      const result = await request("/api/settings/integrations/cloudflare-email/test", "POST");
      setConnection((current) => ({ ...current, ...result.data }));
      toast.success(`Test email sent to ${result.data.sentTo}.`);
    });
  }

  function disconnect() {
    void perform("disconnect", async () => {
      await request("/api/settings/integrations/cloudflare-email", "DELETE");
      setConnection(null);
      setApiToken("");
      setAccountId("");
      setFromEmail("");
      setConfirmDisconnect(false);
      toast.success("Cloudflare Email disconnected.");
    });
  }

  function closeSheet(next) {
    if (busy) return;
    setOpen(next);
    if (!next) setApiToken("");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-product-border-subtle py-6 max-[600px]:items-start max-[400px]:flex-col">
      <div>
        <h3 className="mb-1!">Cloudflare Email Sending</h3>
        <p className="m-0 text-sm text-product-text-secondary">
          Transactional confirmation email through your Cloudflare account.
        </p>
        {connection && (
          <p className="m-0 mt-1 text-xs text-product-text-secondary">
            {statusLabel[connection.status] || "Status unknown"} · {connection.fromEmail}
          </p>
        )}
      </div>
      <Sheet open={open} onOpenChange={closeSheet}>
        <SheetTrigger render={<Button variant="outline" />}>
          {canManage ? (connection ? "Manage" : "Connect") : "View"}
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cloudflare Email Sending</SheetTitle>
            <SheetDescription>
              Connect an account with an Email Sending domain onboarded. Use a token scoped to Email
              Sending: Edit; the token is encrypted and never shown again.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-5 p-6 pt-0">
            <p className="m-0 rounded-lg bg-product-bg-inset p-3 text-caption leading-relaxed text-product-text-secondary">
              Cloudflare Email Sending is transactional-only. It cannot send broadcasts or marketing
              automations. Those remain on the workspace’s Resend connection.
            </p>
            {canManage ? (
              <form onSubmit={save} className="grid gap-4">
                <label className="product-field" htmlFor="cloudflare-account-id">
                  <span>Cloudflare account ID</span>
                  <Input
                    id="cloudflare-account-id"
                    autoComplete="off"
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                    placeholder="32-character account ID"
                    maxLength={32}
                    required
                    disabled={Boolean(busy)}
                  />
                </label>
                <label className="product-field" htmlFor="cloudflare-email-token">
                  <span>API token</span>
                  <Input
                    id="cloudflare-email-token"
                    type="password"
                    autoComplete="new-password"
                    spellCheck="false"
                    value={apiToken}
                    onChange={(event) => setApiToken(event.target.value)}
                    placeholder={
                      connection ? "Saved token · enter a replacement" : "Cloudflare API token"
                    }
                    required={!connection}
                    maxLength={512}
                    disabled={Boolean(busy)}
                  />
                  {connection && (
                    <span className="text-caption text-product-text-secondary">
                      The saved token is encrypted and cannot be viewed or copied.
                    </span>
                  )}
                </label>
                <label className="product-field" htmlFor="cloudflare-sender-email">
                  <span>Verified sender address</span>
                  <Input
                    id="cloudflare-sender-email"
                    type="email"
                    autoComplete="email"
                    value={fromEmail}
                    onChange={(event) => setFromEmail(event.target.value)}
                    placeholder="notifications@example.com"
                    required
                    disabled={Boolean(busy)}
                  />
                </label>
                <Button type="submit" disabled={Boolean(busy)}>
                  {busy === "save" ? "Saving…" : connection ? "Save changes" : "Save connection"}
                </Button>
              </form>
            ) : (
              <p className="m-0 text-sm text-product-text-secondary">
                Only workspace owners and admins can change this connection.
              </p>
            )}
            {connection && canManage && (
              <div className="grid gap-3">
                <p className="m-0 text-sm text-product-text-secondary">
                  Tests send a real email to {accountEmail}.
                </p>
                <Button type="button" variant="outline" onClick={test} disabled={Boolean(busy)}>
                  {busy === "test" ? "Sending…" : "Send test email"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDisconnect(true)}
                  disabled={Boolean(busy)}
                >
                  Disconnect Cloudflare Email
                </Button>
                <ConfirmDialog
                  open={confirmDisconnect}
                  onOpenChange={setConfirmDisconnect}
                  title="Disconnect Cloudflare Email?"
                  description="Transactional signup confirmation emails will use Waitlyze's Cloudflare sender instead. Resend remains connected for campaign email."
                  confirmLabel="Disconnect"
                  pendingLabel="Disconnecting…"
                  onConfirm={disconnect}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
