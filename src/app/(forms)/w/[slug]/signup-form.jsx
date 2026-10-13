"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";
import { THEME_ACCENTS, THEME_FONTS, THEME_PRESETS, normalizeTheme } from "@/lib/templates/theme.mjs";
import styles from "@/components/product/waitlist-signup.module.css";

export function SignupForm({ waitListId, showReferrals, label, buttonText, thankYou, theme }) {
  const normalized = normalizeTheme(theme);
  const preset = THEME_PRESETS[normalized.preset];
  const accent = THEME_ACCENTS[normalized.accent];
  const font = THEME_FONTS[normalized.font];
  const vars = { bg: preset.bg, text: preset.text, muted: preset.muted, card: preset.card, border: preset.border, accent: accent.solid, accentHover: accent.hover, accentLabel: accent.text, font: font.stack };
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
      <section className={styles.result} aria-labelledby="signup-result-title" style={{ "--page-bg": vars.bg, "--page-text": vars.text, "--page-muted": vars.muted, "--page-card": vars.card, "--page-border": vars.border, "--page-accent": vars.accent, "--page-accent-hover": vars.accentHover, "--page-accent-label": vars.accentLabel, "--page-font": vars.font }}>
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <h2 id="signup-result-title">{result.heading}</h2>
        <p className={styles.thankYou}>{result.notice}</p>
        {result.body ? <p>{result.body}</p> : null}
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} style={{ "--page-bg": vars.bg, "--page-text": vars.text, "--page-muted": vars.muted, "--page-card": vars.card, "--page-border": vars.border, "--page-accent": vars.accent, "--page-accent-hover": vars.accentHover, "--page-accent-label": vars.accentLabel, "--page-font": vars.font }}>
      <Label className={styles.label} htmlFor="waitlist-email">{label}</Label>
      <div className={styles.row}>
        <Input className={styles.email} id="waitlist-email" name="email" type="email" autoComplete="email" required maxLength={320} />
        <Button className={styles.button} type="submit" disabled={busy}>{busy ? "Joining…" : buttonText}</Button>
      </div>
      <Label className={styles.consent}>
        <Checkbox className={styles.checkbox} name="marketingConsent" value="on" />
        <span>{MARKETING_CONSENT_COPY}</span>
      </Label>
      <p className={styles.status} aria-live="polite" role="status">{message}</p>
    </form>
  );
}
