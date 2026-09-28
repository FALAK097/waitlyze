import prisma from "@/lib/prisma";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { notFound } from "next/navigation";
import { SignupForm } from "./signup-form";

async function publishedPage(slug) {
  const waitList = await prisma.waitList.findUnique({ where: { publicSlug: slug }, select: { id: true, name: true, status: true, publishedRevision: true } });
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
  if (page.paused) return <main className="public-launch public-launch-paused"><section><p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p><h1>This waitlist is paused</h1><p>Signups aren’t open right now. Please check back later.</p></section></main>;
  return <main className="public-launch"><div className="public-launch-content">
    <p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p>
    {page.snapshot.sections.map((section, index) => <section className={`public-launch-section public-launch-${section.type}`} key={`${section.type}-${index}`}>
      {section.type === "hero" && <><h1>{section.heading}</h1><p>{section.body}</p></>}
      {section.type === "features" && <div className="public-launch-features">{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div>}
      {section.type === "faq" && <div className="public-launch-faq">{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.question}</h2><p>{item.answer}</p></article>)}</div>}
      {section.type === "form" && <SignupForm waitListId={page.waitList.id} label={section.label} buttonText={section.buttonText} thankYou={page.snapshot.thankYou} />}
      {section.type === "footer" && <p>{section.note}</p>}
    </section>)}
  </div></main>;
}
