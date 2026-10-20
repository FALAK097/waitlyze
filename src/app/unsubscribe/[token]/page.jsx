import { hashUnsubscribeToken } from "@/lib/email/unsubscribe.mjs";
import prisma from "@/lib/prisma";

export const metadata = { title: "Email preferences", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ params, searchParams }) {
  const { token } = await params;
  const query = await searchParams;
  const subscriber =
    token.length >= 32 && token.length <= 128
      ? await prisma.signUp.findUnique({
          where: { unsubscribeTokenHash: hashUnsubscribeToken(token) },
          select: { marketingUnsubscribedAt: true, waitList: { select: { name: true } } },
        })
      : null;
  const done = query?.done === "1" || Boolean(subscriber?.marketingUnsubscribedAt);
  const waitlistName = subscriber?.waitList?.name || "this waitlist";

  return (
    <main className="grid min-h-svh place-items-center bg-product-bg-page px-4 py-8 font-product-sans text-product-text-primary">
      <section
        className="w-full max-w-140 rounded-xl border border-product-border-subtle bg-product-bg-surface p-8"
        aria-labelledby="preferences-title"
      >
        <p className="mb-9 text-body font-semibold text-product-text-secondary">
          {waitlistName} · Email preferences
        </p>
        <h1
          id="preferences-title"
          className="mt-2 mb-3 font-product-display text-title leading-tight font-semibold tracking-tight"
        >
          {done
            ? "You’re unsubscribed"
            : subscriber
              ? "Manage email updates"
              : "This link is unavailable"}
        </h1>
        <p className="mb-6 text-product-text-secondary">
          {done
            ? `You won’t receive future launch updates for ${waitlistName}.`
            : subscriber
              ? `Choose whether to stop receiving future launch updates for ${waitlistName}.`
              : "This email preference link may have expired or been copied incorrectly."}
        </p>
        {subscriber && !done ? (
          <form action="/api/email/unsubscribe" method="post">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-product-text-secondary bg-product-accent-solid px-4 text-sm font-medium text-product-accent-label transition-colors hover:bg-product-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Unsubscribe from updates
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
