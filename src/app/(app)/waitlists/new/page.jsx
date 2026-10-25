import Link from "next/link";

import { CreateWaitlistDialog } from "@/components/product/create-waitlist-dialog";
import { isTemplateId } from "@/lib/templates/gallery.mjs";

export const metadata = { title: "New waitlist" };

export default async function NewWaitlistPage({ searchParams }) {
  const resolved = await searchParams;
  const template = Array.isArray(resolved?.template) ? resolved.template[0] : resolved?.template;
  const initialTemplateId = isTemplateId(template) ? template : "simple";
  return (
    <section
      className="rounded-xl border border-product-border-subtle bg-product-bg-surface px-6 py-16 text-center"
      aria-labelledby="new-waitlist-title"
    >
      <h1 id="new-waitlist-title" className="mb-2! text-title">
        Create a waitlist
      </h1>
      <p className="text-sm text-product-text-secondary">
        Name the launch, then shape the page in Builder.
      </p>
      <div className="mt-5">
        <CreateWaitlistDialog initialOpen initialTemplateId={initialTemplateId} />
      </div>
      <Link prefetch={false} href="/waitlists" className="mt-5 inline-block">
        Back to waitlists
      </Link>
    </section>
  );
}
