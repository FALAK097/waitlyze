"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  className,
  idleLabel = "Copy",
  doneLabel = "Copied",
  iconOnly = false,
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button
      type="button"
      onClick={() => void copy(text)}
      aria-label={copied ? doneLabel : idleLabel}
      title={copied ? doneLabel : idleLabel}
      variant={iconOnly ? "public-copy-icon" : "public-copy"}
      size={iconOnly ? "public-copy-icon" : "public-copy"}
      className={cn("shrink-0", className)}
    >
      {iconOnly ? (
        <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={15} aria-hidden="true" />
      ) : copied ? (
        doneLabel
      ) : (
        idleLabel
      )}
    </Button>
  );
}
