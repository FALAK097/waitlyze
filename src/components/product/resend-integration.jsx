"use client";

import { useState } from "react";

export function ResendIntegration({ initialConnection, accountEmail, canManage }) {
  const [connection, setConnection] = useState(initialConnection);
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState(initialConnection?.fromEmail || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function request(path, method, body) {
    const response = await fetch(path, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const data = await request("/api/settings/integrations/resend", "PUT", { apiKey, fromEmail });
      setConnection(data.data); setApiKey("");
      setMessage("Saved. Send a test email to activate this connection.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setMessage("");
    try {
      const data = await request("/api/settings/integrations/resend/test", "POST");
      setConnection((current) => ({ ...current, ...data.data }));
      setMessage(`Test email sent to ${data.data.sentTo}.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setMessage("");
    try {
      await request("/api/settings/integrations/resend", "DELETE");
      setConnection(null); setApiKey(""); setFromEmail("");
      setMessage("Resend disconnected. Waitlist emails will use the deployment sender.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  const status = connection?.status || "DISCONNECTED";
  const statusLabel = { CONNECTED: "Connected", NEEDS_TEST: "Test needed", NEEDS_ATTENTION: "Needs attention", DISCONNECTED: "Not connected" }[status];

  return <div className="product-integration-card">
    <header className="product-integration-heading">
      <div><h3>Resend</h3><p>Send verification, broadcast, and automation email from your workspace.</p></div>
      <span className={`product-integration-status is-${status.toLowerCase().replaceAll("_", "-")}`}>{statusLabel}</span>
    </header>
    {canManage ? <form onSubmit={save} className="product-integration-form">
      <label className="product-integration-field"><span>Resend sending API key</span><input type="password" name="resend-api-key" autoComplete="off" spellCheck="false" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={connection ? "Saved · enter a new key to replace" : "re_…"} required={!connection} disabled={busy} /></label>
      <label className="product-integration-field"><span>From email</span><input type="email" name="resend-from-email" autoComplete="email" value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} placeholder="hello@example.com" required disabled={busy} /></label>
      <div className="product-integration-actions"><button className="product-button product-button-primary" type="submit" disabled={busy}>{connection ? "Save changes" : "Save connection"}</button>{connection && <button className="product-button product-button-outline" type="button" onClick={test} disabled={busy}>Send test email</button>}{connection && <button className="product-button product-button-ghost" type="button" onClick={remove} disabled={busy}>Disconnect</button>}</div>
    </form> : <p className="product-help">Only a workspace owner or admin can change integrations.</p>}
    <p className="product-integration-note">Use a Resend sending-only API key. {connection?.status !== "CONNECTED" ? "The deployment sender remains active until the test succeeds." : `Tests go to your account email (${accountEmail}).`}</p>
    <p role="status" aria-live="polite" className="product-announcement">{busy ? "Working…" : message}</p>
  </div>;
}
