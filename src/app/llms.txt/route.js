import { getPosts } from "@/lib/blog-source";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import { docsLlms } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const docsIndex = await docsLlms.index();
  // Demote the generated docs title so the file keeps a single H1.
  const docsBody = docsIndex.replace(/^# .*\n+/, "");
  const posts = getPosts()
    .map((post) => `- [${post.data.title}](${SITE_URL}${post.url}): ${post.data.description}`)
    .join("\n");

  const body = `# Waitlyze

> ${SITE_DESCRIPTION}

Waitlyze is a waitlist builder for founders and marketing teams. Create a branded waitlist page or embed a signup form, grow the list with verified referrals, send email broadcasts and automations, and read signup, source, and device analytics. A public API, webhooks, and integrations (Resend, Slack, Discord, Zapier) are available.

## AI Agents & Developers

- [AI Agent Instructions](${SITE_URL}/agent-instructions.md): How to connect Cursor, Claude Code, and AI assistants to Waitlyze
- [Full LLMs Context](${SITE_URL}/llms-full.txt): Complete product knowledge base in one file
- [Markdown Route Catalog](${SITE_URL}/api/md/_catalog): Machine-readable index of all markdown routes
- [AI Policy (ai.txt)](${SITE_URL}/ai.txt): Permissions and crawler policy

## Product & Templates

- [Home](${SITE_URL}): Overview, features, and FAQ
- [Waitlist Templates](${SITE_URL}/templates): 14 templates for SaaS, AI, mobile, newsletter, event, and pre-order launches
- [Changelog](${SITE_URL}/docs/changelog): Release notes

## Playbooks & Guides

${posts}

## Documentation

${docsBody}`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
