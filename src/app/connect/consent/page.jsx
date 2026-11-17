"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import Wordmark from "@/components/landing/wordmark";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function ConnectConsentContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clientId = searchParams.get("client_id") || "AI Agent";
  const scope = searchParams.get("scope") || "mcp:read mcp:write";

  const handleDecision = async (accept) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.oauth2.consent({
        accept,
        scope: typeof scope === "string" && scope.trim() ? scope.trim() : undefined,
      });

      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else if (res?.data?.redirectURI) {
        window.location.href = res.data.redirectURI;
      } else if (res?.error) {
        setError(res.error.message || "Failed to process consent response");
        setLoading(false);
      } else {
        window.close();
      }
    } catch (err) {
      setError(err?.message || "Failed to process consent response");
      setLoading(false);
    }
  };

  return (
    <div className="bg-product-background flex min-h-screen items-center justify-center px-4">
      <div className="border-product-border bg-product-surface w-full max-w-md rounded-2xl border p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Wordmark />
          <h1 className="mt-4 text-xl font-semibold text-product-text-primary">
            Authorize AI Client
          </h1>
          <p className="mt-1 text-sm text-product-text-secondary">
            An external AI client is requesting access to your Waitlyze account via MCP.
          </p>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="border-product-border/60 bg-product-subtle/40 mb-6 space-y-3 rounded-xl border p-4 text-sm">
          <div className="border-product-border/40 flex justify-between border-b pb-2">
            <span className="text-product-text-secondary">Client ID:</span>
            <span className="font-mono text-xs font-semibold text-product-text-primary">
              {clientId}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-product-text-secondary">Requested Permissions:</span>
            <ul className="list-inside list-disc space-y-1 text-xs text-product-text-primary">
              <li>Manage waitlists, styling, and publication status</li>
              <li>View and manage subscribers, referrals, and audience rankings</li>
              <li>Access waitlist analytics and K-factor viral metrics</li>
              <li>Dispatch email broadcasts and manage webhooks</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-center"
            onClick={() => handleDecision(false)}
            disabled={loading}
          >
            Deny
          </Button>
          <Button
            type="button"
            className="flex-1 justify-center font-medium"
            onClick={() => handleDecision(true)}
            disabled={loading}
          >
            {loading ? "Authorizing..." : "Authorize"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConnectConsentPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <ConnectConsentContent />
    </Suspense>
  );
}
