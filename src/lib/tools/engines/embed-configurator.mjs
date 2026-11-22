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

export function generateEmbedSnippet(config = {}, waitlistKeyId = "YOUR_PUBLIC_WAITLIST_ID") {
  const framework = config.framework || "nextjs";
  const mode = config.mode || "inline";
  const keyId = waitlistKeyId || "YOUR_PUBLIC_WAITLIST_ID";
  const heightAttr = mode === "pill" ? ' data-height="96"' : "";

  if (framework === "nextjs") {
    const code = `import Script from "next/script";

export function WaitlistEmbed() {
  return (
    <section aria-label="Waitlist signup">
      <div
        className="waitlyze-widget"
        data-key-id="${keyId}"${heightAttr}
      >
        <a href="https://waitlyze.com" target="_blank" rel="noopener">
          Waitlist powered by Waitlyze
        </a>
      </div>
      <Script src="https://waitlyze.com/js/embed.js" strategy="lazyOnload" />
    </section>
  );
}`;
    return {
      language: "tsx",
      code,
      installNote:
        "Loads after hydration via next/script strategy='lazyOnload' so LCP and First Contentful Paint remain untouched.",
    };
  }

  if (framework === "react") {
    const code = `import { useEffect } from "react";

export function WaitlistEmbed() {
  useEffect(() => {
    if (document.querySelector('script[src="https://waitlyze.com/js/embed.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://waitlyze.com/js/embed.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="waitlyze-widget" data-key-id="${keyId}"${heightAttr}>
      <a href="https://waitlyze.com" target="_blank" rel="noopener">
        Waitlist powered by Waitlyze
      </a>
    </div>
  );
}`;
    return {
      language: "jsx",
      code,
      installNote:
        "Idempotent script mount avoids duplicate iframe initialization in React Strict Mode.",
    };
  }

  if (framework === "framer") {
    const code = `<!-- Paste inside Framer → Insert → Utility → Embed (HTML mode) -->
<div class="waitlyze-widget" data-key-id="${keyId}"${heightAttr}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "html",
      code,
      installNote:
        "Set the Framer Embed container width to Fill and height to Fit Content so the widget auto-resizes cleanly.",
    };
  }

  if (framework === "webflow") {
    const code = `<!-- Add a Webflow Embed element where you want the signup form -->
<div class="waitlyze-widget" data-key-id="${keyId}"${heightAttr}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "html",
      code,
      installNote:
        "Works inside any Webflow section, modal wrapper, or CMS template. Publish the site to preview live referral forwarding.",
    };
  }

  if (framework === "shopify") {
    const code = `<!-- Paste inside a Shopify Online Store → Custom Liquid block -->
<div class="waitlyze-widget" data-key-id="${keyId}"${heightAttr}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
    return {
      language: "liquid",
      code,
      installNote:
        "Safe for product drop and coming-soon templates—uses public data-key-id with zero private keys in theme files.",
    };
  }

  const code = `<div class="waitlyze-widget" data-key-id="${keyId}"${heightAttr}>
  <a href="https://waitlyze.com" target="_blank" rel="noopener">
    Waitlist powered by Waitlyze
  </a>
</div>
<script src="https://waitlyze.com/js/embed.js" defer></script>`;
  return {
    language: "html",
    code,
    installNote:
      "Drop directly into any static HTML page. Automatically forwards ?r= referral codes and UTM query parameters.",
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
