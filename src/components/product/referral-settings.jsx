"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { setWaitlistReferrals } from "@/app/actions/settings";
import { notifySettingsResult } from "./settings-feedback";
import { useState, useTransition } from "react";

export function ReferralSettings({ waitListId, initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function changeEnabled(next) {
    const previous = enabled;
    setEnabled(next);
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await setWaitlistReferrals(waitListId, next);
        if (result.error) throw new Error(result.error);
        const success = next ? "Referral sharing is on." : "Referral sharing is off.";
        setMessage(success);
        notifySettingsResult({ success });
      } catch (error) {
        setEnabled(previous);
        setFailed(true);
        const message = error.message || "Could not update referral sharing. Try again.";
        setMessage(message);
        notifySettingsResult({ error: message });
      }
    });
  }

  return (
    <div className="product-referral-setting">
      <Label className="flex items-start min-h-11 cursor-pointer" htmlFor="waitlist-referrals">
        <Checkbox id="waitlist-referrals" checked={enabled} onCheckedChange={changeEnabled} disabled={pending} />
        <span>
          <strong>Enable referral sharing</strong>
          <span>Subscribers can invite others with a personal link.</span>
        </span>
      </Label>
      <p className="product-help">Referral credit counts once both email addresses are verified.</p>
      <p className="product-announcement" role={failed ? "alert" : "status"} aria-live={failed ? "assertive" : "polite"}>{pending ? "Saving…" : message}</p>
    </div>
  );
}
