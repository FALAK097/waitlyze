"use client";

import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProductDate } from "@/lib/product-date.mjs";

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
  const [toRevoke, setToRevoke] = useState(null);
  const panelHeading = useRef(null);
  const createButton = useRef(null);
  const panelWasOpen = useRef(false);
  useEffect(() => {
    const panelOpen = Boolean(creating || toRevoke);
    if (panelOpen) panelHeading.current?.focus();
    else if (panelWasOpen.current) createButton.current?.focus();
    panelWasOpen.current = panelOpen;
  }, [creating, toRevoke, loading]);

  async function load(signal) {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/v1/api-keys", { signal }),
        fetch("/api/v1/waitlists", { signal }),
      ]);
      const [keyData, waitlistData] = await Promise.all(
        responses.map((response) => response.json()),
      );
      if (
        !responses[0].ok ||
        !responses[1].ok ||
        !Array.isArray(keyData.data) ||
        !Array.isArray(waitlistData.data)
      )
        throw new Error("Could not load API keys. Try again.");
      setKeys(keyData.data);
      setWaitlists(waitlistData.data);
      if (!keyData.data.length && waitlistData.data.length) setCreating(true);
    } catch (failure) {
      if (failure.name !== "AbortError") setError(failure.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);
  function changeCreate(next) {
    if (busy) return;
    setCreating(next);
    if (!next) {
      setNewKey(null);
      setName("");
      setWaitlistId("");
      setExpiresInDays("90");
      setReveal(false);
    }
  }
  async function create(event) {
    event.preventDefault();
    setBusy(true);
    if (!waitlistId) {
      toast.error("Choose a waitlist.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/v1/api-keys/create-and-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          waitlistId,
          expiresInDays: expiresInDays === "never" ? null : Number(expiresInDays),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Could not create the key. Try again.");
      const created = data.data.apiKey;
      setNewKey(created);
      setKeys((current) => [...current, { ...created, apiKey: undefined }]);
      toast.success("API key created. Copy it now; it won't be shown again.");
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/api-keys/${toRevoke.id}`, { method: "DELETE" });
      if (response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error?.message || "Could not revoke the key. Try again.");
      }
      setKeys((current) => current.filter((key) => key.id !== toRevoke.id));
      setToRevoke(null);
      toast.success("API key revoked.");
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(newKey.apiKey);
      toast.success("API key copied.");
    } catch {
      toast.error("Copy is unavailable. Reveal and select the key to copy it manually.");
    }
  }
  return (
    <div className="grid gap-6" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          prefetch={false}
          href="/docs/api/reference"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-4"
        >
          View API reference ↗
        </Link>
        {!creating && !toRevoke && (
          <Button
            ref={createButton}
            onClick={() => setCreating(true)}
            disabled={loading || Boolean(error) || !waitlists.length}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
            Create API key
          </Button>
        )}
      </div>
      {!creating &&
        !toRevoke &&
        (loading ? (
          <>
            <p role="status" className="sr-only">
              Loading API keys…
            </p>
            <div className="h-18 rounded-lg bg-product-bg-inset" aria-hidden="true" />
            <div className="h-18 rounded-lg bg-product-bg-inset" aria-hidden="true" />
          </>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <Button variant="outline" onClick={() => load()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {!keys.length && !waitlists.length && (
              <div className="space-y-3">
                <p className="mb-0! text-sm leading-relaxed text-product-text-secondary">
                  Create a waitlist before adding an API key.
                </p>
                <Button variant="outline" render={<Link href="/waitlists/new" />}>
                  Create waitlist
                </Button>
              </div>
            )}
            {keys.length > 0 && (
              <div
                className={[
                  "rounded-xl border border-product-border-subtle bg-product-bg-surface",
                  "[&_table]:min-w-190",
                  "[&_th]:border-b [&_th]:border-product-border-subtle [&_th]:px-4 [&_th]:py-3.5",
                  "[&_thead_th]:font-medium [&_thead_th]:text-product-text-secondary",
                  "[&_td]:border-b [&_td]:border-product-border-subtle [&_td]:px-4 [&_td]:py-4",
                  "[&_td]:text-product-text-secondary",
                  "[&_th:first-child]:w-1/4 [&_th:nth-child(2)]:w-1/5 [&_th:nth-child(3)]:w-1/4",
                  "[&_th:nth-child(4)]:w-1/5",
                ].join(" ")}
              >
                <Table scrollLabel="API keys">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Key</TableHead>
                      <TableHead scope="col">Waitlist</TableHead>
                      <TableHead scope="col">Access</TableHead>
                      <TableHead scope="col">Expires</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableHead scope="row" className="whitespace-normal">
                          <span className="block font-medium text-product-text-primary">
                            {key.name}
                          </span>
                          <span className="block text-caption font-normal text-product-text-secondary">
                            {key.keyId ? `ID ${key.keyId.slice(0, 8)}…` : "Legacy key"}
                          </span>
                        </TableHead>
                        <TableCell>{key.waitlist?.name || "Unlinked"}</TableCell>
                        <TableCell className="whitespace-normal">Signups, status, points</TableCell>
                        <TableCell>
                          {key.expiresAt
                            ? formatProductDate(key.expiresAt, { includeTime: false })
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Revoke ${key.name}`}
                            onClick={() => setToRevoke(key)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ))}
      {creating && !loading && (
        <section
          aria-labelledby="create-api-key-heading"
          className="space-y-5 rounded-xl bg-product-bg-inset p-5 sm:p-6"
        >
          <header>
            <h3
              id="create-api-key-heading"
              ref={panelHeading}
              tabIndex={-1}
              className="text-base font-semibold"
            >
              {newKey ? "Save your API key" : "Create API key"}
            </h3>
            <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
              {newKey
                ? "Copy this secret now and store it on your server. You cannot retrieve it after leaving this screen."
                : "Choose a waitlist to create signups, check status, and award custom points from your server."}
            </p>
          </header>
          {newKey ? (
            <div className="space-y-4 [&_input]:font-mono [&_input]:text-caption">
              <InputGroup className="h-11">
                <InputGroupInput
                  aria-label="New API key"
                  type={reveal ? "text" : "password"}
                  value={newKey.apiKey}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={reveal ? "Hide new API key" : "Show new API key"}
                    aria-pressed={reveal}
                    onClick={() => setReveal(!reveal)}
                  >
                    {reveal ? (
                      <HugeiconsIcon icon={ViewOffIcon} size={16} aria-hidden="true" />
                    ) : (
                      <HugeiconsIcon icon={ViewIcon} size={16} aria-hidden="true" />
                    )}
                  </InputGroupButton>
                  <InputGroupButton size="icon-xs" aria-label="Copy new API key" onClick={copy}>
                    <HugeiconsIcon icon={Copy01Icon} size={16} aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <Button onClick={() => changeCreate(false)}>I’ve saved this key</Button>
            </div>
          ) : (
            <form onSubmit={create} className="space-y-4">
              <label className="product-field" htmlFor="api-key-name">
                <span>Name</span>
                <Input
                  id="api-key-name"
                  required
                  minLength={3}
                  maxLength={64}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Production server"
                  disabled={busy}
                />
              </label>
              <div className="product-field">
                <Label htmlFor="api-key-waitlist">Waitlist</Label>
                <Select value={waitlistId} onValueChange={setWaitlistId} disabled={busy}>
                  <SelectTrigger id="api-key-waitlist">
                    <SelectValue>
                      {waitlists.find((waitlist) => waitlist.id === waitlistId)?.name ||
                        "Choose a waitlist"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {waitlists.map((waitlist) => (
                      <SelectItem key={waitlist.id} value={waitlist.id}>
                        {waitlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="product-field">
                <Label htmlFor="api-key-expiry">Expires</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays} disabled={busy}>
                  <SelectTrigger id="api-key-expiry">
                    <SelectValue>
                      {
                        { 30: "In 30 days", 90: "In 90 days", 365: "In one year", never: "Never" }[
                          expiresInDays
                        ]
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">In 30 days</SelectItem>
                    <SelectItem value="90">In 90 days</SelectItem>
                    <SelectItem value="365">In one year</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating…" : "Create key"}
                </Button>
                {keys.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => changeCreate(false)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </section>
      )}
      {toRevoke && (
        <section aria-labelledby="revoke-api-key-heading" className="space-y-4">
          <h3
            id="revoke-api-key-heading"
            ref={panelHeading}
            tabIndex={-1}
            className="text-base font-semibold"
          >
            Revoke {toRevoke.name}?
          </h3>
          <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
            Apps using this key will lose access immediately. Create, configure, test, and switch
            all integrations to a replacement key before revoking.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={() => setToRevoke(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke} disabled={busy}>
              {busy ? "Revoking…" : "Revoke key"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
