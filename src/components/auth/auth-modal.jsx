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

import "@/components/landing/public.css";

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
      <DialogContent
        className={`wl wl-auth ${publicFontClasses}`}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <Wordmark />
        <DialogHeader>
          <DialogTitle className="wl-auth-title">Your next launch starts here.</DialogTitle>
          <DialogDescription className="wl-auth-description">
            Create your account or sign in with Google. Your first waitlist is just a few steps
            away.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Button
            variant="outline"
            className="wl-auth-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <HugeiconsIcon icon={Loading02Icon} className="size-5 animate-spin" />
            ) : (
              <Image src="/images/google.svg" alt="" width={20} height={20} unoptimized />
            )}
            {loading ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          <p className="wl-auth-note">Free to use. No credit card needed.</p>
          <p className="wl-auth-legal">
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
      </DialogContent>
    </Dialog>
  );
}
