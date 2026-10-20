"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
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
    <Link prefetch={false} href="/waitlists" className={classes}>
      {compact ? "Waitlists" : "Open your waitlists"}{" "}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} aria-hidden="true" />
    </Link>
  ) : (
    <Button type="button" className={classes} disabled={isPending} onClick={openAuthModal}>
      {children}
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} aria-hidden="true" />
    </Button>
  );
}
