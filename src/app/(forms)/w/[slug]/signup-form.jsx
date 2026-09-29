"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function SignupForm({ waitListId, publicSlug, showReferrals, label, buttonText, thankYou }) {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setBusy(true);
    setMessage("");
    try {
      let hypeSession = localStorage.getItem("hypeSession");
      if (!hypeSession) {
        hypeSession = crypto.randomUUID();
        localStorage.setItem("hypeSession", hypeSession);
      }
      const response = await fetch("/api/v1/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          waitListId,
          hypeSession,
          ...(showReferrals && referralCode && /^[A-Za-z0-9_-]{8,256}$/.test(referralCode)
            ? { referralId: referralCode }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Couldn't join the waitlist. Try again.");

      const referralCode = data.signUp?.referralCode;
      const referralUrl = showReferrals && referralCode
        ? `${window.location.origin}/w/${encodeURIComponent(publicSlug)}?r=${encodeURIComponent(referralCode)}`
        : null;
      setResult({ position: data.signUp?.rank ?? null, referralUrl, heading: thankYou.heading, body: thankYou.body });
      setMessage("Signup received.");
      form.reset();
    } catch (error) {
      setMessage(error.message || "Couldn't join the waitlist. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyReferralLink() {
    if (!result?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(result.referralUrl);
      setMessage("Referral link copied.");
    } catch {
      setMessage("Copy isn’t available here. Select the link and copy it.");
    }
  }

  if (result) {
    return (
      <section className="published-signup-result" aria-labelledby="signup-result-title">
        <p className="published-signup-status" role="status" aria-live="polite">{message}</p>
        <h2 id="signup-result-title">{result.heading}</h2>
        <p className="published-signup-thank-you">{result.body}</p>
        {result.position !== null && <p className="published-signup-position">Your current position <strong>#{result.position}</strong></p>}
        {result.referralUrl && (
          <div className="published-referral-share">
            <p>Share your link. Referral credit appears after both signup email addresses are verified.</p>
            <label htmlFor="published-referral-link">Your referral link</label>
            <div className="published-signup-row">
              <input id="published-referral-link" value={result.referralUrl} readOnly />
              <button type="button" onClick={copyReferralLink}>Copy link</button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <form className="published-signup" onSubmit={submit}>
      <label htmlFor="waitlist-email">{label}</label>
      <div className="published-signup-row">
        <input id="waitlist-email" name="email" type="email" autoComplete="email" required maxLength={320} />
        <button type="submit" disabled={busy}>{busy ? "Joining…" : buttonText}</button>
      </div>
      <p className="published-signup-status" aria-live="polite" role="status">{message}</p>
    </form>
  );
}
