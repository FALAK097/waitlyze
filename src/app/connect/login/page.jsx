"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import Wordmark from "@/components/landing/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

// Whitelist callback URLs: only relative, same-app paths are allowed.
function sanitizeCallbackUrl(url) {
  return url.startsWith("/") && !url.startsWith("//") ? url : "";
}

function ConnectLoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewPassword, setReviewPassword] = useState("");
  const reviewerAccess = searchParams.get("review") === "1";
  const oauthRequest = searchParams.has("client_id") && searchParams.has("sig");

  // Sanitize the redirect target: only allow same-app relative paths so a
  // crafted callbackURL cannot bounce users to an attacker-controlled site
  // after sign in (open redirect).
  const callbackURL = sanitizeCallbackUrl(searchParams.get("callbackURL") || "") || "/waitlists";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        ...(oauthRequest ? {} : { callbackURL }),
      });
    } catch (err) {
      setError(err?.message || "Failed to initiate sign in");
      setLoading(false);
    }
  };

  const handleReviewerSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email: reviewEmail.trim(),
        password: reviewPassword,
      });
      if (result.error) throw new Error(result.error.message || "Authentication failed");

      // The OAuth provider client attaches the signed query to the sign-in
      // request and returns the next authorization URL. Preserve that flow
      // instead of replacing it with a generic consent page.
      if (oauthRequest) {
        const oauthRedirect = result.data?.url;
        if (!oauthRedirect) throw new Error("Unable to resume OAuth authorization");
        window.location.assign(oauthRedirect);
        return;
      }

      window.location.assign(callbackURL);
    } catch (err) {
      setError(err?.message || "Reviewer sign-in failed");
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

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-4">
          {!reviewerAccess ? (
            <Button
              type="button"
              className="w-full justify-center gap-2 py-2.5 font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Image src="/images/google.svg" alt="" width={18} height={18} unoptimized />
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>
          ) : (
            <form className="space-y-3" onSubmit={handleReviewerSignIn}>
              <Input
                type="email"
                autoComplete="username"
                aria-label="Reviewer email"
                placeholder="Reviewer email"
                value={reviewEmail}
                onChange={(event) => setReviewEmail(event.target.value)}
                required
              />
              <Input
                type="password"
                autoComplete="current-password"
                aria-label="Reviewer password"
                placeholder="Reviewer password"
                value={reviewPassword}
                onChange={(event) => setReviewPassword(event.target.value)}
                required
              />
              <Button type="submit" className="w-full font-medium" disabled={loading}>
                {loading ? "Signing in..." : "Sign in as reviewer"}
              </Button>
            </form>
          )}

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
