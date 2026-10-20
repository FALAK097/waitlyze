"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collectAttribution } from "@/utils/attribution";

import styles from "@/components/product/waitlist-signup.module.css";

/** Waitlist signup form: validates input, submits the signup, and shows the referral result. */
export function SignupForm(props) {
  return (
    <Suspense fallback={<div className={styles.form} aria-label="Loading signup form" />}>
      <SignupFormInner {...props} />
    </Suspense>
  );
}

function SignupFormInner({ slug, waitListId, showReferrals, formConfig, statusPage }) {
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
      const referralLink =
        showReferrals && code
          ? `${window.location.origin}${slug ? `/w/${slug}` : "/"}?r=${code}`
          : null;
      setResult({
        heading: formConfig.verification ? statusPage.pendingHeading : statusPage.heading,
        body: formConfig.verification ? statusPage.pendingBody : statusPage.body,
        notice: formConfig.verification ? `We sent a confirmation link to ${email}.` : null,
        position: typeof rank === "number" ? rank : null,
        referralLink,
        referralCode: code ?? null,
        referralCount: 0,
      });
      setCopied(false);
      form.reset();
    } catch (error) {
      toast.error(error.message || "Couldn't join the waitlist. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Copies the personal referral link and records a share event only after the clipboard write succeeds. */
  async function copyReferralLink() {
    if (!result?.referralLink) return;
    try {
      await navigator.clipboard.writeText(result.referralLink);
      fetch("/api/v1/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitListId, code: result.referralCode ?? "" }),
      }).catch(() => {});
      setCopied(true);
    } catch {
      toast.error("Copy didn't work — long-press the link to copy it manually.");
    }
  }

  function shareHref(channel) {
    const message = `${statusPage.shareMessage} ${result.referralLink}`;
    if (channel === "x") return `https://x.com/intent/post?text=${encodeURIComponent(message)}`;
    if (channel === "linkedin")
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(result.referralLink)}`;
    if (channel === "whatsapp") return `https://wa.me/?text=${encodeURIComponent(message)}`;
    return `mailto:?subject=${encodeURIComponent(statusPage.heading)}&body=${encodeURIComponent(message)}`;
  }

  function trackShare() {
    fetch("/api/v1/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitListId, code: result.referralCode ?? "" }),
    }).catch(() => {});
  }

  if (result) {
    return (
      <section className={styles.result} aria-labelledby="signup-result-title">
        <h2 id="signup-result-title">{result.heading}</h2>
        {result.notice ? <p className={styles.thankYou}>{result.notice}</p> : null}
        {result.body ? <p>{result.body}</p> : null}
        {statusPage.showPosition && result.position != null ? (
          <p className={styles.position}>
            <span>Your position</span>
            <strong>#{result.position}</strong>
          </p>
        ) : null}
        {statusPage.showReferralCount ? (
          <p className={styles.position}>
            <span>Friends joined</span>
            <strong>{result.referralCount}</strong>
          </p>
        ) : null}
        {statusPage.showReferralLink && result.referralLink ? (
          <div className={styles.referralShare}>
            <p>{statusPage.shareMessage}</p>
            <label htmlFor="waitlist-referral-link">Your referral link</label>
            <div className={styles.referralRow}>
              <input
                id="waitlist-referral-link"
                value={result.referralLink}
                readOnly
                onFocus={(event) => event.target.select()}
              />
              <button type="button" onClick={copyReferralLink}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {statusPage.shareChannels.length > 0 && (
              <div className={styles.referralRow}>
                {statusPage.shareChannels.map((channel) => (
                  <a
                    className={styles.button}
                    href={shareHref(channel)}
                    key={channel}
                    target={channel === "email" ? undefined : "_blank"}
                    rel={channel === "email" ? undefined : "noreferrer"}
                    onClick={trackShare}
                  >
                    {channel === "x" ? "X" : channel[0].toUpperCase() + channel.slice(1)}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form
      className={`${styles.form} ${formConfig.layout === "stacked" ? styles.stacked : ""}`}
      onSubmit={submit}
    >
      <Label className={styles.label} htmlFor="waitlist-email">
        {formConfig.label}
      </Label>
      <div className={styles.row}>
        <Input
          className={styles.email}
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={formConfig.placeholder}
          required
          maxLength={320}
        />
        <Button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Joining…" : formConfig.buttonText}
        </Button>
      </div>
      {formConfig.requireConsent && (
        <Label className={styles.consent}>
          <Checkbox className={styles.checkbox} name="marketingConsent" value="on" />
          <span>{formConfig.consentLabel}</span>
        </Label>
      )}
    </form>
  );
}
