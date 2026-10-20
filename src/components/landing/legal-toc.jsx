"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export default function LegalTOC({ sections }) {
  const navRef = useRef(null);
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const headings = sections.map(({ id }) => document.getElementById(id)).filter(Boolean);
    let frame;
    const update = () => {
      frame = undefined;
      // Match the shared heading scroll offset, including the mobile sticky TOC.
      const offset = window.innerWidth <= 800 ? 180 : 120;
      let current = headings[0]?.id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= offset + 1) current = heading.id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)
        current = headings.at(-1)?.id;
      setActive(current);
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [sections]);

  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector('[aria-current="location"]');
    if (!nav || !link || window.innerWidth > 800) return;
    const navBox = nav.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    if (linkBox.left < navBox.left) nav.scrollLeft -= navBox.left - linkBox.left + 8;
    else if (linkBox.right > navBox.right) nav.scrollLeft += linkBox.right - navBox.right + 8;
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="On this page"
      className="mb-7 grid gap-3 text-xs text-product-text-secondary max-md:mb-0 max-md:flex max-md:overflow-x-auto max-md:p-1.5"
    >
      <p className="mb-2 flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase max-md:hidden">
        On this page
      </p>
      {sections.map(({ id, label }) => (
        <a
          href={`#${id}`}
          key={id}
          aria-current={active === id ? "location" : undefined}
          className={cn(
            "-ml-2 rounded px-2 py-1.5 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 max-md:ml-0 max-md:shrink-0 max-md:whitespace-nowrap",
            active === id && "bg-product-bg-inset font-bold text-product-success-text",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
