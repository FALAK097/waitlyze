import Link from "next/link";

import { CreateWaitlistDialog } from "@/components/product/create-waitlist-dialog";

export const metadata = { title: "New waitlist" };

export default function NewWaitlistPage() {
  return (
    <section className="product-empty" aria-labelledby="new-waitlist-title">
      <h1 id="new-waitlist-title">Create a waitlist</h1>
      <p>Name the launch, then shape the page in Builder.</p>
      <CreateWaitlistDialog initialOpen />
      <Link href="/waitlists">Back to waitlists</Link>
    </section>
  );
}
