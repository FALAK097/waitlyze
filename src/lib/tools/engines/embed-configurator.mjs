export const EMBED_LAYOUT_MODES = Object.freeze([
  { value: "inline", label: "Inline form" },
  { value: "pill", label: "Compact pill" },
  { value: "modal", label: "Popup modal" },
  { value: "drawer", label: "Slide-over drawer" },
]);

export const EMBED_FRAMEWORKS = Object.freeze([
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "framer", label: "Framer" },
  { value: "webflow", label: "Webflow" },
  { value: "shopify", label: "Shopify" },
  { value: "html", label: "HTML" },
]);

export const EMBED_DEFAULTS = Object.freeze({
  mode: "inline",
  theme: "light",
  accentColor: "#c6fe1e",
  buttonTextColor: "#00160d",
  radius: "round",
  showNameField: false,
  buttonText: "Join waitlist",
  placeholder: "you@company.com",
  framework: "nextjs",
});

function escapeAttr(val) {
  return String(val || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildDataAttrs(config = {}) {
  const mode = config.mode || "inline";
  const attrs = [];
  if (mode !== "inline") attrs.push(`data-mode="${escapeAttr(mode)}"`);
  if (mode === "pill") attrs.push('data-height="96px"');
  if (config.theme && config.theme !== "light") {
    attrs.push(`data-theme="${escapeAttr(config.theme)}"`);
  }
  if (mode === "modal" || mode === "drawer") {
    if (config.buttonText) attrs.push(`data-button-text="${escapeAttr(config.buttonText)}"`);
    if (config.accentColor) attrs.push(`data-accent-color="${escapeAttr(config.accentColor)}"`);
    if (config.buttonTextColor) {
      attrs.push(`data-button-text-color="${escapeAttr(config.buttonTextColor)}"`);
    }
    if (config.radius) attrs.push(`data-radius="${escapeAttr(config.radius)}"`);
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

export function generateEmbedSnippet(config = {}, waitlistKeyId = "YOUR_PUBLIC_WAITLIST_ID") {
  const framework = config.framework || "nextjs";
  const keyId = escapeAttr(waitlistKeyId || "YOUR_PUBLIC_WAITLIST_ID");
  const extraAttrs = buildDataAttrs(config);
  const styleSyncNote =
    "Snippet settings control the embed trigger and layout. Form colors, radius, placeholder, and optional Name/Role fields are saved as a private campaign draft reference; publish the campaign separately to apply form settings.";

  if (framework === "nextjs") {
    const code = `"use client";

import Script from "next/script";

declare global {
  interface Window {
    WaitlyzeEmbed?: { init?: () => void };
  }
}

export function WaitlistEmbed() {
  return (
    <section aria-label="Waitlist signup">
      <div
        className="waitlyze-widget"
        data-key-id="${keyId}"${extraAttrs}
      >
        <a href="https://waitlyze.com" target="_blank" rel="noopener">
          Waitlist powered by Waitlyze
        </a>
      </div>
      <Script
        src="https://waitlyze.com/js/embed.js"
        strategy="lazyOnload"
        onReady={() => window.WaitlyzeEmbed?.init?.()}
      />
    </section>
  );
}`;
    return {
      language: "tsx",
      code,
      installNote: `Loads after hydration via next/script strategy='lazyOnload' and re-scans on client navigation via window.WaitlyzeEmbed.init(). ${styleSyncNote}`,
    };
  }

  if (framework === "react") {
    const code = `import { useEffect } from "react";

export function WaitlistEmbed() {
  useEffect(() => {
    const existing = document.querySelector('script[src="https://waitlyze.com/js/embed.js"]');
    if (existing) {
      window.WaitlyzeEmbed?.init?.();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://waitlyze.com/js/embed.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="waitlyze-widget" data-key-id="${keyId}"${extraAttrs}>
      <a href="https://waitlyze.com" target="_blank" rel="noopener">
        Waitlist powered by Waitlyze
      </a>
    </div>
  );
}`;
    return {
      language: "jsx",
      code,
      installNote: `Calls window.WaitlyzeEmbed.init() on remounts so SPA route transitions always render the widget. ${styleSyncNote}`,
    };
  }

  if (framework === "framer") {
    const code = `<!-- Paste inside Framer → Insert → Utility → Embed (HTML mode) -->
<div class="waitlyze-widget" data-key-id="${keyId}"${extraAttrs}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "html",
      code,
      installNote: `Set the Framer Embed container width to Fill and height to Fit Content so the widget auto-resizes cleanly. ${styleSyncNote}`,
    };
  }

  if (framework === "webflow") {
    const code = `<!-- Add a Webflow Embed element where you want the signup form -->
<div class="waitlyze-widget" data-key-id="${keyId}"${extraAttrs}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "html",
      code,
      installNote: `Works inside any Webflow section, modal wrapper, or CMS template. Publish the site to preview live referral forwarding. ${styleSyncNote}`,
    };
  }

  if (framework === "shopify") {
    const code = `<!-- Paste inside a Shopify Online Store → Custom Liquid block -->
<div class="waitlyze-widget" data-key-id="${keyId}"${extraAttrs}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "liquid",
      code,
      installNote: `Safe for product drop and coming-soon templates—uses public data-key-id with zero private keys in theme files. ${styleSyncNote}`,
    };
  }

  const code = `<div class="waitlyze-widget" data-key-id="${keyId}"${extraAttrs}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
  return {
    language: "html",
    code,
    installNote: `Drop directly into any static HTML page. Automatically forwards ?r= referral codes and UTM query parameters. ${styleSyncNote}`,
  };
}

export function getCspChecklist() {
  return [
    {
      directive: "script-src",
      value: "https://waitlyze.com",
      note: "Allows the deferred /js/embed.js loader.",
    },
    {
      directive: "frame-src",
      value: "https://waitlyze.com",
      note: "Allows the sandboxed waitlist signup and post-signup referral iframe.",
    },
    {
      directive: "Performance",
      value: "Zero blocking JS",
      note: "Uses defer / lazyOnload and postMessage height resizing with zero secret keys exposed.",
    },
  ];
}
