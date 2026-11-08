"use client";

import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import Wordmark from "@/components/landing/wordmark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { publicFontClasses } from "@/lib/public-fonts";

export function AuthModal({ open, onOpenChange, onCloseAutoFocus }) {
  const [loading, setLoading] = useState(false);
  const [localMode, setLocalMode] = useState("signup");
  const [localName, setLocalName] = useState("");
  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const attemptRef = useRef(0);
  const localPasswordAuthEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_LOCAL_DEV_EMAIL_PASSWORD_AUTH === "true";

  const changeOpen = (nextOpen) => {
    if (!nextOpen) {
      attemptRef.current += 1;
      setLoading(false);
    }
    onOpenChange(nextOpen);
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    const attempt = ++attemptRef.current;
    setLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/waitlists",
      });
      if (result.error) throw new Error("Sign-in failed");
    } catch {
      if (attempt === attemptRef.current)
        toast.error("We couldn’t connect to Google. Please try again.");
    } finally {
      if (attempt === attemptRef.current) setLoading(false);
    }
  };

  async function handleLocalPasswordAuth(event) {
    event.preventDefault();
    if (loading) return;
    const attempt = ++attemptRef.current;
    setLoading(true);
    try {
      const result =
        localMode === "signup"
          ? await authClient.signUp.email({
              name: localName.trim() || "Local Preview",
              email: localEmail.trim(),
              password: localPassword,
              callbackURL: "/waitlists",
            })
          : await authClient.signIn.email({
              email: localEmail.trim(),
              password: localPassword,
              callbackURL: "/waitlists",
            });
      if (result.error) throw new Error(result.error.message || "Authentication failed.");
      if (attempt !== attemptRef.current) return;
      changeOpen(false);
      window.location.assign("/waitlists");
    } catch (error) {
      if (attempt === attemptRef.current)
        toast.error(error?.message || "Local sign-in failed. Check the email and password.");
    } finally {
      if (attempt === attemptRef.current) setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="max-h-[min(90dvh,48rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div
          className={`flex flex-col font-product-sans text-product-text-primary ${publicFontClasses}`}
        >
          <div className="mb-9">
            <Wordmark />
          </div>
          <DialogHeader>
            <DialogTitle>
              <span className="block text-left font-product-display text-3xl leading-tight tracking-tight">
                Your next launch starts here.
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="mt-3 block text-left text-sm leading-relaxed text-product-text-secondary">
                Create your account or sign in with Google. Your first waitlist is just a few steps
                away.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              aria-busy={loading}
              variant="product-outline"
              size="auth-provider"
              className="mt-7 w-full rounded-md disabled:cursor-wait disabled:opacity-65"
            >
              {loading ? (
                <HugeiconsIcon icon={Loading02Icon} className="size-5 animate-spin" />
              ) : (
                <Image src="/images/google.svg" alt="" width={20} height={20} unoptimized />
              )}
              {loading ? "Connecting to Google…" : "Continue with Google"}
            </Button>
            {localPasswordAuthEnabled && (
              <div className="mt-6 rounded-xl border border-product-border-subtle bg-product-bg-inset/50 p-4">
                <p className="mb-3 text-xs font-semibold tracking-wider text-product-success-text uppercase">
                  Local development only
                </p>
                <div
                  className="mb-4 flex gap-2"
                  role="group"
                  aria-label="Local authentication mode"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={localMode === "signup" ? "product-accent" : "product-ghost"}
                    aria-pressed={localMode === "signup"}
                    onClick={() => setLocalMode("signup")}
                  >
                    Create test account
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={localMode === "signin" ? "product-accent" : "product-ghost"}
                    aria-pressed={localMode === "signin"}
                    onClick={() => setLocalMode("signin")}
                  >
                    Sign in
                  </Button>
                </div>
                <form onSubmit={handleLocalPasswordAuth} className="grid gap-3">
                  {localMode === "signup" && (
                    <label className="grid gap-1.5 text-xs font-medium" htmlFor="local-auth-name">
                      Name
                      <Input
                        id="local-auth-name"
                        value={localName}
                        onChange={(event) => setLocalName(event.target.value)}
                        autoComplete="name"
                        maxLength={80}
                        disabled={loading}
                      />
                    </label>
                  )}
                  <label className="grid gap-1.5 text-xs font-medium" htmlFor="local-auth-email">
                    Email
                    <Input
                      id="local-auth-email"
                      type="email"
                      value={localEmail}
                      onChange={(event) => setLocalEmail(event.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium" htmlFor="local-auth-password">
                    Password
                    <Input
                      id="local-auth-password"
                      type="password"
                      value={localPassword}
                      onChange={(event) => setLocalPassword(event.target.value)}
                      autoComplete={localMode === "signup" ? "new-password" : "current-password"}
                      minLength={8}
                      required
                      disabled={loading}
                    />
                  </label>
                  <Button
                    type="submit"
                    variant="product-outline"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading
                      ? "Working…"
                      : localMode === "signup"
                        ? "Create local test account"
                        : "Sign in locally"}
                  </Button>
                </form>
              </div>
            )}
            <p className="mt-3.5 text-center text-xs text-product-text-secondary">
              Free to use. No credit card needed.
            </p>
            <p className="mt-7 pt-6 text-center text-micro leading-relaxed text-product-text-secondary">
              By continuing, you agree to our{" "}
              <Link
                prefetch={false}
                href="/terms"
                onClick={() => changeOpen(false)}
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                prefetch={false}
                href="/refund-policy"
                onClick={() => changeOpen(false)}
                className="underline underline-offset-4 hover:text-primary"
              >
                Refund Policy
              </Link>{" "}
              and{" "}
              <Link
                prefetch={false}
                href="/privacy"
                onClick={() => changeOpen(false)}
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
