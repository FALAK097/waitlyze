"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export function notifySettingsResult(result) {
  if (result?.error) {
    toast((notification) => <span className="product-settings-toast"><span>{result.error}</span><button type="button" aria-label="Dismiss error" onClick={() => toast.dismiss(notification.id)}><X size={16} aria-hidden="true" /></button></span>, { duration: Infinity, ariaProps: { role: "alert", "aria-live": "assertive" } });
  } else if (result?.success) toast.success(result.success);
}

export function useSettingsFeedback(result) {
  useEffect(() => { notifySettingsResult(result); }, [result]);
}
