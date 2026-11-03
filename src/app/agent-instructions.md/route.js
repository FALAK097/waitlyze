import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";

export const revalidate = false;

export async function GET() {
  const instructions = `# Waitlyze: Developer & AI Agent Instructions

> ${SITE_DESCRIPTION}

This document is the official machine-readable guide for AI coding assistants (Claude Code, Cursor, Codex, Windsurf, ChatGPT) and developers integrating Waitlyze into applications. For human-facing examples, browse the [homepage](${SITE_URL}/), [templates](${SITE_URL}/templates), and [documentation](${SITE_URL}/docs).

---

## 1. Product Summary & Architecture

Waitlyze is an all-in-one pre-launch waitlist platform. It provides:
1. **Hosted Pages**: Standalone waitlist landing pages at \`${SITE_URL}/w/[slug]\` (or configured custom domains).
2. **Embed Widget**: Drop-in JavaScript widget (\`/js/embed.js\`) compatible with Next.js, React, HTML, Webflow, and Framer.
3. **Signup API**: Server-side endpoint \`POST ${SITE_URL}/api/waitlist\` with a scoped API key to capture signups from custom frontends. Never expose the key in browser code.
4. **Viral Referrals**: Automatic referral code generation (\`?r=CODE\`), queue position tracking, and fraud velocity limits.
5. **Email Engine**: Welcome automations, referral reminders, and broadcast sends with double opt-in verification.
6. **Analytics**: Visitors, signups, conversion, verification, and available source, geographic, and device breakdowns.

---

## 2. Quickstart: Integrating Waitlyze into an App

### Method A: Drop-in Embed Widget (Recommended for Frontends)
Place this snippet where you want the waitlist form to render:

\`\`\`html
<!-- 1. The container with your public waitlist ID -->
<div class="waitlyze-widget" data-key-id="YOUR_PUBLIC_WAITLIST_ID"></div>

<!-- 2. The embed script -->
<script src="${SITE_URL}/js/embed.js" defer></script>
\`\`\`

**In React / Next.js:**
\`\`\`tsx
import Script from "next/script";

export function WaitlistSection() {
  return (
    <section>
      <div className="waitlyze-widget" data-key-id="YOUR_PUBLIC_WAITLIST_ID" />
      <Script src="${SITE_URL}/js/embed.js" strategy="lazyOnload" />
    </section>
  );
}
\`\`\`

- The iframe automatically resizes to fit your form height.
- URL parameters like \`?r=REFERRAL_CODE\` and UTM parameters are automatically forwarded into the waitlist.
- No secret API keys are required for the embed.

---

### Method B: Server-side Signup API (For Custom Forms)
If you build custom UI and capture emails on your own backend:

\`\`\`http
POST ${SITE_URL}/api/waitlist HTTP/1.1
Content-Type: application/json
x-api-key: YOUR_SCOPED_API_KEY

{
  "waitlistId": "YOUR_WAITLIST_ID",
  "email": "user@example.com",
  "referralCode": "OPTIONAL_REFERRER_CODE"
}
\`\`\`

**Next.js Server Action Example:**
\`\`\`typescript
"use server";

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;
  const referralCode = (formData.get("ref") as string) || undefined;

  const res = await fetch("${SITE_URL}/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.WAITLYZE_API_KEY!,
    },
    body: JSON.stringify({
      waitlistId: process.env.WAITLYZE_WAITLIST_ID,
      email,
      referralCode,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to join waitlist");
  }

  const data = await res.json();
  // Returns { position, referral_code, referral_link, points,
  // referral_count, verified, ... } in the data field.
  return data.data;
}
\`\`\`

---

## 3. Webhook Events

Waitlyze can notify your server in real time when campaign events occur. Set your webhook URL in **Waitlist Settings → Webhooks**.

Events payload format:
- \`signup.created\`: Fired when a new visitor submits an email.
- \`signup.verified\`: Fired when the subscriber clicks their confirmation email link.
- \`referral.completed\`: Fired when an invited person verifies, awarding referral points to the referrer.

---

## 4. How to Connect Waitlyze to Cursor, Claude, or Codex

### Option 1: In Cursor (.cursorrules / .cursor/rules)
Add this to your project's \`.cursorrules\` or create \`.cursor/rules/waitlyze.mdc\`:
\`\`\`markdown
---
description: Waitlyze waitlist and pre-launch setup guidance
globs: **/*waitlist*
---
When integrating the waitlist into our application:
- Fetch and reference ${SITE_URL}/agent-instructions.md
- For embeds, use <div class="waitlyze-widget" data-key-id="..." /> with ${SITE_URL}/js/embed.js.
- For custom APIs, call POST ${SITE_URL}/api/waitlist from the server with an x-api-key header, waitlistId, email, and optional referralCode. Never put the API key in client code.
\`\`\`

### Option 2: In Claude Code
Prompt:
\`\`\`bash
claude "Read ${SITE_URL}/agent-instructions.md and integrate the Waitlyze signup widget into our landing page hero component."
\`\`\`

---

## 5. Machine-Readable Discovery Endpoints

- \`/llms.txt\` - Curated index of the entire product for language models.
- \`/rss.xml\` - RSS 2.0 feed for Waitlyze launch guides (also available at \`/blog/feed.xml\`).
- \`/agent-instructions.md\` - This integration guide.
- \`/llms-full.txt\` - Complete consolidated documentation context in a single file.
- \`/api/md/_catalog\` - JSON catalog of all markdown-rendered routes.
- \`/<page>.md\` - Append \`.md\` to a page listed in \`/api/md/_catalog\` (e.g., \`/templates.md\`, \`/blog.md\`) to get pure markdown.
- Content Negotiation: Send \`Accept: text/markdown\` to a page listed in \`/api/md/_catalog\` to receive clean markdown instead of HTML.

---
Official Website: ${SITE_URL}
`;

  return new Response(instructions, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
