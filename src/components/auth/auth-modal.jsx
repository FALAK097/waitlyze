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
import { authClient } from "@/lib/auth-client";
import { publicFontClasses } from "@/lib/public-fonts";

export function AuthModal({ open, onOpenChange, onCloseAutoFocus }) {
  const [loading, setLoading] = useState(false);
  const attemptRef = useRef(0);

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

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
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
