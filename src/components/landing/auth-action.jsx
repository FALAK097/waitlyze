"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const iconClasses =
  "shrink-0 transition-transform duration-180 group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

export default function AuthAction({
  children = "Create your waitlist",
  className = "",
  compact = false,
}) {
  const { openAuthModal } = useAuthModal();
  const { data: session, isPending } = useSession();
  const classes = cn(
    "group col-start-1 row-start-1 inline-flex min-h-13 items-center justify-center gap-5 rounded-md border border-product-border-subtle bg-product-bg-surface px-6 py-3 text-body leading-tight font-semibold whitespace-nowrap text-product-text-primary transition duration-160 hover:border-product-text-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 active:translate-y-px disabled:cursor-wait disabled:opacity-65",
    compact
      ? "min-h-10 gap-6 px-4 py-2 text-caption"
      : "border-product-text-primary bg-product-accent-solid text-product-text-primary hover:border-product-text-primary hover:bg-product-accent-hover",
    className,
  );
  return session ? (
    <Link prefetch={false} href="/waitlists" className={classes}>
      {compact ? "Waitlists" : "Open your waitlists"}{" "}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={18}
        aria-hidden="true"
        className={iconClasses}
      />
    </Link>
  ) : (
    <Button
      type="button"
      variant={compact ? "product-auth-outline" : "product-accent"}
      size={compact ? "product-action-compact" : "product-action"}
      className={cn("group", className)}
      disabled={isPending}
      onClick={openAuthModal}
    >
      {children}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={18}
        aria-hidden="true"
        className={iconClasses}
      />
    </Button>
  );
}
