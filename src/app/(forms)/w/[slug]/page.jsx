import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { notFound } from "next/navigation";
import { SignupForm } from "./signup-form";
import { WaitlistPageContent } from "@/components/product/waitlist-page-content";

async function publishedPage(slug) {
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
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page || page.paused) return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  const hero = page.snapshot.sections[0];
  return { title: page.waitList.name || hero.heading, description: hero.body, openGraph: { title: hero.heading, description: hero.body } };
}

export default async function PublicWaitlistPage({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page) notFound();
  if (page.paused) return <main className="product-ui public-launch public-launch-paused"><section><p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p><h1>This waitlist is paused</h1><p>Signups aren’t open right now. Please check back later.</p></section></main>;
  return <main className="product-ui"><WaitlistPageContent
    snapshot={page.snapshot}
    name={page.waitList.name}
    renderSignupForm={(section, snapshot) => <SignupForm waitListId={page.waitList.id} showReferrals={page.waitList.showReferrals} label={section.label} buttonText={section.buttonText} thankYou={snapshot.thankYou} />}
  /></main>;
}
