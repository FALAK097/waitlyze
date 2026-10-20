import { nanoid } from "nanoid";
import { notFound } from "next/navigation";
import { cache } from "react";

import { sendSignupEmail } from "@/app/actions/emails";
import { WaitlistPageContent } from "@/components/product/waitlist-page-content";
import { FormPreview } from "@/components/wait-lists/preview";
import {
  getLegacyPublicSignUpsCount,
  getLegacyPublicWaitList,
} from "@/lib/campaigns/legacy-public.mjs";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { ReactQueryProvider } from "@/providers/query";

import { SignupForm } from "../../w/[slug]/signup-form";

const getWaitList = cache(async (id) => getLegacyPublicWaitList(prisma, { id }));

const getWaitListMetadata = cache(async (id) => {
  return await prisma.waitList.findUnique({
    where: { id, status: "PUBLISHED" },
    select: {
      name: true,
      description: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
    },
  });
});

const getSignUpsCount = cache(async (waitListId) =>
  getLegacyPublicSignUpsCount(prisma, waitListId),
);

export async function generateMetadata(props) {
  const params = await props.params;
  const { id } = params;

  const waitList = await getWaitListMetadata(id);

  if (!waitList) {
    return {
      robots: { index: false, follow: false },
      title: "Not Found, Check the URL and try again",
      description: "The requested waitlist could not be found.",
    };
  }

  const title = waitList.ogTitle || waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1);
  const description =
    waitList.ogDescription ||
    waitList.description ||
    "Preview and test your waitlist form before sharing it with your audience.";

  return {
    robots: { index: false, follow: false },
    title,
    description,
    openGraph: {
      title,
      description,
      ...(waitList.ogImage && {
        images: [
          {
            url: waitList.ogImage,
            width: 1200,
            height: 630,
            alt: `${title} Preview`,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(waitList.ogImage && {
        images: [waitList.ogImage],
      }),
    },
  };
}

export default async function WaitListsPreviewPage(props) {
  const params = await props.params;
  const { id } = params;
  const structured = await prisma.waitList.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, showReferrals: true, publishedRevision: true },
  });
  if (structured?.status === "PAUSED")
    return (
      <main className="grid min-h-screen place-items-center bg-product-bg-page px-6 py-12 text-center font-product-sans text-product-text-primary xl:py-30">
        <section className="w-full max-w-160">
          <h1 className="mb-5 font-product-display text-5xl leading-none font-semibold tracking-tighter text-balance lg:text-7xl">
            Signups are paused
          </h1>
          <p className="mx-auto max-w-155 text-lg leading-relaxed text-product-text-secondary">
            Please check back later.
          </p>
        </section>
      </main>
    );
  if (structured?.status === "PUBLISHED" && structured.publishedRevision) {
    const publication = await prisma.waitListPublicationRevision.findUnique({
      where: { waitListId_revision: { waitListId: id, revision: structured.publishedRevision } },
      select: { snapshot: true },
    });
    const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
    if (parsed.success) {
      const embedSnapshot = {
        ...parsed.data,
        sections: [
          {
            id: "embed-form",
            type: "form",
            visible: true,
            variant: "default",
            heading: "",
            body: "",
          },
        ],
      };
      return (
        <WaitlistPageContent
          snapshot={embedSnapshot}
          name={structured.name}
          previewViewport="mobile"
          renderSignupForm={(_section, snapshot) => (
            <SignupForm
              waitListId={id}
              showReferrals={structured.showReferrals}
              formConfig={snapshot.form}
              statusPage={snapshot.statusPage}
            />
          )}
        />
      );
    }
  }

  const waitList = await getWaitList(id);

  if (!waitList) {
    return notFound();
  }

  const uniqueUserId = nanoid();
  const initialSignUpsCount = await getSignUpsCount(id);

  const getTotalSignUpsOnWaitList = async (waitListId) => {
    "use server";
    return getSignUpsCount(waitListId);
  };

  const sendSignUpEmailAction = async ({ email }) => {
    "use server";
    if (!email) return { success: false, message: "Missing email" };
    return await sendSignupEmail({ waitListId: id, to: email });
  };

  return (
    <div>
      <ReactQueryProvider>
        <FormPreview
          uniqueUserId={uniqueUserId}
          waitList={waitList}
          initialSignUpsCount={initialSignUpsCount}
          getTotalSignUpsOnWaitList={getTotalSignUpsOnWaitList.bind(null, id)}
          sendSignUpEmailAction={sendSignUpEmailAction}
        />
      </ReactQueryProvider>
    </div>
  );
}
