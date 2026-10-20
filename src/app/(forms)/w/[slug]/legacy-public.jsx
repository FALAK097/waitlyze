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
        <main className="grid min-h-screen place-items-center bg-product-bg-page px-6 py-12 text-center font-product-sans text-product-text-primary xl:py-30">
          <section className="w-full max-w-160">
            <p className="mb-9 text-lg font-semibold text-product-text-secondary">
              {waitList.name || "Waitlist"}
            </p>
            <h1 className="mb-5 font-product-display text-5xl leading-none font-semibold tracking-tighter text-balance lg:text-7xl">
              This waitlist is paused
            </h1>
            <p className="mx-auto max-w-155 text-lg leading-relaxed text-product-text-secondary">
              Signups aren’t open right now. Please check back later.
            </p>
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
