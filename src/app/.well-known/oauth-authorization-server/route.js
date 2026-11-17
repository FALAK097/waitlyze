import { MCP_SCOPES } from "@/lib/mcp/config.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
  const authBase = `${baseUrl}/api/auth`;

  const metadata = {
    issuer: authBase,
    authorization_endpoint: `${authBase}/oauth2/authorize`,
    token_endpoint: `${authBase}/oauth2/token`,
    jwks_uri: `${authBase}/jwks`,
    registration_endpoint: `${authBase}/oauth2/register`,
    scopes_supported: ["openid", "profile", "email", "offline_access", ...MCP_SCOPES],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
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
