import { Suspense } from "react";

import { ProductContentSkeleton } from "@/components/product/content-skeleton";
import { WaitlistNav } from "@/components/product/waitlist-nav";
import { requireCampaignPage } from "@/lib/workspaces/authorize";

async function AuthorizedWaitlistLayout({ children, params }) {
  const { id } = await params;
  const { campaign, role } = await requireCampaignPage(id, "viewCampaign");
  const canSendEmail = ["OWNER", "ADMIN"].includes(role);
  return (
    <section className="product-waitlist-detail">
      <div className="mt-2 mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 max-sm:-mx-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-0">
        <h1 className="mt-0! mb-0! min-w-0 text-xl! wrap-anywhere max-sm:px-4">
          {campaign.name || "Untitled waitlist"}
        </h1>
        <WaitlistNav id={id} canSendEmail={canSendEmail} />
      </div>
      {children}
    </section>
  );
}

export default function WaitlistLayout({ children, params }) {
  return (
    <Suspense fallback={<ProductContentSkeleton label="Loading waitlist" variant="campaign" />}>
      <AuthorizedWaitlistLayout params={params}>{children}</AuthorizedWaitlistLayout>
    </Suspense>
  );
}
