import Link from "next/link";

import PublicShell from "@/components/landing/public-shell";
import SignupButton from "@/components/landing/signup-button";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";

export const metadata = {
  title: "Waitlist Templates | Waitlyze",
  description:
    "Browse 14 free waitlist templates for SaaS betas, AI launches, newsletters, events, pre-orders, and more. Pick a template and launch your waitlist.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Waitlist Templates | Waitlyze",
    description:
      "Fourteen free waitlist templates for every kind of launch. Pick one and make it yours.",
  },
  twitter: { card: "summary_large_image", title: "Waitlist Templates | Waitlyze" },
};

const containerClasses = "mx-auto w-full max-w-7xl px-4 sm:px-5 md:px-8 lg:px-12";
const eyebrowClasses =
  "flex items-center gap-2 text-micro font-semibold tracking-widest text-product-text-secondary uppercase";

function TemplateCard({ template }) {
  const meta = getGalleryMeta(template.id);
  const hero = template.snapshot.sections.find((section) => section.type === "hero");
  const blockCount = template.snapshot.sections.filter((section) => section.visible).length;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-product-border-subtle bg-product-bg-surface">
      <Link
        prefetch={false}
        href={`/templates/${template.id}`}
        aria-label={`${template.name} template details`}
        className="block p-3 pb-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
      >
        <span
          className="flex aspect-video flex-col gap-1.5 overflow-hidden rounded-lg p-4"
          style={{
            backgroundColor: template.snapshot.brand.pageBackground,
            color: template.snapshot.brand.textColor,
          }}
          aria-hidden="true"
        >
          <span
            className="h-1.5 w-16 rounded-full opacity-80"
            style={{ backgroundColor: template.snapshot.brand.textColor }}
          />
          <span className="line-clamp-2 font-product-display text-lg leading-snug font-semibold tracking-tight">
            {hero?.heading || template.name}
          </span>
          <span className="line-clamp-1 text-xs opacity-70">{hero?.body || ""}</span>
          <span className="mt-auto flex items-center gap-2">
            <span
              className="inline-block h-6 w-24 rounded-full"
              style={{ backgroundColor: template.snapshot.brand.accentColor }}
            />
            <span
              className="inline-block h-6 w-12 rounded-full opacity-20"
              style={{ backgroundColor: template.snapshot.brand.textColor }}
            />
          </span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4 pt-3">
        <p className="text-micro font-semibold tracking-widest text-product-text-secondary uppercase">
          {template.category}
        </p>
        <h2 className="font-product-display text-section leading-snug font-semibold tracking-tight">
          <Link
            prefetch={false}
            href={`/templates/${template.id}`}
            className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {template.name}
          </Link>
        </h2>
        <p className="text-sm text-product-text-secondary">{template.description}</p>
        {meta && (
          <p className="text-sm text-product-text-secondary">
            Best for: {meta.bestFor.join(" · ")}
          </p>
        )}
        <p className="text-micro text-product-text-secondary">{blockCount} sections</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <Link
            prefetch={false}
            href={`/waitlists/new?template=${template.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-product-text-primary px-4 py-2 text-caption font-semibold text-product-bg-page focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            Use this template
          </Link>
          <Link
            prefetch={false}
            href={`/templates/${template.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-product-border-subtle px-4 py-2 text-caption font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            Preview
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function TemplatesPage() {
  const templates = listTemplates();
  return (
    <PublicShell>
      <main id="main-content" className="scroll-mt-28">
        <section
          className={`${containerClasses} pt-14 pb-10 md:pt-18`}
          aria-labelledby="templates-title"
        >
          <p className={eyebrowClasses}>
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-product-accent-solid" />{" "}
            Templates
          </p>
          <h1
            id="templates-title"
            className="mt-5 max-w-3xl font-product-display text-5xl leading-tight font-medium tracking-tighter text-balance lg:text-6xl"
          >
            Start from a page that already works.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-normal text-product-text-secondary">
            Fourteen templates for every kind of launch — SaaS betas, AI previews, newsletters,
            events, pre-orders, and more. Pick one, make it yours, and publish when ready.
          </p>
          <div className="mt-8">
            <SignupButton>Browse templates, then create free</SignupButton>
          </div>
        </section>
        <section className={`${containerClasses} pb-18`} aria-label="Template gallery">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
