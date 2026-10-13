"use client";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const events = ["signup.created", "signup.verified"];

export function WebhookSettings({ waitListId, canManage = true }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState([events[0]]);
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialLoad, setInitialLoad] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const controlsDisabled = !canManage || busy || initialLoad !== "ready" || Boolean(loadError);
  const [messageIsError, setMessageIsError] = useState(false);

  async function refresh({ signal, initial = false } = {}) {
    if (initial) {
      setInitialLoad("loading");
      setLoadError("");
      setMessage("");
      setMessageIsError(false);
    }
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/webhooks`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load webhooks.");
      if (!Array.isArray(data.data)) throw new Error("The webhook list could not be read. Try again.");
      setRows(data.data);
      setInitialLoad("ready");
      setLoadError("");
      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      setLoadError(error.message || "Unable to load webhooks. Check your connection and try again.");
      if (initial) setInitialLoad("error");
      return false;
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal, initial: true });
    return () => controller.abort();
  }, [waitListId]);

  async function call(path, method = "POST", body) {
    setBusy(true); setMessage(""); setMessageIsError(false);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/webhooks${path}`, { method, headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      if (data.data?.secret) { setSecret(data.data.secret); setShowSecret(false); }
      const refreshed = await refresh();
      if (refreshed) { const success = path.endsWith("/test") ? "Test delivery queued." : path.endsWith("/rotate") ? "Signing secret rotated." : path.endsWith("/deliveries") ? "Replay queued." : method === "PATCH" ? "Endpoint updated." : "Webhook endpoint created."; setMessage(success); toast.success(success); }
      return true;
    } catch (error) { setMessage(error.message); setMessageIsError(true); toast.error(error.message || "Request failed. Try again."); return false; }
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

  return <div className="product-webhook-settings" aria-busy={initialLoad === "loading"}>
    {initialLoad === "loading" && <>
      <p role="status">Loading webhook endpoints…</p>
      <article className="product-webhook-endpoint" aria-hidden="true">
        <div className="product-content-loading-settings-heading"><i /><i /></div>
        <div className="product-content-loading-settings-panel"><i /><i /><i /><i /></div>
      </article>
    </>}
    {loadError && <div role="alert"><p>Webhook endpoints couldn’t be loaded.</p><p>{loadError}</p><Button variant="outline" type="button" disabled={busy} onClick={() => refresh({ initial: initialLoad !== "ready" })}>Try again</Button></div>}
    {initialLoad === "ready" && rows.length === 0 && <p className="product-help">No endpoints connected yet.</p>}
    {initialLoad === "ready" && <form onSubmit={createEndpoint}>
      <div className="product-field"><Label><span>Endpoint name</span><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Production app" disabled={controlsDisabled} /></Label></div>
      <div className="product-field"><Label><span>HTTPS endpoint</span><Input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://api.example.com/waitlist-events" disabled={controlsDisabled} /></Label></div>
      <fieldset className="product-webhook-events" disabled={controlsDisabled}><legend>Events</legend>{events.map((item) => <Label key={item}><Checkbox checked={selected.includes(item)} onCheckedChange={() => toggleEvent(item)} />{item}</Label>)}</fieldset>
      <Button type="submit" disabled={controlsDisabled || !selected.length}>Add endpoint</Button>
    </form>}
    {initialLoad === "ready" && <p className="product-help">Use a public HTTPS endpoint. Payloads exclude subscriber email addresses.</p>}
    {secret && <section className="product-webhook-secret" aria-labelledby="webhook-secret-title"><h3 id="webhook-secret-title">Signing secret</h3><p>Copy and store this secret before dismissing it.</p><code>{showSecret ? secret : "••••••••••••••••••••••••"}</code><Button variant="ghost" type="button" onClick={() => setShowSecret((value) => !value)}>{showSecret ? "Hide secret" : "Show secret"}</Button><Button variant="outline" type="button" onClick={async () => { try { await navigator.clipboard.writeText(secret); setMessageIsError(false); setMessage("Signing secret copied."); toast.success("Signing secret copied."); } catch { setShowSecret(true); setMessageIsError(true); setMessage("Copy is unavailable. Select and copy the secret above."); } }}>Copy secret</Button><Button variant="outline" type="button" onClick={() => setSecret("")}>Dismiss</Button></section>}
    {rows.map((row) => <article className="product-webhook-endpoint" key={row.id}>
      <header><div><h3>{row.name}</h3><p><code>{row.url}</code> · {row.eventTypes.join(", ")}</p></div><span>{row.enabled ? "Active" : "Paused"}</span></header>
      {canManage && <div className="product-webhook-actions">
        <Button variant="outline" type="button" disabled={controlsDisabled} onClick={() => call(`/${row.id}/test`)}>Send test</Button>
        <Button variant="outline" type="button" disabled={controlsDisabled} onClick={() => call(`/${row.id}`, "PATCH", { enabled: !row.enabled })}>{row.enabled ? "Pause" : "Resume"}</Button>
        <Button variant="outline" type="button" disabled={controlsDisabled} onClick={() => { if (window.confirm("Rotate this signing secret? Update your receiving endpoint with the new secret immediately.")) call(`/${row.id}/rotate`); }}>Rotate secret</Button>
      </div>}
      <div className="product-webhook-deliveries"><Collapsible><CollapsibleTrigger>Recent deliveries</CollapsibleTrigger><CollapsibleContent>
      {row.deliveries.length ? <ul>{row.deliveries.map((delivery) => <li key={delivery.id}><span>{delivery.eventType} · {delivery.status.toLowerCase()}</span><span>{delivery.responseStatus || delivery.lastErrorCode || "Queued"}</span>{canManage && delivery.status === "FAILED" && <Button variant="outline" type="button" disabled={controlsDisabled} onClick={() => call(`/${row.id}/deliveries`, "POST", { deliveryId: delivery.id })}>Replay</Button>}</li>)}</ul> : <p className="product-help">No deliveries yet.</p>}</CollapsibleContent></Collapsible></div>
    </article>)}
    <p role={messageIsError ? "alert" : "status"} aria-live={messageIsError ? "assertive" : "polite"}>{busy ? "Saving…" : message}</p>
  </div>;
}
