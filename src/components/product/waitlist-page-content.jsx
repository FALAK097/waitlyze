import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";

import { CopyButton } from "@/components/product/copy-button";
import { ShareButtons } from "@/components/product/share-buttons";
import { fontFamilyValue, googleFontsStylesheet } from "@/lib/google-fonts.mjs";
import { normalizeRewardsConfig, readRewardTiers } from "@/lib/referrals/rewards-config.mjs";
import { SITE_URL } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";

const radius = { sharp: "0px", soft: "10px", round: "18px", pill: "999px" };

// Defense in depth for stored image URLs: only render TLS, site-relative, or
// inline data URLs. Anything else falls back to the text/placeholder treatment.
function safeImageUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https:\/\/|data:image\/|\/)/i.test(trimmed)) return trimmed;
  return "";
}

function safeHref(value) {
  if (typeof value !== "string") return "#";
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (/^\s*(javascript|data|vbscript|file|blob):/i.test(trimmed)) return "#";
  return trimmed;
}

const H1_CENTERED = {
  small: "text-3xl sm:text-4xl md:text-5xl",
  medium: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
  large: "text-5xl sm:text-6xl md:text-7xl",
};
const H1_SPLIT = {
  small: "text-3xl sm:text-4xl",
  medium: "text-4xl sm:text-5xl lg:text-6xl",
  large: "text-5xl sm:text-6xl",
};
const H2 = {
  small: "text-2xl md:text-3xl",
  medium: "text-4xl md:text-5xl lg:text-6xl",
  large: "text-5xl md:text-6xl",
};
const BODY_TEXT = { small: "text-sm", medium: "", large: "text-lg" };
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
  hideCounts = false,
  interactive = false,
  selectedBlockId = null,
  onBlockSelect,
  renderBlockToolbar,
}) {
  const visible = snapshot.sections.filter((section) => section.visible);
  const firstForm = visible.find(
    (section) => section.type === "form" || (section.type === "hero" && section.showForm),
  );
  const mobile = previewViewport === "mobile";
  const headingPx =
    typeof snapshot.brand.headingSize === "number" ? snapshot.brand.headingSize : null;
  const h1Centered =
    headingPx == null
      ? (H1_CENTERED[snapshot.brand.headingSize] ?? H1_CENTERED.medium)
      : "wl-type-h1";
  const h1Split =
    headingPx == null ? (H1_SPLIT[snapshot.brand.headingSize] ?? H1_SPLIT.medium) : "wl-type-h1";
  const h2 = headingPx == null ? (H2[snapshot.brand.headingSize] ?? H2.medium) : "wl-type-h2";
  const h1Px = headingPx == null ? undefined : `${headingPx}px`;
  const h2Px = headingPx == null ? undefined : `${Math.max(12, Math.round(headingPx * 0.66))}px`;
  const bodyPx = typeof snapshot.brand.bodySize === "number" ? snapshot.brand.bodySize : null;
  const bodyText = bodyPx == null ? (BODY_TEXT[snapshot.brand.bodySize] ?? "") : "wl-type-body";
  const bodyPxValue = bodyPx == null ? undefined : `${bodyPx}px`;
  const hasVisibleNavigation = visible.some((section) => section.type === "navigation");
  const brandLogo = safeImageUrl(snapshot.brand.logo) || null;
  const fontStylesheet = googleFontsStylesheet([
    snapshot.brand.headingFont,
    snapshot.brand.bodyFont,
  ]);
  const renderForm = (section) =>
    renderSignupForm?.(section, snapshot) ?? <WaitlistSignupPreview form={snapshot.form} />;
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-clip bg-wl-page px-6 font-wl-body text-wl-text",
        bodyText,
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
        "--wl-heading-font": fontFamilyValue(snapshot.brand.headingFont),
        "--wl-body-font": fontFamilyValue(snapshot.brand.bodyFont),
        "--wl-body": bodyPxValue,
      }}
    >
      {fontStylesheet ? (
        <link href={fontStylesheet} rel="stylesheet" precedence="waitlyze-fonts" />
      ) : null}
      <div className="mx-auto w-full max-w-7xl">
        {visible.map((section) => {
          const block = (() => {
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
                    {brandLogo ? (
                      <Image
                        alt={section.brand || name}
                        className="block h-8 w-auto max-w-44 object-contain"
                        height={64}
                        src={brandLogo}
                        unoptimized
                        width={256}
                      />
                    ) : (
                      section.brand || name
                    )}
                  </a>
                  <div className="flex max-w-full flex-wrap items-center justify-end gap-x-5 gap-y-3 max-sm:w-full max-sm:justify-start">
                    {section.links.map((link) => (
                      <a
                        className="text-sm text-wl-muted no-underline"
                        href={safeHref(link.href)}
                        key={`${link.label}-${link.href}`}
                      >
                        {link.label}
                      </a>
                    ))}
                    {section.buttonText && (
                      <a
                        className="inline-flex min-h-11 items-center justify-center rounded-wl bg-wl-button px-4 py-2.5 font-bold text-wl-button-text no-underline"
                        href="#signup"
                      >
                        {section.buttonText}
                      </a>
                    )}
                  </div>
                </nav>
              );
            if (section.type === "hero") {
              if (section.variant === "split") {
                const copy = (
                  <div>
                    {section.eyebrow && (
                      <p className="mb-6 text-xs font-bold tracking-widest text-wl-muted uppercase">
                        {section.eyebrow}
                      </p>
                    )}
                    <h1
                      className={cn("m-0 leading-none font-bold break-words", h1Split)}
                      style={{ "--wl-h1": h1Px }}
                    >
                      {section.heading}
                    </h1>
                    <p className="mt-7 max-w-3xl text-lg text-wl-muted">{section.body}</p>
                  </div>
                );
                if (!section.showForm)
                  return (
                    <section
                      className={cn(sectionClass, "max-w-4xl py-20 max-sm:py-16")}
                      id="top"
                      key={section.id}
                    >
                      {copy}
                    </section>
                  );
                return (
                  <section
                    className={cn(
                      sectionClass,
                      mobile
                        ? "grid grid-cols-1 items-center gap-12 py-20"
                        : "grid items-center gap-12 py-20 md:grid-cols-2 md:gap-16",
                    )}
                    id="top"
                    key={section.id}
                  >
                    {copy}
                    <div
                      className="w-full"
                      id={section.id === firstForm?.id ? "signup" : undefined}
                    >
                      {renderForm(section)}
                    </div>
                  </section>
                );
              }
              return (
                <section
                  className={cn(
                    sectionClass,
                    mobile
                      ? "grid min-h-0 items-center justify-items-center px-4 py-16 text-center"
                      : "grid min-h-190 items-center justify-items-center py-20 text-center max-sm:min-h-0 max-sm:py-16",
                  )}
                  id="top"
                  key={section.id}
                >
                  <div className="max-w-4xl">
                    {!hasVisibleNavigation && brandLogo && (
                      <Image
                        alt={name}
                        className="mx-auto mb-8 block h-14 w-auto max-w-64 object-contain"
                        height={96}
                        src={brandLogo}
                        unoptimized
                        width={384}
                      />
                    )}
                    {section.eyebrow && (
                      <p className="mb-6 text-xs font-bold tracking-widest text-wl-muted uppercase">
                        {section.eyebrow}
                      </p>
                    )}
                    <h1
                      className={cn("m-0 leading-none font-bold break-words", h1Centered)}
                      style={{ "--wl-h1": h1Px }}
                    >
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
            }
            if (section.type === "logos")
              return (
                <section className={cn(sectionClass, "py-11 text-center")} key={section.id}>
                  {section.heading && (
                    <p className="mb-6 text-xs font-bold tracking-widest text-wl-muted uppercase">
                      {section.heading}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-x-11 gap-y-4 font-wl-heading font-bold text-wl-muted">
                    {section.items.map((raw, index) => {
                      const item = typeof raw === "string" ? { label: raw, imageUrl: "" } : raw;
                      const logoSrc = safeImageUrl(item.imageUrl);
                      const key = logoSrc || item.label || `logo-${index}`;
                      return logoSrc ? (
                        <span key={key} className="inline-flex h-8 items-center">
                          <Image
                            alt={item.label || "Partner logo"}
                            className="h-8 w-auto max-w-44 object-contain"
                            height={64}
                            src={logoSrc}
                            unoptimized
                            width={256}
                          />
                        </span>
                      ) : (
                        <span key={key}>{item.label}</span>
                      );
                    })}
                  </div>
                </section>
              );
            if (section.type === "features" || section.type === "steps") {
              if (section.variant === "timeline")
                return (
                  <section className={cn(sectionClass, "py-20")} key={section.id}>
                    <Heading
                      className={cn("mb-12 max-w-ch16 leading-none", h2)}
                      style={{ "--wl-h2": h2Px }}
                    >
                      {section.heading}
                    </Heading>
                    <div className="relative grid gap-10">
                      <div
                        aria-hidden="true"
                        className="absolute top-2 bottom-2 left-1 w-px bg-wl-text/20"
                      />
                      {section.items.map((item) => (
                        <article className="relative pl-10" key={`${item.title}-${item.body}`}>
                          <span
                            aria-hidden="true"
                            className="absolute top-1.5 left-0 size-2.5 rounded-full bg-wl-accent"
                          />
                          <h3 className="m-0 text-xl">{item.title}</h3>
                          <p className="mt-2 mb-0 text-wl-muted">{item.body}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              if (section.variant === "list")
                return (
                  <section className={cn(sectionClass, "py-20")} key={section.id}>
                    <Heading
                      className={cn("mb-12 max-w-ch16 leading-none", h2)}
                      style={{ "--wl-h2": h2Px }}
                    >
                      {section.heading}
                    </Heading>
                    <div className="grid gap-px bg-wl-text/15">
                      {section.items.map((item, index) => (
                        <article
                          className={cn(
                            "flex flex-col gap-2 bg-wl-page py-7",
                            !mobile && "md:flex-row md:items-baseline md:gap-10",
                          )}
                          key={`${item.title}-${item.body}`}
                        >
                          <span className="shrink-0 font-wl-heading text-sm font-bold text-wl-muted tabular-nums md:w-16">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 className="m-0 shrink-0 text-xl md:w-72">{item.title}</h3>
                          <p className="m-0 text-wl-muted">{item.body}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              return (
                <section className={cn(sectionClass, "py-20")} key={section.id}>
                  <Heading
                    className={cn("mb-12 max-w-ch16 leading-none", h2)}
                    style={{ "--wl-h2": h2Px }}
                  >
                    {section.heading}
                  </Heading>
                  <div
                    className={
                      mobile ? "grid grid-cols-1 gap-6" : "grid gap-6 md:grid-cols-3 md:gap-12"
                    }
                  >
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
            }
            if (section.type === "stats")
              return (
                <section className={cn(sectionClass, "py-16")} key={section.id}>
                  <div className={cn("grid gap-px bg-wl-text/15", !mobile && "md:grid-cols-3")}>
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
            if (section.type === "testimonials") {
              if (section.variant === "editorial")
                return (
                  <section className={cn(sectionClass, "py-20 text-center")} key={section.id}>
                    <div className="mx-auto grid max-w-3xl gap-14">
                      {section.items.map((item) => (
                        <figure className="m-0" key={`${item.name}-${item.quote}`}>
                          <blockquote className="mb-6 font-wl-heading text-2xl leading-snug font-bold text-balance md:text-4xl">
                            “{item.quote}”
                          </blockquote>
                          <figcaption className="text-sm text-wl-muted">
                            <strong className="text-wl-text">{item.name}</strong>
                            {item.role && <span> — {item.role}</span>}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                );
              return (
                <section className={cn(sectionClass, "py-20")} key={section.id}>
                  <Heading
                    className={cn("mb-12 max-w-ch16 leading-none", h2)}
                    style={{ "--wl-h2": h2Px }}
                  >
                    {section.heading}
                  </Heading>
                  <div
                    className={
                      mobile ? "grid grid-cols-1 gap-6" : "grid gap-6 md:grid-cols-3 md:gap-12"
                    }
                  >
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
            }
            if (section.type === "faq")
              return (
                <section className={cn(sectionClass, "py-20")} key={section.id}>
                  <Heading
                    className={cn("mb-12 max-w-ch16 leading-none", h2)}
                    style={{ "--wl-h2": h2Px }}
                  >
                    {section.heading}
                  </Heading>
                  <div className="ml-auto max-w-4xl">
                    {section.items.map((item) => (
                      <details
                        className="group border-t border-wl-text/20 last:border-b"
                        key={item.question}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-wl-heading text-xl font-bold [&::-webkit-details-marker]:hidden">
                          <span>{item.question}</span>
                          <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-wl-text/20 transition-transform group-open:rotate-180"
                          >
                            <HugeiconsIcon icon={ArrowDown01Icon} size={17} />
                          </span>
                        </summary>
                        <p className="mt-1 mb-6 max-w-ch65 text-base leading-relaxed text-wl-muted">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            if (section.type === "media") {
              const imageSrc = safeImageUrl(section.imageUrl);
              const visual = (frameClass, sizes) => (
                <div
                  className={cn(
                    "relative grid place-items-center overflow-hidden bg-wl-surface text-wl-muted",
                    frameClass,
                  )}
                >
                  {imageSrc ? (
                    <Image
                      className="object-cover"
                      src={imageSrc}
                      alt={section.imageAlt}
                      fill
                      sizes={sizes}
                      unoptimized
                    />
                  ) : (
                    <span>Product image</span>
                  )}
                </div>
              );
              if (section.variant === "phone")
                return (
                  <section
                    className={cn(sectionClass, "flex flex-col items-center gap-10 py-20")}
                    key={section.id}
                  >
                    <div className="max-w-2xl text-center">
                      <Heading className={cn("mb-6 leading-none", h2)} style={{ "--wl-h2": h2Px }}>
                        {section.heading}
                      </Heading>
                      {section.body && <p className="text-wl-muted">{section.body}</p>}
                    </div>
                    <div className="w-full max-w-70 overflow-hidden rounded-3xl border border-wl-text/15">
                      <div className="relative">
                        {visual("aspect-9/16", "(max-width: 768px) 80vw, 320px")}
                        <div
                          aria-hidden="true"
                          className="absolute top-3 left-1/2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-wl-text/25"
                        />
                      </div>
                    </div>
                  </section>
                );
              if (section.variant === "wide")
                return (
                  <section
                    className={cn(sectionClass, "flex flex-col items-center gap-10 py-20")}
                    key={section.id}
                  >
                    <div className="max-w-2xl text-center">
                      <Heading className={cn("mb-6 leading-none", h2)} style={{ "--wl-h2": h2Px }}>
                        {section.heading}
                      </Heading>
                      {section.body && <p className="text-wl-muted">{section.body}</p>}
                    </div>
                    {visual("aspect-video w-full rounded-wl", "100vw")}
                  </section>
                );
              return (
                <section
                  className={cn(
                    sectionClass,
                    mobile
                      ? "flex flex-col items-center gap-10 py-20"
                      : "flex flex-col items-center gap-10 py-20 md:flex-row md:gap-16",
                  )}
                  key={section.id}
                >
                  <div className="md:grow-7 md:basis-0">
                    <Heading className={cn("mb-6 leading-none", h2)} style={{ "--wl-h2": h2Px }}>
                      {section.heading}
                    </Heading>
                    {section.body && <p className="text-wl-muted">{section.body}</p>}
                  </div>
                  <div className="w-full md:grow-13 md:basis-0">
                    <div className="flex items-center gap-1.5 rounded-t-wl border border-b-0 border-wl-text/15 bg-wl-surface px-4 py-3">
                      <span className="size-2.5 rounded-full bg-wl-text/20" />
                      <span className="size-2.5 rounded-full bg-wl-text/20" />
                      <span className="size-2.5 rounded-full bg-wl-text/20" />
                    </div>
                    {visual(
                      "aspect-16/10 rounded-b-wl border border-wl-text/15",
                      "(max-width: 768px) 100vw, 60vw",
                    )}
                  </div>
                </section>
              );
            }
            if (section.type === "form") {
              if (section.variant === "card")
                return (
                  <section
                    className={cn(sectionClass, "py-20")}
                    id={section.id === firstForm?.id ? "signup" : undefined}
                    key={section.id}
                  >
                    <div className="rounded-wl bg-wl-surface p-6 sm:p-8 md:p-14">
                      <div className="mx-auto max-w-2xl text-center">
                        {section.heading && (
                          <Heading
                            className={cn("mb-5 leading-none text-balance", h2)}
                            style={{ "--wl-h2": h2Px }}
                          >
                            {section.heading}
                          </Heading>
                        )}
                        {section.body && <p className="text-wl-muted">{section.body}</p>}
                        <div className="mt-9 text-left">{renderForm(section)}</div>
                      </div>
                    </div>
                  </section>
                );
              return (
                <section
                  className={cn(
                    sectionClass,
                    mobile
                      ? "flex flex-col items-start gap-9 py-20"
                      : "flex flex-col items-start gap-9 py-20 md:flex-row md:gap-16",
                  )}
                  id={section.id === firstForm?.id ? "signup" : undefined}
                  key={section.id}
                >
                  <div className="md:grow-8 md:basis-0">
                    {section.heading && (
                      <Heading className={cn("mb-5 leading-none", h2)} style={{ "--wl-h2": h2Px }}>
                        {section.heading}
                      </Heading>
                    )}
                    {section.body && <p className="text-wl-muted">{section.body}</p>}
                  </div>
                  <div className="w-full md:grow-12 md:basis-0">{renderForm(section)}</div>
                </section>
              );
            }
            if (section.type === "signupCount") {
              // Stealth mode (private/B2B launches) hides the headcount entirely
              // instead of rendering a zero that invites questions.
              if (hideCounts) return null;
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
            }
            if (section.type === "referralRewards")
              return (
                <section className={cn(sectionClass, "py-20")} key={section.id}>
                  <Heading
                    className={cn("mb-12 max-w-ch16 leading-none", h2)}
                    style={{ "--wl-h2": h2Px }}
                  >
                    {section.heading}
                  </Heading>
                  <ol
                    className={cn(
                      "m-0 grid list-none gap-px bg-wl-text/15 p-0",
                      !mobile && "md:grid-cols-3",
                    )}
                  >
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
                    mobile
                      ? "flex flex-col items-start justify-between gap-10 border-t border-wl-text/15 py-20"
                      : "flex flex-col items-start justify-between gap-10 border-t border-wl-text/15 py-20 md:flex-row md:gap-10",
                  )}
                  key={section.id}
                >
                  <div>
                    <Heading className={cn("mb-4 leading-none", h2)} style={{ "--wl-h2": h2Px }}>
                      {section.heading}
                    </Heading>
                    {section.body && <p className="text-wl-muted">{section.body}</p>}
                  </div>
                  <a
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-wl bg-wl-button px-4 py-2.5 font-bold text-wl-button-text no-underline"
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
                    mobile
                      ? "flex min-h-28 flex-col items-start justify-center gap-6 border-t border-wl-text/15 text-sm"
                      : "flex min-h-28 flex-col items-start justify-center gap-6 border-t border-wl-text/15 text-sm md:flex-row md:items-center",
                  )}
                  key={section.id}
                >
                  <p className="m-0">{section.note}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {section.links.map((link) => (
                      <a
                        className="text-wl-text"
                        href={safeHref(link.href)}
                        key={`${link.label}-${link.href}`}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </footer>
              );
            return null;
          })();
          if (!interactive) return block;
          if (!block) return null;
          const isSelected = selectedBlockId === section.id;
          return (
            // Click selection is for the studio preview; keyboard users select blocks from the block list.
            // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
              className={cn(
                "group relative cursor-pointer outline-2 -outline-offset-2 outline-transparent transition-colors hover:outline-product-accent-solid",
                isSelected && "outline-product-accent-solid",
              )}
              data-block-id={section.id}
              data-selected={isSelected}
              key={section.id}
              onClick={(event) => {
                if (event.target.closest?.("a")) event.preventDefault();
                event.stopPropagation();
                onBlockSelect?.(section.id);
              }}
            >
              {block}
              {renderBlockToolbar?.(section)}
            </div>
          );
        })}
      </div>
      {snapshot.brand.showPoweredBy !== false && (
        <a
          className="absolute right-5 bottom-5 z-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm no-underline shadow-md"
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            aria-hidden="true"
            className="size-5 text-waitlyze-mark"
            fill="none"
            viewBox="0 0 64 64"
          >
            <g fill="currentColor" transform="skewX(-10) translate(6 0)">
              <rect x="17" y="30" width="8" height="20" rx="3" />
              <rect x="29" y="14" width="8" height="36" rx="3" />
              <rect x="41" y="23" width="8" height="27" rx="3" />
            </g>
          </svg>
          <span className="text-waitlyze-muted">Powered by</span>
          <strong className="text-waitlyze-ink">Waitlyze</strong>
        </a>
      )}
    </div>
  );
}

export function WaitlistSignupPreview({ form, brand }) {
  const fontStylesheet = brand ? googleFontsStylesheet([brand.headingFont, brand.bodyFont]) : null;
  return (
    <div
      className={cn("w-full text-wl-text", brand && "rounded-wl bg-wl-page p-8 font-wl-body")}
      aria-label="Signup form preview"
      style={
        brand
          ? {
              "--wl-page": brand.pageBackground,
              "--wl-text": brand.textColor,
              "--wl-muted": brand.mutedColor,
              "--wl-button": brand.buttonColor,
              "--wl-button-text": brand.buttonTextColor,
              "--wl-input": brand.inputBackground,
              "--wl-input-border": brand.inputBorder,
              "--wl-radius": radius[brand.radius],
              "--wl-heading-font": fontFamilyValue(brand.headingFont),
              "--wl-body-font": fontFamilyValue(brand.bodyFont),
            }
          : undefined
      }
    >
      {fontStylesheet ? (
        <link href={fontStylesheet} rel="stylesheet" precedence="waitlyze-fonts" />
      ) : null}
      <span className="mb-2 block text-caption font-bold">{form.label}</span>
      <div
        className={cn("flex gap-2 max-sm:flex-col", form.layout === "stacked" && "flex-col gap-3")}
      >
        <span
          className={cn(
            "flex h-12 min-h-12 flex-1 items-center rounded-wl border border-wl-input-border bg-wl-input px-4 text-wl-muted",
          )}
        >
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

export function StatusBadge({ pending, iconStyle = "filled", className }) {
  return (
    <p
      className={cn(
        "m-0 grid size-12 shrink-0 place-items-center rounded-full",
        iconStyle === "soft"
          ? "bg-wl-button/10 text-wl-button"
          : "bg-wl-button text-wl-button-text",
        className,
      )}
    >
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
  );
}

export function StatusPagePreview({ snapshot, state = "confirmed", showReferrals = true }) {
  const status = snapshot.statusPage;
  const pending = state === "pending";
  const returning = state === "returning";
  const card = status.layout === "card";
  // Rewards config may predate the snapshot (old drafts): normalize to
  // zero-config defaults so the preview never crashes on missing keys.
  const rewards = normalizeRewardsConfig(snapshot.rewards);
  const tiers = readRewardTiers(snapshot);
  const nextTier = tiers.find((tier) => tier.referrals > 1) ?? tiers[0] ?? null;
  const demoPosition = 128 + rewards.positionOffset;
  const demoLink = `${SITE_URL}/w/your-launch?r=friend`;
  const headingPx =
    typeof snapshot.brand.headingSize === "number" ? snapshot.brand.headingSize : null;
  const h1Centered =
    headingPx == null
      ? (H1_CENTERED[snapshot.brand.headingSize] ?? H1_CENTERED.medium)
      : "wl-type-h1";
  const h1Px = headingPx == null ? undefined : `${headingPx}px`;
  const bodyPx = typeof snapshot.brand.bodySize === "number" ? snapshot.brand.bodySize : null;
  const bodyText = bodyPx == null ? (BODY_TEXT[snapshot.brand.bodySize] ?? "") : "wl-type-body";
  const bodyPxValue = bodyPx == null ? undefined : `${bodyPx}px`;
  const fontStylesheet = googleFontsStylesheet([
    snapshot.brand.headingFont,
    snapshot.brand.bodyFont,
  ]);
  return (
    <div
      className={cn(
        "grid min-h-full items-center justify-items-center bg-wl-page px-6 py-20 text-center font-wl-body text-wl-text",
        bodyText,
      )}
      style={{
        "--wl-page": snapshot.brand.pageBackground,
        "--wl-surface": snapshot.brand.surfaceColor,
        "--wl-text": snapshot.brand.textColor,
        "--wl-muted": snapshot.brand.mutedColor,
        "--wl-button": snapshot.brand.buttonColor,
        "--wl-button-text": snapshot.brand.buttonTextColor,
        "--wl-radius": radius[snapshot.brand.radius],
        "--wl-heading-font": fontFamilyValue(snapshot.brand.headingFont),
        "--wl-body-font": fontFamilyValue(snapshot.brand.bodyFont),
        "--wl-body": bodyPxValue,
      }}
    >
      {fontStylesheet ? (
        <link href={fontStylesheet} rel="stylesheet" precedence="waitlyze-fonts" />
      ) : null}
      <div
        className={cn(
          "grid w-full max-w-2xl items-center justify-items-center",
          card && "rounded-wl bg-wl-surface p-8 md:p-12",
        )}
      >
        <StatusBadge pending={pending} iconStyle={status.iconStyle} />
        <h1
          className={cn(
            "my-4 max-w-ch14 font-wl-heading leading-none tracking-tight text-balance",
            h1Centered,
          )}
          style={{ "--wl-h1": h1Px }}
        >
          {pending ? status.pendingHeading : status.heading}
        </h1>
        <p className="max-w-xl leading-relaxed text-wl-muted">
          {pending ? status.pendingBody : status.body}
        </p>
        {status.showPosition && !pending && !rewards.hideCounts && (
          <div className="mt-8 flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
            <span>Your position</span>
            <strong className="text-xl">#{demoPosition}</strong>
          </div>
        )}
        {!pending && !rewards.hideCounts && rewards.showPoints && (
          <div className="mt-4 flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
            <span>Your points</span>
            <strong className="text-xl">{rewards.pointsSignup + rewards.pointsReferral}</strong>
          </div>
        )}
        {!pending && !rewards.hideCounts && rewards.showProgress && nextTier ? (
          <p className="m-0 w-full max-w-md text-sm leading-relaxed text-wl-muted">
            {Math.max(nextTier.referrals - 1, 1)} more referral
            {nextTier.referrals - 1 === 1 ? "" : "s"} to unlock{" "}
            <strong className="text-wl-text">{nextTier.reward}</strong>
          </p>
        ) : null}
        {returning && showReferrals && status.showReferralCount && !rewards.hideCounts && (
          <div className="mt-4 flex w-full max-w-md justify-between border-y border-wl-text/15 py-4">
            <span>Friends joined</span>
            <strong className="text-xl">3</strong>
          </div>
        )}
        {showReferrals && status.showReferralLink && !pending && (
          <div className="mt-8 grid w-full max-w-md gap-2.5">
            <p className="m-0 text-sm text-wl-muted">{status.shareMessage}</p>
            <div
              className={cn(
                "flex items-center gap-2 overflow-hidden rounded-wl py-2 pr-2 pl-3",
                card ? "border border-wl-text/10 bg-wl-page" : "bg-wl-surface",
              )}
            >
              <span className="min-w-0 flex-1 text-left text-caption text-ellipsis whitespace-nowrap text-wl-muted">
                {demoLink.replace(/^https?:\/\//, "")}
              </span>
              <CopyButton text={demoLink} iconOnly />
            </div>
            {status.shareChannels.length > 0 && (
              <ShareButtons
                channels={status.shareChannels}
                message={`${status.shareMessage} ${demoLink}`}
                link={demoLink}
                subject={status.heading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
