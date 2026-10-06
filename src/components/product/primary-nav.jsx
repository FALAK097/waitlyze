"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PrimaryNav() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="product-primary-nav">
    {[["/wait-lists", "Waitlists"], ["/settings", "Settings"]].map(([href, name]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>{name}</Link>)}
  </nav>;
}
