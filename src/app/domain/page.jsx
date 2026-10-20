import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { WaitlistPageContent } from "@/components/product/waitlist-page-content";
import { normalizeDomain } from "@/lib/domains/provider.mjs";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";

import { ImpressionTracker } from "../(forms)/w/[slug]/impression-tracker";
import { SignupForm } from "../(forms)/w/[slug]/signup-form";

const loadPage = cache(async function loadPage() {
  const host = (await headers()).get("host")?.split(":")[0];
  let hostname;
  try {
    hostname = normalizeDomain(host);
  } catch {
    return null;
  }
  const domain = await prisma.customDomain.findUnique({
    where: { hostname },
    select: {
      status: true,
      waitList: {
        select: {
          id: true,
          name: true,
          status: true,
          publishedRevision: true,
          showReferrals: true,
          _count: { select: { signUps: true } },
        },
      },
    },
  });
  if (domain?.status !== "ACTIVE" || !domain.waitList) return null;
  const waitList = domain.waitList;
  if (waitList.status === "PAUSED") return { waitList, paused: true };
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;
  const publication = await prisma.waitListPublicationRevision.findUnique({
    where: {
      waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision },
    },
    select: { snapshot: true },
  });
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  return parsed.success ? { waitList, snapshot: parsed.data } : null;
});

export async function generateMetadata() {
  const page = await loadPage();
  if (!page || page.paused)
    return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  const hero = page.snapshot.sections.find((section) => section.type === "hero");
  const title = page.snapshot.seo.title || page.waitList.name || hero?.heading || "Waitlist";
  const description = page.snapshot.seo.description || hero?.body || "";
  return {
    title,
    description,
    robots: { index: page.snapshot.seo.indexable, follow: page.snapshot.seo.indexable },
    openGraph: {
      title,
      description,
      ...(page.snapshot.seo.image ? { images: [{ url: page.snapshot.seo.image }] } : {}),
    },
  };
}

export default async function CustomDomainPage() {
  const page = await loadPage();
  if (!page) notFound();
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
            waitListId={page.waitList.id}
            showReferrals={page.waitList.showReferrals}
            formConfig={snapshot.form}
            statusPage={snapshot.statusPage}
          />
        )}
      />
    </main>
  );
}
