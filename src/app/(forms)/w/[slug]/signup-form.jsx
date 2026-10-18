"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";
import { collectAttribution } from "@/utils/attribution";
import styles from "@/components/product/waitlist-signup.module.css";

export function SignupForm({ slug, waitListId, showReferrals, label, buttonText, thankYou }) {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const marketingConsent = formData.get("marketingConsent") === "on";
    setBusy(true);
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
          ...collectAttribution(),
          ...(showReferrals && referralCode && /^[A-Za-z0-9_-]{8,256}$/.test(referralCode)
            ? { referralId: referralCode }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Couldn't join the waitlist. Try again.");

      const rank = data.signUp?.rank;
      const code = data.signUp?.referralCode;
      const referralLink = showReferrals && code && slug
        ? `${window.location.origin}/w/${slug}?r=${code}`
        : null;
      setResult({
        heading: "Check your inbox",
        body: thankYou?.body || "Your signup is nearly complete.",
        notice: `We sent a confirmation link to ${email}. Confirm your email to secure your place on the waitlist.`,
        position: typeof rank === "number" ? rank : null,
        referralLink,
        referralCode: code ?? null,
      });
      setCopied(false);
      form.reset();
    } catch (error) {
      toast.error(error.message || "Couldn't join the waitlist. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyReferralLink() {
    if (!result?.referralLink) return;
    fetch("/api/v1/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitListId, code: result.referralCode ?? "" }),
    }).catch(() => {});
    try {
      await navigator.clipboard.writeText(result.referralLink);
      setCopied(true);
    } catch {
      toast.error("Copy didn't work — long-press the link to copy it manually.");
    }
  }

  if (result) {
    return (
      <section className={styles.result} aria-labelledby="signup-result-title">
        <h2 id="signup-result-title">{result.heading}</h2>
        <p className={styles.thankYou}>{result.notice}</p>
        {result.body ? <p>{result.body}</p> : null}
        {result.position != null ? (
          <p className={styles.thankYou}>Your current position in line: <strong>#{result.position}</strong></p>
        ) : null}
        {result.referralLink ? (
          <div className={styles.referralShare}>
            <p>Share your personal link — every friend who joins through it moves you up in line.</p>
            <label htmlFor="waitlist-referral-link">Your referral link</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input id="waitlist-referral-link" value={result.referralLink} readOnly onFocus={(event) => event.target.select()} />
              <button type="button" onClick={copyReferralLink}>{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Label className={styles.label} htmlFor="waitlist-email">{label}</Label>
      <div className={styles.row}>
        <Input className={styles.email} id="waitlist-email" name="email" type="email" autoComplete="email" required maxLength={320} />
        <Button className={styles.button} type="submit" disabled={busy}>{busy ? "Joining…" : buttonText}</Button>
      </div>
      <Label className={styles.consent}>
        <Checkbox className={styles.checkbox} name="marketingConsent" value="on" />
        <span>{MARKETING_CONSENT_COPY}</span>
      </Label>
    </form>
  );
}
