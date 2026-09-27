"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { SignUpForm } from "@/components/wait-lists/sign-up-form";
import toast from "react-hot-toast";

const styles = [
  {
    id: "terracotta",
    name: "Terracotta",
    buttonColor: "#AE452F",
    buttonBorder: "#AE452F",
    buttonTextColor: "#FFFFFF",
    badgeColor: "#F9E9E1",
    badgeTextColor: "#8F3B28",
  },
  {
    id: "olive",
    name: "Olive",
    buttonColor: "#536B46",
    buttonBorder: "#536B46",
    buttonTextColor: "#FFFFFF",
    badgeColor: "#E9EFE3",
    badgeTextColor: "#405238",
  },
  {
    id: "ink",
    name: "Ink",
    buttonColor: "#293B50",
    buttonBorder: "#293B50",
    buttonTextColor: "#FFFFFF",
    badgeColor: "#E8EDF2",
    badgeTextColor: "#293B50",
  },
];

export default function WaitlistPlayground() {
  const [styleId, setStyleId] = useState("terracotta");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const interactionRef = useRef(false);
  const style = styles.find((item) => item.id === styleId) ?? styles[0];

  useEffect(() => {
    if (!interactionRef.current) return;
    if (!loading) emailRef.current?.focus({ preventScroll: true });
  }, [loading]);

  const waitList = {
    ...style,
    showBadge: true,
    badgeText: "A small note before the big day",
    showLogo: false,
    placeholderText: "Your email address",
    inputColor: "#FFFFFF",
    inputBorder: "#D8D3CD",
    inputTextColor: "#292824",
    borderWidth: "1px",
    borderRadius: "medium",
    buttonText: "Join the waitlist",
    successMessage: "Preview complete. No signup was created.",
    fontWeight: 600,
    showSocialProof: false,
    showBranding: true,
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || !email) return;
    interactionRef.current = true;
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setLoading(false);
    toast.success(waitList.successMessage, { position: "top-center" });
    setEmail("");
  }

  return (
    <div className="wl-playground" id="preview">
      <div className="wl-preview-toolbar">
        <span>
          <span className="wl-status-dot" />
          A hosted waitlist, made with Waitlyze
        </span>
        <span>Live preview</span>
      </div>
      <div className="wl-preview-stage">
        <div className="wl-preview-page">
          <div className="wl-preview-brand">
            <span className="wl-preview-brand-mark" aria-hidden="true">
              f.
            </span>
            <span>fieldnote</span>
          </div>
          <h2>Make room for a little more outside.</h2>
          <p className="wl-preview-intro">
            A slower kind of weekend is on its way. Leave your email and we’ll
            let you know when Fieldnote opens its doors.
          </p>
          <div className="wl-preview-form-space">
            <SignUpForm
              email={email}
              isLoading={loading}
              waitList={waitList}
              onSubmit={handleSubmit}
              setEmail={setEmail}
              inputRef={emailRef}
            />
          </div>
        </div>
      </div>
      <div className="wl-preview-controls">
        <fieldset>
          <legend>Try a different brand color</legend>
          <div className="wl-swatches">
            {styles.map((item) => (
              <button
                key={item.id}
                type="button"
                data-color={item.id}
                aria-label={`${item.name} brand color`}
                aria-pressed={styleId === item.id}
                onClick={() => setStyleId(item.id)}
              >
                {styleId === item.id ? <Check size={14} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </fieldset>
        <span className="wl-preview-selected-style">{style.name}</span>
      </div>
      <p className="wl-preview-disclaimer">
        Preview only. Your email is not saved or sent.
      </p>
    </div>
  );
}
