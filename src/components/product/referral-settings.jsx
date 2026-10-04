"use client";

import { setWaitlistReferrals } from "@/app/actions/settings";
import { useState, useTransition } from "react";

export function ReferralSettings({ waitListId, initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function changeEnabled(event) {
    const next = event.currentTarget.checked;
    const previous = enabled;
    setEnabled(next);
    setMessage("");
    startTransition(async () => {
      const result = await setWaitlistReferrals(waitListId, next);
      if (result.error) {
        setEnabled(previous);
        setMessage(result.error);
      } else {
        setMessage(next ? "Referral sharing is on." : "Referral sharing is off.");
      }
    });
  }

  return (
    <div className="product-referral-setting">
      <label className="product-referral-setting-control" htmlFor="waitlist-referrals">
        <input id="waitlist-referrals" type="checkbox" checked={enabled} onChange={changeEnabled} disabled={pending} />
        <span>
          <strong>Enable referral sharing</strong>
          <span>After joining, subscribers can share a personal link and see their current position.</span>
        </span>
      </label>
      <p className="product-help">Referral credit appears after both signup email addresses are verified. Position updates may take a moment.</p>
      <p className="product-announcement" role="status" aria-live="polite">{pending ? "Saving…" : message}</p>
    </div>
  );
}
