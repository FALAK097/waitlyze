import { NextResponse } from "next/server";

// JSON responses for the API root. Unknown or bare API paths must never fall
// through to the HTML 404 page — agents and API clients parse JSON errors.
const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "private, no-store",
};

export function GET() {
  return NextResponse.json(
    {
      name: "Waitlyze API",
      description:
        "Waitlyze machine surface: public signup endpoints and the REST API v1. See the OpenAPI specification for the full, typed surface.",
      links: {
        openapi: "https://waitlyze.com/openapi.json",
        agent_instructions: "https://waitlyze.com/agent-instructions.md",
        api_reference: "https://waitlyze.com/docs/api/reference",
        oauth_protected_resource: "https://waitlyze.com/.well-known/oauth-protected-resource",
        oauth_authorization_server: "https://waitlyze.com/.well-known/oauth-authorization-server",
        ard_manifest: "https://waitlyze.com/.well-known/ard.json",
      },
      endpoints: {
        create_signup: "POST /api/waitlist",
        lookup_signup: "GET /api/waitlist?waitlistId=...&email=...",
        award_event_points: "POST /api/waitlist/points",
        rest_api_v1: "/api/v1/* (Bearer or X-Api-Key auth; see OpenAPI spec)",
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
