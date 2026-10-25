"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useCallback, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ShareButtons } from "@/components/product/share-buttons";
import { StatusBadge } from "@/components/product/waitlist-page-content";
import { cn } from "@/lib/utils";
import { collectAttribution } from "@/utils/attribution";

const control =
  "h-12 min-h-12 min-w-0 flex-1 rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-input-text";
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

function SignupFormInner({
  slug,
  waitListId,
  showReferrals,
  formConfig,
  statusPage,
  brand,
  turnstileSiteKey = "",
}) {
  const emailId = useId();
  const resultTitleId = useId();
  const turnstileContainer = useRef(null);
  const turnstileWidgetId = useRef(null);
  const headingPx = typeof brand?.headingSize === "number" ? brand.headingSize : null;
  const bodyPx = typeof brand?.bodySize === "number" ? brand.bodySize : null;
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileMessage, setTurnstileMessage] = useState(() =>
    formConfig.requireTurnstile
      ? turnstileSiteKey
        ? "Complete the security check to enable signup."
        : "Verification is unavailable right now. Please try again later."
      : "",
  );

  const renderTurnstile = useCallback(() => {
    if (!formConfig.requireTurnstile || !turnstileSiteKey || !turnstileContainer.current) return;
    if (turnstileWidgetId.current !== null) return;
    if (!window.turnstile) {
      setTurnstileMessage("Verification is unavailable right now. Please try again later.");
      return;
    }
    try {
      turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey: turnstileSiteKey,
        action: "signup",
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileMessage("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileMessage("The security check expired. Please complete it again.");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileMessage("Verification is unavailable right now. Please try again later.");
        },
      });
    } catch {
      setTurnstileMessage("Verification is unavailable right now. Please try again later.");
    }
  }, [formConfig.requireTurnstile, turnstileSiteKey]);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const marketingConsent = formData.get("marketingConsent") === "on";
    if (formConfig.requireTurnstile && !turnstileToken) {
      toast.error("Complete the security check and try again.");
      return;
    }
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
          ...(formConfig.requireTurnstile ? { "cf-turnstile-response": turnstileToken } : {}),
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
          ? `${window.location.origin}${slug ? `/w/${slug}` : "/"}?r=${encodeURIComponent(code)}`
          : null;
      const verified = data.signUp?.verified === true;
      const returning = data.signUp?.outcome === "returning";
      setResult({
        heading: verified ? statusPage.heading : statusPage.pendingHeading,
        body: verified ? statusPage.body : statusPage.pendingBody,
        pending: !verified && !returning,
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
      if (formConfig.requireTurnstile) {
        try {
          if (turnstileWidgetId.current !== null && window.turnstile)
            window.turnstile.reset(turnstileWidgetId.current);
          setTurnstileToken("");
          setTurnstileMessage("Complete the security check to enable signup.");
        } catch {
          setTurnstileToken("");
          setTurnstileMessage("Verification is unavailable right now. Please try again later.");
        }
      }
      setBusy(false);
    }
  }

  if (result) {
    return (
      <SignupResult
        result={result}
        statusPage={statusPage}
        showReferrals={showReferrals}
        waitListId={waitListId}
        headingPx={headingPx}
        bodyPx={bodyPx}
        resultTitleId={resultTitleId}
        copied={copied}
        onCopy={() => setCopied(true)}
      />
    );
  }

  return (
    <>
      {formConfig.requireTurnstile && turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderTurnstile}
          onError={() =>
            setTurnstileMessage("Verification is unavailable right now. Please try again later.")
          }
        />
      ) : null}
      <form className="w-full min-w-0 text-wl-text" onSubmit={submit}>
        <label className="mb-2 block text-caption font-bold" htmlFor={emailId}>
          {formConfig.label}
        </label>
        <div
          className={cn(
            "flex min-w-0 gap-2 max-sm:flex-col",
            formConfig.layout === "stacked" && "flex-col gap-3",
          )}
        >
          <input
            className={cn(
              control,
              formConfig.layout === "stacked" && "h-14",
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
            className={cn(action, "cursor-pointer disabled:cursor-wait disabled:opacity-65")}
            type="submit"
            disabled={
              busy || (formConfig.requireTurnstile && (!turnstileToken || !turnstileSiteKey))
            }
          >
            {busy ? "Joining…" : formConfig.buttonText}
          </button>
        </div>
        {formConfig.requireTurnstile && (
          <>
            {turnstileSiteKey ? (
              <fieldset className="m-0 mt-4 max-w-full overflow-x-auto border-0 p-0">
                <legend className="sr-only">Bot verification</legend>
                <div ref={turnstileContainer} className="min-h-[65px] min-w-[300px]" />
              </fieldset>
            ) : null}
            <output
              className="mt-2 block text-caption leading-relaxed text-wl-muted"
              aria-live="polite"
            >
              {turnstileMessage}
            </output>
          </>
        )}
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
    </>
  );
}

/** Post-signup result: confirmation copy, position, referral link, and share buttons. */
function SignupResult({
  result,
  statusPage,
  showReferrals,
  waitListId,
  headingPx,
  bodyPx,
  resultTitleId,
  copied,
  onCopy,
}) {
  const referralId = useId();
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
      onCopy();
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

  return (
    <section
      className={cn(
        "grid w-full justify-items-center text-center text-wl-text",
        bodyPx != null && "wl-type-body",
        statusPage.layout === "card" && "rounded-wl bg-wl-surface p-6 md:p-10",
      )}
      style={bodyPx != null ? { "--wl-body": `${bodyPx}px` } : undefined}
      aria-labelledby={resultTitleId}
    >
      <StatusBadge pending={result.pending} iconStyle={statusPage.iconStyle} className="mb-4" />
      <h2
        className={cn(
          "my-4 max-w-ch14 font-wl-heading leading-none tracking-tight text-balance",
          headingPx == null ? "text-3xl" : "wl-type-h1",
        )}
        style={headingPx == null ? undefined : { "--wl-h1": `${headingPx}px` }}
        id={resultTitleId}
      >
        {result.heading}
      </h2>
      {result.notice ? <p className="leading-relaxed text-wl-muted">{result.notice}</p> : null}
      {result.body ? <p className="leading-relaxed text-wl-muted">{result.body}</p> : null}
      {statusPage.showPosition && result.position != null ? (
        <p className="flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
          <span>Your position</span>
          <strong>#{result.position}</strong>
        </p>
      ) : null}
      {showReferrals && statusPage.showReferralCount ? (
        <p className="flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
          <span>Friends joined</span>
          <strong>{result.referralCount}</strong>
        </p>
      ) : null}
      {showReferrals && statusPage.showReferralLink && result.referralLink ? (
        <div className="mt-6 grid w-full max-w-md gap-2.5">
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
