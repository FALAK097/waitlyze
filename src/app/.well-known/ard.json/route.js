import { SITE_URL } from "@/lib/site-metadata";

// Agentic Resource Discovery (ARD) manifest — https://agenticresourcediscovery.org/spec/
// Lets AI agents and registries discover Waitlyze's agent-facing artifacts.
// Entries use only ARD-standard media types and carry 2-5 representative
// queries each, so conformance validators score the manifest without warnings.
const UPDATED_AT = "2026-11-28T00:00:00.000Z";

const manifest = {
  entries: [
    {
      identifier: "urn:air:waitlyze.com:mcp:waitlyze",
      displayName: "Waitlyze MCP Server",
      type: "application/mcp-server-card+json",
      url: `${SITE_URL}/mcp`,
      description:
        "Waitlist software MCP server with 68 tools for managing waitlists, referrals, subscribers, broadcasts, and launch analytics. Streamable HTTP with OAuth 2.0 or API key auth.",
      capabilities: [
        "list-workspaces",
        "create-waitlist",
        "list-subscribers",
        "get-analytics",
        "send-broadcast",
      ],
      tags: ["waitlist", "waitlist-software", "referrals", "pre-launch", "analytics", "mcp"],
      version: "0.13.0",
      updatedAt: UPDATED_AT,
      representativeQueries: [
        "connect an MCP server to manage my waitlist",
        "check my waitlist signups and referral analytics",
        "send a launch email broadcast to my subscribers",
        "create a new waitlist with referral rewards",
        "export my waitlist subscribers",
      ],
      trustManifest: {
        identity: SITE_URL,
        identityType: "https",
      },
    },
    {
      identifier: "urn:air:waitlyze.com:skills:waitlyze",
      displayName: "Waitlyze Agent Skill",
      type: "application/agent-skills+md",
      url: "https://github.com/FALAK097/waitlyze/blob/main/SKILL.md",
      description:
        "Agent skill for connecting AI coding agents to Waitlyze: manage waitlists, referrals, subscribers, and launch analytics through its remote MCP server.",
      tags: ["waitlist", "mcp", "agent-skill", "launch", "email"],
      version: "0.13.0",
      updatedAt: UPDATED_AT,
      representativeQueries: [
        "connect Claude Code or Cursor to my Waitlyze workspace",
        "inspect my waitlist subscribers from an AI coding agent",
      ],
      trustManifest: {
        identity: SITE_URL,
        identityType: "https",
      },
    },
  ],
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
      ...CORS_HEADERS,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
