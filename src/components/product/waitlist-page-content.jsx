import page from "./waitlist-page-content.module.css";
import signup from "./waitlist-signup.module.css";
import { MARKETING_CONSENT_COPY } from "@/lib/campaigns/marketing-consent.mjs";

export function WaitlistPageContent({ snapshot, name, renderSignupForm, previewViewport }) {
  return <div className={page.pageCanvas} data-preview-viewport={previewViewport}>
    <div className={page.content}>
      <p className={page.eyebrow}>{name || "Waitlist"}</p>
      {snapshot.sections.map((section, index) => <section className={`${page.section} ${page[section.type] || ""}`} data-page-section={section.type} key={`${section.type}-${index}`}>
        {section.type === "hero" && <><h1>{section.heading}</h1><p>{section.body}</p></>}
        {section.type === "features" && <div className={page.features}>{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div>}
        {section.type === "faq" && <div className={page.faq}>{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.question}</h2><p>{item.answer}</p></article>)}</div>}
        {section.type === "form" && renderSignupForm?.(section, snapshot)}
        {section.type === "footer" && <p>{section.note}</p>}
      </section>)}
    </div>
  </div>;
}

export function WaitlistSignupPreview({ label, buttonText }) {
  return <div className={signup.form} aria-label="Signup form preview">
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
