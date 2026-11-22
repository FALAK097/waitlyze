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

Waitlyze is open-source waitlist software for founders and product teams. Create a branded waitlist page or embed a signup form, grow the list with verified referrals, send email broadcasts and automations, and read signup, source, and device analytics. Free for 1 workspace, 1 waitlist, and 100 lifetime signups; Pro is ${WAITLYZE_PRICING.pro.monthly.formatted}/month or ${WAITLYZE_PRICING.pro.annual.formatted}/year flat per workspace. A public API, webhooks, and integrations (Resend, Slack, Discord, Zapier, MCP) are available.

## AI Agents & Developers

- [MCP Server](${SITE_URL}/mcp): Streamable HTTP Model Context Protocol (MCP) server for Claude Code, Cursor, Codex, VS Code, Gemini, and OpenCode (includes read-only Launch Lab planning tools: calculate_viral_growth, simulate_waitlist_queue, recommend_waitlist_template, design_referral_rewards, plan_launch_timeline)
- [MCP Documentation](${SITE_URL}/docs/mcp): Complete agent connection instructions, tool references, and schemas
- [AI Agent Instructions](${SITE_URL}/agent-instructions.md): How to connect Cursor, Claude Code, and AI assistants to Waitlyze
- [Full LLMs Context](${SITE_URL}/llms-full.txt): Complete product knowledge base in one file
- [Markdown Route Catalog](${SITE_URL}/api/md/_catalog): Machine-readable index of all markdown routes
- [AI Policy (ai.txt)](${SITE_URL}/ai.txt): Permissions and crawler policy

## Launch Lab (Free Pre-Launch Tools & Research)

- [Waitlyze Launch Lab Hub](${SITE_URL}/tools): 14 free, no-login pre-launch calculators, page graders, copy builders, and DNS/health diagnostics with direct campaign blueprint handoff
${tools}

## Product & Templates

- [Home](${SITE_URL}): Overview, features, pricing ($0 Free / ${WAITLYZE_PRICING.pro.monthly.formatted} per month Pro), and FAQ
- [Features](${SITE_URL}/#features): Waitlist page builder, referrals, email, analytics, and developer tools
- [Pricing](${SITE_URL}/pricing): Free plan limits and Pro pricing (${WAITLYZE_PRICING.pro.monthly.formatted}/month or ${WAITLYZE_PRICING.pro.annual.formatted}/year)
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

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
