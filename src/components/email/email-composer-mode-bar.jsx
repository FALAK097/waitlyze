"use client";

import { CodeIcon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const tab =
  "inline-flex min-h-9 items-center gap-2 rounded-product-control border border-product-border-control bg-white px-3 text-caption font-semibold text-product-text-primary aria-[pressed=true]:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text!";

export function EmailComposerModeBar({ mode, setMode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Email editor mode">
        <button
          type="button"
          className={tab}
          aria-pressed={mode === "visual"}
          onClick={() => setMode("visual")}
        >
          <HugeiconsIcon icon={Edit02Icon} size={16} aria-hidden="true" /> Visual editor
        </button>
        <button
          type="button"
          className={tab}
          aria-pressed={mode === "html"}
          onClick={() => setMode("html")}
        >
          <HugeiconsIcon icon={CodeIcon} size={16} aria-hidden="true" /> HTML
        </button>
      </div>
    </div>
  );
}
