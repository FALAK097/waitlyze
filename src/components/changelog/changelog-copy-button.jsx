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
      toast.success(`Copied link to ${version}`);
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
      className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent text-fd-muted-foreground transition-colors hover:bg-transparent hover:text-fd-foreground"
      aria-label={`Copy link to ${version}`}
    >
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle01Icon : Link01Icon}
        size={15}
        aria-hidden="true"
        className={copied ? "text-fd-primary" : ""}
      />
    </button>
  );
}
