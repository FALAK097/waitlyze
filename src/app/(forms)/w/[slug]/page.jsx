import { notFound } from "next/navigation";
import { cache } from "react";

import { WaitlistPageContent } from "@/components/product/waitlist-page-content";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";

import { ImpressionTracker } from "./impression-tracker";
import { SignupForm } from "./signup-form";

const publishedPage = cache(async function publishedPage(slug) {
  const waitList = await prisma.waitList.findUnique({
    where: { publicSlug: slug },
    select: {
      id: true,
      name: true,
      status: true,
      publishedRevision: true,
      showReferrals: true,
      _count: { select: { signUps: true } },
    },
  });
  if (!waitList) return null;
  if (waitList.status === "PAUSED") return { waitList, paused: true };
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;
  const publication = await prisma.waitListPublicationRevision.findUnique({
    where: {
      waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision },
    },
    select: { snapshot: true },
  });
  if (!publication) return null;
  const parsed = templateSnapshotSchema.safeParse(publication.snapshot);
  return parsed.success ? { waitList, snapshot: parsed.data } : null;
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page || page.paused)
    return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  const hero = page.snapshot.sections.find((section) => section.type === "hero");
  const title = page.snapshot.seo.title || page.waitList.name || hero?.heading || "Waitlist";
  const description = page.snapshot.seo.description || hero?.body || "";
  return {
    title,
    description,
    robots: { index: page.snapshot.seo.indexable, follow: page.snapshot.seo.indexable },
    alternates: { canonical: `/w/${encodeURIComponent(slug)}` },
    openGraph: {
      title,
      description,
      ...(page.snapshot.seo.image ? { images: [{ url: page.snapshot.seo.image }] } : {}),
    },
  };
}

export default async function PublicWaitlistPage({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page) return notFound();
  if (page.paused)
    return (
      <main className="grid min-h-screen place-items-center bg-product-bg-page px-6 py-12 text-center font-product-sans text-product-text-primary xl:py-30">
        <section className="w-full max-w-160">
          <p className="mb-9 text-lg font-semibold text-product-text-secondary">
            {page.waitList.name || "Waitlist"}
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
  return (
    <main className="product-ui">
      <ImpressionTracker waitListId={page.waitList.id} />
      <WaitlistPageContent
        snapshot={page.snapshot}
        name={page.waitList.name}
        signupCount={page.waitList._count.signUps}
        renderSignupForm={(_section, snapshot) => (
          <SignupForm
            slug={slug}
            waitListId={page.waitList.id}
            showReferrals={page.waitList.showReferrals}
            formConfig={snapshot.form}
            statusPage={snapshot.statusPage}
            brand={snapshot.brand}
          />
        )}
      />
    </main>
  );
}
