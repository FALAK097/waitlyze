"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./waitlist-experience.module.css";

export function WaitlistNav({ id, canSendEmail }) {
  const pathname = usePathname();
  const navRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const root = `/wait-lists/${id}`;
  const tabs = [[root, "Overview"], [`${root}/edit`, "Page"], [`${root}/subscribers`, "Subscribers"], ...(canSendEmail ? [[`${root}/emails`, "Emails"]] : []), [`${root}/settings`, "Waitlist settings"]];
  const isCurrent = (href) => pathname === href || (href !== root && pathname.startsWith(`${href}/`));
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => setHasOverflow(nav.scrollWidth > nav.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    for (const child of nav.children) observer.observe(child);
    document.fonts?.ready.then(measure);
    measure();
    return () => observer.disconnect();
  }, [id, canSendEmail]);

  return <>
    <nav ref={navRef} aria-label="Waitlist sections" aria-describedby={hasOverflow ? "waitlist-section-scroll-hint" : undefined} data-overflow={hasOverflow || undefined} className={`product-context-nav ${styles.contextNav}`}>{tabs.map(([href, label]) => <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined}>{label}</Link>)}</nav>
    {hasOverflow && <span id="waitlist-section-scroll-hint" className="product-visually-hidden">Scroll horizontally to see all waitlist sections.</span>}
  </>;
}
