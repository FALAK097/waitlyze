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
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/80 px-2 py-0.5 text-xs text-emerald-900 shadow-2xs transition-colors hover:bg-emerald-100/70 sm:gap-1.5 sm:px-2.5 sm:py-1"
    >
      <a
        href={changelogUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 font-medium text-emerald-900 no-underline sm:gap-1.5"
        title={`View ${version} changelog in a new tab`}
      >
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-semibold">{version}</span>
        <span className="hidden text-emerald-700 sm:inline">released</span>
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
        className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-emerald-700/70 transition-colors hover:bg-emerald-200/80 hover:text-emerald-950"
        aria-label={`Dismiss ${version} notification`}
        title="Dismiss until next release"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={11} aria-hidden="true" />
      </button>
    </div>
  );
}
