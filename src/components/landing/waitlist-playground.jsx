"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const styles = [
  {
    id: "lime",
    name: "Lime",
    buttonColor: "#C6FE1E",
    buttonBorder: "#BFEB3B",
    buttonTextColor: "#00160D",
    badgeColor: "#F3FAF6",
    badgeTextColor: "#176B4A",
  },
  {
    id: "forest",
    name: "Forest",
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
  const [styleId, setStyleId] = useState("lime");
  const style = styles.find((item) => item.id === styleId) ?? styles[0];

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
            A slower kind of weekend is on its way. This sample shows how a
            Fieldnote signup could look; it is not a live waitlist.
          </p>
          <div className="wl-preview-form-space">
            <form onSubmit={(event) => event.preventDefault()} aria-label="Example waitlist form">
              <label className="sr-only" htmlFor="preview-example-email">Example email address</label>
              <input
                id="preview-example-email"
                aria-label="Example email address"
                type="email"
                value="you@example.com"
                readOnly
                tabIndex={-1}
                autoComplete="off"
              />
              <button
                type="button"
                disabled
                style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor, borderColor: style.buttonBorder }}
              >
                Join the waitlist
              </button>
            </form>
            <p className="wl-preview-notice">Interactive preview only. This example does not collect or send email.</p>
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
      <p className="wl-preview-disclaimer">Choose a color to see the form update.</p>
    </div>
  );
}
