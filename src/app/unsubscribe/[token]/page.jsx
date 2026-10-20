import { Button } from "@/components/ui/button";
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
    <main className="product-ui public-launch public-preferences">
      <section className="public-preferences-card" aria-labelledby="preferences-title">
        <p className="public-launch-eyebrow">{waitlistName} · Email preferences</p>
        <h1 id="preferences-title">
          {done
            ? "You’re unsubscribed"
            : subscriber
              ? "Manage email updates"
              : "This link is unavailable"}
        </h1>
        <p>
          {done
            ? `You won’t receive future launch updates for ${waitlistName}.`
            : subscriber
              ? `Choose whether to stop receiving future launch updates for ${waitlistName}.`
              : "This email preference link may have expired or been copied incorrectly."}
        </p>
        {subscriber && !done ? (
          <form action="/api/email/unsubscribe" method="post">
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Unsubscribe from updates</Button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
