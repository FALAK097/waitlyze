"use client";

import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";

// Better Auth is externalized on the server. Keep its React hook in a
// browser-only island while the surrounding navigation and content stay SSR.
const AuthAction = dynamic(() => import("./auth-action"), { ssr: false });

export default function SignupButton({
  children = "Create your waitlist",
  compact = false,
  className = "",
}) {
  return (
    <span
      className={`wl-auth-action ${compact ? "wl-auth-action-compact" : ""}`}
    >
      <span
        className={`wl-button wl-auth-placeholder ${compact ? "wl-button-small" : "wl-button-primary"} ${className}`}
        aria-hidden="true"
      >
        {children}
        <ArrowUpRight size={18} />
      </span>
      <AuthAction compact={compact} className={className}>
        {children}
      </AuthAction>
    </span>
  );
}
