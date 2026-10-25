import Link from "next/link";
import { notFound } from "next/navigation";

import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import { WaitlistPageContent } from "@/components/product/waitlist-page-content";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { TEMPLATE_IDS, getGalleryMeta, isTemplateId } from "@/lib/templates/gallery.mjs";

export function generateStaticParams() {
  return TEMPLATE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!isTemplateId(id)) return { title: "Template not found" };
  const meta = getGalleryMeta(id);
  const title = `${meta.seoTitle} | Waitlyze Templates`;
  return {
    title,
    description: meta.seoDescription,
    alternates: { canonical: `/templates/${id}` },
    openGraph: { title, description: meta.seoDescription },
    twitter: { card: "summary_large_image", title },
  };
}

const containerClasses = "mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12";
const eyebrowClasses =
  "flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase";

export default async function TemplateDetailPage({ params }) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();
  const template = listTemplates().find((entry) => entry.id === id);
  if (!template) notFound();
  const meta = getGalleryMeta(id);
  const visibleSections = template.snapshot.sections.filter((section) => section.visible);

  return (
    <PublicShell>
      <main id="main-content" className="scroll-mt-28">
        <section
          className={`${containerClasses} pt-14 pb-10 md:pt-18`}
          aria-labelledby="template-title"
        >
          <nav aria-label="Breadcrumb">
            <Link
              prefetch={false}
              href="/templates"
              className="text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              ← All templates
            </Link>
          </nav>
          <p className={`${eyebrowClasses} mt-8`}>
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-product-accent-solid" />{" "}
            {template.category} template
          </p>
          <h1
            id="template-title"
            className="mt-5 max-w-3xl font-product-display text-5xl leading-tight font-medium tracking-tighter text-balance lg:text-6xl"
          >
            {meta.seoTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-normal text-product-text-secondary">
            {template.description} {meta.useCase}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              prefetch={false}
              href={`/waitlists/new?template=${template.id}`}
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-product-text-primary px-6 py-3 text-body font-semibold text-product-bg-page focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              Use the {template.name} template
            </Link>
            <span className="text-micro text-product-text-secondary">
              Free to use. No credit card needed.
            </span>
          </div>
        </section>

        <section className={`${containerClasses} pb-10`} aria-label="Template preview">
          <div className="overflow-hidden rounded-xl border border-product-border-subtle shadow-canvas">
            <WaitlistPageContent snapshot={template.snapshot} name={template.name} />
          </div>
          <p className="mt-3 text-micro text-product-text-secondary">
            Live preview with the template&apos;s real sections, copy placeholders, and brand style.
            Your content replaces the placeholders when you build.
          </p>
        </section>

        <section
          className={`${containerClasses} grid gap-10 pb-14 md:grid-cols-2`}
          aria-label="Template details"
        >
          <div>
            <h2 className="font-product-display text-section leading-snug font-semibold tracking-tight">
              Best for
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {meta.bestFor.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-product-accent-solid"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-product-display text-section leading-snug font-semibold tracking-tight">
              What&apos;s inside
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {visibleSections.map((section) => (
                <li key={section.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold capitalize">{section.type}</span>
                  {"heading" in section && section.heading && (
                    <span className="truncate text-product-text-secondary">{section.heading}</span>
                  )}
                  {"note" in section && section.note && (
                    <span className="truncate text-product-text-secondary">{section.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className={`${containerClasses} flex items-center justify-between gap-8 py-14 pb-18 max-md:flex-col max-md:items-start`}
          aria-labelledby="template-cta-title"
        >
          <div>
            <p className={eyebrowClasses}>Ready when you are</p>
            <h2
              id="template-cta-title"
              className="mt-4 font-product-display text-4xl leading-tight font-semibold tracking-tighter text-balance max-sm:text-3xl lg:text-5xl"
            >
              Launch with the {template.name} template.
            </h2>
          </div>
          <div>
            <SignupButton>Start from this template</SignupButton>
            <Link
              prefetch={false}
              href={`/waitlists/new?template=${template.id}`}
              className="mt-3 block text-micro text-product-text-secondary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
            >
              Or open creation with this template preselected →
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
