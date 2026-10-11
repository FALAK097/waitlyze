"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { SideDrawer } from "./side-drawer";

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
  return <>
    <div className="settings-integration-row">
      <div className="settings-integration-brand">{logo}<div><h3>Resend</h3><p>Send email from your own domain.</p></div></div>
      <div className="settings-integration-row-actions"><span>{statusLabel}</span><button type="button" className="product-button product-button-outline" onClick={() => setOpen(true)}>{canManage ? connection ? "Manage" : "Connect" : "View"}</button></div>
    </div>
    <SideDrawer open={open} onOpenChange={changeOpen} title="Connect Resend" description="Use a sending-only API key and a verified sender address.">
      <div className="integration-drawer-content">
        <span className="integration-status">{statusLabel}</span>
        {canManage ? <form onSubmit={save} className="integration-drawer-form">
          <label className="product-field" htmlFor="resend-api-key"><span>Sending API key</span></label>
          <div className="integration-secret-input"><input id="resend-api-key" type={revealed ? "text" : "password"} autoComplete="off" spellCheck="false" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={connection ? "Saved key · enter a replacement" : "re_…"} required={!connection} maxLength={512} disabled={Boolean(busy)} /><button type="button" aria-label={revealed ? "Hide API key" : "Show API key"} aria-pressed={revealed} onClick={() => setRevealed(!revealed)} disabled={!apiKey || Boolean(busy)}>{revealed ? <EyeOff size={18} /> : <Eye size={18} />}</button><button type="button" aria-label="Copy entered API key" disabled={!apiKey || Boolean(busy)} onClick={copy}><Copy size={18} /></button></div>
          {connection && <p className="product-help">Your saved key stays encrypted and cannot be viewed or copied.</p>}
          <label className="product-field"><span>Sender email</span><input type="email" autoComplete="email" value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} placeholder="hello@example.com" required disabled={Boolean(busy)} /></label>
          <button className="product-button product-button-primary" type="submit" disabled={Boolean(busy)}>{busy === "save" && <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />}{busy === "save" ? "Saving…" : connection ? "Save changes" : "Save connection"}</button>
        </form> : <p>Only workspace owners and admins can change this connection.</p>}
        {canManage && connection && <div className="integration-test"><p className="product-help">Tests go to {accountEmail}. After saving, emails use the deployment sender until this connection passes its test.</p><button type="button" className="product-button product-button-outline" disabled={Boolean(busy)} onClick={test}>{busy === "test" ? "Sending…" : "Send test email"}</button></div>}
        {error && <p role="alert" className="integration-error">{error}</p>}
        {canManage && connection && <div className="integration-disconnect">{confirmDisconnect ? <><p>Disconnect Resend? Waitlist emails will use the deployment sender.</p><div><button type="button" className="product-button" onClick={() => setConfirmDisconnect(false)} disabled={Boolean(busy)}>Cancel</button><button type="button" className="product-button integration-danger" onClick={disconnect} disabled={Boolean(busy)}>{busy === "disconnect" ? "Disconnecting…" : "Disconnect Resend"}</button></div></> : <button type="button" className="product-button product-button-ghost integration-danger" onClick={() => setConfirmDisconnect(true)} disabled={Boolean(busy)}>Disconnect</button>}</div>}
      </div>
    </SideDrawer>
  </>;
}
