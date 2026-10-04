"use client";

import { useEffect, useState } from "react";

const events = ["signup.created", "signup.verified"];

export function WebhookSettings({ waitListId, canManage = true }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState([events[0]]);
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch(`/api/wait-lists/${waitListId}/webhooks`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setRows(data.data);
    else setMessage(data.error || "Unable to load webhooks.");
  }
  useEffect(() => { refresh(); }, [waitListId]);

  async function call(path, method = "POST", body) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/wait-lists/${waitListId}/webhooks${path}`, { method, headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      if (data.data?.secret) setSecret(data.data.secret);
      setMessage(path.endsWith("/test") ? "Test delivery queued." : path.endsWith("/rotate") ? "Signing secret rotated." : path.endsWith("/deliveries") ? "Replay queued." : method === "PATCH" ? "Endpoint updated." : "Webhook endpoint created.");
      await refresh();
      return true;
    } catch (error) { setMessage(error.message); return false; }
    finally { setBusy(false); }
  }

  async function createEndpoint(event) {
    event.preventDefault();
    const created = await call("", "POST", { name, url, events: selected });
    if (created) { setName(""); setUrl(""); }
  }

  function toggleEvent(event) {
    setSelected((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  }

  return <div className="product-webhook-settings">
    <form onSubmit={createEndpoint}>
      <label className="product-field"><span>Endpoint name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Production app" disabled={!canManage || busy} /></label>
      <label className="product-field"><span>HTTPS endpoint</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://api.example.com/waitlist-events" disabled={!canManage || busy} /></label>
      <fieldset className="product-webhook-events" disabled={!canManage || busy}><legend>Events</legend>{events.map((item) => <label key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggleEvent(item)} />{item}</label>)}</fieldset>
      <button className="product-button product-button-primary" type="submit" disabled={!canManage || busy || !selected.length}>Add endpoint</button>
    </form>
    <p className="product-help">Endpoints must use HTTPS and resolve to public internet addresses. Subscriber email addresses are never included. An admin must configure WEBHOOK_SECRET_ENCRYPTION_KEY before adding endpoints.</p>
    {secret && <section className="product-webhook-secret" aria-labelledby="webhook-secret-title"><h3 id="webhook-secret-title">Copy your signing secret now</h3><p>This secret is shown once. Rotate it if you close this message before saving it.</p><code>{secret}</code><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(secret); setMessage("Signing secret copied."); } catch { setMessage("Copy is unavailable. Select and copy the secret above."); } }}>Copy secret</button><button type="button" onClick={() => setSecret("")}>Dismiss</button></section>}
    {rows.map((row) => <article className="product-webhook-endpoint" key={row.id}>
      <header><div><h3>{row.name}</h3><p><code>{row.url}</code> · {row.eventTypes.join(", ")}</p></div><span>{row.enabled ? "Active" : "Paused"}</span></header>
      {canManage && <div className="product-webhook-actions">
        <button type="button" disabled={busy} onClick={() => call(`/${row.id}/test`)}>Send test</button>
        <button type="button" disabled={busy} onClick={() => call(`/${row.id}`, "PATCH", { enabled: !row.enabled })}>{row.enabled ? "Pause" : "Resume"}</button>
        <button type="button" disabled={busy} onClick={() => call(`/${row.id}/rotate`)}>Rotate secret</button>
      </div>}
      <h4>Recent deliveries</h4>
      {row.deliveries.length ? <ul>{row.deliveries.map((delivery) => <li key={delivery.id}><span>{delivery.eventType} · {delivery.status.toLowerCase()}</span><span>{delivery.responseStatus || delivery.lastErrorCode || "Queued"}</span>{canManage && delivery.status === "FAILED" && <button type="button" disabled={busy} onClick={() => call(`/${row.id}/deliveries`, "POST", { deliveryId: delivery.id })}>Replay</button>}</li>)}</ul> : <p className="product-help">No deliveries yet.</p>}
    </article>)}
    <p role="status" aria-live="polite">{busy ? "Saving…" : message}</p>
  </div>;
}
