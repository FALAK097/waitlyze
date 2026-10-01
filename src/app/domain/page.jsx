import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { normalizeDomain } from "@/lib/domains/provider.mjs";
import { templateSnapshotSchema } from "@/lib/templates/catalog.mjs";
import { SignupForm } from "../(forms)/w/[slug]/signup-form";

async function loadPage() {
  const host = (await headers()).get("host")?.split(":")[0];
  let hostname;
  try { hostname = normalizeDomain(host); } catch { return null; }
  const domain = await prisma.customDomain.findUnique({ where: { hostname }, select: { status: true, waitList: { select: { id: true, name: true, status: true, publishedRevision: true, showReferrals: true } } } });
  if (domain?.status !== "ACTIVE" || !domain.waitList) return null;
  const waitList = domain.waitList;
  if (waitList.status === "PAUSED") return { waitList, paused: true };
  if (waitList.status !== "PUBLISHED" || !waitList.publishedRevision) return null;
  const publication = await prisma.waitListPublicationRevision.findUnique({ where: { waitListId_revision: { waitListId: waitList.id, revision: waitList.publishedRevision } }, select: { snapshot: true } });
  const parsed = templateSnapshotSchema.safeParse(publication?.snapshot);
  return parsed.success ? { waitList, snapshot: parsed.data } : null;
}

export async function generateMetadata() {
  const page = await loadPage();
  if (!page || page.paused) return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  const hero = page.snapshot.sections[0];
  return { title: page.waitList.name || hero.heading, description: hero.body, openGraph: { title: hero.heading, description: hero.body } };
}

export default async function CustomDomainPage() {
  const page = await loadPage();
  if (!page) notFound();
  if (page.paused) return <main className="product-ui public-launch public-launch-paused"><section><p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p><h1>This waitlist is paused</h1><p>Signups aren’t open right now. Please check back later.</p></section></main>;
  return <main className="product-ui public-launch"><div className="public-launch-content">
    <p className="public-launch-eyebrow">{page.waitList.name || "Waitlist"}</p>
    {page.snapshot.sections.map((section, index) => <section className={`public-launch-section public-launch-${section.type}`} key={`${section.type}-${index}`}>
      {section.type === "hero" && <><h1>{section.heading}</h1><p>{section.body}</p></>}
      {section.type === "features" && <div className="public-launch-features">{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div>}
      {section.type === "faq" && <div className="public-launch-faq">{section.items.map((item, itemIndex) => <article key={itemIndex}><h2>{item.question}</h2><p>{item.answer}</p></article>)}</div>}
      {section.type === "form" && <SignupForm waitListId={page.waitList.id} showReferrals={page.waitList.showReferrals} label={section.label} buttonText={section.buttonText} thankYou={page.snapshot.thankYou} />}
      {section.type === "footer" && <p>{section.note}</p>}
    </section>)}
  </div></main>;
}
