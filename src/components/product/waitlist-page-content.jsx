import page from "./waitlist-page-content.module.css";
import signup from "./waitlist-signup.module.css";

const font = {
  hanken: "var(--wl-body)",
  manrope: "var(--wl-display)",
  bricolage: "var(--wl-bricolage)",
  figtree: "var(--wl-figtree)",
  archivo: "var(--wl-archivo)",
};
const radius = { sharp: "0px", soft: "10px", round: "18px", pill: "999px" };
function Heading({ level = 2, children, ...props }) {
  const Tag = `h${level}`;
  return <Tag {...props}>{children}</Tag>;
}

export function WaitlistPageContent({
  snapshot,
  name,
  renderSignupForm,
  previewViewport,
  signupCount = 128,
}) {
  const visible = snapshot.sections.filter((section) => section.visible);
  const renderForm = (section) =>
    renderSignupForm?.(section, snapshot) ?? <WaitlistSignupPreview form={snapshot.form} />;
  return (
    <div
      className={page.pageCanvas}
      data-preview-viewport={previewViewport}
      style={{
        "--wl-page": snapshot.brand.pageBackground,
        "--wl-surface": snapshot.brand.surfaceColor,
        "--wl-text": snapshot.brand.textColor,
        "--wl-muted": snapshot.brand.mutedColor,
        "--wl-accent": snapshot.brand.accentColor,
        "--wl-button": snapshot.brand.buttonColor,
        "--wl-button-text": snapshot.brand.buttonTextColor,
        "--wl-input": snapshot.brand.inputBackground,
        "--wl-input-border": snapshot.brand.inputBorder,
        "--wl-input-text": snapshot.brand.inputTextColor,
        "--wl-radius": radius[snapshot.brand.radius],
        "--wl-heading-font": font[snapshot.brand.headingFont],
        "--wl-body-font": font[snapshot.brand.bodyFont],
      }}
    >
      <div className={page.content}>
        {visible.map((section) => {
          const sectionClass = `${page.section} ${page[section.type] || ""}`;
          if (section.type === "navigation")
            return (
              <nav className={sectionClass} key={section.id} aria-label="Waitlist navigation">
                <a href="#top" className={page.wordmark}>
                  {section.brand || name}
                </a>
                <div className={page.navLinks}>
                  {section.links.map((link) => (
                    <a href={link.href} key={`${link.label}-${link.href}`}>
                      {link.label}
                    </a>
                  ))}
                  {section.buttonText && (
                    <a className={page.navButton} href="#signup">
                      {section.buttonText}
                    </a>
                  )}
                </div>
              </nav>
            );
          if (section.type === "hero")
            return (
              <section
                className={`${sectionClass} ${page[`variant_${section.variant}`] || ""}`}
                id="top"
                key={section.id}
              >
                <div className={page.heroCopy}>
                  {section.eyebrow && <p className={page.eyebrow}>{section.eyebrow}</p>}
                  <h1>{section.heading}</h1>
                  <p className={page.lede}>{section.body}</p>
                </div>
                {section.showForm && (
                  <div id="signup" className={page.heroForm}>
                    {renderForm(section)}
                  </div>
                )}
              </section>
            );
          if (section.type === "logos")
            return (
              <section className={sectionClass} key={section.id}>
                {section.heading && <p className={page.sectionKicker}>{section.heading}</p>}
                <div className={page.logoRow}>
                  {section.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
            );
          if (section.type === "features" || section.type === "steps")
            return (
              <section className={sectionClass} key={section.id}>
                <Heading>{section.heading}</Heading>
                <div className={section.type === "steps" ? page.stepGrid : page.featureGrid}>
                  {section.items.map((item, index) => (
                    <article key={`${item.title}-${item.body}`}>
                      {section.type === "steps" && (
                        <span className={page.stepNumber}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          if (section.type === "stats")
            return (
              <section className={sectionClass} key={section.id}>
                <div className={page.statGrid}>
                  {section.items.map((item) => (
                    <div key={`${item.value}-${item.label}`}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          if (section.type === "testimonials")
            return (
              <section className={sectionClass} key={section.id}>
                <Heading>{section.heading}</Heading>
                <div className={page.quoteGrid}>
                  {section.items.map((item) => (
                    <figure key={`${item.name}-${item.quote}`}>
                      <blockquote>“{item.quote}”</blockquote>
                      <figcaption>
                        <strong>{item.name}</strong>
                        {item.role && <span>{item.role}</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          if (section.type === "faq")
            return (
              <section className={sectionClass} key={section.id}>
                <Heading>{section.heading}</Heading>
                <div className={page.faqList}>
                  {section.items.map((item) => (
                    <details key={item.question}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          if (section.type === "media")
            return (
              <section className={sectionClass} key={section.id}>
                <div>
                  <Heading>{section.heading}</Heading>
                  {section.body && <p>{section.body}</p>}
                </div>
                <div className={page.mediaFrame}>
                  {section.imageUrl ? (
                    <img src={section.imageUrl} alt={section.imageAlt} />
                  ) : (
                    <span>Product image</span>
                  )}
                </div>
              </section>
            );
          if (section.type === "form")
            return (
              <section className={sectionClass} id="signup" key={section.id}>
                <div>
                  {section.heading && <Heading>{section.heading}</Heading>}
                  {section.body && <p>{section.body}</p>}
                </div>
                {renderForm(section)}
              </section>
            );
          if (section.type === "signupCount")
            return (
              <section className={sectionClass} key={section.id}>
                <p>
                  {section.prefix} <strong>{Number(signupCount).toLocaleString()}</strong>{" "}
                  {section.suffix}
                </p>
              </section>
            );
          if (section.type === "referralRewards")
            return (
              <section className={sectionClass} key={section.id}>
                <Heading>{section.heading}</Heading>
                <ol>
                  {section.items.map((item) => (
                    <li key={item.referrals}>
                      <strong>{item.referrals}</strong>
                      <span>{item.referrals === 1 ? "referral" : "referrals"}</span>
                      <p>{item.reward}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          if (section.type === "cta")
            return (
              <section className={sectionClass} key={section.id}>
                <div>
                  <Heading>{section.heading}</Heading>
                  {section.body && <p>{section.body}</p>}
                </div>
                <a className={page.ctaButton} href="#signup">
                  {section.buttonText}
                </a>
              </section>
            );
          if (section.type === "footer")
            return (
              <footer className={sectionClass} key={section.id}>
                <p>{section.note}</p>
                <div>
                  {section.links.map((link) => (
                    <a href={link.href} key={`${link.label}-${link.href}`}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </footer>
            );
          return null;
        })}
      </div>
    </div>
  );
}

export function WaitlistSignupPreview({ form }) {
  return (
    <div
      className={`${signup.form} ${form.layout === "stacked" ? signup.stacked : ""}`}
      aria-label="Signup form preview"
    >
      <span className={signup.label}>{form.label}</span>
      <div className={signup.row}>
        <span className={signup.previewEmail}>{form.placeholder}</span>
        <span className={signup.previewButton}>{form.buttonText}</span>
      </div>
      {form.requireConsent && (
        <div className={signup.consent}>
          <span className={signup.previewCheckbox} />
          <span>{form.consentLabel}</span>
        </div>
      )}
    </div>
  );
}

export function StatusPagePreview({ snapshot, pending = false }) {
  const status = snapshot.statusPage;
  return (
    <div
      className={page.statusPreview}
      style={{
        "--wl-page": snapshot.brand.pageBackground,
        "--wl-surface": snapshot.brand.surfaceColor,
        "--wl-text": snapshot.brand.textColor,
        "--wl-muted": snapshot.brand.mutedColor,
        "--wl-button": snapshot.brand.buttonColor,
        "--wl-button-text": snapshot.brand.buttonTextColor,
        "--wl-radius": radius[snapshot.brand.radius],
        "--wl-heading-font": font[snapshot.brand.headingFont],
        "--wl-body-font": font[snapshot.brand.bodyFont],
      }}
    >
      <p className={page.statusMark}>✓</p>
      <h1>{pending ? status.pendingHeading : status.heading}</h1>
      <p>{pending ? status.pendingBody : status.body}</p>
      {status.showPosition && (
        <div className={page.positionPreview}>
          <span>Your position</span>
          <strong>#128</strong>
        </div>
      )}
      {status.showReferralLink && (
        <div className={page.linkPreview}>waitlyze.falakgala.dev/w/your-launch?r=friend</div>
      )}
    </div>
  );
}
