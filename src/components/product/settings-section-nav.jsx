"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "workspace", label: "Workspace" },
  { id: "integrations", label: "Integrations" },
  { id: "developers", label: "Developers" },
];

function currentHash() {
  const id = window.location.hash.slice(1);
  return sections.some((section) => section.id === id) ? id : sections[0].id;
}

export function SettingsSectionNavigation() {
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const syncHash = () => setActiveSection(currentHash());
    syncHash();
    window.addEventListener("hashchange", syncHash);

    const targets = sections.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (!("IntersectionObserver" in window)) return () => window.removeEventListener("hashchange", syncHash);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-24% 0px -65% 0px", threshold: 0 });
    targets.forEach((target) => observer.observe(target));

    return () => {
      window.removeEventListener("hashchange", syncHash);
      observer.disconnect();
    };
  }, []);

  const links = (mobile = false) => sections.map(({ id, label }) => (
    <a
      key={id}
      href={`#${id}`}
      aria-current={activeSection === id ? "location" : undefined}
      onClick={(event) => {
        setActiveSection(id);
        if (mobile) {
          const disclosure = event.currentTarget.closest("details");
          if (disclosure) disclosure.open = false;
        }
      }}
    >
      {label}
    </a>
  ));

  return <>
    <nav aria-label="Settings sections" className="product-settings-index product-settings-desktop">{links()}</nav>
    <details className="product-settings-mobile">
      <summary>Settings sections</summary>
      <nav aria-label="Settings sections">{links(true)}</nav>
    </details>
  </>;
}
