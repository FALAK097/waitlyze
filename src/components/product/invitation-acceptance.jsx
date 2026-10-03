"use client";

import { useActionState, useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/product/button";
import { acceptWorkspaceInvite } from "@/app/actions/workspace-invitations";

export function InvitationSignIn({ callbackURL }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function signIn() {
    startTransition(async () => {
      setError("");
      try {
        const result = await authClient.signIn.social({ provider: "google", callbackURL });
        if (result.error) setError("We couldn’t connect to Google. Please try again.");
      } catch {
        setError("We couldn’t connect to Google. Please try again.");
      }
    });
  }
  return <div className="product-invitation-actions"><Button type="button" onClick={signIn} disabled={pending}>{pending ? "Connecting…" : "Continue with Google"}</Button><p role="alert">{error}</p></div>;
}

export function InvitationSwitchAccount() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function signOut() {
    startTransition(async () => {
      setError("");
      try {
        const result = await authClient.signOut();
        if (result.error) setError("We couldn’t sign you out. Open Settings and try again.");
        else window.location.reload();
      } catch {
        setError("We couldn’t sign you out. Open Settings and try again.");
      }
    });
  }
  return <div className="product-invitation-actions"><Button type="button" variant="outline" onClick={signOut} disabled={pending}>{pending ? "Signing out…" : "Switch account"}</Button>{error ? <p role="alert">{error}</p> : null}</div>;
}

export function InvitationAcceptButton({ token }) {
  const [state, action, pending] = useActionState(acceptWorkspaceInvite, {});
  return <form action={action} className="product-invitation-actions">
    <input type="hidden" name="token" value={token} />
    <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Joining workspace…" : "Accept invitation"}</Button>
    <p role={state.error ? "alert" : "status"} aria-live={state.error ? "assertive" : "polite"}>{state.error || state.message || ""}</p>
  </form>;
}
