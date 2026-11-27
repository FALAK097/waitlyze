import { NextResponse } from "next/server";

const BASE_URL = (process.env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");

const BODY = `# Waitlyze Agent Instructions

Base URL: ${BASE_URL}
OpenAPI Spec: ${BASE_URL}/openapi.json
MCP Server: ${BASE_URL}/mcp (Streamable HTTP, MCP v0.13.0)
OAuth Discovery: ${BASE_URL}/.well-known/oauth-protected-resource

## Authentication

1. **API Keys (\`wl2_...\`)**: Pass \`Authorization: Bearer wl2_<keyId>_<secret>\` or \`X-Api-Key: wl2_<keyId>_<secret>\`.
   - Keys may be **waitlist-scoped** or **workspace-scoped** with granular scopes:
     \`waitlist:read\`, \`waitlist:write\`, \`waitlist:manage\`, \`subscribers:read\`, \`subscribers:write\`, \`analytics:read\`, \`emails:read\`, \`emails:write\`, \`webhooks:read\`, \`webhooks:write\`, \`integrations:write\`, \`workspace:read\`, \`workspace:manage\`, \`mcp:read\`, \`mcp:write\`.
2. **OAuth 2.0 / OIDC** (for MCP clients & agent integrations): Discover endpoints via \`/.well-known/oauth-protected-resource\`.

## Site Search for Agents (No Authentication)

Search Waitlyze's public content (marketing, docs, blog, comparisons, templates) instead of crawling individual pages. The endpoint returns the most relevant Markdown chunks, not a generated answer.

- \`GET ${BASE_URL}/.well-known/search?q=<keywords or natural-language question>\`
- \`QUERY ${BASE_URL}/.well-known/search\` with \`Content-Type: text/plain\` (raw query) or \`application/json\` (\`{"q":"..."}\`)

## High-Throughput Public Signup & Lookup Endpoints

- \`POST /api/waitlist\`: Idempotently create or replay a signup (\`email\`, \`ref\`/\`referralCode\`, \`phone\`, \`customFields\`, \`marketingConsent\`, UTMs). Returns \`201 Created\` (new) or \`200 OK\` (existing) with live \`position\`, \`points\`, \`referral_link\`, \`total_signups\`, and \`waitlist_url\`.
- \`GET /api/waitlist?email=...\`: Look up live \`position\`, \`points\`, \`referrals_count\`, \`total_signups\`, \`referral_link\`, \`verified\`, \`custom_fields\`, and \`marketing_consent\`.
- \`POST /api/waitlist/points\`: Award custom event points to a verified subscriber (\`email\`, \`event\`, optional \`idempotencyKey\`).

## Full Platform Control via REST API v1 (\`/api/v1\`)

Every dashboard workflow is available programmatically:

- **Workspaces & Team**: \`GET/POST /api/v1/workspaces\`, \`GET/PATCH /api/v1/workspaces/{workspaceId}\`, \`/members\`, \`/audit\`, \`/suppressions\`, \`/integrations/resend\`, \`/integrations/cloudflare-email\`
- **API Keys**: \`GET/POST /api/v1/api-keys\`, \`DELETE /api/v1/api-keys/{id}\`
- **Waitlists & Page Builder**: \`GET/POST /api/v1/waitlists\`, \`GET/PATCH/DELETE /api/v1/waitlists/{id}\`, \`GET/PUT/PATCH /api/v1/waitlists/{id}/page\`, \`POST /rehearsal\`, \`POST /publish\`, \`POST /pause\`, \`POST /rollback\`
- **Analytics & Referrals**: \`GET /api/v1/waitlists/{id}/analytics\`, \`GET /api/v1/waitlists/{id}/referrals/reviews\`, \`PATCH /api/v1/waitlists/{id}/referrals/reviews/{referralId}\`
- **Subscribers**: \`GET/POST /api/v1/waitlists/{id}/subscribers\` (single or up to 500 JSON rows), \`GET/PATCH/DELETE /subscribers/{subscriberId}\`, \`POST /subscribers/{subscriberId}/points\`, \`POST /subscribers/batch\`, \`GET /subscribers/export\` (JSON or CSV)
- **Emails (Broadcasts, Templates, Automations)**: \`/broadcasts\`, \`/broadcasts/preview\`, \`/broadcasts/{broadcastId}/(send|schedule|cancel|test)\`, \`/email-templates\`, \`/email-templates/test\`, \`/automations\`, \`/automations/{recipeId}\`, \`/automations/{recipeId}/test\`, \`/email-logs\`
- **Domains, Senders, Alerts & Webhooks**: \`/domain\`, \`/email-sender\`, \`/notifications/{slack|discord}\`, \`/webhooks\`, \`/webhooks/{subscriptionId}/(test|rotate|deliveries)\`

## MCP Capabilities

Connect your agent to \`${BASE_URL}/mcp\` for:
- **68 MCP tools** covering workspaces, waitlists, page builder, form/reward rules, rehearsal/publish/rollback, analytics, subscribers, bulk import/actions, fraud review, broadcasts, templates, automations, custom domains, senders, webhooks, Slack/Discord alerts, API keys, and Launch Lab calculators.
- **MCP Resources** (\`waitlyze://workspaces\`, \`waitlyze://waitlists\`, \`waitlyze://waitlists/{waitlistId}/*\`, \`waitlyze://guide/workflow\`).
- **MCP Prompts** (\`launch_waitlist\`, \`diagnose_waitlist_growth\`, \`send_waitlist_broadcast\`, \`import_and_onboard_subscribers\`).
`;

export function GET() {
  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=300",
    },
  });
}
