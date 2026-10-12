"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

import Link from "next/link";
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
    <Link href="/wait-lists" className={classes}>
      {compact ? "Waitlists" : "Open your waitlists"}{" "}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} aria-hidden="true" />
    </Link>
  ) : (
    <Button
      type="button"
      className={classes}
      disabled={isPending}
      onClick={openAuthModal}
    >
      {children}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} aria-hidden="true" />
    </Button>
  );
}
