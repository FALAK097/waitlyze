"use client";

import {
  UserGroupIcon,
  LinkSquare01Icon,
  Plug01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const sections = [
  { id: "referral", label: "Referral sharing", icon: UserGroupIcon },
  { id: "domain", label: "Custom domain", icon: LinkSquare01Icon },
  { id: "webhooks", label: "Webhooks", icon: Plug01Icon },
  { id: "delete", label: "Delete waitlist", icon: Delete02Icon, danger: true },
];

const settingsNavClass = "grid gap-1 max-[760px]:grid-cols-2 max-[760px]:gap-1.5";

const settingsNavLinkClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-item no-underline transition-colors duration-150 hover:bg-product-bg-inset max-[760px]:gap-2 max-[760px]:px-2.5";

export function WaitlistSettingsNavigation({ waitlistId, section = "referral" }) {
  return (
    <nav aria-label="Waitlist settings sections" className={settingsNavClass}>
      {sections.map(({ id, label, icon, danger }) => (
        <Link
          prefetch={false}
          key={id}
          href={`/waitlists/${waitlistId}/settings?section=${id}`}
          aria-current={section === id ? "page" : undefined}
          data-danger={danger || undefined}
          scroll={false}
          className={cn(
            settingsNavLinkClass,
            danger
              ? "text-product-danger-text hover:text-product-danger-text"
              : "text-product-text-secondary hover:text-product-text-primary",
            section === id && "bg-product-bg-inset font-medium",
            section === id && !danger && "text-product-text-primary",
          )}
        >
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
