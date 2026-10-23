import Image from "next/image";

import { cn } from "@/lib/utils";

const font = {
  hanken: "var(--wl-body)",
  manrope: "var(--wl-display)",
  bricolage: "var(--wl-bricolage)",
  figtree: "var(--wl-figtree)",
  archivo: "var(--wl-archivo)",
};
const radius = { sharp: "0px", soft: "10px", round: "18px", pill: "999px" };
function Heading({ level = 2, children, className, ...props }) {
  const Tag = `h${level}`;
  return (
    <Tag className={cn("font-wl-heading tracking-tight text-balance", className)} {...props}>
      {children}
    </Tag>
  );
}

export function WaitlistPageContent({
  snapshot,
  name,
  renderSignupForm,
  previewViewport,
  signupCount = 128,
}) {
  const visible = snapshot.sections.filter((section) => section.visible);
  const firstForm = visible.find(
    (section) => section.type === "form" || (section.type === "hero" && section.showForm),
  );
  const mobile = previewViewport === "mobile";
  const renderForm = (section) =>
    renderSignupForm?.(section, snapshot) ?? <WaitlistSignupPreview form={snapshot.form} />;
  return (
    <div
      className={cn(
        "min-h-screen overflow-x-clip bg-wl-page px-6 font-wl-body text-wl-text",
        mobile && "min-h-203 px-4",
      )}
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
      <div className="mx-auto w-full max-w-7xl">
        {visible.map((section) => {
          const sectionClass = "scroll-mt-6";
          if (section.type === "navigation")
            return (
              <nav
                className={cn(
                  sectionClass,
                  "flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4",
                )}
                key={section.id}
                aria-label="Waitlist navigation"
              >
                <a href="#top" className="font-wl-heading font-bold text-wl-text no-underline">
                  {section.brand || name}
                </a>
                <div className="flex max-w-full flex-wrap items-center justify-end gap-x-5 gap-y-3 max-sm:w-full max-sm:justify-start">
                  {section.links.map((link) => (
                    <a
                      className="text-sm text-wl-muted no-underline"
                      href={link.href}
                      key={`${link.label}-${link.href}`}
                    >
                      {link.label}
                    </a>
                  ))}
                  {section.buttonText && (
                    <a
                      className="rounded-wl bg-wl-button px-4 py-2.5 font-bold text-wl-button-text no-underline"
                      href="#signup"
                    >
                      {section.buttonText}
                    </a>
                  )}
                </div>
              </nav>
            );
          if (section.type === "hero")
            return (
              <section
                className={cn(
                  sectionClass,
                  "grid min-h-190 items-center justify-items-center py-20 text-center max-sm:min-h-0 max-sm:py-16",
                )}
                id="top"
                key={section.id}
              >
                <div className="max-w-4xl">
                  {section.eyebrow && (
                    <p className="mb-6 text-xs font-bold tracking-widest text-wl-muted uppercase">
                      {section.eyebrow}
                    </p>
                  )}
                  <h1 className="m-0 text-4xl leading-none font-bold break-words sm:text-5xl md:text-6xl lg:text-7xl">
                    {section.heading}
                  </h1>
                  <p className="mx-auto mt-7 max-w-3xl text-lg text-wl-muted">{section.body}</p>
                </div>
                {section.showForm && (
                  <div
                    className="mt-11 w-full max-w-2xl text-left"
                    id={section.id === firstForm?.id ? "signup" : undefined}
                  >
                    {renderForm(section)}
                  </div>
                )}
              </section>
            );
          if (section.type === "logos")
            return (
              <section className={cn(sectionClass, "py-11 text-center")} key={section.id}>
                {section.heading && (
                  <p className="mb-6 text-xs font-bold tracking-widest text-wl-muted uppercase">
                    {section.heading}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-x-11 gap-y-4 font-wl-heading font-bold text-wl-muted">
                  {section.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
            );
          if (section.type === "features" || section.type === "steps")
            return (
              <section className={cn(sectionClass, "py-20")} key={section.id}>
                <Heading className="mb-12 max-w-ch16 text-4xl leading-none md:text-5xl lg:text-6xl">
                  {section.heading}
                </Heading>
                <div className={cn("grid gap-6 md:grid-cols-3 md:gap-12", mobile && "grid-cols-1")}>
                  {section.items.map((item, index) => (
                    <article
                      className="border-t border-wl-text/20 pt-5"
                      key={`${item.title}-${item.body}`}
                    >
                      {section.type === "steps" && (
                        <span className="text-xs text-wl-muted tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                      <h3 className="my-4 text-xl">{item.title}</h3>
                      <p className="m-0 text-wl-muted">{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          if (section.type === "stats")
            return (
              <section className={cn(sectionClass, "py-16")} key={section.id}>
                <div className="grid gap-px bg-wl-text/15 md:grid-cols-3">
                  {section.items.map((item) => (
                    <div
                      className="grid gap-2 bg-wl-page p-9 text-center"
                      key={`${item.value}-${item.label}`}
                    >
                      <strong className="font-wl-heading text-4xl tracking-tight md:text-5xl">
                        {item.value}
                      </strong>
                      <span className="text-sm text-wl-muted">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          if (section.type === "testimonials")
            return (
              <section className={cn(sectionClass, "py-20")} key={section.id}>
                <Heading className="mb-12 max-w-ch16 text-4xl leading-none md:text-5xl lg:text-6xl">
                  {section.heading}
                </Heading>
                <div className={cn("grid gap-6 md:grid-cols-3 md:gap-12", mobile && "grid-cols-1")}>
                  {section.items.map((item) => (
                    <figure
                      className="m-0 rounded-wl bg-wl-surface p-7"
                      key={`${item.name}-${item.quote}`}
                    >
                      <blockquote className="mb-7 font-wl-heading text-lg leading-relaxed">
                        “{item.quote}”
                      </blockquote>
                      <figcaption className="grid gap-0.5 text-sm">
                        <strong>{item.name}</strong>
                        {item.role && <span className="text-wl-muted">{item.role}</span>}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          if (section.type === "faq")
            return (
              <section className={cn(sectionClass, "py-20")} key={section.id}>
                <Heading className="mb-12 max-w-ch16 text-4xl leading-none md:text-5xl lg:text-6xl">
                  {section.heading}
                </Heading>
                <div className="ml-auto max-w-4xl">
                  {section.items.map((item) => (
                    <details
                      className="border-t border-wl-text/20 last:border-b"
                      key={item.question}
                    >
                      <summary className="cursor-pointer py-5 pr-8 font-wl-heading text-lg font-bold">
                        {item.question}
                      </summary>
                      <p className="mt-2 mb-5 max-w-ch65 text-wl-muted">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          if (section.type === "media")
            return (
              <section
                className={cn(
                  sectionClass,
                  "flex flex-col items-center gap-10 py-20 md:flex-row md:gap-16",
                )}
                key={section.id}
              >
                <div className="md:grow-7 md:basis-0">
                  <Heading className="mb-6 text-4xl leading-none md:text-5xl">
                    {section.heading}
                  </Heading>
                  {section.body && <p className="text-wl-muted">{section.body}</p>}
                </div>
                <div className="relative grid aspect-16/10 w-full place-items-center overflow-hidden rounded-wl bg-wl-surface text-wl-muted md:grow-13 md:basis-0">
                  {section.imageUrl ? (
                    <Image
                      className="object-cover"
                      src={section.imageUrl}
                      alt={section.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      unoptimized
                    />
                  ) : (
                    <span>Product image</span>
                  )}
                </div>
              </section>
            );
          if (section.type === "form")
            return (
              <section
                className={cn(
                  sectionClass,
                  "flex flex-col items-start gap-9 py-20 md:flex-row md:gap-16",
                )}
                id={section.id === firstForm?.id ? "signup" : undefined}
                key={section.id}
              >
                <div className="md:grow-8 md:basis-0">
                  {section.heading && (
                    <Heading className="mb-5 text-4xl leading-none md:text-5xl">
                      {section.heading}
                    </Heading>
                  )}
                  {section.body && <p className="text-wl-muted">{section.body}</p>}
                </div>
                <div className="w-full md:grow-12 md:basis-0">{renderForm(section)}</div>
              </section>
            );
          if (section.type === "signupCount")
            return (
              <section className={cn(sectionClass, "py-12 text-center")} key={section.id}>
                <p className="m-0 text-2xl md:text-3xl">
                  {section.prefix}{" "}
                  <strong className="font-wl-heading text-wl-text">
                    {Number(signupCount).toLocaleString()}
                  </strong>{" "}
                  {section.suffix}
                </p>
              </section>
            );
          if (section.type === "referralRewards")
            return (
              <section className={cn(sectionClass, "py-20")} key={section.id}>
                <Heading className="mb-12 max-w-ch16 text-4xl leading-none md:text-5xl lg:text-6xl">
                  {section.heading}
                </Heading>
                <ol className="m-0 grid list-none gap-px bg-wl-text/15 p-0 md:grid-cols-3">
                  {section.items.map((item) => (
                    <li className="bg-wl-page p-7" key={item.referrals}>
                      <strong className="block font-wl-heading text-3xl">{item.referrals}</strong>
                      <span className="text-xs text-wl-muted uppercase">
                        {item.referrals === 1 ? "referral" : "referrals"}
                      </span>
                      <p className="m-0 text-wl-muted">{item.reward}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          if (section.type === "cta")
            return (
              <section
                className={cn(
                  sectionClass,
                  "flex flex-col items-start justify-between gap-10 border-t border-wl-text/15 py-20 md:flex-row md:gap-10",
                )}
                key={section.id}
              >
                <div>
                  <Heading className="mb-4 text-4xl leading-none md:text-5xl">
                    {section.heading}
                  </Heading>
                  {section.body && <p className="text-wl-muted">{section.body}</p>}
                </div>
                <a
                  className="shrink-0 rounded-wl bg-wl-button px-4 py-2.5 font-bold text-wl-button-text no-underline"
                  href="#signup"
                >
                  {section.buttonText}
                </a>
              </section>
            );
          if (section.type === "footer")
            return (
              <footer
                className={cn(
                  sectionClass,
                  "flex min-h-28 flex-col items-start justify-center gap-6 border-t border-wl-text/15 text-sm md:flex-row md:items-center",
                )}
                key={section.id}
              >
                <p className="m-0">{section.note}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {section.links.map((link) => (
                    <a className="text-wl-text" href={link.href} key={`${link.label}-${link.href}`}>
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
      className={cn("w-full text-wl-text", form.layout === "stacked" && "flex-col gap-2")}
      aria-label="Signup form preview"
    >
      <span className="mb-2 block text-caption font-bold">{form.label}</span>
      <div className="flex gap-2 max-sm:flex-col">
        <span className="flex h-12 flex-1 items-center rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-muted">
          {form.placeholder}
        </span>
        <span className="inline-flex h-12 items-center justify-center rounded-wl bg-wl-button px-5 font-bold text-wl-button-text">
          {form.buttonText}
        </span>
      </div>
      {form.requireConsent && (
        <div className="mt-3 flex items-start gap-2.5 text-caption leading-relaxed font-normal text-wl-muted">
          <span className="mt-px size-4 shrink-0 rounded border border-wl-input-border bg-wl-input" />
          <span>{form.consentLabel}</span>
        </div>
      )}
    </div>
  );
}

export function StatusPagePreview({ snapshot, state = "confirmed" }) {
  const status = snapshot.statusPage;
  const pending = state === "pending";
  const returning = state === "returning";
  return (
    <div
      className="grid min-h-full items-center justify-items-center bg-wl-page px-6 py-20 text-center font-wl-body text-wl-text"
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
      <p className="m-0 grid size-12 place-items-center rounded-full bg-wl-button text-wl-button-text">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          {pending ? <path d="M3 6h18v12H3zM3 7l9 6 9-6" /> : <path d="m5 12 4 4L19 6" />}
        </svg>
      </p>
      <h1 className="my-4 max-w-ch14 font-wl-heading text-4xl leading-none tracking-tight text-balance md:text-5xl">
        {pending ? status.pendingHeading : status.heading}
      </h1>
      <p className="max-w-xl leading-relaxed text-wl-muted">
        {pending ? status.pendingBody : status.body}
      </p>
      {status.showPosition && !pending && (
        <div className="mt-8 flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
          <span>Your position</span>
          <strong className="text-xl">#128</strong>
        </div>
      )}
      {returning && status.showReferralCount && (
        <div className="mt-4 flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
          <span>Friends joined</span>
          <strong className="text-xl">3</strong>
        </div>
      )}
      {status.showReferralLink && !pending && (
        <div className="mt-3 w-full max-w-md overflow-hidden rounded-wl bg-wl-surface px-3 py-3 text-caption text-ellipsis whitespace-nowrap text-wl-muted">
          waitlyze.falakgala.dev/w/your-launch?r=friend
        </div>
      )}
    </div>
  );
}
