"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useSession } from "@/lib/auth-client";

export default function AuthAction({
  children = "Create your waitlist",
  className = "",
  compact = false,
}) {
  const { openAuthModal } = useAuthModal();
  const { data: session, isPending } = useSession();
  const classes = `wl-button ${compact ? "wl-button-small" : "wl-button-primary"} ${className}`;
  return session ? (
    <Link href="/dashboard" className={classes}>
      {compact ? "Dashboard" : "Open your dashboard"}{" "}
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  ) : (
    <button
      type="button"
      className={classes}
      disabled={isPending}
      onClick={openAuthModal}
    >
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </button>
  );
}
