"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const labels = {
  NEEDS_DNS: "Ownership check pending",
  VERIFYING: "DNS or certificate setup pending",
  ACTIVE: "Ready",
  NEEDS_ATTENTION: "Needs attention",
};

function RecordCopyButton({ text, label }) {
  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="product-domain-copy"
              aria-label={`Copy DNS record ${label}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  toast.success("Copied to clipboard");
                } catch {
                  toast.error("Copy is unavailable. Select the text and copy it manually.");
                }
              }}
            >
              <HugeiconsIcon icon={Copy01Icon} className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        />
        <TooltipContent side="top">Copy {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CustomDomainSettings({ waitListId, canManage, available }) {
  const [domain, setDomain] = useState(null);
  const [hostname, setHostname] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);

  const refresh = useCallback(
    async (signal) => {
      setLoadState("loading");
      setLoadError("");
      try {
        const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/domain`, {
          cache: "no-store",
          signal,
        });
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
    },
    [waitListId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function retry() {
    await refresh();
  }

  async function call(method, body) {
    setBusy(true);
    try {
      const response = await fetch(`/api/wait-lists/${encodeURIComponent(waitListId)}/domain`, {
        method,
        headers: { "content-type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update domain.");

      if (method === "DELETE") setDomain(null);
      else if (result.data) setDomain(result.data);
      if (method === "POST") setHostname("");

      const successMessage =
        method === "POST"
          ? "Domain added. Follow the DNS records below, then check again."
          : method === "DELETE"
            ? "Domain removed."
            : result.data?.status === "ACTIVE"
              ? "Domain verified and connected."
              : "DNS is still propagating. Check again shortly.";
      toast.success(successMessage);
      const refreshed = await refresh();
      if (!refreshed) {
        toast.error(
          `${successMessage} The latest status could not be confirmed; retry to refresh it.`,
        );
      }
    } catch (error) {
      toast.error(error.message || "Could not update domain. Try again.");
      const refreshed = await refresh();
      if (!refreshed) toast.error("The current status could not be loaded; retry to recover.");
    } finally {
      setBusy(false);
    }
  }

  const actionsEnabled = canManage && available && !busy && loadState === "ready";

  return (
    <div className="product-custom-domain" aria-busy={busy || loadState === "loading"}>
      {loadState === "loading" && !domain && (
        <>
          <p role="status" className="sr-only">
            Loading custom domain…
          </p>
          <div className="product-domain-skeleton" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </>
      )}
      {loadState === "error" && (
        <div role="alert" className="product-domain-load-error">
          <p>{loadError}</p>
          <Button type="button" variant="outline" onClick={retry} disabled={busy}>
            Try again
          </Button>
        </div>
      )}

      {loadState === "ready" && !domain && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            call("POST", { hostname });
          }}
        >
          {available ? (
            <>
              <div className="product-field">
                <Label>
                  <span>Domain name</span>
                  <Input
                    autoComplete="url"
                    value={hostname}
                    onChange={(event) => setHostname(event.target.value)}
                    placeholder="launch.example.com"
                    required
                    disabled={!canManage || busy}
                  />
                </Label>
              </div>
              <Button type="submit" disabled={!actionsEnabled || !hostname.trim()}>
                {busy ? "Connecting…" : "Connect domain"}
              </Button>
            </>
          ) : (
            <p className="product-help">
              Custom domains are unavailable. Ask your administrator to finish domain setup.
            </p>
          )}
          {!canManage && <p className="product-help">An owner or admin can connect a domain.</p>}
        </form>
      )}

      {domain && (
        <>
          <header>
            <div>
              <h3>{domain.hostname}</h3>
              <p>{labels[domain.status] || "Status unknown"}</p>
            </div>
            {canManage && available && (
              <div className="product-domain-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!actionsEnabled}
                  onClick={() => call("PATCH")}
                >
                  {busy ? "Checking…" : "Check DNS"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!actionsEnabled}
                  onClick={() => setRemoveOpen(true)}
                >
                  Remove domain
                </Button>
              </div>
            )}
          </header>
          <ConfirmDialog
            open={removeOpen}
            onOpenChange={setRemoveOpen}
            title={`Remove ${domain.hostname}?`}
            description="This disconnects the domain from your waitlist. Subscribers keep using this waitlist's own URL."
            confirmLabel="Remove domain"
            pendingLabel="Removing…"
            onConfirm={() => call("DELETE")}
          />
          {domain.status !== "ACTIVE" && (
            <>
              <p className="product-help">
                Add the records at your DNS provider. Verification can take a little while after DNS
                changes.
              </p>
              {(domain.dnsRecords || []).concat(domain.verification || []).map((record, index) => (
                <dl
                  className="product-domain-record"
                  key={`${record.type}-${record.domain || record.name}-${index}`}
                >
                  <div>
                    <dt>Type</dt>
                    <dd>
                      <code>{record.type}</code>
                      <RecordCopyButton text={record.type} label="type" />
                    </dd>
                  </div>
                  <div>
                    <dt>Name</dt>
                    <dd>
                      <code>{record.domain || record.name}</code>
                      <RecordCopyButton text={record.domain || record.name} label="name" />
                    </dd>
                  </div>
                  <div>
                    <dt>Value</dt>
                    <dd>
                      <code>{record.value}</code>
                      <RecordCopyButton text={record.value} label="value" />
                    </dd>
                  </div>
                </dl>
              ))}
            </>
          )}
          {domain.status === "ACTIVE" && (
            <p className="product-help">Your waitlist is ready on this domain.</p>
          )}
        </>
      )}
    </div>
  );
}
