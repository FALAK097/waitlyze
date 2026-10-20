"use client";

import { ArrowUpRight01Icon, Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import SignupButton from "./signup-button";
import Wordmark from "./wordmark";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const links = [
    ["How it works", "/#how-it-works"],
    ["Features", "/#features"],
    ["FAQ", "/#faq"],
  ];
  return (
    <header
      className="sticky top-0 z-40 bg-product-bg-surface"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuRef.current?.focus();
        }
      }}
    >
      <div className="mx-auto flex h-22 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-5 md:h-18 md:px-8 lg:px-12">
        <Link
          prefetch={false}
          href="/"
          aria-label="Waitlyze home"
          onClick={() => setOpen(false)}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
        >
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <Link
              prefetch={false}
              href={href}
              key={href}
              className="text-sm text-product-text-secondary transition-colors duration-150 hover:text-product-success-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 md:gap-1">
          <SignupButton compact className="max-sm:gap-2 max-sm:px-3 max-sm:py-2">
            Sign in
          </SignupButton>
          <button
            ref={menuRef}
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="wl-mobile-nav"
            onClick={() => setOpen(!open)}
            className="hidden size-10 place-items-center rounded-md border border-transparent bg-transparent text-product-text-secondary transition-colors hover:bg-product-bg-inset hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 max-sm:w-9 md:inline-grid"
          >
            {open ? (
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            )}
          </button>
        </div>
      </div>
      <nav
        id="wl-mobile-nav"
        className={cn(
          "grid gap-1 border-t border-product-border-subtle px-5 pt-2 pb-5 md:hidden",
          !open && "hidden",
        )}
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map(([label, href]) => (
          <Link
            prefetch={false}
            href={href}
            key={href}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded p-3 text-base hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {label}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
