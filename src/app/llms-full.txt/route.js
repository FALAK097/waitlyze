import { getPosts } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import { docsLlms } from "@/lib/source";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";
import { listTools } from "@/lib/tools/registry.mjs";

export const revalidate = false;

export async function GET() {
  const docsFull = await docsLlms.full();
  const templates = listTemplates();
  const posts = getPosts();
  const tools = listTools();

  const toolsSection = tools
    .map(
      (tool) => `### Tool: ${tool.title} (${tool.path})
Priority: ${tool.priority}
Summary: ${tool.directAnswer}
Formula / Method: ${tool.howItWorks.formula}
Privacy: ${tool.privacyNotice}
`,
    )
    .join("\n");

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

## 3. Waitlyze Launch Lab (14 Free Pre-Launch Tools & Research)
${toolsSection}

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
