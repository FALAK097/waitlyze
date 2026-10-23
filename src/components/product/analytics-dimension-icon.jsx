"use client";

import {
  BrowserIcon,
  ComputerIcon,
  Globe02Icon,
  Link01Icon,
  Mail01Icon,
  Search01Icon,
  SmartPhone01Icon,
  Tablet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const SVGL = "https://svgl.app/library";

const SVGL_ICONS = {
  chrome: `${SVGL}/chrome.svg`,
  chromium: `${SVGL}/chromium.svg`,
  firefox: `${SVGL}/firefox.svg`,
  edge: `${SVGL}/edge.svg`,
  opera: `${SVGL}/opera.svg`,
  brave: `${SVGL}/brave.svg`,
  safari: `${SVGL}/safari.svg`,
  vivaldi: `${SVGL}/vivaldi.svg`,
  arc: `${SVGL}/arc_browser.svg`,
  tor: `${SVGL}/tor.svg`,
  windows: `${SVGL}/windows.svg`,
  apple: `${SVGL}/apple.svg`,
  android: `${SVGL}/android-icon.svg`,
  linux: `${SVGL}/linux.svg`,
  x: `${SVGL}/x.svg`,
  twitter: `${SVGL}/twitter.svg`,
  linkedin: `${SVGL}/linkedin.svg`,
  youtube: `${SVGL}/youtube.svg`,
  reddit: `${SVGL}/reddit.svg`,
  google: `${SVGL}/google.svg`,
  instagram: `${SVGL}/instagram-icon.svg`,
  facebook: `${SVGL}/facebook-icon.svg`,
  tiktok: `${SVGL}/tiktok-icon-light.svg`,
  telegram: `${SVGL}/telegram.svg`,
  threads: `${SVGL}/threads.svg`,
  bluesky: `${SVGL}/bluesky.svg`,
  pinterest: `${SVGL}/pinterest.svg`,
  whatsapp: `${SVGL}/whatsapp-icon.svg`,
  discord: `${SVGL}/discord.svg`,
  producthunt: `${SVGL}/producthunt.svg`,
  github: `${SVGL}/github.svg`,
};

function flag(code) {
  const clean = String(code || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "";
  return String.fromCodePoint(...[...clean].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

function countryFromLabel(label) {
  const match = String(label || "").match(/(?:^|,\s*)([A-Z]{2})$/);
  return match?.[1] || "";
}

function hostMatches(value, domain) {
  return value === domain || value.endsWith(`.${domain}`);
}

function svglKeyFor(label) {
  const value = String(label || "")
    .toLowerCase()
    .trim();
  if (!value || value === "direct" || value === "none" || value === "direct/none") return null;
  if (
    hostMatches(value, "x.com") ||
    hostMatches(value, "t.co") ||
    hostMatches(value, "twitter.com") ||
    value === "twitter" ||
    value === "x"
  )
    return "x";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("reddit")) return "reddit";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook") || hostMatches(value, "fb.me")) return "facebook";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("telegram")) return "telegram";
  if (value.includes("threads")) return "threads";
  if (value.includes("bluesky")) return "bluesky";
  if (value.includes("pinterest")) return "pinterest";
  if (value.includes("whatsapp")) return "whatsapp";
  if (value.includes("discord")) return "discord";
  if (value.includes("product hunt") || hostMatches(value, "producthunt.com")) return "producthunt";
  if (value.includes("github")) return "github";
  if (value === "chrome") return "chrome";
  if (value === "chromium") return "chromium";
  if (value === "firefox") return "firefox";
  if (value === "edge") return "edge";
  if (value === "opera" || value === "opr") return "opera";
  if (value === "brave" || hostMatches(value, "brave.com")) return "brave";
  if (value === "safari") return "safari";
  if (value === "vivaldi") return "vivaldi";
  if (value === "arc" || value.includes("arc browser") || value.includes("arc-browser"))
    return "arc";
  if (value === "tor" || value.includes("tor browser") || value.includes("tor-browser"))
    return "tor";
  if (value.includes("windows")) return "windows";
  if (
    ["macos", "mac os", "ios", "ipados", "apple"].includes(value) ||
    value.includes("iphone") ||
    value.includes("ipad")
  )
    return "apple";
  if (value.includes("android")) return "android";
  if (value.includes("linux") || value.includes("ubuntu")) return "linux";
  if (value === "google" || value.includes("google")) return "google";
  return null;
}

function hugeiconFor(label) {
  const value = String(label || "").toLowerCase();
  if (value.includes("search") || value.includes("organic search")) return Search01Icon;
  if (value === "email" || value.includes("newsletter")) return Mail01Icon;
  if (value.includes("@")) return Mail01Icon;
  if (value.includes("referral") || value.includes("referred") || value.includes("direct"))
    return Link01Icon;
  if (value.startsWith("organic")) return Globe02Icon;
  if (value === "desktop") return ComputerIcon;
  if (value === "mobile") return SmartPhone01Icon;
  if (value === "tablet") return Tablet01Icon;
  return BrowserIcon;
}

export function AnalyticsDimensionIcon({ label, kind, code }) {
  if (kind === "country") {
    const countryFlag = flag(code || label);
    return (
      <span
        className="inline-flex w-5.5 shrink-0 items-center justify-center text-sm leading-none"
        aria-hidden="true"
      >
        {countryFlag || "·"}
      </span>
    );
  }
  if (kind === "region" || kind === "city") {
    const countryFlag = flag(countryFromLabel(label));
    if (countryFlag)
      return (
        <span
          className="inline-flex w-5.5 shrink-0 items-center justify-center text-sm leading-none"
          aria-hidden="true"
        >
          {countryFlag}
        </span>
      );
  }
  const key = svglKeyFor(label);
  if (key && SVGL_ICONS[key]) {
    return (
      <span
        className="grid size-5.5 shrink-0 place-items-center rounded-md bg-product-bg-surface text-product-text-secondary [&_img]:size-4 [&_img]:object-contain"
        data-brand={key}
        aria-hidden="true"
      >
        <img src={SVGL_ICONS[key]} alt="" width={16} height={16} loading="lazy" />
      </span>
    );
  }
  return (
    <span
      className="grid size-5.5 shrink-0 place-items-center rounded-md bg-product-bg-inset text-product-text-secondary [&_svg]:size-3.25"
      aria-hidden="true"
    >
      <HugeiconsIcon icon={hugeiconFor(label) || Globe02Icon} />
    </span>
  );
}
