"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function WaitlistNav({ id, canSendEmail }) {
  const pathname = usePathname();
  const navRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const root = `/waitlists/${id}`;
  const tabs = [
    [root, "Builder"],
    [`${root}/subscribers`, "Signups"],
    ...(canSendEmail ? [[`${root}/emails`, "Emails"]] : []),
    [`${root}/analytics`, "Analytics"],
    [`${root}/settings`, "Settings"],
  ];
  const isCurrent = (href) =>
    href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
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

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Waitlist sections"
        aria-describedby={hasOverflow ? "waitlist-section-scroll-hint" : undefined}
        data-overflow={hasOverflow || undefined}
        className="no-scrollbar -me-2.5 flex gap-5 overflow-x-auto pb-0 motion-reduce:snap-none max-[480px]:snap-x max-sm:me-0 max-sm:w-full max-sm:px-4"
      >
        {tabs.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center border-b-2 border-transparent px-0 py-2.5 text-sm font-medium whitespace-nowrap text-product-text-secondary no-underline hover:text-product-text-primary max-[480px]:snap-start",
              isCurrent(href) && "border-product-accent-solid text-product-text-primary",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      {hasOverflow && (
        <span id="waitlist-section-scroll-hint" className="sr-only">
          Scroll horizontally to see all waitlist sections.
        </span>
      )}
    </>
  );
}
