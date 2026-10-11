"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, Building2, UsersRound, Plug } from "lucide-react";

const sections = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Members", icon: UsersRound },
  { id: "integrations", label: "Integrations", icon: Plug },
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
    {sections.map(({ id, label, icon: Icon }) => <Link key={id} href={`/settings?section=${id}`} aria-current={section === id ? "page" : undefined} scroll={false}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}
