"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AndroidIcon,
  AppleIcon,
  BrowserIcon,
  ChromeIcon,
  ComputerIcon,
  Globe02Icon,
  GoogleIcon,
  InstagramIcon,
  Link01Icon,
  Linkedin01Icon,
  Mail01Icon,
  NewTwitterIcon,
  RedditIcon,
  SafariIcon,
  Search01Icon,
  SmartPhone01Icon,
  Tablet01Icon,
  WindowsNewIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";

function flag(code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return "";
  return String.fromCodePoint(...[...clean].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

function countryFromLabel(label) {
  const match = String(label || "").match(/(?:^|,\s*)([A-Z]{2})$/);
  return match?.[1] || "";
}

function iconFor(label) {
  const value = String(label || "").toLowerCase();
  if (value.includes("google")) return [GoogleIcon, "google"];
  if (value.includes("reddit")) return [RedditIcon, "reddit"];
  if (value.includes("twitter") || value.includes("x.com") || value.includes("t.co")) return [NewTwitterIcon, "twitter"];
  if (value.includes("linkedin")) return [Linkedin01Icon, "linkedin"];
  if (value.includes("youtube")) return [YoutubeIcon, "youtube"];
  if (value.includes("instagram")) return [InstagramIcon, "instagram"];
  if (value === "chrome") return [ChromeIcon, "chrome"];
  if (value === "safari") return [SafariIcon, "safari"];
  if (value === "windows") return [WindowsNewIcon, "windows"];
  if (value === "android") return [AndroidIcon, "android"];
  if (["macos", "ios", "ipados"].includes(value)) return [AppleIcon, "apple"];
  if (value === "desktop") return [ComputerIcon, "device"];
  if (value === "mobile") return [SmartPhone01Icon, "device"];
  if (value === "tablet") return [Tablet01Icon, "device"];
  if (value.includes("search")) return [Search01Icon, "channel"];
  if (value === "email") return [Mail01Icon, "channel"];
  if (value === "referral" || value.includes("direct")) return [Link01Icon, "channel"];
  return [BrowserIcon, "default"];
}

export function AnalyticsDimensionIcon({ label, kind, code }) {
  if (kind === "country") {
    const countryFlag = flag(code || label);
    return <span className="analytics-dimension-flag" aria-hidden="true">{countryFlag || "·"}</span>;
  }
  if (kind === "region" || kind === "city") {
    const countryFlag = flag(countryFromLabel(label));
    if (countryFlag) return <span className="analytics-dimension-flag" aria-hidden="true">{countryFlag}</span>;
  }
  const [icon, brand] = iconFor(label);
  return <span className="analytics-dimension-icon" data-brand={brand} aria-hidden="true"><HugeiconsIcon icon={icon || Globe02Icon} /></span>;
}
