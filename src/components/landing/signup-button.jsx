"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
// Better Auth is externalized on the server. Keep its React hook in a
// browser-only island while the surrounding navigation and content stay SSR.
const AuthAction = dynamic(() => import("./auth-action"), { ssr: false });

import { cn } from "@/lib/utils";

const iconClasses =
  "shrink-0 transition-transform duration-180 group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

export default function SignupButton({
  children = "Create your waitlist",
  compact = false,
  className = "",
}) {
  return (
    <span className="inline-grid">
      <span
        className={cn(
          "group pointer-events-none invisible col-start-1 row-start-1 inline-flex min-h-13 items-center justify-center gap-5 rounded-md border border-product-border-subtle bg-product-bg-surface px-6 py-3 text-body leading-tight font-semibold whitespace-nowrap text-product-text-primary",
          compact
            ? "min-h-10 gap-6 px-4 py-2 text-caption"
            : "border-product-text-primary bg-product-accent-solid text-product-text-primary",
          className,
        )}
        aria-hidden="true"
      >
        {children}
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} className={iconClasses} />
      </span>
      <AuthAction compact={compact} className={className}>
        {children}
      </AuthAction>
    </span>
  );
}
