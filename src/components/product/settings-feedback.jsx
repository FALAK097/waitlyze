"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export function notifySettingsResult(result) {
  if (result?.error) {
    toast((notification) => <span className="product-settings-toast"><span>{result.error}</span><Button variant="ghost" size="icon" type="button" aria-label="Dismiss error" onClick={() => toast.dismiss(notification.id)}><HugeiconsIcon icon={Cancel01Icon} size={16} aria-hidden="true" /></Button></span>, { duration: Infinity, ariaProps: { role: "alert", "aria-live": "assertive" } });
  } else if (result?.success) toast.success(result.success);
}

export function useSettingsFeedback(result) {
  useEffect(() => { notifySettingsResult(result); }, [result]);
}
