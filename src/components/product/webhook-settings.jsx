"use client";

import {
  Add01Icon,
  Clock03Icon,
  Copy01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  RotateLeft01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const events = ["signup.created", "signup.verified"];
const MAX_ENDPOINTS = 5;
const deliveryDateTime = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function WebhookSettings({ waitListId, canManage = true }) {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [sheetId, setSheetId] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialLoad, setInitialLoad] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [configured, setConfigured] = useState(true);
  const controlsDisabled =
    !canManage || !configured || busy || initialLoad !== "ready" || Boolean(loadError);

  async function refresh({ signal, initial = false } = {}) {
    if (initial) {
      setInitialLoad("loading");
      setLoadError("");
    }
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/webhooks`, {
        cache: "no-store",
        signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load webhooks.");
      if (!Array.isArray(data.data))
        throw new Error("The webhook list could not be read. Try again.");
      setRows(data.data);
      setConfigured(data.configured !== false);
      setInitialLoad("ready");
      setLoadError("");
      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      setLoadError(
        error.message || "Unable to load webhooks. Check your connection and try again.",
      );
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
    setBusy(true);
    try {
      const response = await fetch(
        `/api/wait-lists/${encodeURIComponent(waitListId)}/webhooks${path}`,
        {
          method,
          headers: { "content-type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      if (data.data?.secret) {
        setSecret(data.data.secret);
        setShowSecret(false);
      }
      const success = path.endsWith("/test")
        ? "Test delivery queued."
        : path.endsWith("/rotate")
          ? "Signing secret rotated."
          : path.endsWith("/deliveries")
            ? "Replay queued."
            : method === "PATCH"
              ? "Endpoint updated."
              : "Webhook endpoint created.";
      toast.success(success);
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Request failed. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createEndpoint(event) {
    event.preventDefault();
    const created = await call("", "POST", { name, url, events });
    if (created) {
      setName("");
      setUrl("");
      setAddOpen(false);
    }
  }

  async function copySecret(subscriptionId) {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/wait-lists/${encodeURIComponent(waitListId)}/webhooks/${encodeURIComponent(subscriptionId)}/secret`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read the signing secret.");
      try {
        await navigator.clipboard.writeText(data.data.secret);
      } catch {
        throw new Error(
          "Copy is unavailable in this browser. Rotate the secret to reveal a new one.",
        );
      }
      toast.success("Signing secret copied.");
    } catch (error) {
      toast.error(error.message || "Could not copy the signing secret. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setAddOpen(true);
  }

  const atLimit = rows.length >= MAX_ENDPOINTS;
  const sheetRow = sheetId ? rows.find((row) => row.id === sheetId) || null : null;

  return (
    <div className="product-webhook-settings" aria-busy={initialLoad === "loading"}>
      {initialLoad === "loading" && (
        <>
          <p role="status" className="sr-only">
            Loading webhook endpoints…
          </p>
          <div className="product-webhook-loading" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </>
      )}
      {loadError && (
        <div role="alert">
          <p>Webhook endpoints couldn’t be loaded.</p>
          <p>{loadError}</p>
          <Button
            variant="outline"
            type="button"
            disabled={busy}
            onClick={() => refresh({ initial: initialLoad !== "ready" })}
          >
            Try again
          </Button>
        </div>
      )}
      {initialLoad === "ready" && !configured && (
        <p className="product-help" role="note">
          Webhook delivery isn&rsquo;t configured on this deployment yet. Endpoints can be added
          once an administrator finishes setup.
        </p>
      )}
      {initialLoad === "ready" && configured && (
        <>
          <div className="product-webhook-toolbar">
            <p>
              {rows.length ? `${rows.length} of ${MAX_ENDPOINTS} endpoints` : "No endpoints yet"}
            </p>
            {canManage && (
              <Button
                size="sm"
                type="button"
                disabled={controlsDisabled || atLimit}
                title={atLimit ? "A waitlist can have up to five endpoints." : undefined}
                onClick={openAdd}
              >
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                Add endpoint
              </Button>
            )}
          </div>
          {rows.length > 0 && (
            <div className="product-table-wrap product-webhook-table-wrap">
              <table className="product-waitlist-table product-webhook-table">
                <caption className="product-visually-hidden">Webhook endpoints</caption>
                <thead>
                  <tr>
                    <th scope="col">Endpoint</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last delivery</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className="product-webhook-endpoint-cell">
                        <strong>{row.name}</strong>
                        <code>{row.url}</code>
                      </th>
                      <td>
                        <span
                          className="product-webhook-status"
                          data-state={row.enabled ? "active" : "paused"}
                        >
                          <i aria-hidden="true" />
                          {row.enabled ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td>
                        {row.lastDeliveredAt
                          ? deliveryDateTime.format(new Date(row.lastDeliveredAt))
                          : "—"}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                            aria-label={`Actions for ${row.name}`}
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
                            {canManage && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={controlsDisabled}
                                onClick={() => call(`/${row.id}/test`)}
                              >
                                <HugeiconsIcon icon={SentIcon} aria-hidden="true" />
                                <span className="flex-1 whitespace-nowrap">Send test</span>
                              </DropdownMenuItem>
                            )}
                            {canManage && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={controlsDisabled}
                                onClick={() =>
                                  call(`/${row.id}`, "PATCH", { enabled: !row.enabled })
                                }
                              >
                                <HugeiconsIcon
                                  icon={row.enabled ? PauseIcon : PlayIcon}
                                  aria-hidden="true"
                                />
                                <span className="flex-1 whitespace-nowrap">
                                  {row.enabled ? "Pause" : "Resume"}
                                </span>
                              </DropdownMenuItem>
                            )}
                            {canManage && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={controlsDisabled}
                                onClick={() => copySecret(row.id)}
                              >
                                <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                                <span className="flex-1 whitespace-nowrap">
                                  Copy signing secret
                                </span>
                              </DropdownMenuItem>
                            )}
                            {canManage && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={controlsDisabled}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Rotate this signing secret? Update your receiving endpoint with the new secret immediately.",
                                    )
                                  )
                                    call(`/${row.id}/rotate`);
                                }}
                              >
                                <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden="true" />
                                <span className="flex-1 whitespace-nowrap">Rotate secret</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setSheetId(row.id)}
                            >
                              <HugeiconsIcon icon={Clock03Icon} aria-hidden="true" />
                              <span className="flex-1 whitespace-nowrap">View deliveries</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Sheet
            open={sheetRow !== null}
            onOpenChange={(next) => {
              if (!next) setSheetId(null);
            }}
          >
            <SheetContent>
              {sheetRow && (
                <>
                  <SheetHeader>
                    <SheetTitle>{sheetRow.name}</SheetTitle>
                  </SheetHeader>
                  <div className="product-webhook-sheet-body">
                    <div className="product-webhook-sheet-meta">
                      <code>{sheetRow.url}</code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        aria-label="Copy endpoint URL"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(sheetRow.url);
                            toast.success("Endpoint URL copied.");
                          } catch {
                            toast.error("Copy is unavailable in this browser.");
                          }
                        }}
                      >
                        <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                      </Button>
                      <span
                        className="product-webhook-status"
                        data-state={sheetRow.enabled ? "active" : "paused"}
                      >
                        <i aria-hidden="true" />
                        {sheetRow.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="product-webhook-detail">
                      <h4>Recent deliveries</h4>
                      {sheetRow.deliveries.length ? (
                        <ul>
                          {sheetRow.deliveries.map((delivery) => (
                            <li key={delivery.id} data-status={delivery.status.toLowerCase()}>
                              <i aria-hidden="true" />
                              <div>
                                <span>
                                  {delivery.eventType} ·{" "}
                                  {delivery.status.charAt(0) +
                                    delivery.status.slice(1).toLowerCase()}
                                </span>
                                <span>
                                  {deliveryDateTime.format(new Date(delivery.createdAt))} ·{" "}
                                  {delivery.responseStatus
                                    ? `HTTP ${delivery.responseStatus}`
                                    : delivery.lastErrorCode || "Queued"}
                                </span>
                              </div>
                              {canManage && delivery.status === "FAILED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  disabled={controlsDisabled}
                                  onClick={() =>
                                    call(`/${sheetRow.id}/deliveries`, "POST", {
                                      deliveryId: delivery.id,
                                    })
                                  }
                                >
                                  Replay
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="product-help">No deliveries yet.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
          <Dialog
            open={addOpen}
            onOpenChange={(next) => {
              if (!busy) setAddOpen(next);
            }}
          >
            <DialogContent>
              <DialogTitle>Add endpoint</DialogTitle>
              <DialogDescription>Signed signup events will be sent to this URL.</DialogDescription>
              <form onSubmit={createEndpoint} className="product-form">
                <div className="product-field">
                  <Label htmlFor="webhook-endpoint-name">Endpoint name</Label>
                  <Input
                    id="webhook-endpoint-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    required
                    placeholder="Production app"
                    disabled={controlsDisabled}
                    autoComplete="off"
                  />
                </div>
                <div className="product-field">
                  <Label htmlFor="webhook-endpoint-url">HTTPS endpoint</Label>
                  <Input
                    id="webhook-endpoint-url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    required
                    placeholder="https://api.example.com/waitlist-events"
                    disabled={controlsDisabled}
                    autoComplete="url"
                    aria-describedby="webhook-endpoint-dialog-help"
                  />
                  <p id="webhook-endpoint-dialog-help" className="product-help">
                    Use a public HTTPS endpoint. Receives both signup.created and signup.verified.
                    Payloads exclude subscriber email addresses.
                  </p>
                </div>
                <div className="product-actions">
                  <DialogClose render={<Button variant="outline" />} disabled={busy}>
                    Cancel
                  </DialogClose>
                  <Button type="submit" disabled={controlsDisabled}>
                    {busy ? "Adding…" : "Add endpoint"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
      {secret && (
        <section className="product-webhook-secret" aria-labelledby="webhook-secret-title">
          <h3 id="webhook-secret-title">Signing secret</h3>
          <p>Copy and store this secret before dismissing it.</p>
          <code>{showSecret ? secret : "••••••••••••••••••••••••"}</code>
          <div className="product-webhook-secret-actions">
            <Button
              size="sm"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(secret);
                  toast.success("Signing secret copied.");
                } catch {
                  setShowSecret(true);
                  toast.error("Copy is unavailable. Select and copy the secret above.");
                }
              }}
            >
              Copy secret
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowSecret((value) => !value)}
            >
              {showSecret ? "Hide" : "Show"}
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setSecret("")}>
              Dismiss
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
