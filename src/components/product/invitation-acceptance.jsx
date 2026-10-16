"use client";

import { useActionState, useEffect, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { acceptWorkspaceInvite } from "@/app/actions/workspace-invitations";

export function InvitationSignIn({ callbackURL }) {
  const [pending, startTransition] = useTransition();
  function signIn() {
    startTransition(async () => {
      try {
        const result = await authClient.signIn.social({ provider: "google", callbackURL });
        if (result.error) toast.error("We couldn’t connect to Google. Please try again.");
      } catch {
        toast.error("We couldn’t connect to Google. Please try again.");
      }
    });
  }
  return <div className="product-invitation-actions"><Button type="button" onClick={signIn} disabled={pending}>{pending ? "Connecting…" : "Continue with Google"}</Button></div>;
}

export function InvitationSwitchAccount() {
  const [pending, startTransition] = useTransition();
  function signOut() {
    startTransition(async () => {
      try {
        const result = await authClient.signOut();
        if (result.error) toast.error("We couldn’t sign you out. Open Settings and try again.");
        else window.location.reload();
      } catch {
        toast.error("We couldn’t sign you out. Open Settings and try again.");
      }
    });
  }
  return <div className="product-invitation-actions"><Button type="button" variant="outline" onClick={signOut} disabled={pending}>{pending ? "Signing out…" : "Switch account"}</Button></div>;
}

export function InvitationAcceptButton({ token }) {
  const [state, action, pending] = useActionState(acceptWorkspaceInvite, {});
  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);
  return <form action={action} className="product-invitation-actions">
    <input type="hidden" name="token" value={token} />
    <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Joining workspace…" : "Accept invitation"}</Button>
  </form>;
}
