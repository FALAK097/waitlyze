"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { useRef, useState } from "react";
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
      className="wl-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuRef.current?.focus();
        }
      }}
    >
      <div className="wl-container wl-header-inner">
        <Link prefetch={false}
          href="/"
          aria-label="Waitlyze home"
          onClick={() => setOpen(false)}
        >
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation" className="wl-desktop-nav">
          {links.map(([label, href]) => (
            <Link prefetch={false} href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="wl-header-actions">
          <SignupButton compact>Sign in</SignupButton>
          <Button
            ref={menuRef}
            className="wl-icon-button wl-menu-toggle"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="wl-mobile-nav"
            variant="ghost" onClick={() => setOpen(!open)}
          >
            {open ? <HugeiconsIcon icon={Cancel01Icon} size={20} /> : <HugeiconsIcon icon={Menu01Icon} size={20} />}
          </Button>
        </div>
      </div>
      <nav
        id="wl-mobile-nav"
        className="wl-mobile-nav"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map(([label, href]) => (
          <Link prefetch={false} href={href} key={href} onClick={() => setOpen(false)}>
            {label}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
