"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOpenAuthModal } from "@/components/auth/auth-modal-provider";

/**
 * Navigates to template creation when signed in or opens the sign-in modal
 * with the template callback preserved, avoiding static links to /waitlists.
 */
export function UseTemplateButton({ templateId, templateName, className, children }) {
  const router = useRouter();
  const openAuthModal = useOpenAuthModal();
  const [checking, setChecking] = useState(false);
  const target = `/waitlists/new?template=${encodeURIComponent(templateId)}`;

  async function handleClick() {
    if (checking) return;
    setChecking(true);
    try {
      const { authClient } = await import("@/lib/auth-client");
      const { data } = await authClient.getSession();
      if (data?.session) {
        router.push(target);
        return;
      }
    } catch {
      // Fall back to opening the auth modal with the template callback.
    } finally {
      setChecking(false);
    }
    openAuthModal({
      callbackURL: target,
      heading: templateName ? `Start with the ${templateName} template` : undefined,
      description: "Sign in or create a free account to customize and publish this template.",
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={checking} className={className}>
      {children}
    </button>
  );
}
