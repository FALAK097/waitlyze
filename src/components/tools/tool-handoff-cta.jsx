"use client";

import { ArrowRight01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useOpenAuthModal } from "@/components/auth/auth-modal-provider";
import { authClient } from "@/lib/auth-client";
import { trackToolEvent } from "@/lib/tools/analytics";
import { cn } from "@/lib/utils";

/**
 * Primary value-matched conversion bridge for every Launch Lab tool.
 * Creates a validated ToolBlueprint on the server, preserves it via signed cookie
 * + callbackURL across Google OAuth for anonymous users, or navigates directly
 * to /waitlists/new?blueprint=<id> for signed-in users.
 */
export function ToolHandoffCta({
  toolSlug,
  toolVersion = "1.0",
  entrySurface = "public_tool",
  label,
  sublabel = "Free to start · No credit card · Draft stays private until you publish",
  buildBlueprint,
  resultBand = "standard",
  onApplyInProduct = null,
  compact = false,
  className = "",
}) {
  const router = useRouter();
  const openAuthModal = useOpenAuthModal();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    const blueprint = typeof buildBlueprint === "function" ? buildBlueprint() : buildBlueprint;
    if (!blueprint) return;

    if (onApplyInProduct) {
      setBusy(true);
      try {
        await onApplyInProduct({
          version: 1,
          toolSlug,
          ...blueprint,
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const [sessionResult, response] = await Promise.all([
        authClient.getSession().catch(() => null),
        fetch("/api/tools/blueprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: 1,
            toolSlug,
            ...blueprint,
          }),
        }),
      ]);
      const isAuthenticated = Boolean(sessionResult?.data?.user);
      trackToolEvent("TOOL_SIGNUP_CLICKED", {
        tool_slug: toolSlug,
        tool_version: toolVersion,
        entry_surface: entrySurface,
        result_band: resultBand,
        template_id: blueprint.templateId || "simple",
        authenticated: isAuthenticated,
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Could not prepare your campaign blueprint.");
      }

      const nextUrl = data.nextUrl || `/waitlists/new?blueprint=${encodeURIComponent(data.id)}`;
      if (isAuthenticated) {
        router.push(nextUrl);
      } else {
        openAuthModal({
          callbackURL: nextUrl,
          heading: "Carry your plan straight into Waitlyze.",
          description:
            "Sign in with Google to review your prefilled waitlist draft. Free for up to 100 signups, no credit card needed.",
        });
      }
    } catch (error) {
      toast.error(error?.message || "Could not prepare your campaign draft. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        compact
          ? "flex flex-wrap items-center gap-3"
          : "flex flex-col gap-3 rounded-xl border border-product-border-subtle bg-product-bg-inset/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      {!compact && (
        <div className="min-w-0">
          <p className="text-body font-semibold text-product-text-primary">
            Ready to turn this into a live waitlist?
          </p>
          <p className="mt-0.5 text-caption text-product-text-secondary">{sublabel}</p>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={handleClick}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-product-text-primary bg-product-accent-solid px-5 py-2.5 text-body font-semibold text-product-accent-label transition-colors duration-150 hover:bg-product-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-focus disabled:cursor-wait disabled:opacity-70 motion-safe:active:scale-[0.98]"
      >
        {busy ? (
          <>
            <HugeiconsIcon
              icon={Loading02Icon}
              size={17}
              className="animate-spin"
              aria-hidden="true"
            />
            <span>Preparing draft…</span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
