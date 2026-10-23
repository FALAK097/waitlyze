import { notFound } from "next/navigation";

import { WaitlistNav } from "@/components/product/waitlist-nav";
import prisma from "@/lib/prisma";
import { currentWorkspace } from "@/lib/workspaces/current";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export default async function WaitlistLayout({ children, params }) {
  const [{ id }, { user, workspace }] = await Promise.all([params, currentWorkspace()]);
  const waitlist = await prisma.waitList.findFirst({
    where: { id, ...campaignScope(user.id, "viewCampaign", workspace.id) },
    select: { id: true, name: true },
  });
  if (!waitlist) notFound();
  const canSendEmail = ["OWNER", "ADMIN"].includes(workspace.members[0]?.role);
  return (
    <section className="product-waitlist-detail">
      <div className="mt-2 mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 max-sm:-mx-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-0">
        <h1 className="mt-0! mb-0! min-w-0 text-xl! wrap-anywhere max-sm:px-4">
          {waitlist.name || "Untitled waitlist"}
        </h1>
        <WaitlistNav id={id} canSendEmail={canSendEmail} />
      </div>
      {children}
    </section>
  );
}
