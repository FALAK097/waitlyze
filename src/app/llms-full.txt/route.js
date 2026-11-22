import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";
import { getPosts } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import { docsLlms } from "@/lib/source";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";

export const revalidate = false;

export async function GET() {
  const docsFull = await docsLlms.full();
  const templates = listTemplates();
  const posts = getPosts();

  const templatesSection = templates
    .map((t) => {
      const meta = getGalleryMeta(t.id);
      return `### Template: ${t.name} (/templates/${t.id})
Category: ${t.category}
Use Case: ${meta?.useCase || t.description}
Best for: ${meta?.bestFor.join(", ") || "Launches"}
`;
    })
    .join("\n");

  const blogSection = (
    await Promise.all(
      posts.map(async (p) => {
        const text = await p.data.getText("processed");
        return `### Blog: ${p.data.title} (${p.url})
Author: ${p.data.author}
Tags: ${p.data.tags.join(", ")}
TL;DR: ${p.data.tldr}

${text}
`;
      }),
    )
  ).join("\n---\n\n");

  const fullContent = `# Waitlyze: Complete Knowledge Base & Documentation Context

> ${SITE_DESCRIPTION}
Canonical: ${SITE_URL}

---

## 1. Product Overview & Architecture
Waitlyze is a waitlist and pre-launch platform for builders, founders, and creators.
- Zero-code hosted pages (/w/slug) and embed widgets (/js/embed.js)
- Verified referral engine with points, leaderboards, and queue ranking
- Email automations (welcome emails, referral reminders, milestone updates)
- Public developer API (POST /api/waitlist) and webhook integrations
- Privacy-first analytics without third-party tracking cookies

---

## 2. Agent Quickstart & Integration
To integrate Waitlyze:
- Embed widget: <div class="waitlyze-widget" data-key-id="PUBLIC_WAITLIST_ID"><a href="${SITE_URL}" target="_blank" rel="noopener">Waitlist powered by Waitlyze</a></div><script src="${SITE_URL}/js/embed.js" defer></script>
- Public Signup API: POST ${SITE_URL}/api/waitlist with JSON { waitlistId, email, referralCode }
- Full Agent Instructions: ${SITE_URL}/agent-instructions.md

---

## 3. Pricing, Limits & Buying Fit
- Free: ${WAITLYZE_PRICING.free.formatted}; one workspace, one waitlist, one member, and 100 cumulative signups. The allowance does not reset monthly or when a waitlist is deleted.
- Pro monthly: ${WAITLYZE_PRICING.pro.monthly.formatted} per month in USD.
- Pro annual: ${WAITLYZE_PRICING.pro.annual.formatted} per year in USD (${WAITLYZE_PRICING.pro.annual.monthlyEquivalentFormatted} per month equivalent).
- Pro includes unlimited workspaces, waitlists, signups, and members, plus advanced analytics, referral milestones, subscriber broadcasts and automations, branding removal, and one optional custom domain per waitlist.
- Subscriber email requires a connected, verified Resend sender. Waitlyze tracks referral reward eligibility but does not fulfill rewards. Taxes and any available country-adjusted price appear at checkout.
- Current canonical pricing: ${SITE_URL}/pricing
- Side-by-side buyer comparison: ${SITE_URL}/compare
- Focused alternative guides: ${SITE_URL}/alternatives

---

## 4. Launch Templates Catalog
${templatesSection}

---

## 5. Pre-Launch Guides & Playbooks
${blogSection}

---

## 6. Developer & Platform Documentation
${docsFull}
`;

  return new Response(fullContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
