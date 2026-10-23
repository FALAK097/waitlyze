"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { toast } from "sonner";

import { ShareButtons } from "@/components/product/share-buttons";
import { cn } from "@/lib/utils";
import { collectAttribution } from "@/utils/attribution";

const control =
  "h-12 min-w-0 flex-1 rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-input-text";
const action =
  "inline-flex h-12 items-center justify-center rounded-wl bg-wl-button px-5 font-bold whitespace-nowrap text-wl-button-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent";

/** Waitlist signup form: validates input, submits the signup, and shows the referral result. */
export function SignupForm(props) {
  return (
    <Suspense fallback={<div className="w-full text-wl-text" aria-label="Loading signup form" />}>
      <SignupFormInner {...props} />
    </Suspense>
  );
}

function SignupFormInner({ slug, waitListId, showReferrals, formConfig, statusPage }) {
  const emailId = useId();
  const referralId = useId();
  const resultTitleId = useId();
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
      const verified = data.signUp?.verified === true;
      const returning = data.signUp?.outcome === "returning";
      setResult({
        heading: verified ? statusPage.heading : statusPage.pendingHeading,
        body: verified ? statusPage.body : statusPage.pendingBody,
        notice: returning
          ? "You're already on this waitlist. Here are your current details."
          : verified
            ? null
            : `We sent a confirmation link to ${email}.`,
        position: typeof rank === "number" ? rank : null,
        referralLink,
        referralCode: code ?? null,
        referralCount: data.signUp?.referralCount ?? 0,
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

  function trackShare() {
    fetch("/api/v1/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitListId, code: result.referralCode ?? "" }),
    }).catch(() => {});
  }

  if (result) {
    return (
      <section className="w-full text-wl-text" aria-labelledby={resultTitleId}>
        <h2 className="mb-4 font-wl-heading text-3xl tracking-tight" id={resultTitleId}>
          {result.heading}
        </h2>
        {result.notice ? <p className="leading-relaxed text-wl-muted">{result.notice}</p> : null}
        {result.body ? <p className="leading-relaxed text-wl-muted">{result.body}</p> : null}
        {statusPage.showPosition && result.position != null ? (
          <p className="flex justify-between border-y border-wl-text/15 py-4">
            <span>Your position</span>
            <strong>#{result.position}</strong>
          </p>
        ) : null}
        {showReferrals && statusPage.showReferralCount ? (
          <p className="flex justify-between border-y border-wl-text/15 py-4">
            <span>Friends joined</span>
            <strong>{result.referralCount}</strong>
          </p>
        ) : null}
        {statusPage.showReferralLink && result.referralLink ? (
          <div className="mt-6 grid gap-2.5">
            <p className="m-0 text-sm text-wl-muted">{statusPage.shareMessage}</p>
            <label className="text-caption font-bold" htmlFor={referralId}>
              Your referral link
            </label>
            <div className="flex gap-2 max-sm:flex-col">
              <input
                className={cn(
                  control,
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
                )}
                id={referralId}
                value={result.referralLink}
                readOnly
                onFocus={(event) => event.target.select()}
              />
              <button className={action} type="button" onClick={copyReferralLink}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {statusPage.shareChannels.length > 0 && (
              <ShareButtons
                channels={statusPage.shareChannels}
                message={`${statusPage.shareMessage} ${result.referralLink}`}
                link={result.referralLink}
                subject={statusPage.heading}
                onShare={trackShare}
              />
            )}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <form className="w-full text-wl-text" onSubmit={submit}>
      <label className="mb-2 block text-caption font-bold" htmlFor={emailId}>
        {formConfig.label}
      </label>
      <div
        className={cn(
          "flex gap-2 max-sm:flex-col",
          formConfig.layout === "stacked" && "flex-col gap-3",
        )}
      >
        <input
          className={cn(
            control,
            formConfig.layout === "stacked" ? "h-13" : "h-12",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
          )}
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={formConfig.placeholder}
          required
          maxLength={320}
        />
        <button
          className={cn(
            action,
            formConfig.layout === "stacked" && "h-11",
            "cursor-pointer disabled:cursor-wait disabled:opacity-65",
          )}
          type="submit"
          disabled={busy}
        >
          {busy ? "Joining…" : formConfig.buttonText}
        </button>
      </div>
      {formConfig.requireConsent && (
        <label className="mt-3 flex items-start gap-2.5 text-caption leading-relaxed font-normal text-wl-muted">
          <input
            className="mt-px size-4 shrink-0 rounded border border-wl-input-border bg-wl-input"
            name="marketingConsent"
            type="checkbox"
            value="on"
          />
          <span>{formConfig.consentLabel}</span>
        </label>
      )}
    </form>
  );
}
