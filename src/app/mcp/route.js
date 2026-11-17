import { createMcpHandler } from "@modelcontextprotocol/server";

import { resolveMcpAuth } from "@/lib/mcp/auth.js";
import { createWaitlyzeMcpServer } from "@/lib/mcp/server.js";
import prisma from "@/lib/prisma.js";
import { checkRateLimit } from "@/lib/rate-limit.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, x-waitlyze-api-key, mcp-session-id, mcp-method, mcp-name, mcp-protocol-version, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "mcp-session-id, WWW-Authenticate, Link",
};

const mcpHandler = createMcpHandler(
  async ({ requestInfo }) => {
    const authContext = await resolveMcpAuth(requestInfo);
    return createWaitlyzeMcpServer(authContext);
  },
  {
    responseMode: "json",
  },
);

function applyCors(response) {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  if (!headers.has("Link")) {
    headers.set(
      "Link",
      `<${baseUrl}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function createAuthChallenge({ baseUrl, error, id = null, invalidToken = false }) {
  const challengeParams = [
    invalidToken ? 'error="invalid_token"' : null,
    invalidToken && error ? `error_description="${error.replaceAll('"', "'")}"` : null,
    `resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
  ].filter(Boolean);

  return applyCors(
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: error || "Authentication required to access Waitlyze.",
        },
        id,
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer ${challengeParams.join(", ")}`,
        },
      },
    ),
  );
}

async function normalizeRequest(request) {
  const url = request.url;
  const newHeaders = new Headers(request.headers);
  const accept = newHeaders.get("accept") || "";
  if (!accept.includes("text/event-stream")) {
    newHeaders.set("accept", "application/json, text/event-stream");
  }
  const bodyText = await request.text();
  let parsedBody = null;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    // Leave null if invalid JSON
  }
  return {
    req: new Request(url, {
      method: request.method,
      headers: newHeaders,
      body: bodyText,
    }),
    parsedBody,
  };
}

export async function POST(request) {
  try {
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown-client";
    try {
      const allowed = await checkRateLimit(prisma, `mcp:${clientIp}`, 120, 60 * 1000);
      if (!allowed) {
        return applyCors(
          new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "Rate limit exceeded. Too many MCP requests.",
              },
              id: null,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "60",
              },
            },
          ),
        );
      }
    } catch (rateLimitErr) {
      console.warn("MCP rate limit check skipped:", rateLimitErr?.message || rateLimitErr);
    }

    const { req, parsedBody } = await normalizeRequest(request);

    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-waitlyze-api-key");
    const hasAuthToken = Boolean(authHeader || apiKeyHeader);
    const authContext = await resolveMcpAuth(req);

    const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
    const isToolCall = parsedBody?.method === "tools/call";

    // Unauthenticated callers can discover capabilities (initialize, tools/list)
    // so MCP clients like ChatGPT can inspect tools before user sign-in.
    // Execution (tools/call) or requests with invalid tokens are challenged with 401.
    if (!authContext.authenticated && (hasAuthToken || isToolCall)) {
      return createAuthChallenge({
        baseUrl,
        error: authContext.error,
        id: parsedBody?.id ?? null,
        invalidToken: hasAuthToken,
      });
    }

    const response = await mcpHandler.fetch(req, { parsedBody });
    return applyCors(response);
  } catch (error) {
    console.error("MCP handler error:", error);
    return applyCors(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal MCP error",
          },
          id: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  }
}

export async function GET(request) {
  const accept = request.headers.get("accept") || "";
  const hasMcpHeader = request.headers.has("mcp-method") || request.headers.has("mcp-session-id");

  if (accept.includes("text/event-stream") || hasMcpHeader) {
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-waitlyze-api-key");
    const hasAuthToken = Boolean(authHeader || apiKeyHeader);
    const authContext = await resolveMcpAuth(request);

    if (!authContext.authenticated && hasAuthToken) {
      const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
      return createAuthChallenge({
        baseUrl,
        error: authContext.error,
        invalidToken: true,
      });
    }

    const response = await mcpHandler.fetch(request);
    return applyCors(response);
  }

  const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
  return applyCors(
    new Response(
      JSON.stringify(
        {
          name: "waitlyze-mcp",
          version: "0.10.0",
          description: "First-class Model Context Protocol (MCP) server for Waitlyze",
          endpoint: `${baseUrl}/mcp`,
          protocol: "Streamable HTTP (2026-01-26)",
          documentation: `${baseUrl}/docs/mcp`,
          authentication: {
            oauth2: {
              type: "OAuth 2.0 (RFC 9728)",
              protectedResourceMetadata: `${baseUrl}/.well-known/oauth-protected-resource`,
              authorizationServerMetadata: `${baseUrl}/.well-known/oauth-authorization-server`,
              scopes: ["mcp:read", "mcp:write"],
            },
            apiKey: {
              type: "Bearer Token or Header",
              formats: ["Authorization: Bearer wl2_...", "x-waitlyze-api-key: wl2_..."],
            },
          },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
