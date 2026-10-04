"use client";

import { useState } from "react";

export function VerifyAction({ token, returnPath }) {
  const [state, setState] = useState("ready");
  const [message, setMessage] = useState("");
  const [referral, setReferral] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  async function verify() {
    setState("loading");
    setMessage("");
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
      setMessage(error.message || "Verification failed. Request a new link from the waitlist.");
    }
  }

  const referralUrl = referral ? `${window.location.origin}${referral.path}` : null;

  async function copyReferralLink() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopyMessage("Referral link copied.");
    } catch {
      setCopyMessage("Select the link and copy it.");
    }
  }

  return (
    <main className="verify-page" aria-labelledby="verify-title">
      <section className="verify-card">
        <p className="verify-eyebrow">WAITLYZE</p>
        <h1 id="verify-title">{state === "success" ? "You’re confirmed" : "Confirm your email"}</h1>
        <p>{state === "success" ? "Your email is verified and your place is secured." : "Confirm this address to secure your place on the waitlist."}</p>
        {state === "ready" || state === "loading" ? <button type="button" onClick={verify} disabled={state === "loading"}>{state === "loading" ? "Confirming…" : "Confirm email"}</button> : null}
        {referralUrl ? (
          <div className="verify-referral">
            <p>Invite a friend to {referral.waitListName}.</p>
            <label htmlFor="verify-referral-link">Your referral link</label>
            <div className="verify-referral-row">
              <input id="verify-referral-link" value={referralUrl} readOnly />
              <button type="button" onClick={copyReferralLink}>Copy link</button>
            </div>
            <p role="status" aria-live="polite">{copyMessage}</p>
            {referral.position ? <p>Your position: <strong>#{referral.position}</strong></p> : null}
          </div>
        ) : null}
        {(state === "success" || state === "error") && !referralUrl ? <a href={returnPath}>Return to waitlist</a> : null}
        {message ? <p className="verify-error" role="alert">{message}</p> : null}
      </section>
    </main>
  );
}
