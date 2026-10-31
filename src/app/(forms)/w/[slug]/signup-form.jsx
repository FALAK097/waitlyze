"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ReferralCockpitExtras } from "@/components/product/referral-cockpit";
import { ShareButtons } from "@/components/product/share-buttons";
import { StatusBadge } from "@/components/product/waitlist-page-content";
import { PhoneInput } from "@/components/reui/phone-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { collectAttribution } from "@/utils/attribution";

const control =
  "h-12 min-h-12 min-w-0 flex-1 rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-input-text focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent";
const checkboxControl =
  "mt-px size-4 rounded-[4px] border-wl-input-border bg-wl-input text-wl-button-text data-checked:border-wl-accent data-checked:bg-wl-accent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent";

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
        <Button
          type="button"
          variant="public-link-action"
          size="public-link-action"
          onClick={() => {
            onTokenRef.current("");
            onRetry();
          }}
        >
          Retry verification
        </Button>
      </div>
    );
  }
  return <div ref={containerRef} className="mt-3" />;
}

function CustomSelectField({ id, name, label, field, brand }) {
  const [selected, setSelected] = useState("");
  const options = Array.isArray(field.options) ? field.options : [];
  const placeholder = field.placeholder || "Choose an option";
  return (
    <div className="mt-3">
      {label}
      <input type="hidden" name={name} value={selected} />
      <SelectPrimitive.Root value={selected} onValueChange={(value) => setSelected(value ?? "")}>
        <SelectPrimitive.Trigger
          id={id}
          aria-required={field.required === true}
          className={cn(
            control,
            "flex w-full cursor-pointer items-center justify-between gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wl-accent data-popup-open:[&_svg]:rotate-180",
            !selected && "text-wl-muted",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected || placeholder}</span>
          <SelectPrimitive.Icon
            render={
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                aria-hidden="true"
                className="shrink-0 text-wl-muted transition-transform duration-150"
              />
            }
          />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            side="bottom"
            sideOffset={6}
            align="start"
            alignItemWithTrigger={false}
            className="isolate z-50"
          >
            <SelectPrimitive.Popup
              className="max-h-60 w-(--anchor-width) overflow-y-auto rounded-wl border border-wl-input-border bg-wl-input p-1.5 text-wl-input-text shadow-md"
              style={
                brand
                  ? {
                      "--wl-surface": brand.surfaceColor,
                      "--wl-text": brand.textColor,
                      "--wl-input": brand.inputBackground,
                      "--wl-input-border": brand.inputBorder,
                      "--wl-input-text": brand.inputTextColor,
                      "--wl-accent": brand.accentColor,
                    }
                  : undefined
              }
            >
              <SelectPrimitive.List>
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option}
                    value={option}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm text-wl-input-text outline-none select-none data-highlighted:bg-wl-text/10 data-selected:bg-wl-text/10 data-selected:font-semibold"
                  >
                    <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
                      {option}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator
                      render={<HugeiconsIcon icon={Tick01Icon} size={14} aria-hidden="true" />}
                    />
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

function CustomFieldInput({ field, brand, controlClass = control }) {
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
        <Textarea
          className={cn(controlClass, "min-h-24 py-3")}
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
    return <CustomSelectField id={id} name={name} label={label} field={field} brand={brand} />;
  }
  if (field.type === "checkbox") {
    return (
      <label className="mt-3 flex items-start gap-2.5 text-caption leading-relaxed font-normal text-wl-muted">
        <Checkbox
          className={checkboxControl}
          id={id}
          name={name}
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
      <Input
        className={cn(controlClass, "w-full")}
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

function PhoneField({ idBase, formConfig, phone, onPhoneChange }) {
  return (
    <div className="mt-3">
      <label className="mb-2 block text-caption font-bold" htmlFor={`${idBase}-phone`}>
        Phone number{formConfig.requirePhone ? " *" : ""}
      </label>
      <PhoneInput
        inputId={`${idBase}-phone`}
        name="phone"
        value={phone}
        onChange={(next) => onPhoneChange(typeof next === "string" ? next : "")}
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
  );
}

function ConsentField({ formConfig }) {
  return (
    <label className="mt-3 flex items-start gap-2.5 text-caption leading-relaxed font-normal text-wl-muted">
      <Checkbox className={checkboxControl} name="marketingConsent" value="on" />
      <span>{formConfig.consentLabel}</span>
    </label>
  );
}

function ResultStat({ label, value }) {
  return (
    <p className="flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function ReferralShareBlock({
  statusPage,
  result,
  referralId,
  copied,
  onCopyReferralLink,
  onTrackShare,
  waitListId,
}) {
  return (
    <div className="mt-6 grid w-full max-w-md gap-2.5">
      <p className="m-0 text-sm text-wl-muted">{statusPage.shareMessage}</p>
      <label className="text-caption font-bold" htmlFor={referralId}>
        Your referral link
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <Input
          className={control}
          id={referralId}
          value={result.referralLink}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <Button
          variant="public-action"
          size="public-action"
          type="button"
          onClick={onCopyReferralLink}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {statusPage.shareChannels.length > 0 && (
        <ShareButtons
          channels={statusPage.shareChannels}
          message={`${statusPage.shareMessage} ${result.referralLink}`}
          link={result.referralLink}
          subject={statusPage.heading}
          onShare={onTrackShare}
        />
      )}
      {result.referralCode ? (
        <ReferralCockpitExtras
          waitListId={waitListId}
          code={result.referralCode}
          statusPage={statusPage}
        />
      ) : null}
    </div>
  );
}

function ResultHeader({ result, statusPage, brand, resultTitleId }) {
  const headingPx = typeof brand?.headingSize === "number" ? brand.headingSize : null;
  return (
    <>
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
    </>
  );
}

function SignupResult({
  result,
  statusPage,
  showReferrals,
  brand,
  resultTitleId,
  referralId,
  copied,
  onCopyReferralLink,
  onTrackShare,
  waitListId,
}) {
  const bodyPx = typeof brand?.bodySize === "number" ? brand.bodySize : null;
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
      <ResultHeader
        result={result}
        statusPage={statusPage}
        brand={brand}
        resultTitleId={resultTitleId}
      />
      {statusPage.showPosition && !result.hideCounts && result.position != null ? (
        <ResultStat label="Your position" value={`#${result.position}`} />
      ) : null}
      {result.verified && !result.hideCounts && result.showPoints ? (
        <ResultStat label="Your points" value={String(result.points)} />
      ) : null}
      {result.verified && !result.hideCounts && result.showProgress && result.nextReward != null ? (
        <p className="m-0 w-full max-w-md text-sm leading-relaxed text-wl-muted">
          {result.nextReward.remaining} more referral
          {result.nextReward.remaining === 1 ? "" : "s"} to unlock{" "}
          <strong className="text-wl-text">{result.nextReward.reward}</strong>
        </p>
      ) : null}
      {showReferrals && statusPage.showReferralCount && !result.hideCounts ? (
        <ResultStat label="Friends joined" value={String(result.referralCount)} />
      ) : null}
      {showReferrals && statusPage.showReferralLink && result.referralLink ? (
        <ReferralShareBlock
          statusPage={statusPage}
          result={result}
          referralId={referralId}
          copied={copied}
          onCopyReferralLink={onCopyReferralLink}
          onTrackShare={onTrackShare}
          waitListId={waitListId}
        />
      ) : null}
    </section>
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
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("r");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [phone, setPhone] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const collectPhone = formConfig.collectPhone === true || formConfig.requirePhone === true;
  const customFields = Array.isArray(formConfig.customFields) ? formConfig.customFields : [];
  // Bot protection is opt-in per form. Prefer the deployment's public key so
  // old drafts cannot pin the widget to a stale environment-specific value.
  const turnstileSiteKeyResolved =
    turnstileSiteKey.trim() ||
    (typeof formConfig.turnstileSiteKey === "string" ? formConfig.turnstileSiteKey.trim() : "");
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
    const missingRequiredSelect = customFields.find(
      (field) =>
        field.type === "select" &&
        field.required === true &&
        !String(formData.get(`custom-${field.id}`) ?? "").trim(),
    );
    if (missingRequiredSelect) {
      toast.error(`Please select an option for “${missingRequiredSelect.label}”.`);
      return;
    }
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
          ...collectAttribution(waitListId),
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
      if (statusPage.postSignupBehavior === "no-change") {
        form.reset();
        setPhone("");
        setResetKey((current) => current + 1);
        toast.success("You're on the waitlist.");
        return;
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
      const summary = data.signUp ?? {};
      setResult({
        heading: verified ? statusPage.heading : statusPage.pendingHeading,
        body: verified ? statusPage.body : statusPage.pendingBody,
        pending: !verified && !returning,
        notice: returning
          ? "You're already on this waitlist. Here are your current details."
          : verified
            ? null
            : `We sent a confirmation link to ${email}.`,
        position:
          typeof summary.displayRank === "number"
            ? summary.displayRank
            : typeof rank === "number"
              ? rank
              : null,
        referralLink,
        referralCode: code ?? null,
        referralCount: data.signUp?.referralCount ?? 0,
        points: typeof summary.points === "number" ? summary.points : 0,
        nextReward: summary.nextReward ?? null,
        hideCounts: summary.hideCounts === true,
        showPoints: summary.showPoints !== false,
        showProgress: summary.showProgress !== false,
        verified,
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
      toast.error("Copy didn't work - long-press the link to copy it manually.");
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
      <SignupResult
        result={result}
        statusPage={statusPage}
        showReferrals={showReferrals}
        brand={brand}
        resultTitleId={resultTitleId}
        referralId={referralId}
        copied={copied}
        onCopyReferralLink={copyReferralLink}
        onTrackShare={trackShare}
        waitListId={waitListId}
      />
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
        <Input
          className={control}
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={formConfig.placeholder}
          required
          maxLength={320}
        />
        <Button
          type="submit"
          variant="public-action"
          size="public-action"
          disabled={busy || (turnstileOn && !turnstileToken)}
        >
          {busy ? "Joining…" : formConfig.buttonText}
        </Button>
      </div>
      {collectPhone && (
        <PhoneField
          idBase={emailId}
          formConfig={formConfig}
          phone={phone}
          onPhoneChange={setPhone}
        />
      )}
      {customFields.map((field) => (
        <CustomFieldInput
          field={field}
          brand={brand}
          controlClass={control}
          key={`${field.id}:${resetKey}`}
        />
      ))}
      {formConfig.requireConsent && <ConsentField formConfig={formConfig} />}
      {turnstileOn && (
        <TurnstileWidget siteKey={turnstileSiteKeyResolved} onToken={setTurnstileToken} />
      )}
    </form>
  );
}
