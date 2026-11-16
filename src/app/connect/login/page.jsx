"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import Wordmark from "@/components/landing/wordmark";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

// Whitelist callback URLs: only relative, same-app paths are allowed.
function sanitizeCallbackUrl(url) {
  return url.startsWith("/") && !url.startsWith("//") ? url : "";
}

function ConnectLoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sanitize the redirect target: only allow same-app relative paths so a
  // crafted callbackURL cannot bounce users to an attacker-controlled site
  // after sign in (open redirect).
  const callbackURL =
    sanitizeCallbackUrl(searchParams.get("callbackURL") || "") || "/connect/consent";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      setError(err?.message || "Failed to initiate sign in");
      setLoading(false);
    }
  };

  return (
    <div className="bg-product-background flex min-h-screen items-center justify-center px-4">
      <div className="border-product-border bg-product-surface w-full max-w-md rounded-2xl border p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Wordmark />
          <h1 className="mt-4 text-xl font-semibold text-product-text-primary">
            Connect your AI Agent
          </h1>
          <p className="mt-1 text-sm text-product-text-secondary">
            Sign in to grant your AI client access to your Waitlyze waitlists and audience data.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            className="w-full justify-center gap-2 py-2.5 font-medium"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Continue with Google"}
          </Button>

          <p className="text-center text-xs text-product-text-muted">
            Waitlyze uses OAuth 2.0 (RFC 9728) to securely authenticate Model Context Protocol
            agents without exposing long-lived credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnectLoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <ConnectLoginContent />
    </Suspense>
  );
}
