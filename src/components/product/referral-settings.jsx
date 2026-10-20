"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setWaitlistReferrals } from "@/app/actions/settings";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ReferralSettings({ waitListId, initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function changeEnabled(next) {
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      try {
        const result = await setWaitlistReferrals(waitListId, next);
        if (result.error) throw new Error(result.error);
        toast.success(next ? "Referral sharing is on." : "Referral sharing is off.");
      } catch (error) {
        setEnabled(previous);
        toast.error(error.message || "Could not update referral sharing. Try again.");
      }
    });
  }

  return (
    <div className="product-referral-setting">
      <Label className="flex min-h-11 cursor-pointer items-start" htmlFor="waitlist-referrals">
        <Checkbox
          id="waitlist-referrals"
          checked={enabled}
          onCheckedChange={changeEnabled}
          disabled={pending}
        />
        <span>
          <strong>Enable referral sharing</strong>
          <span>Referral credit counts once both email addresses are verified.</span>
        </span>
      </Label>
    </div>
  );
}
