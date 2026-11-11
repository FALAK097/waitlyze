"use client";

import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [waitlistId, setWaitlistId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("90");
  const [newKey, setNewKey] = useState(null);
  const [reveal, setReveal] = useState(false);

  // Revoke Modal state
  const [toRevoke, setToRevoke] = useState(null);

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
      ) {
        throw new Error("Could not load API keys. Try again.");
      }
      setKeys(keyData.data);
      setWaitlists(waitlistData.data);
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

  function handleOpenCreate() {
    setName("");
    setWaitlistId(waitlists[0]?.id || "");
    setExpiresInDays("90");
    setNewKey(null);
    setReveal(false);
    setCreateOpen(true);
  }

  function handleCloseCreate(next) {
    if (busy && !next) return;
    setCreateOpen(next);
    if (!next) {
      setNewKey(null);
      setName("");
      setWaitlistId("");
      setExpiresInDays("90");
      setReveal(false);
    }
  }

  async function createKey(event) {
    event.preventDefault();
    if (!waitlistId) {
      toast.error("Choose a waitlist.");
      return;
    }
    setBusy(true);
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
      if (!response.ok) {
        throw new Error(data.error?.message || "Could not create the key. Try again.");
      }
      const created = data.data.apiKey;
      setNewKey(created);
      setKeys((current) => [{ ...created, apiKey: undefined }, ...current]);
      toast.success("API key created. Copy it now; it won't be shown again.");
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey() {
    if (!toRevoke) return;
    const response = await fetch(`/api/v1/api-keys/${toRevoke.id}`, { method: "DELETE" });
    if (response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || "Could not revoke the key. Try again.");
    }
    setKeys((current) => current.filter((key) => key.id !== toRevoke.id));
    toast.success("API key revoked.");
  }

  async function copyKey() {
    if (!newKey?.apiKey) return;
    try {
      await navigator.clipboard.writeText(newKey.apiKey);
      toast.success("API key copied to clipboard.");
    } catch {
      toast.error("Copy failed. Reveal and select the key to copy it manually.");
    }
  }

  return (
    <div className="grid gap-6" aria-busy={loading}>
      {/* Header action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          prefetch={false}
          href="/docs/api/reference"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-product-text-secondary underline underline-offset-4 hover:text-product-text-primary"
        >
          View API reference ↗
        </Link>
        <Button
          onClick={handleOpenCreate}
          disabled={loading || Boolean(error) || !waitlists.length}
          className="cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
          Create API key
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <p role="status" className="sr-only">
            Loading API keys…
          </p>
          <div className="h-16 animate-pulse rounded-xl bg-product-bg-inset" aria-hidden="true" />
          <div className="h-16 animate-pulse rounded-xl bg-product-bg-inset" aria-hidden="true" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          role="alert"
          className="border-product-danger-border bg-product-danger-surface rounded-xl border p-4 text-product-danger-text"
        >
          <p className="font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            className="mt-3 cursor-pointer"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty state: No waitlists */}
      {!loading && !error && !waitlists.length && (
        <div className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-8 text-center">
          <h3 className="text-base font-semibold text-product-text-primary">No waitlists found</h3>
          <p className="mt-1 text-sm text-product-text-secondary">
            Create a waitlist before generating an API key.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              render={<Link href="/waitlists/new" />}
              className="cursor-pointer"
            >
              Create waitlist
            </Button>
          </div>
        </div>
      )}

      {/* Empty state: Waitlists exist, but no keys yet */}
      {!loading && !error && waitlists.length > 0 && keys.length === 0 && (
        <div className="rounded-xl border border-product-border-subtle bg-product-bg-surface p-8 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-product-bg-inset text-product-text-secondary">
            <HugeiconsIcon icon={Key01Icon} size={20} aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-product-text-primary">No API keys yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-product-text-secondary">
            Create an API key to connect your backend server to create signups, check status, and
            award custom points.
          </p>
          <div className="mt-5">
            <Button onClick={handleOpenCreate} className="cursor-pointer">
              <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
              Create API key
            </Button>
          </div>
        </div>
      )}

      {/* Table view: Keys exist */}
      {!loading && !error && keys.length > 0 && (
        <div
          className={[
            "overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-surface",
            "[&_table]:min-w-190",
            "[&_th]:border-b [&_th]:border-product-border-subtle [&_th]:px-4 [&_th]:py-3.5",
            "[&_thead_th]:font-medium [&_thead_th]:text-product-text-secondary",
            "[&_td]:border-b [&_td]:border-product-border-subtle [&_td]:px-4 [&_td]:py-4",
            "[&_td]:text-product-text-secondary",
            "[&_tr:last-child_td]:border-b-0",
          ].join(" ")}
        >
          <Table scrollLabel="API keys">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-1/4">
                  Key
                </TableHead>
                <TableHead scope="col" className="w-1/4">
                  Waitlist
                </TableHead>
                <TableHead scope="col" className="w-1/4">
                  Access
                </TableHead>
                <TableHead scope="col" className="w-1/6">
                  Expires
                </TableHead>
                <TableHead scope="col" className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <span className="block font-medium text-product-text-primary">{key.name}</span>
                    <span className="block font-mono text-caption text-product-text-secondary">
                      {key.keyId ? `ID ${key.keyId.slice(0, 8)}…` : "Legacy key"}
                    </span>
                  </TableCell>
                  <TableCell className="text-product-text-secondary">
                    {key.waitlist?.name || "Unlinked"}
                  </TableCell>
                  <TableCell className="text-product-text-secondary">
                    Signups, status, points
                  </TableCell>
                  <TableCell className="text-product-text-secondary">
                    {key.expiresAt
                      ? formatProductDate(key.expiresAt, { includeTime: false })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Revoke ${key.name}`}
                      title="Revoke key"
                      className="cursor-pointer text-product-text-secondary hover:bg-transparent hover:text-product-danger-text"
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

      {/* Create Key Dialog */}
      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
          {newKey ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Save your API key</DialogTitle>
                <DialogDescription>
                  Copy this secret now and store it on your server. You cannot retrieve it after
                  closing this window.
                </DialogDescription>
              </DialogHeader>

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
                      className="cursor-pointer"
                      onClick={() => setReveal(!reveal)}
                    >
                      {reveal ? (
                        <HugeiconsIcon icon={ViewOffIcon} size={16} aria-hidden="true" />
                      ) : (
                        <HugeiconsIcon icon={ViewIcon} size={16} aria-hidden="true" />
                      )}
                    </InputGroupButton>
                    <InputGroupButton
                      size="icon-xs"
                      aria-label="Copy new API key"
                      className="cursor-pointer"
                      onClick={copyKey}
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={16} aria-hidden="true" />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <DialogFooter>
                <Button onClick={() => handleCloseCreate(false)} className="cursor-pointer">
                  I’ve saved this key
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={createKey} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Choose a waitlist to create signups, check status, and award custom points from
                  your server.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="api-key-name">Name</Label>
                  <Input
                    id="api-key-name"
                    required
                    minLength={3}
                    maxLength={64}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Production server"
                    disabled={busy}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="api-key-waitlist">Waitlist</Label>
                  <Select value={waitlistId} onValueChange={setWaitlistId} disabled={busy}>
                    <SelectTrigger id="api-key-waitlist" className="w-full">
                      <SelectValue placeholder="Choose a waitlist">
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

                <div className="space-y-1.5">
                  <Label htmlFor="api-key-expiry">Expires</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays} disabled={busy}>
                    <SelectTrigger id="api-key-expiry" className="w-full">
                      <SelectValue>
                        {
                          {
                            30: "In 30 days",
                            90: "In 90 days",
                            365: "In one year",
                            never: "Never",
                          }[expiresInDays]
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
              </div>

              <DialogFooter>
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                  disabled={busy}
                  className="cursor-pointer"
                >
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  disabled={busy || !name.trim() || !waitlistId}
                  className="cursor-pointer"
                >
                  {busy ? "Creating…" : "Create key"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Key Modal */}
      <ConfirmDialog
        open={Boolean(toRevoke)}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title={`Revoke ${toRevoke?.name || "API key"}?`}
        description="Apps using this key will lose access immediately. Create, configure, test, and switch all integrations to a replacement key before revoking."
        confirmLabel="Revoke key"
        pendingLabel="Revoking…"
        variant="destructive"
        onConfirm={revokeKey}
      />
    </div>
  );
}
