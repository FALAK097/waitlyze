import { cache } from "react";
import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { SignupForm } from "./signup-form";
import { ImpressionTracker } from "./impression-tracker";
import { LegacyPublicWaitlist } from "./legacy-public";
import { WaitlistPageContent } from "@/components/product/waitlist-page-content";

const publishedPage = cache(async function publishedPage(slug) {
  const waitList = await prisma.waitList.findUnique({ where: { publicSlug: slug }, select: { id: true, name: true, status: true, publishedRevision: true, showReferrals: true } });
  if (!waitList) return null;
  if (waitList.status === "PAUSED") return { waitList, paused: true };
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;
  const publication = await prisma.waitListPublicationRevision.findUnique({
    where: { waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision } },
    select: { snapshot: true },
  });
  if (!publication) return null;
  const parsed = templateSnapshotSchema.safeParse(publication.snapshot);
  return parsed.success ? { waitList, snapshot: parsed.data } : null;
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page || page.paused) {
    const legacy = await prisma.waitList.findFirst({ where: { publicSlug: slug, status: "PUBLISHED" }, select: { name: true, description: true, ogTitle: true, ogDescription: true, ogImage: true, templateSnapshot: true } });
    if (legacy && !legacy.templateSnapshot) {
      const title = legacy.ogTitle || legacy.name || "Waitlist";
      const description = legacy.ogDescription || legacy.description || "";
      return { title, description, alternates: { canonical: `/w/${encodeURIComponent(slug)}` }, openGraph: { title, description, ...(legacy.ogImage ? { images: [{ url: legacy.ogImage }] } : {}) } };
    }
    return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  }
  const hero = page.snapshot.sections[0];
  return { title: page.waitList.name || hero.heading, description: hero.body, alternates: { canonical: `/w/${encodeURIComponent(slug)}` }, openGraph: { title: hero.heading, description: hero.body } };
}

export default async function PublicWaitlistPage({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  // Snapshot-less (legacy builder) pages render the classic form loop.
  if (!page) return <LegacyPublicWaitlist slug={slug} />;
  if (page.paused) return <main className="product-ui public-launch public-launch-paused"><section><p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p><h1>This waitlist is paused</h1><p>Signups aren’t open right now. Please check back later.</p></section></main>;
  return <main className="product-ui"><ImpressionTracker waitListId={page.waitList.id} /><WaitlistPageContent
    snapshot={page.snapshot}
    name={page.waitList.name}
    renderSignupForm={(section, snapshot) => <SignupForm slug={slug} waitListId={page.waitList.id} showReferrals={page.waitList.showReferrals} label={section.label} buttonText={section.buttonText} thankYou={snapshot.thankYou} />}
  /></main>;
}
