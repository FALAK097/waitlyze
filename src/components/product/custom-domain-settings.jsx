"use client";

import { useCallback, useEffect, useState } from "react";

const labels = { NEEDS_DNS: "Ownership check pending", VERIFYING: "DNS or certificate setup pending", ACTIVE: "Ready", NEEDS_ATTENTION: "Needs attention" };

export function CustomDomainSettings({ waitListId, canManage, available }) {
  const [domain, setDomain] = useState(null);
  const [hostname, setHostname] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const refresh = useCallback(async (signal) => {
    setLoadState("loading");
    setLoadError("");
    try {
      const response = await fetch(`/api/wait-lists/${waitListId}/domain`, { cache: "no-store", signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load custom domain settings.");
      setDomain(body.data || null);
      setLoadState("ready");
      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      setLoadState("error");
      setLoadError("Custom domain status couldn’t be loaded. Retry to safely continue.");
      return false;
    }
  }, [waitListId]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function retry() {
    setMessage("");
    setMessageIsError(false);
    await refresh();
  }

  async function call(method, body) {
    setBusy(true);
    setMessage("");
    setMessageIsError(false);
    try {
      const response = await fetch(`/api/wait-lists/${waitListId}/domain`, {
        method,
        headers: { "content-type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update domain.");

      if (method === "DELETE") setDomain(null);
      else if (result.data) setDomain(result.data);
      if (method === "POST") setHostname("");

      const successMessage = method === "POST"
        ? "Domain added. Follow the DNS records below, then check again."
        : method === "DELETE"
          ? "Domain removed."
          : result.data?.status === "ACTIVE"
            ? "Domain verified and connected."
            : "DNS is still propagating. Check again shortly.";
      setMessage(successMessage);
      const refreshed = await refresh();
      if (!refreshed) {
        setMessage(`${successMessage} The latest status could not be confirmed; retry to refresh it.`);
        setMessageIsError(true);
      }
    } catch (error) {
      setMessage(error.message || "Could not update domain.");
      setMessageIsError(true);
      const refreshed = await refresh();
      if (!refreshed) setMessage(`${error.message || "Could not update domain."} The current status could not be loaded; retry to recover.`);
    } finally {
      setBusy(false);
    }
  }

  const actionsEnabled = canManage && available && !busy && loadState === "ready";

  return <div className="product-custom-domain" aria-busy={busy || loadState === "loading"}>
    {loadState === "loading" && !domain && <>
      <p role="status">Loading custom domain…</p>
      <div className="product-domain-skeleton" aria-hidden="true"><i /><i /><i /></div>
    </>}
    {loadState === "error" && <div role="alert" className="product-domain-load-error">
      <p>{loadError}</p>
      <button type="button" className="product-button product-button-outline" onClick={retry} disabled={busy}>Retry</button>
    </div>}

    {loadState === "ready" && !domain && <form onSubmit={(event) => { event.preventDefault(); call("POST", { hostname }); }}>
      {available ? <><label className="product-field"><span>Custom hostname</span><input autoComplete="url" value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="launch.example.com" required disabled={!canManage || busy} /></label>
      <button type="submit" className="product-button product-button-primary" disabled={!actionsEnabled || !hostname.trim()}>{busy ? "Connecting…" : "Connect domain"}</button></> : <p className="product-help">Custom domains are unavailable until Vercel project credentials and the app root domain are configured.</p>}
      {!canManage && <p className="product-help">An owner or admin can connect a domain.</p>}
    </form>}

    {domain && <>
      <header><div><h3>{domain.hostname}</h3><p>{labels[domain.status] || "Status unknown"}</p></div>{canManage && available && <div className="product-domain-actions"><button type="button" disabled={!actionsEnabled} onClick={() => call("PATCH")}>{busy ? "Checking…" : "Check DNS"}</button><button type="button" disabled={!actionsEnabled} onClick={() => call("DELETE")}>Remove</button></div>}</header>
      {domain.status !== "ACTIVE" && <><p className="product-help">Add the records at your DNS provider. Verification can take a little while after DNS changes.</p>{(domain.dnsRecords || []).concat(domain.verification || []).map((record, index) => <dl className="product-domain-record" key={`${record.type}-${record.domain || record.name}-${index}`}><div><dt>Type</dt><dd>{record.type}</dd></div><div><dt>Name</dt><dd><code>{record.domain || record.name}</code></dd></div><div><dt>Value</dt><dd><code>{record.value}</code></dd></div></dl>)}</>}
      {domain.status === "ACTIVE" && <p className="product-help">DNS is configured and the provider reports the domain ready. TLS certificates are managed by the hosting provider.</p>}
    </>}

    <p role={messageIsError ? "alert" : "status"} aria-live={messageIsError ? "assertive" : "polite"}>{busy ? "Updating domain…" : message}</p>
  </div>;
}
