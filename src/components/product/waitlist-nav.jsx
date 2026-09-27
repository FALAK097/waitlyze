"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function WaitlistNav({ id, canSendEmail }) {
  const pathname = usePathname();
  const root = `/wait-lists/${id}`;
  const tabs = [[root, "Overview"], [`${root}/edit`, "Page"], [`${root}/subscribers`, "Subscribers"], ...(canSendEmail ? [[`${root}/emails`, "Emails"]] : []), [`${root}/settings`, "Settings"]];
  return <nav aria-label="Waitlist sections" className="product-context-nav">{tabs.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
