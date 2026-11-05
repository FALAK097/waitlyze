"use client";

import { ArrowUpRight01Icon, Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import SignupButton from "./signup-button";
import Wordmark from "./wordmark";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);
  const links = [
    ["Features", "/#features"],
    ["How it works", "/#steps"],
    ["Templates", "/#templates"],
    ["Blog", "/blog"],
    ["Docs", "/docs"],
  ];
  return (
    <header className="sticky top-0 z-40 bg-product-bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-3 px-5 sm:gap-6 sm:px-6">
        <Link
          href="/"
          aria-label="Waitlyze home"
          onClick={() => setOpen(false)}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
        >
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-5 md:flex xl:gap-7">
          {links.map(([label, href]) => (
            <Link
              href={href}
              key={href}
              className="text-[13px] text-product-text-secondary transition-colors duration-150 hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              {label}
              {label === "Docs" && (
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={13}
                  aria-hidden="true"
                  className="ml-1 inline-block"
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <SignupButton
            compact
            className="min-h-9 gap-1 rounded-full border-product-text-primary bg-product-accent-solid px-3 py-1.5 text-[13px] text-product-accent-label hover:bg-product-accent-hover sm:px-4"
          >
            Start free
          </SignupButton>
          <Button
            ref={menuRef}
            type="button"
            variant="product-ghost"
            size="icon-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="wl-mobile-nav"
            onClick={() => setOpen(!open)}
            className="md:hidden"
          >
            {open ? (
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            ) : (
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            )}
          </Button>
        </div>
      </div>
      <nav
        id="wl-mobile-nav"
        className={cn("grid gap-1 px-5 pt-2 pb-5 md:hidden", !open && "hidden")}
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map(([label, href]) => (
          <Link
            href={href}
            key={href}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded p-3 text-base hover:bg-product-bg-inset focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {label}
            {label === "Docs" && (
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
