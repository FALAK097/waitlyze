"use client";

import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { useState } from "react";
import { toast } from "sonner";

export function VerifyAction({ token, returnPath }) {
  const [state, setState] = useState("ready");
  const [referral, setReferral] = useState(null);

  async function verify() {
    setState("loading");
    try {
      const response = await fetch("/api/v1/sign_up/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "This link can’t be used.");
      setReferral(data.referral || null);
      setState("success");
    } catch (error) {
      setState("error");
      toast.error(error.message || "Verification failed. Request a new link from the waitlist.");
    }
  }

  const referralUrl = referral ? `${window.location.origin}${referral.path}` : null;

  async function copyReferralLink() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success("Referral link copied.");
    } catch {
      toast.error("Select the link and copy it.");
    }
  }

  return (
    <main className="verify-page" aria-labelledby="verify-title">
      <section className="verify-card">
        <p className="verify-eyebrow">WAITLYZE</p>
        <h1 id="verify-title">{state === "success" ? "You’re confirmed" : "Confirm your email"}</h1>
        <p>{state === "success" ? "Your email is verified and your place is secured." : "Confirm this address to secure your place on the waitlist."}</p>
        {state === "ready" || state === "loading" ? <Button type="button" onClick={verify} disabled={state === "loading"}>{state === "loading" ? "Confirming…" : "Confirm email"}</Button> : null}
        {referralUrl ? (
          <div className="verify-referral">
            <p>Invite a friend to {referral.waitListName}.</p>
            <Label htmlFor="verify-referral-link">Your referral link</Label>
            <div className="verify-referral-row">
              <Input id="verify-referral-link" value={referralUrl} readOnly />
              <Button type="button" onClick={copyReferralLink}>Copy link</Button>
            </div>
            {referral.position ? <p>Your position: <strong>#{referral.position}</strong></p> : null}
          </div>
        ) : null}
        {(state === "success" || state === "error") && !referralUrl ? <a href={returnPath}>Return to waitlist</a> : null}
      </section>
    </main>
  );
}
