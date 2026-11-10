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

function CloudflareEmailForm({
  busy,
  hasConnection,
  accountId,
  apiToken,
  fromEmail,
  onAccountIdChange,
  onApiTokenChange,
  onFromEmailChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="product-field" htmlFor="cloudflare-account-id">
        <span>Cloudflare account ID</span>
        <Input
          id="cloudflare-account-id"
          autoComplete="off"
          value={accountId}
          onChange={(event) => onAccountIdChange(event.target.value)}
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
          onChange={(event) => onApiTokenChange(event.target.value)}
          placeholder={hasConnection ? "Saved token · enter a replacement" : "Cloudflare API token"}
          required={!hasConnection}
          maxLength={512}
          disabled={Boolean(busy)}
        />
        <span className="text-caption text-product-text-secondary">
          {hasConnection
            ? "The saved token is encrypted and cannot be viewed or copied."
            : "Use an API token with Email Sending: Edit permission."}
        </span>
      </label>
      <label className="product-field" htmlFor="cloudflare-sender-email">
        <span>Verified sender address</span>
        <Input
          id="cloudflare-sender-email"
          type="email"
          autoComplete="email"
          value={fromEmail}
          onChange={(event) => onFromEmailChange(event.target.value)}
          placeholder="notifications@example.com"
          required
          disabled={Boolean(busy)}
        />
      </label>
      <Button type="submit" disabled={Boolean(busy)}>
        {busy === "save" ? "Saving…" : hasConnection ? "Save changes" : "Save connection"}
      </Button>
    </form>
  );
}

function CloudflareEmailActions({
  busy,
  accountEmail,
  confirmDisconnect,
  onConfirmDisconnectChange,
  onDisconnect,
  onTest,
}) {
  return (
    <div className="grid gap-3">
      <p className="m-0 text-sm text-product-text-secondary">
        Tests send a real email to {accountEmail}.
      </p>
      <Button type="button" variant="outline" onClick={onTest} disabled={Boolean(busy)}>
        {busy === "test" ? "Sending…" : "Send test email"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onConfirmDisconnectChange(true)}
        disabled={Boolean(busy)}
      >
        Disconnect Cloudflare Email
      </Button>
      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={onConfirmDisconnectChange}
        title="Disconnect Cloudflare Email?"
        description="Transactional signup confirmations will fall back to your default sender. Campaign email is unaffected."
        confirmLabel="Disconnect"
        pendingLabel="Disconnecting…"
        onConfirm={onDisconnect}
      />
    </div>
  );
}

export function CloudflareEmailIntegration({
  initialConnection,
  accountEmail,
  canManage,
  logo,
}) {
  const [connection, setConnection] = useState(initialConnection);
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(initialConnection?.accountId || "");
  const [apiToken, setApiToken] = useState("");
  const [fromEmail, setFromEmail] = useState(initialConnection?.fromEmail || "");
  const [busy, setBusy] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

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
      try {
        const result = await request("/api/settings/integrations/cloudflare-email/test", "POST");
        setConnection((current) => ({ ...current, ...result.data }));
        toast.success(`Test email sent to ${result.data.sentTo}.`);
      } catch (error) {
        // A failed test can mark the connection NEEDS_ATTENTION server-side;
        // reload the authoritative state so the panel does not keep showing
        // Connected while transactional sends would fail.
        const fresh = await request("/api/settings/integrations/cloudflare-email", "GET").catch(
          () => null,
        );
        if (fresh) setConnection(fresh.data ?? null);
        throw error;
      }
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
    <div className="flex items-center justify-between gap-4 border-t border-product-border-subtle py-6 max-[600px]:items-start max-[600px]:gap-3 max-[400px]:flex-col max-[400px]:gap-5">
      <div className="flex items-center gap-4 max-[600px]:gap-3">
        {logo}
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
      </div>
      <div className="flex items-center gap-4 max-[600px]:flex-col max-[600px]:items-end max-[600px]:gap-2 max-[400px]:w-full max-[400px]:flex-row max-[400px]:items-center max-[400px]:justify-between [&_button]:max-[400px]:shrink-0 [&_button]:max-[400px]:whitespace-nowrap">
        <Sheet open={open} onOpenChange={closeSheet}>
          <SheetTrigger render={<Button variant="outline" />}>
            {canManage ? (connection ? "Manage" : "Connect") : "View"}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {connection ? "Manage Cloudflare Email" : "Connect Cloudflare Email"}
              </SheetTitle>
              <SheetDescription>
                Send transactional confirmation emails through your Cloudflare account.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-5 p-6 pt-0">
              {canManage ? (
                <CloudflareEmailForm
                  busy={busy}
                  hasConnection={Boolean(connection)}
                  accountId={accountId}
                  apiToken={apiToken}
                  fromEmail={fromEmail}
                  onAccountIdChange={setAccountId}
                  onApiTokenChange={setApiToken}
                  onFromEmailChange={setFromEmail}
                  onSubmit={save}
                />
              ) : (
                <p className="m-0 text-sm text-product-text-secondary">
                  Only workspace owners and admins can change this connection.
                </p>
              )}
              {connection && canManage && (
                <CloudflareEmailActions
                  busy={busy}
                  accountEmail={accountEmail}
                  confirmDisconnect={confirmDisconnect}
                  onConfirmDisconnectChange={setConfirmDisconnect}
                  onDisconnect={disconnect}
                  onTest={test}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
