"use client";

import {
  UserCircleIcon,
  UserGroupIcon,
  Plug01Icon,
  HistoryIcon,
  Building02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

const sections = [
  { id: "profile", label: "Profile", icon: UserCircleIcon },
  { id: "workspace", label: "Workspace", icon: Building02Icon },
  { id: "team", label: "Members", icon: UserGroupIcon },
  { id: "integrations", label: "Integrations", icon: Plug01Icon },
  { id: "audit", label: "Audit", icon: HistoryIcon },
];

const settingsNavClass = "grid gap-1 max-[760px]:grid-cols-2 max-[760px]:gap-1.5";

const settingsNavLinkClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-item text-product-text-secondary no-underline transition-colors duration-150 hover:bg-product-bg-inset hover:text-product-text-primary max-[760px]:gap-2 max-[760px]:px-2.5";

export function SettingsSectionNavigation({ section = "profile" }) {
  const router = useRouter();
  useEffect(() => {
    function migrateHash() {
      const old = window.location.hash.slice(1);
      const mapped = old === "developers" ? "integrations" : old === "privacy" ? "profile" : old;
      if (sections.some(({ id }) => id === mapped))
        router.replace(`/settings?section=${mapped}`, { scroll: false });
    }
    migrateHash();
    window.addEventListener("hashchange", migrateHash);
    return () => window.removeEventListener("hashchange", migrateHash);
  }, [router]);
  return (
    <nav aria-label="Settings sections" className={settingsNavClass}>
      {sections.map(({ id, label, icon }) => (
        <Link
          key={id}
          href={`/settings?section=${id}`}
          aria-current={section === id ? "page" : undefined}
          scroll={false}
          className={cn(
            settingsNavLinkClass,
            section === id && "bg-product-bg-inset font-medium text-product-text-primary",
          )}
        >
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
