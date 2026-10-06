"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";
import styles from "@/components/product/waitlist-signup.module.css";

export function SignupForm({ waitListId, showReferrals, label, buttonText, thankYou }) {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const marketingConsent = formData.get("marketingConsent") === "on";
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
          marketingConsent,
          waitListId,
          hypeSession,
          ...(showReferrals && referralCode && /^[A-Za-z0-9_-]{8,256}$/.test(referralCode)
            ? { referralId: referralCode }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Couldn't join the waitlist. Try again.");

      setResult({ heading: "Check your inbox", body: thankYou?.body || "Your signup is nearly complete.", notice: `We sent a confirmation link to ${email}. Confirm your email to secure your place on the waitlist.` });
      setMessage("Signup received. Confirmation email queued.");
      form.reset();
    } catch (error) {
      setMessage(error.message || "Couldn't join the waitlist. Try again.");
    } finally {
      setBusy(false);
    }
  }


  if (result) {
    return (
      <section className={styles.result} aria-labelledby="signup-result-title">
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <h2 id="signup-result-title">{result.heading}</h2>
        <p className={styles.thankYou}>{result.notice}</p>
        {result.body ? <p>{result.body}</p> : null}
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label} htmlFor="waitlist-email">{label}</label>
      <div className={styles.row}>
        <input className={styles.email} id="waitlist-email" name="email" type="email" autoComplete="email" required maxLength={320} />
        <button className={styles.button} type="submit" disabled={busy}>{busy ? "Joining…" : buttonText}</button>
      </div>
      <label className={styles.consent}>
        <input className={styles.checkbox} name="marketingConsent" type="checkbox" />
        <span>{MARKETING_CONSENT_COPY}</span>
      </label>
      <p className={styles.status} aria-live="polite" role="status">{message}</p>
    </form>
  );
}
