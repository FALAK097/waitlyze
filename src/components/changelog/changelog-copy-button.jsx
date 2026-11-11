"use client";

import { CheckmarkCircle01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

export function ChangelogCopyButton({ releaseId, version }) {
  const [copied, setCopied] = useState(false);

  async function copy(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/docs/changelog#${releaseId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`Copied direct link to ${version}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy link.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy link to ${version}`}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border/70 bg-white text-fd-muted-foreground shadow-2xs transition-all hover:border-fd-border hover:bg-fd-muted/50 hover:text-fd-foreground"
      aria-label={`Copy link to ${version}`}
    >
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle01Icon : Link01Icon}
        size={14}
        aria-hidden="true"
        className={copied ? "text-emerald-600" : ""}
      />
    </button>
  );
}
