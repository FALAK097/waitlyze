"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  className,
  idleLabel = "Copy",
  doneLabel = "Copied",
  iconOnly = false,
}) {
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
      title={copied ? doneLabel : idleLabel}
      className={cn(
        "shrink-0 cursor-pointer",
        iconOnly
          ? "grid size-8 place-items-center rounded-full bg-wl-button/10 text-wl-button transition-opacity hover:opacity-80"
          : "rounded-wl bg-wl-button px-3 py-2 text-caption font-bold text-wl-button-text",
        className,
      )}
    >
      {iconOnly ? (
        <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={15} aria-hidden="true" />
      ) : copied ? (
        doneLabel
      ) : (
        idleLabel
      )}
    </button>
  );
}
