import { NextResponse } from "next/server";

import { WAITLYZE_PRICING } from "@/lib/billing/pricing.mjs";
import { getPosts } from "@/lib/blog-source";
import { competitors } from "@/lib/comparison-data";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";
import { docsLlms } from "@/lib/source";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { getGalleryMeta } from "@/lib/templates/gallery.mjs";
import { listTools } from "@/lib/tools/registry.mjs";

export const revalidate = false;

export async function GET() {
  const docsIndex = await docsLlms.index();
  // Demote the generated docs title so the file keeps a single H1.
  const docsBody = docsIndex.replace(/^# .*\n+/, "");
  const posts = getPosts()
    .map((post) => `- [${post.data.title}](${SITE_URL}${post.url}): ${post.data.description}`)
    .join("\n");
  const tools = listTools()
    .map((tool) => `- [${tool.title}](${SITE_URL}${tool.path}): ${tool.targetJob}`)
    .join("\n");
  const templates = listTemplates()
    .map((template) => {
      const meta = getGalleryMeta(template.id);
      return `- [${meta?.seoTitle || template.name}](${SITE_URL}/templates/${template.id}): ${meta?.seoDescription || template.description}`;
    })
    .join("\n");
  const comparisons = competitors
    .map(
      (competitor) =>
        `- [${competitor.name} Alternative & Pricing (Waitlyze vs ${competitor.name})](${SITE_URL}/alternatives/${competitor.slug}): ${competitor.name} starts at ${competitor.price} (${competitor.freePlan.toLowerCase()}). ${competitor.summary}`,
    )
    .join("\n");

  const body = `# Waitlyze

> ${SITE_DESCRIPTION}

Waitlyze is open-source waitlist software with a full-parity Public REST API v1, live hosted pages/widgets, verified referrals, consent-aware email, audience analytics, and a Streamable HTTP MCP server (${SITE_URL}/mcp). Free for 1 workspace, 1 waitlist, and 100 lifetime signups; Pro is ${WAITLYZE_PRICING.pro.monthly.formatted}/month or ${WAITLYZE_PRICING.pro.annual.formatted}/year flat per workspace.

## AI Agents & Developers

- [MCP Server](${SITE_URL}/mcp): Streamable HTTP Model Context Protocol (MCP) server (68 tools, OAuth 2.0 via \`/.well-known/oauth-protected-resource\` or \`wl2_\` API key)
- [MCP Documentation](${SITE_URL}/docs/mcp): Complete agent connection instructions, tool references, and schemas
- [API Overview & Reference](${SITE_URL}/docs/api/reference): Full REST API v1 and public signup/lookup endpoints
- [API Keys & Scopes](${SITE_URL}/docs/api-keys): Workspace-scoped and waitlist-scoped \`wl2_\` API keys
- [OpenAPI 3.1 Specification](${SITE_URL}/openapi.json): OpenAPI 3.1.0 schema for public and v1 endpoints
- [Agent Integration Instructions](${SITE_URL}/agent-instructions.md): How to connect Cursor, Claude Code, Codex, ChatGPT, and AI assistants to Waitlyze
- [CLI](https://www.npmjs.com/package/waitlyze): Official \`waitlyze\` CLI on npm — signup, status, points, and REST API v1 passthrough from scripts and agents (\`npx waitlyze@latest --help\`)
- [ARD Manifest](${SITE_URL}/.well-known/ard.json): Agentic Resource Discovery entries for the MCP server and the Waitlyze agent skill
- [Full LLMs Context](${SITE_URL}/llms-full.txt): Complete product knowledge base in one file
- [Markdown Route Catalog](${SITE_URL}/api/md/_catalog): Machine-readable index of all markdown routes
- [AI Policy (ai.txt)](${SITE_URL}/ai.txt): Permissions and crawler policy
- [Site Search for Agents](${SITE_URL}/.well-known/search?q={query}): Retrieval endpoint for AI agents. \`GET\` with \`?q=\` or HTTP \`QUERY\` with a text/plain or JSON body; returns the most relevant Markdown chunks (docs, blog, comparisons, templates) instead of whole pages

## Key Endpoints

- Hosted Public Signup: \`POST ${SITE_URL}/api/waitlist\` & \`GET ${SITE_URL}/api/waitlist?email=...\`
- Custom Event Points: \`POST ${SITE_URL}/api/waitlist/points\`
- Full Platform REST API v1: \`${SITE_URL}/api/v1/*\`
- MCP Streamable HTTP Endpoint: \`${SITE_URL}/mcp\`
- Agent Site Search: \`GET ${SITE_URL}/.well-known/search?q=...\` or \`QUERY ${SITE_URL}/.well-known/search\` (plain text or \`{"q":"..."}\` body)

## Launch Lab (Free Pre-Launch Tools & Research)

- [Waitlyze Launch Lab Hub](${SITE_URL}/tools): 14 free, no-login pre-launch calculators, page graders, copy builders, and DNS/health diagnostics with direct campaign blueprint handoff
${tools}

## Product & Templates

- [Home](${SITE_URL}): Overview, features, pricing ($0 Free / ${WAITLYZE_PRICING.pro.monthly.formatted} per month Pro), and FAQ
- [Features](${SITE_URL}/features): Waitlist page builder, referrals, email, analytics, and developer tools
- [Pricing](${SITE_URL}/pricing): Free plan limits and Pro pricing (${WAITLYZE_PRICING.pro.monthly.formatted}/month or ${WAITLYZE_PRICING.pro.annual.formatted}/year)
- [About](${SITE_URL}/about): Open-source story, product principles, and builder details
- [Waitlist Templates Gallery](${SITE_URL}/templates): 14 free waitlist landing page templates for SaaS, AI, mobile, newsletter, event, and pre-order launches
${templates}
- [Changelog](${SITE_URL}/docs/changelog): Release notes and product updates

## Comparisons & Alternatives

- [Waitlist Software Comparison (7 Tools Side by Side)](${SITE_URL}/compare): Compare Waitlyze, GetWaitlist, LaunchList, Prefinery, KickoffLabs, Viral Loops, and Waitlister on free plans, pricing models, referrals, email, analytics, and API access
- [Best Waitlist Software Alternatives](${SITE_URL}/alternatives): Overview of dedicated waitlist and referral platforms
${comparisons}

## Playbooks & Guides

${posts}

## Documentation

${docsBody}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
