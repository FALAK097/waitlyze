"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
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
        <Link
          href="/"
          aria-label="Waitlyze home"
          onClick={() => setOpen(false)}
        >
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation" className="wl-desktop-nav">
          {links.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="wl-header-actions">
          <SignupButton compact>Sign in</SignupButton>
          <button
            ref={menuRef}
            className="wl-icon-button wl-menu-toggle"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="wl-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <nav
        id="wl-mobile-nav"
        className="wl-mobile-nav"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map(([label, href]) => (
          <Link href={href} key={href} onClick={() => setOpen(false)}>
            {label}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
