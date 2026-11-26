import { getMcpBaseUrl, getMcpResourceUrl, MCP_SCOPES } from "@/lib/mcp/config.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  const baseUrl = getMcpBaseUrl();
  const resource = getMcpResourceUrl();

  const metadata = {
    resource,
    authorization_servers: [`${baseUrl}/api/auth`],
    bearer_methods_supported: ["header"],
    scopes_supported: [...MCP_SCOPES],
    resource_name: "Waitlyze MCP",
    resource_documentation: `${baseUrl}/docs/mcp`,
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
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
