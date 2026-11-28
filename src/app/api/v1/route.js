import { NextResponse } from "next/server";

// JSON response for the bare /api/v1 root. The real v1 surface requires auth
// and lives under concrete resource paths; this root exists so that agents and
// clients probing /api/v1 get a parseable JSON answer, never the HTML 404 page.
const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "private, no-store",
};

export function GET() {
  return NextResponse.json(
    {
      name: "Waitlyze REST API v1",
      description:
        "Workspace-scoped REST API v1. Authenticate with a scoped wl2_ API key via 'Authorization: Bearer wl2_...' or 'X-Api-Key: wl2_...'. Scoped keys: waitlist:read, waitlist:write, waitlist:manage, subscribers:read, subscribers:write, analytics:read, emails:read, emails:write, webhooks:read, webhooks:write, integrations:write, workspace:read, workspace:manage, mcp:read, mcp:write.",
      spec: "https://waitlyze.com/openapi.json",
      resources: {
        workspaces: "/api/v1/workspaces",
        waitlists: "/api/v1/waitlists",
        api_keys: "/api/v1/api-keys",
      },
    },
    { headers: DEFAULT_HEADERS },
  );
}

export function notAllowed() {
  return NextResponse.json(
    {
      success: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "Use GET on this endpoint." },
      message: "Use GET on this endpoint.",
    },
    { status: 405, headers: { ...DEFAULT_HEADERS, Allow: "GET, OPTIONS" } },
  );
}

export const POST = notAllowed;
export const PUT = notAllowed;
export const PATCH = notAllowed;
export const DELETE = notAllowed;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
    },
  });
}
