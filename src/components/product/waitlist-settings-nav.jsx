"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, LinkSquare01Icon, Plug01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

const sections = [
  { id: "referral", label: "Referral sharing", icon: UserGroupIcon },
  { id: "domain", label: "Custom domain", icon: LinkSquare01Icon },
  { id: "webhooks", label: "Webhooks", icon: Plug01Icon },
  { id: "delete", label: "Delete waitlist", icon: Delete02Icon, danger: true },
];

export function WaitlistSettingsNavigation({ waitlistId, section = "referral" }) {
  return <nav aria-label="Waitlist settings sections" className="product-settings-section-nav">
    {sections.map(({ id, label, icon, danger }) => <Link
      prefetch={false}
      key={id}
      href={`/waitlists/${waitlistId}/settings?section=${id}`}
      aria-current={section === id ? "page" : undefined}
      data-danger={danger || undefined}
      scroll={false}
    ><HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}
