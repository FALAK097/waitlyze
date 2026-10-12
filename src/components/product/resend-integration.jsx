"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Loading03Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function ResendIntegration({ initialConnection, accountEmail, canManage, logo }) {
  const [connection, setConnection] = useState(initialConnection);
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [fromEmail, setFromEmail] = useState(initialConnection?.fromEmail || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  async function request(path, method, body) {
    const response = await fetch(path, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request could not be completed. Try again.");
    return data;
  }
  async function perform(action, callback) {
    setBusy(action); setError("");
    try { await callback(); }
    catch (failure) { const message = failure.message || "Check your connection and try again."; setError(message); toast.error(message); }
    finally { setBusy(""); }
  }
  function changeOpen(next) {
    if (busy) return;
    setOpen(next);
    if (!next) { setApiKey(""); setRevealed(false); setConfirmDisconnect(false); setError(""); }
  }
  function save(event) {
    event.preventDefault();
    perform("save", async () => {
      const data = await request("/api/settings/integrations/resend", "PUT", { apiKey, fromEmail });
      setConnection(data.data); setApiKey(""); setRevealed(false);
      toast.success("Saved. Send a test email to activate Resend.");
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
      setConnection(null); setApiKey(""); setFromEmail(""); setConfirmDisconnect(false);
      toast.success("Resend disconnected.");
    });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(apiKey); toast.success("Key copied."); }
    catch { toast.error("Copy is unavailable. Select the key and copy it manually."); }
  }
  const status = connection?.status || "DISCONNECTED";
  const statusLabel = { CONNECTED: "Connected", NEEDS_TEST: "Test needed", NEEDS_ATTENTION: "Needs attention", DISCONNECTED: "Not connected" }[status] || "Not connected";
  return <Sheet open={open} onOpenChange={changeOpen}>
    <div className="settings-integration-row">
      <div className="settings-integration-brand">{logo}<div><h3>Resend</h3><p>Send email from your own domain.</p></div></div>
      <div className="settings-integration-row-actions"><span>{statusLabel}</span><SheetTrigger render={<Button variant="outline" />}>{canManage ? connection ? "Manage" : "Connect" : "View"}</SheetTrigger></div>
    </div>
    <SheetContent>
      <SheetHeader><SheetTitle>Connect Resend</SheetTitle><SheetDescription>Use a sending-only API key and a verified sender address.</SheetDescription></SheetHeader>
      <div className="p-6 pt-0">
      <div className="integration-drawer-content">
        <span className="integration-status">{statusLabel}</span>
        {canManage ? <form onSubmit={save} className="integration-drawer-form">
          <label className="product-field" htmlFor="resend-api-key"><span>Sending API key</span></label>
          <div className="integration-secret-input"><Input id="resend-api-key" type={revealed ? "text" : "password"} autoComplete="off" spellCheck="false" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={connection ? "Saved key · enter a replacement" : "re_…"} required={!connection} maxLength={512} disabled={Boolean(busy)} /><Button type="button" variant="ghost" size="icon" aria-label={revealed ? "Hide API key" : "Show API key"} aria-pressed={revealed} onClick={() => setRevealed(!revealed)} disabled={!apiKey || Boolean(busy)}>{revealed ? <HugeiconsIcon icon={ViewOffIcon} size={18} /> : <HugeiconsIcon icon={ViewIcon} size={18} />}</Button><Button type="button" variant="ghost" size="icon" aria-label="Copy entered API key" disabled={!apiKey || Boolean(busy)} onClick={copy}><HugeiconsIcon icon={Copy01Icon} size={18} /></Button></div>
          {connection && <p className="product-help">Your saved key stays encrypted and cannot be viewed or copied.</p>}
          <label className="product-field"><span>Sender email</span><Input type="email" autoComplete="email" value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} placeholder="hello@example.com" required disabled={Boolean(busy)} /></label>
          <Button type="submit" disabled={Boolean(busy)}>{busy === "save" && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} aria-hidden="true" />}{busy === "save" ? "Saving…" : connection ? "Save changes" : "Save connection"}</Button>
        </form> : <p>Only workspace owners and admins can change this connection.</p>}
        {canManage && connection && <div className="integration-test"><p className="product-help">Tests go to {accountEmail}. After saving, emails use the deployment sender until this connection passes its test.</p><Button type="button" variant="outline" disabled={Boolean(busy)} onClick={test}>{busy === "test" ? "Sending…" : "Send test email"}</Button></div>}
        {error && <p role="alert" className="integration-error">{error}</p>}
        {canManage && connection && <div className="integration-disconnect">{confirmDisconnect ? <><p>Disconnect Resend? Waitlist emails will use the deployment sender.</p><div><Button type="button" variant="outline" onClick={() => setConfirmDisconnect(false)} disabled={Boolean(busy)}>Cancel</Button><Button type="button" variant="destructive" onClick={disconnect} disabled={Boolean(busy)}>{busy === "disconnect" ? "Disconnecting…" : "Disconnect Resend"}</Button></div></> : <Button type="button" variant="ghost" onClick={() => setConfirmDisconnect(true)} disabled={Boolean(busy)}>Disconnect</Button>}</div>}
      </div>
      </div>
    </SheetContent>
  </Sheet>;
}
