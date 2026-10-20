import { nanoid } from "nanoid";
import { notFound } from "next/navigation";

import { sendSignupEmail } from "@/app/actions/emails";
import { FormPreview } from "@/components/wait-lists/preview";
import { getLegacyPublicSignUpsCount, legacyPublicSelect } from "@/lib/campaigns/legacy-public.mjs";
import prisma from "@/lib/prisma";
import { ReactQueryProvider } from "@/providers/query";

// Legacy-builder fallback for /w/[slug]: snapshot-less published pages render
// the classic form + referral loop. Snapshot pages never reach here.
export async function LegacyPublicWaitlist({ slug }) {
  const waitList = await prisma.waitList.findFirst({
    where: { publicSlug: slug },
    select: legacyPublicSelect,
  });
  if (!waitList || waitList.templateSnapshot) return notFound();
  if (waitList.status !== "PUBLISHED") {
    if (waitList.status === "PAUSED") {
      return (
        <main className="product-ui public-launch public-launch-paused">
          <section>
            <p className="public-launch-eyebrow">{waitList.name || "Waitlist"}</p>
            <h1>This waitlist is paused</h1>
            <p>Signups aren’t open right now. Please check back later.</p>
          </section>
        </main>
      );
    }
    return notFound();
  }
  const uniqueUserId = nanoid();
  const initialSignUpsCount = await getLegacyPublicSignUpsCount(prisma, waitList.id);
  const getTotalSignUpsOnWaitList = async (waitListId) => {
    "use server";
    return getLegacyPublicSignUpsCount(prisma, waitListId);
  };
  const sendSignUpEmailAction = async ({ email }) => {
    "use server";
    if (!email) return { success: false, message: "Missing email" };
    return await sendSignupEmail({ waitListId: waitList.id, to: email });
  };
  return (
    <div>
      <ReactQueryProvider>
        <FormPreview
          uniqueUserId={uniqueUserId}
          waitList={waitList}
          initialSignUpsCount={initialSignUpsCount}
          getTotalSignUpsOnWaitList={getTotalSignUpsOnWaitList.bind(null, waitList.id)}
          sendSignUpEmailAction={sendSignUpEmailAction}
        />
      </ReactQueryProvider>
    </div>
  );
}
