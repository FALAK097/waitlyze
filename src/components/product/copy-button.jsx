"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function CopyButton({ text, className, idleLabel = "Copy", doneLabel = "Copied" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? doneLabel : idleLabel}
      className={cn(
        "shrink-0 cursor-pointer rounded-wl bg-wl-button px-3 py-2 text-caption font-bold text-wl-button-text",
        className,
      )}
    >
      {copied ? doneLabel : idleLabel}
    </button>
  );
}
