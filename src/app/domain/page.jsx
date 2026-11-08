import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublishedWaitlistPage } from "@/components/product/published-waitlist-page";
import { resolvePublishedWaitlistPage } from "@/lib/campaigns/published-waitlist-page.mjs";
import { normalizeDomain } from "@/lib/domains/provider.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-metadata";

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
          workspaceId: true,
          name: true,
          publicSlug: true,
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
  if (!page || page.paused || !page.canUseCustomDomain)
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
  if (!page.canUseCustomDomain) {
    return (
      <main className="grid min-h-screen place-items-center bg-product-bg-page px-6 py-12 text-center font-product-sans text-product-text-primary">
        <section className="w-full max-w-xl">
          <h1 className="font-product-display text-3xl font-semibold tracking-tight">
            This custom domain is unavailable
          </h1>
          <p className="mt-3 text-product-text-secondary">
            This waitlist is still available on its hosted Waitlyze page.
          </p>
          {page.waitList.publicSlug && (
            <Link
              className="mt-5 inline-block underline underline-offset-4"
              href={`${(process.env.BETTER_AUTH_URL || SITE_URL).replace(/\/$/, "")}/w/${encodeURIComponent(page.waitList.publicSlug)}`}
            >
              Open the hosted waitlist
            </Link>
          )}
        </section>
      </main>
    );
  }
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
