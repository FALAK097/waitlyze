import { getMcpBaseUrl } from "@/lib/mcp/config.mjs";

// The issuer is `${BASE_URL}/api/auth`, so OIDC Discovery 1.0 places the
// metadata document at `${issuer}/.well-known/openid-configuration`. Clients
// and scanners that probe the site root instead are redirected there.
export async function GET() {
  const base = getMcpBaseUrl();
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${base}/api/auth/.well-known/openid-configuration`,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
