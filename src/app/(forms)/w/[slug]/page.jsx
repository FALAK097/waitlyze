import { notFound } from "next/navigation";
import { cache } from "react";

import { PublishedWaitlistPage } from "@/components/product/published-waitlist-page";
import { resolvePublishedWaitlistPage } from "@/lib/campaigns/published-waitlist-page.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-metadata";

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
  return resolvePublishedWaitlistPage(waitList);
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page || page.paused)
    return { title: "Waitlist unavailable", robots: { index: false, follow: false } };
  const hero = page.snapshot.sections.find((section) => section.type === "hero");
  const title = page.snapshot.seo.title || page.waitList.name || hero?.heading || "Waitlist";
  const description = page.snapshot.seo.description || hero?.body || "";
  const path = `/w/${encodeURIComponent(slug)}`;
  // Scrapers need an absolute image URL. Resolve site-relative values against
  // the canonical origin. Only absolute TLS or site-relative URLs pass:
  // protocol-relative ("//evil.test/x.png") would inherit https and bypass the
  // allowlist, and inline data URLs can't be fetched by cards - both dropped
  // rather than emitting a broken tag.
  const rawImage = page.snapshot.seo.image?.trim() || "";
  const normalizedImage = /^(?:https:\/\/|\/(?!\/))/i.test(rawImage) ? rawImage : "";
  const image = normalizedImage.startsWith("/") ? `${SITE_URL}${normalizedImage}` : normalizedImage;
  const images = image ? [{ url: image }] : [];
  const favicon =
    typeof page.snapshot.brand.favicon === "string" &&
    /^(https:\/\/|\/(?!\/)|data:image\/)/i.test(page.snapshot.brand.favicon.trim())
      ? page.snapshot.brand.favicon.trim()
      : "";
  return {
    title,
    description,
    robots: { index: page.snapshot.seo.indexable, follow: page.snapshot.seo.indexable },
    alternates: { canonical: path },
    ...(favicon ? { icons: { icon: favicon } } : {}),
    openGraph: {
      type: "website",
      siteName: page.waitList.name || "Waitlyze",
      url: path,
      title,
      description,
      images,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images },
  };
}

export default async function PublicWaitlistPage({ params }) {
  const { slug } = await params;
  const page = await publishedPage(slug);
  if (!page) return notFound();
  return (
    <PublishedWaitlistPage
      page={page}
      hideCounts={page.snapshot.rewards?.hideCounts === true}
      impressionTracker={<ImpressionTracker waitListId={page.waitList.id} />}
      renderSignupForm={(_section, snapshot) => (
        <SignupForm
          slug={slug}
          waitListId={page.waitList.id}
          showReferrals={page.waitList.showReferrals}
          formConfig={snapshot.form}
          statusPage={snapshot.statusPage}
          brand={snapshot.brand}
          turnstileSiteKey={
            snapshot.form.requireTurnstile ? env.TURNSTILE_SITE_KEY?.trim() || "" : ""
          }
        />
      )}
    />
  );
}
