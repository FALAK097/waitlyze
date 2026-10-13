import page from "./waitlist-page-content.module.css";
import signup from "./waitlist-signup.module.css";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";
import { THEME_ACCENTS, THEME_FONTS, THEME_PRESETS, normalizeTheme } from "@/lib/templates/theme.mjs";

function themeParts(theme) {
  const normalized = normalizeTheme(theme);
  return { preset: THEME_PRESETS[normalized.preset], accent: THEME_ACCENTS[normalized.accent], font: THEME_FONTS[normalized.font] };
}

export function WaitlistPageContent({ snapshot, name, renderSignupForm, previewViewport }) {
  const HeroHeading = previewViewport ? "h2" : "h1";
  const ItemHeading = previewViewport ? "h3" : "h2";
  const v = themeParts(snapshot?.theme);
  return <div className={page.pageCanvas} data-preview-viewport={previewViewport} style={{ "--page-bg": v.preset.bg, "--page-text": v.preset.text, "--page-muted": v.preset.muted, "--page-card": v.preset.card, "--page-border": v.preset.border, "--page-accent": v.accent.solid, "--page-accent-hover": v.accent.hover, "--page-accent-label": v.accent.text, "--page-font": v.font.stack }}>
    <div className={page.content}>
      <p className={page.eyebrow}>{name || "Waitlist"}</p>
      {snapshot.sections.map((section, index) => <section className={`${page.section} ${page[section.type] || ""}`} data-page-section={section.type} key={`${section.type}-${index}`}>
        {section.type === "hero" && <><HeroHeading>{section.heading}</HeroHeading><p>{section.body}</p></>}
        {section.type === "features" && <div className={page.features}>{section.items.map((item, itemIndex) => <article key={itemIndex}><ItemHeading>{item.title}</ItemHeading><p>{item.body}</p></article>)}</div>}
        {section.type === "faq" && <div className={page.faq}>{section.items.map((item, itemIndex) => <article key={itemIndex}><ItemHeading>{item.question}</ItemHeading><p>{item.answer}</p></article>)}</div>}
        {section.type === "form" && renderSignupForm?.(section, snapshot)}
        {section.type === "footer" && <p>{section.note}</p>}
      </section>)}
    </div>
  </div>;
}

export function WaitlistSignupPreview({ label, buttonText, theme }) {
  const v = themeParts(theme);
  return <div className={signup.form} aria-label="Signup form preview" style={{ "--page-bg": v.preset.bg, "--page-text": v.preset.text, "--page-muted": v.preset.muted, "--page-card": v.preset.card, "--page-border": v.preset.border, "--page-accent": v.accent.solid, "--page-accent-hover": v.accent.hover, "--page-accent-label": v.accent.text, "--page-font": v.font.stack }}>
    <span className={signup.label}>{label}</span>
    <div className={signup.row}>
      <span className={signup.previewEmail} aria-hidden="true">you@example.com</span>
      <span className={signup.previewButton} aria-hidden="true">{buttonText}</span>
    </div>
    <div className={signup.consent}>
      <span className={signup.previewCheckbox} aria-hidden="true" />
      <span>{MARKETING_CONSENT_COPY}</span>
    </div>
  </div>;
}
