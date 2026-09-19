"use client";

import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { publicFontClasses } from "@/lib/public-fonts";
import Wordmark from "@/components/landing/wordmark";
import "@/components/landing/public.css";

export function AuthModal({ open, onOpenChange, onCloseAutoFocus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const attemptRef = useRef(0);

  const changeOpen = (nextOpen) => {
    if (!nextOpen) {
      attemptRef.current += 1;
      setLoading(false);
      setError("");
    }
    onOpenChange(nextOpen);
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    const attempt = ++attemptRef.current;
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (result.error) throw new Error("Sign-in failed");
    } catch {
      if (attempt === attemptRef.current)
        setError("We couldn’t connect to Google. Please try again.");
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
          <DialogTitle className="wl-auth-title">
            Your next launch starts here.
          </DialogTitle>
          <DialogDescription className="wl-auth-description">
            Create your account or sign in with Google. Your first waitlist is
            just a few steps away.
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
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Image src="/images/google.svg" alt="" width={20} height={20} />
            )}
            {loading ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          {error ? (
            <p role="alert" className="wl-auth-error">
              {error}
            </p>
          ) : null}
          <p className="wl-auth-note">Free to use. No credit card needed.</p>
          <p className="wl-auth-legal">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              onClick={() => changeOpen(false)}
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
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
