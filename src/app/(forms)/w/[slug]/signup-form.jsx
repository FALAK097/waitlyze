"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ShareButtons } from "@/components/product/share-buttons";
import { StatusBadge } from "@/components/product/waitlist-page-content";
import { PhoneInput } from "@/components/reui/phone-input";
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

// Cloudflare Turnstile widget (explicit render). Reports the token up; the
// server verifies it before any DB work. Renders nothing without a site key.
function TurnstileWidget({ siteKey, onToken }) {
  const [attempt, setAttempt] = useState(0);
  if (!siteKey) return null;
  return (
    <TurnstileAttempt
      key={`${siteKey}:${attempt}`}
      siteKey={siteKey}
      onToken={onToken}
      onRetry={() => setAttempt((current) => current + 1)}
    />
  );
}

function TurnstileAttempt({ siteKey, onToken, onRetry }) {
  const containerRef = useRef(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!siteKey) return;
    let widgetId;
    let script;
    let cancelled = false;
    const removeWidget = () => {
      try {
        if (widgetId !== undefined) window.turnstile?.remove(widgetId);
      } catch {
        // Widget teardown is best-effort.
      }
      widgetId = undefined;
    };
    const fail = ({ removeScript = false } = {}) => {
      if (cancelled) return;
      removeWidget();
      if (removeScript) script?.remove();
      onTokenRef.current("");
      setFailed(true);
    };
    const handleScriptError = () => fail({ removeScript: true });
    const render = () => {
      if (cancelled || !containerRef.current) return;
      if (typeof window === "undefined" || !window.turnstile) {
        fail({ removeScript: true });
        return;
      }
      try {
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => fail(),
        });
      } catch {
        fail();
      }
    };
    if (typeof window !== "undefined" && window.turnstile) {
      render();
    } else if (typeof document !== "undefined") {
      script = document.querySelector("script[data-turnstile]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = "true";
      }
      script.addEventListener("load", render);
      script.addEventListener("error", handleScriptError, { once: true });
      if (!script.isConnected) document.head.appendChild(script);
      return () => {
        cancelled = true;
        script.removeEventListener("load", render);
        script.removeEventListener("error", handleScriptError);
        removeWidget();
      };
    }
    return () => {
      cancelled = true;
      removeWidget();
    };
  }, [siteKey]);

  if (failed) {
    return (
      <div className="mt-3">
        <p className="text-caption text-wl-muted" role="alert">
          Verification couldn’t load. Check your connection or content blocker and try again.
        </p>
        <button
          className="cursor-pointer text-caption font-bold text-wl-accent underline underline-offset-4"
          type="button"
          onClick={() => {
            onTokenRef.current("");
            onRetry();
          }}
        >
          Retry verification
        </button>
      </div>
    );
  }
  return <div ref={containerRef} className="mt-3" />;
}

function CustomFieldInput({ field, control }) {
  const id = useId();
  const name = `custom-${field.id}`;
  const label = (
    <label className="mb-2 block text-caption font-bold" htmlFor={id}>
      {field.label}
      {field.required ? " *" : ""}
    </label>
  );
  if (field.type === "textarea") {
    return (
      <div className="mt-3">
        {label}
        <textarea
          className={cn(control, "min-h-24 py-3")}
          id={id}
          name={name}
          placeholder={field.placeholder || ""}
          required={field.required === true}
          maxLength={2000}
        />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="mt-3">
        {label}
        <select
          className={cn(control, "w-full")}
          id={id}
          name={name}
          required={field.required === true}
          defaultValue=""
        >
          <option value="" disabled>
            {field.placeholder || "Choose an option"}
          </option>
          {(Array.isArray(field.options) ? field.options : []).map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="mt-3 flex items-start gap-2.5 text-caption leading-relaxed font-normal text-wl-muted">
        <input
          className="mt-px size-4 shrink-0 rounded border border-wl-input-border bg-wl-input"
          id={id}
          name={name}
          type="checkbox"
          value="on"
          required={field.required === true}
        />
        <span>{field.label}</span>
      </label>
    );
  }
  return (
    <div className="mt-3">
      {label}
      <input
        className={cn(control, "w-full")}
        id={id}
        name={name}
        type="text"
        inputMode={field.type === "number" ? "numeric" : undefined}
        pattern={field.type === "number" ? "-?[0-9]+(\\.[0-9]+)?" : undefined}
        placeholder={field.placeholder || ""}
        required={field.required === true}
        maxLength={2000}
      />
    </div>
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
  const referralId = useId();
  const resultTitleId = useId();
  const headingPx = typeof brand?.headingSize === "number" ? brand.headingSize : null;
  const bodyPx = typeof brand?.bodySize === "number" ? brand.bodySize : null;
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [phone, setPhone] = useState("");

  const collectPhone = formConfig.collectPhone === true || formConfig.requirePhone === true;
  const customFields = Array.isArray(formConfig.customFields) ? formConfig.customFields : [];
  // Bot protection is opt-in per form. The site key normally comes from the
  // founder's saved form config; a dashboard renderer can inject the platform
  // key instead — either source may drive the widget.
  const turnstileSiteKeyResolved =
    typeof formConfig.turnstileSiteKey === "string" && formConfig.turnstileSiteKey.trim() !== ""
      ? formConfig.turnstileSiteKey.trim()
      : turnstileSiteKey.trim();
  const turnstileOn = formConfig.requireTurnstile === true && turnstileSiteKeyResolved !== "";

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const marketingConsent = formData.get("marketingConsent") === "on";
    const phoneValue = collectPhone ? String(formData.get("phone") ?? "").trim() : "";
    const answers = customFields.map((field) => ({
      id: field.id,
      value:
        field.type === "checkbox"
          ? formData.get(`custom-${field.id}`) === "on"
          : (formData.get(`custom-${field.id}`) ?? ""),
    }));
    // Opt-in protection requires a completed challenge before we even start.
    if (turnstileOn && !turnstileToken) {
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
          hypeSession,
          ...(phoneValue ? { phone: phoneValue } : {}),
          ...(answers.length > 0 ? { customFields: answers } : {}),
          ...(turnstileOn && turnstileToken ? { turnstileToken } : {}),
          ...collectAttribution(),
          ...(showReferrals && referralCode && /^[A-Za-z0-9_-]{8,256}$/.test(referralCode)
            ? { referralId: referralCode }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== "undefined" && window.turnstile) {
          try {
            window.turnstile.reset();
          } catch {
            // Reset is best-effort; the token simply expires.
          }
          setTurnstileToken("");
        }
        throw new Error(data.message || "Couldn't join the waitlist. Try again.");
      }

      // Server-vetted redirect only: the API echoes a redirect URL solely when
      // the founder configured one that passes the allowlist. Never navigate
      // to founder config or user input directly.
      if (typeof data.signUp?.redirectUrl === "string" && data.signUp.redirectUrl) {
        window.location.assign(data.signUp.redirectUrl);
        return;
      }
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
      setPhone("");
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
          disabled={busy || (turnstileOn && !turnstileToken)}
        >
          {busy ? "Joining…" : formConfig.buttonText}
        </button>
      </div>
      {collectPhone && (
        <div className="mt-3">
          <label className="mb-2 block text-caption font-bold" htmlFor={`${emailId}-phone`}>
            Phone number{formConfig.requirePhone ? " *" : ""}
          </label>
          <PhoneInput
            inputId={`${emailId}-phone`}
            name="phone"
            value={phone}
            onChange={(next) => setPhone(typeof next === "string" ? next : "")}
            required={formConfig.requirePhone === true}
            inputClassName={cn(
              control,
              "w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
            )}
            selectClassName={cn(
              control,
              "max-w-32 flex-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent",
            )}
          />
          <p className="mt-1 text-micro leading-relaxed text-wl-muted">
            We only use this for launch updates.
          </p>
        </div>
      )}
      {customFields.map((field) => (
        <CustomFieldInput field={field} control={control} key={field.id} />
      ))}
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
      {turnstileOn && (
        <TurnstileWidget siteKey={turnstileSiteKeyResolved} onToken={setTurnstileToken} />
      )}
    </form>
  );
}
