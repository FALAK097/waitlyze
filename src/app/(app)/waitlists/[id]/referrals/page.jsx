import Link from "next/link";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { notFound } from "next/navigation";
import styles from "@/components/product/waitlist-experience.module.css";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage({ params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const scope = campaignScope(user.id, "viewAudience", workspace.id);
  const waitlist = await prisma.waitList.findFirst({ where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) }, select: { id: true, showReferrals: true } });
  if (!waitlist) notFound();
  const groups = await prisma.referral.groupBy({
    by: ["referredById"],
    where: { referredById: { not: null }, signUp: { waitListId: id, waitList: scope }, referredBy: { waitListId: id } },
    _count: { signUpId: true },
    orderBy: { _count: { signUpId: "desc" } },
    take: 50,
  });
  const referrers = await prisma.signUp.findMany({
    where: { id: { in: groups.map((group) => group.referredById).filter(Boolean) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(referrers.map((row) => [row.id, row.email]));
  const leaders = groups
    .filter((group) => group.referredById)
    .map((group, index) => ({ rank: index + 1, email: emailById.get(group.referredById) || "—", referrals: group._count.signUpId }));
  const total = leaders.reduce((sum, row) => sum + row.referrals, 0);
  return <div className="product-section">
    <div className="product-page-heading">
      <h1>Referrals</h1>
      <p className="product-description">{waitlist.showReferrals ? "Friends who joined through a personal link. Credit counts once both emails are verified." : "Referral sharing is off. Turn it on in settings to let joiners invite friends."}</p>
    </div>
    {leaders.length === 0
      ? <p className="product-description">{waitlist.showReferrals ? "No referrals yet. Share your page to start the loop." : <Link prefetch={false} href={`/waitlists/${id}/settings`}>Open referral settings</Link>}</p>
      : <>
        <dl className={styles.overviewFacts}>
          <div><dt>Total referrals</dt><dd>{total.toLocaleString()}</dd></div>
          <div><dt>Referrers</dt><dd>{leaders.length.toLocaleString()}</dd></div>
        </dl>
        <div className="product-table-wrap product-waitlist-table"><table>
          <caption className="product-visually-hidden">Top referrers</caption>
          <thead><tr><th scope="col">#</th><th scope="col">Referrer</th><th scope="col">Referrals</th></tr></thead>
          <tbody>{leaders.map((row) => <tr key={row.rank}><th scope="row">{row.rank}</th><td>{row.email}</td><td>{row.referrals.toLocaleString()}</td></tr>)}</tbody>
        </table></div>
      </>}
    <div className="product-actions">
      <Link prefetch={false} href={`/waitlists/${id}/settings`}>Referral settings</Link>
    </div>
  </div>;
}
