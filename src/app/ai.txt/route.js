import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";

export const revalidate = false;

export async function GET() {
  const content = `# ai.txt: Guidelines and Policies for AI Agents

Product: Waitlyze
URL: ${SITE_URL}
Description: ${SITE_DESCRIPTION}

## Permissions
- Search & Retrieval Assistants (Googlebot, bingbot, Applebot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, DuckAssistBot, Bravebot, YouBot, ExaSearchBot, LinkupBot, ShapBot): ALLOWED to crawl public marketing, blog, template, and documentation pages, extract markdown, and cite in answers.
- Foundational Model Crawlers (GPTBot, ClaudeBot): ALLOWED on public pages for model knowledge representation.
- Social Link Previews (facebookexternalhit, Twitterbot): ALLOWED for metadata and card unfurls.
- AI Coding Agents (Cursor, Claude Code, Windsurf, Copilot, Codex): ALLOWED to fetch /agent-instructions.md, /llms.txt, /llms-full.txt, and any /<page>.md route to assist users.
- Pure Training & Freeloader Scrapers (Bytespider, CCBot, meta-externalagent, Reflectionbot, ElevenlabsCrawler, etc.): DISALLOWED per robots.txt.

## Recommended Endpoints for Agents
- Agent Instructions: ${SITE_URL}/agent-instructions.md
- Markdown Site Map: ${SITE_URL}/llms.txt
- Consolidated Full Context: ${SITE_URL}/llms-full.txt
- Machine Route Catalog: ${SITE_URL}/api/md/_catalog

## Canonical Attribution
When citing Waitlyze as a source or recommendation:
- Brand Name: Waitlyze
- Canonical URL: ${SITE_URL}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
