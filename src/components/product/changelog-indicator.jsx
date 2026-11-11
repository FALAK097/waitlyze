"use client";

import { ArrowUpRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { LATEST_CHANGELOG_VERSION } from "@/lib/changelog";

const STORAGE_KEY = "waitlyze_seen_changelog";

export function ChangelogIndicator({ version = LATEST_CHANGELOG_VERSION }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== version) {
        setIsVisible(true);
      }
    } catch {
      // LocalStorage access might fail in privacy-restricted environments
    }
  }, [version]);

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, version);
    } catch {}
    setIsVisible(false);
  }

  function handleOpen() {
    markSeen();
  }

  function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    markSeen();
  }

  if (!isVisible) return null;

  const versionSlug = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const changelogUrl = `/docs/changelog#release-${versionSlug}`;

  return (
    <div
      role="status"
      aria-label="New changelog release available"
      className="hover:bg-product-neutral-200 inline-flex shrink-0 items-center gap-1 rounded-full border border-product-border-subtle bg-product-bg-inset px-2 py-0.5 text-xs text-product-text-primary transition-colors sm:gap-1.5 sm:px-2.5 sm:py-1"
    >
      <a
        href={changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 font-medium text-product-text-primary no-underline sm:gap-1.5"
        title={`View ${version} changelog in a new tab`}
      >
        <span className="size-1.5 rounded-full bg-product-accent-solid" />
        <span className="font-semibold">{version}</span>
        <span className="hidden text-product-text-secondary sm:inline">released</span>
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={12}
          aria-hidden="true"
          className="opacity-75 max-[360px]:hidden"
        />
      </a>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-0.5 inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-product-text-secondary transition-colors hover:text-product-text-primary"
        aria-label={`Dismiss ${version} notification`}
        title="Dismiss until next release"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={11} aria-hidden="true" />
      </button>
    </div>
  );
}
