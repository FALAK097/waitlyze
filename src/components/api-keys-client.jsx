"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Copy01Icon, Delete02Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { formatProductDate } from "@/lib/product-date.mjs";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";

export function ApiKeysClient() {
  const [keys, setKeys] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [waitlistId, setWaitlistId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("90");
  const [newKey, setNewKey] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [formError, setFormError] = useState("");
  const [toRevoke, setToRevoke] = useState(null);
  const panelHeading = useRef(null);
  const docsLink = useRef(null);
  const panelWasOpen = useRef(false);
  useEffect(() => {
    const panelOpen = Boolean(creating || toRevoke);
    if (panelOpen) panelHeading.current?.focus();
    else if (panelWasOpen.current) docsLink.current?.focus();
    panelWasOpen.current = panelOpen;
  }, [creating, toRevoke]);

  async function load(signal) {
    setLoading(true); setError("");
    try {
      const responses = await Promise.all([fetch("/api/v1/api-keys", { signal }), fetch("/api/v1/waitlists", { signal })]);
      const [keyData, waitlistData] = await Promise.all(responses.map((response) => response.json()));
      if (!responses[0].ok || !responses[1].ok || !Array.isArray(keyData.data) || !Array.isArray(waitlistData.data)) throw new Error("Could not load API keys. Try again.");
      setKeys(keyData.data); setWaitlists(waitlistData.data);
    } catch (failure) { if (failure.name !== "AbortError") setError(failure.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, []);
  const available = waitlists.filter((waitlist) => !keys.some((key) => key.waitlist?.id === waitlist.id));
  function changeCreate(next) {
    if (busy) return;
    setCreating(next);
    if (!next) { setNewKey(null); setName(""); setWaitlistId(""); setExpiresInDays("90"); setFormError(""); setReveal(false); }
  }
  async function create(event) {
    event.preventDefault(); setBusy(true); setFormError("");
    try {
      const response = await fetch("/api/v1/api-keys/create-and-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), waitlistId, expiresInDays: expiresInDays === "never" ? null : Number(expiresInDays) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Could not create the key. Try again.");
      const created = data.data.apiKey;
      setNewKey(created); setKeys((current) => [...current, { ...created, apiKey: undefined }]);
      toast.success("API key created. Copy it before closing.");
    } catch (failure) { setFormError(failure.message); toast.error(failure.message); }
    finally { setBusy(false); }
  }
  async function revoke(event) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch(`/api/v1/api-keys/${toRevoke.id}`, { method: "DELETE" });
      if (response.status !== 204) { const data = await response.json(); throw new Error(data.error?.message || "Could not revoke the key. Try again."); }
      setKeys((current) => current.filter((key) => key.id !== toRevoke.id)); setToRevoke(null); toast.success("API key revoked.");
    } catch (failure) { toast.error(failure.message); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(newKey.apiKey); toast.success("API key copied."); }
    catch { toast.error("Copy is unavailable. Reveal and select the key to copy it manually."); }
  }
  return <div className="settings-api-keys" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3"><Link ref={docsLink} href="/docs/api" className="text-sm underline underline-offset-4">Read API docs</Link>{!creating && !toRevoke && <Button onClick={() => setCreating(true)} disabled={loading || Boolean(error) || !available.length}><HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />Create key</Button>}</div>
    {!creating && !toRevoke && (loading ? <><p role="status" className="sr-only">Loading API keys…</p><div className="settings-api-key-skeleton" aria-hidden="true" /><div className="settings-api-key-skeleton" aria-hidden="true" /></> : error ? <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => load()}>Try again</Button></div> : <>
      {!keys.length && <p className="product-help">No API keys yet. Create one for a waitlist to accept signups from your server.</p>}
      {keys.map((key) => <article key={key.id} className="settings-api-key-row"><header><strong className="text-sm">{key.name}</strong><Button variant="ghost" size="icon" aria-label={`Revoke ${key.name}`} onClick={() => setToRevoke(key)}><HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" /></Button></header><p>{key.waitlist?.name || "Unlinked"} · Signup access</p><code className="text-sm break-all">{key.keyId ? `wl2_${key.keyId}_` : "Legacy key · "}••••••••••••••••</code><p>{key.expiresAt ? `Expires ${formatProductDate(key.expiresAt, { includeTime: false })}` : "No expiry"}</p></article>)}
      {!available.length && <p className="product-help">{waitlists.length ? "Each waitlist already has a key. Revoke a key before creating its replacement." : "Create a waitlist before adding an API key."}</p>}
    </>)}
    {creating && <section aria-labelledby="create-api-key-heading" className="space-y-4"><header><h3 id="create-api-key-heading" ref={panelHeading} tabIndex={-1} className="text-base font-semibold">{newKey ? "Save your API key" : "Create API key"}</h3><p className="product-help">{newKey ? "This secret is shown once. Keep it on your server." : "A key only creates signups for its selected waitlist."}</p></header>
      {newKey ? <div className="space-y-4"><div className="settings-api-key-secret"><Input aria-label="New API key" type={reveal ? "text" : "password"} value={newKey.apiKey} readOnly /><Button variant="ghost" size="icon" aria-label={reveal ? "Hide new API key" : "Show new API key"} aria-pressed={reveal} onClick={() => setReveal(!reveal)}>{reveal ? <HugeiconsIcon icon={ViewOffIcon} size={16} /> : <HugeiconsIcon icon={ViewIcon} size={16} />}</Button><Button variant="ghost" size="icon" aria-label="Copy new API key" onClick={copy}><HugeiconsIcon icon={Copy01Icon} size={16} /></Button></div><Button onClick={() => changeCreate(false)}>Done</Button></div> : <form onSubmit={create} className="space-y-4"><label className="product-field"><span>Name</span><Input required minLength={3} maxLength={64} value={name} onChange={(event) => setName(event.target.value)} placeholder="Production server" disabled={busy} /></label><label className="product-field"><span>Waitlist</span><NativeSelect required value={waitlistId} onChange={(event) => setWaitlistId(event.target.value)} disabled={busy}><NativeSelectOption value="">Choose a waitlist</NativeSelectOption>{available.map((waitlist) => <NativeSelectOption key={waitlist.id} value={waitlist.id}>{waitlist.name}</NativeSelectOption>)}</NativeSelect></label><label className="product-field"><span>Expires</span><NativeSelect value={expiresInDays} onChange={(event) => setExpiresInDays(event.target.value)} disabled={busy}><NativeSelectOption value="30">In 30 days</NativeSelectOption><NativeSelectOption value="90">In 90 days</NativeSelectOption><NativeSelectOption value="365">In one year</NativeSelectOption><NativeSelectOption value="never">Never</NativeSelectOption></NativeSelect></label>{formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create key"}</Button><Button type="button" variant="ghost" onClick={() => changeCreate(false)} disabled={busy}>Cancel</Button></div></form>}
    </section>}
    {toRevoke && <section aria-labelledby="revoke-api-key-heading" className="space-y-4"><h3 id="revoke-api-key-heading" ref={panelHeading} tabIndex={-1} className="text-base font-semibold">Revoke {toRevoke.name}?</h3><p className="product-help">Apps using this key will lose access immediately. Create a replacement after revoking.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => setToRevoke(null)}>Cancel</Button><Button variant="destructive" onClick={revoke} disabled={busy}>{busy ? "Revoking…" : "Revoke key"}</Button></div></section>}

  </div>;
}
