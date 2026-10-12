"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, UserGroupIcon, Plug01Icon } from "@hugeicons/core-free-icons";

const sections = [
  { id: "profile", label: "Profile", icon: UserCircleIcon },
  { id: "team", label: "Members", icon: UserGroupIcon },
  { id: "integrations", label: "Integrations", icon: Plug01Icon },
];

export function SettingsSectionNavigation({ section = "profile" }) {
  const router = useRouter();
  useEffect(() => {
    function migrateHash() {
      const old = window.location.hash.slice(1);
      const mapped = old === "developers" ? "integrations" : old === "privacy" ? "profile" : old;
      if (sections.some(({ id }) => id === mapped)) router.replace(`/settings?section=${mapped}`, { scroll: false });
    }
    migrateHash();
    window.addEventListener("hashchange", migrateHash);
    return () => window.removeEventListener("hashchange", migrateHash);
  }, [router]);
  return <nav aria-label="Settings sections" className="product-settings-section-nav">
    {sections.map(({ id, label, icon }) => <Link key={id} href={`/settings?section=${id}`} aria-current={section === id ? "page" : undefined} scroll={false}><HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}
