import prisma from "@/lib/prisma";
import { hashUnsubscribeToken } from "@/lib/email/unsubscribe.mjs";

export const metadata = { title: "Email preferences | Waitlyze", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ params, searchParams }) {
  const { token } = await params;
  const query = await searchParams;
  const subscriber = token.length >= 32 && token.length <= 128
    ? await prisma.signUp.findUnique({
      where: { unsubscribeTokenHash: hashUnsubscribeToken(token) },
      select: { marketingUnsubscribedAt: true },
    })
    : null;
  const done = query?.done === "1" || Boolean(subscriber?.marketingUnsubscribedAt);

  return (
    <main className="product-ui public-launch public-preferences">
      <section className="public-preferences-card" aria-labelledby="preferences-title">
        <p className="public-launch-eyebrow">WAITLYZE · EMAIL PREFERENCES</p>
        <h1 id="preferences-title">{done ? "You’re unsubscribed" : subscriber ? "Manage email updates" : "This link is unavailable"}</h1>
        <p>{done ? "You won’t receive future launch updates for this waitlist." : subscriber ? "Choose whether to stop receiving future launch updates for this waitlist." : "This email preference link may have expired or been copied incorrectly."}</p>
        {subscriber && !done ? <form action="/api/email/unsubscribe" method="post">
          <input type="hidden" name="token" value={token} />
          <button type="submit">Unsubscribe from updates</button>
        </form> : null}
      </section>
    </main>
  );
}
