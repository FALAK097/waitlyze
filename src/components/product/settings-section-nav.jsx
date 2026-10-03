"use client";

import { useEffect, useState } from "react";

const groups = [
  {
    label: "Account",
    sections: [{ id: "profile", label: "Profile" }],
  },
  {
    label: "Workspace",
    sections: [
      { id: "workspace", label: "Workspace" },
      { id: "team", label: "Team access" },
    ],
  },
  {
    label: "Connections",
    sections: [{ id: "integrations", label: "Integrations" }],
  },
  {
    label: "Developer",
    advanced: true,
    sections: [{ id: "developers", label: "Developer tools" }],
  },
  {
    label: "Data",
    advanced: true,
    sections: [{ id: "privacy", label: "Privacy & data" }],
  },
];

const sections = groups.flatMap((group) => group.sections.map((section) => ({ ...section, group: group.label })));

function sectionFromHash() {
  const id = window.location.hash.slice(1);
  return sections.some((section) => section.id === id) ? id : sections[0].id;
}

function sectionAtReadingPosition() {
  const readingLine = window.innerHeight * 0.34;
  const positioned = sections
    .map(({ id }) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY }))
    .filter(({ top }) => top <= readingLine);

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    return sections.at(-1).id;
  }

  return positioned.at(-1)?.id ?? sections[0].id;
}

export function SettingsSectionNavigation() {
  const [activeSection, setActiveSection] = useState("profile");
  const active = sections.find((section) => section.id === activeSection) ?? sections[0];

  useEffect(() => {
    let frame = 0;
    const syncFromScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActiveSection(sectionAtReadingPosition()));
    };
    const syncFromHash = () => setActiveSection(sectionFromHash());

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, []);

  const renderLinks = (mobile = false) => groups.map((group) => (
    <div className="product-settings-nav-group" data-settings-level={group.advanced ? "advanced" : "primary"} key={group.label}>
      <p className="product-settings-nav-label">{group.label}</p>
      {group.sections.map(({ id, label }) => (
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
      ))}
    </div>
  ));

  return <>
    <nav aria-label="Settings sections" className="product-settings-index product-settings-desktop">
      {renderLinks()}
    </nav>
    <details className="product-settings-mobile" id="settings-section-disclosure">
      <summary aria-label={`Settings sections. Current section: ${active.label}`}>
        <span>Jump to section</span>
        <strong>{active.label}</strong>
      </summary>
      <nav aria-label="Settings sections">{renderLinks(true)}</nav>
    </details>
  </>;
}
