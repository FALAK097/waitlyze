"use client";

import { useEffect, useState } from "react";

const labels = { NEEDS_DNS: "Ownership check pending", VERIFYING: "DNS or certificate setup pending", ACTIVE: "Ready", NEEDS_ATTENTION: "Needs attention" };

export function CustomDomainSettings({ waitListId, canManage, available }) {
  const [domain, setDomain] = useState(null);
  const [hostname, setHostname] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    const response = await fetch(`/api/wait-lists/${waitListId}/domain`, { cache: "no-store" });
    const body = await response.json();
    if (response.ok) setDomain(body.data);
  }
  useEffect(() => { refresh(); }, [waitListId]);
  async function call(method, body) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/wait-lists/${waitListId}/domain`, { method, headers: { "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update domain.");
      setDomain(result.data || null);
      setHostname("");
      setMessage(method === "POST" ? "Domain added. Follow the DNS records below, then check again." : method === "DELETE" ? "Domain removed." : result.data.status === "ACTIVE" ? "Domain verified and connected." : "DNS is still propagating. Check again shortly.");
    } catch (error) { setMessage(error.message); await refresh(); }
    finally { setBusy(false); }
  }
  return <div className="product-custom-domain">
    {!domain ? <form onSubmit={(event) => { event.preventDefault(); call("POST", { hostname }); }}>
      {available ? <><label className="product-field"><span>Custom hostname</span><input autoComplete="url" value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="launch.example.com" required disabled={!canManage || busy} /></label>
      <button type="submit" className="product-button product-button-primary" disabled={!canManage || busy || !hostname.trim()}>{busy ? "Connecting…" : "Connect domain"}</button></> : <p className="product-help">Custom domains are unavailable until Vercel project credentials and the app root domain are configured.</p>}
      {!canManage && <p className="product-help">An owner or admin can connect a domain.</p>}
    </form> : <>
      <header><div><h3>{domain.hostname}</h3><p>{labels[domain.status] || "Status unknown"}</p></div>{canManage && available && <div className="product-domain-actions"><button type="button" disabled={busy} onClick={() => call("PATCH")}>{busy ? "Checking…" : "Check DNS"}</button><button type="button" disabled={busy} onClick={() => call("DELETE")}>Remove</button></div>}</header>
      {domain.status !== "ACTIVE" && <><p className="product-help">Add the records at your DNS provider. Verification can take a little while after DNS changes.</p>{(domain.dnsRecords || []).concat(domain.verification || []).map((record, index) => <dl className="product-domain-record" key={`${record.type}-${record.domain || record.name}-${index}`}><div><dt>Type</dt><dd>{record.type}</dd></div><div><dt>Name</dt><dd><code>{record.domain || record.name}</code></dd></div><div><dt>Value</dt><dd><code>{record.value}</code></dd></div></dl>)}</>}
      {domain.status === "ACTIVE" && <p className="product-help">DNS is configured and the provider reports the domain ready. TLS certificates are managed by the hosting provider.</p>}
    </>}
    <p role="status" aria-live="polite">{busy ? "Updating domain…" : message}</p>
  </div>;
}
