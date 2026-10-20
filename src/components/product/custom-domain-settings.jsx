"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const labels = {
  NEEDS_DNS: "Ownership check pending",
  VERIFYING: "DNS or certificate setup pending",
  ACTIVE: "Ready",
  NEEDS_ATTENTION: "Needs attention",
};

export function CustomDomainSettings({ waitListId, canManage, available }) {
  const [domain, setDomain] = useState(null);
  const [hostname, setHostname] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");

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
    <div className="grid gap-4" aria-busy={busy || loadState === "loading"}>
      {loadState === "loading" && !domain && (
        <>
          <p role="status" className="sr-only">
            Loading custom domain…
          </p>
          <div
            className="grid gap-3 rounded-lg border border-product-border-subtle bg-product-bg-surface p-4.5"
            aria-hidden="true"
          >
            <i className="block h-4.5 w-3/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            <i className="block h-3.5 w-3/4 rounded bg-product-bg-inset motion-safe:animate-pulse" />
            <i className="block h-3.5 w-2/5 rounded bg-product-bg-inset motion-safe:animate-pulse" />
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
          className="grid max-w-140 gap-4 [&_input]:min-h-11 [&_input]:rounded-lg [&_input]:border [&_input]:border-product-border-control [&_input]:bg-product-bg-surface [&_input]:px-3 [&_input]:py-2.25 [&_input]:text-sm"
        >
          {available ? (
            <>
              <div className="product-field text-sm">
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
              <div className="justify-self-start">
                <Button type="submit" disabled={!actionsEnabled || !hostname.trim()}>
                  {busy ? "Connecting…" : "Connect domain"}
                </Button>
              </div>
            </>
          ) : (
            <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
              Custom domains are unavailable. Ask your administrator to finish domain setup.
            </p>
          )}
          {!canManage && (
            <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
              An owner or admin can connect a domain.
            </p>
          )}
        </form>
      )}

      {domain && (
        <>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="wrap-anywhere">{domain.hostname}</h3>
              <p className="m-0 mt-1 text-sm text-product-text-secondary">
                {labels[domain.status] || "Status unknown"}
              </p>
            </div>
            {canManage && available && (
              <div className="flex flex-wrap items-center justify-between gap-2 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:border [&_button]:border-product-border-control [&_button]:bg-product-bg-surface [&_button]:text-product-text-primary">
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
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${domain.hostname}? This disconnects the domain from your waitlist.`,
                      )
                    )
                      call("DELETE");
                  }}
                >
                  Remove domain
                </Button>
              </div>
            )}
          </header>
          {domain.status !== "ACTIVE" && (
            <>
              <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
                Add the records at your DNS provider. Verification can take a little while after DNS
                changes.
              </p>
              {(domain.dnsRecords || []).concat(domain.verification || []).map((record, index) => (
                <dl
                  className="my-3 grid gap-2 border-0 bg-transparent p-0"
                  key={`${record.type}-${record.domain || record.name}-${index}`}
                >
                  <div className="flex gap-3">
                    <dt className="w-18 shrink-0 text-caption text-product-text-secondary">Type</dt>
                    <dd className="m-0 min-w-0 flex-1 text-sm wrap-anywhere">{record.type}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-18 shrink-0 text-caption text-product-text-secondary">Name</dt>
                    <dd className="m-0 min-w-0 flex-1 text-sm wrap-anywhere">
                      <code>{record.domain || record.name}</code>
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-18 shrink-0 text-caption text-product-text-secondary">
                      Value
                    </dt>
                    <dd className="m-0 min-w-0 flex-1 text-sm wrap-anywhere">
                      <code>{record.value}</code>
                    </dd>
                  </div>
                </dl>
              ))}
            </>
          )}
          {domain.status === "ACTIVE" && (
            <p className="mb-4! text-sm leading-relaxed text-product-text-secondary">
              Your waitlist is ready on this domain.
            </p>
          )}
        </>
      )}
    </div>
  );
}
