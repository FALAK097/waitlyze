import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublishedWaitlistPage } from "@/components/product/published-waitlist-page";
import { resolvePublishedWaitlistPage } from "@/lib/campaigns/published-waitlist-page.mjs";
import { normalizeDomain } from "@/lib/domains/provider.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

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
  return resolvePublishedWaitlistPage(waitList);
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
  return (
    <PublishedWaitlistPage
      page={page}
      impressionTracker={<ImpressionTracker waitListId={page.waitList.id} />}
      renderSignupForm={(_section, snapshot) => (
        <SignupForm
          waitListId={page.waitList.id}
          showReferrals={page.waitList.showReferrals}
          formConfig={snapshot.form}
          statusPage={snapshot.statusPage}
          turnstileSiteKey={
            snapshot.form.requireTurnstile ? env.TURNSTILE_SITE_KEY?.trim() || "" : ""
          }
        />
      )}
    />
  );
}
