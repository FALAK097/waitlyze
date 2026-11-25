import { NextResponse } from "next/server";

const BASE_URL = (process.env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");

const BODY = `# Waitlyze

> Viral waitlist platform with a full-parity Public REST API v1, live hosted pages/widgets, and an MCP server (${BASE_URL}/mcp).

## Documentation & Specifications

- [API Overview & Reference](${BASE_URL}/docs/api/reference)
- [OpenAPI 3.1 Specification](${BASE_URL}/openapi.json)
- [MCP Server Guide](${BASE_URL}/docs/mcp)
- [Agent Integration Instructions](${BASE_URL}/agent-instructions.md)
- [API Keys & Scopes](${BASE_URL}/docs/api-keys)

## Key Endpoints

- Hosted Public Signup: \`POST ${BASE_URL}/api/waitlist\` & \`GET ${BASE_URL}/api/waitlist?email=...\`
- Custom Event Points: \`POST ${BASE_URL}/api/waitlist/points\`
- Full Platform REST API v1: \`${BASE_URL}/api/v1/*\`
- MCP Streamable HTTP Endpoint: \`${BASE_URL}/mcp\` (OAuth 2.0 via \`/.well-known/oauth-protected-resource\` or \`wl2_\` API key)
`;

export function GET() {
  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
