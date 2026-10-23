import Link from "next/link";

import { CreateWaitlistDialog } from "@/components/product/create-waitlist-dialog";

export const metadata = { title: "New waitlist" };

export default function NewWaitlistPage() {
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
        <CreateWaitlistDialog initialOpen />
      </div>
      <Link prefetch={false} href="/waitlists" className="mt-5 inline-block">
        Back to waitlists
      </Link>
    </section>
  );
}
