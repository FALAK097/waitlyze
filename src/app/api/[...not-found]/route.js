import { NextResponse } from "next/server";

// Catch-all for unmatched /api/* paths. Unknown API endpoints must return a
// structured JSON error instead of Next's HTML 404 page, so agents and API
// clients can parse the failure. Real routes always take precedence over this
// catch-all; only genuinely unknown paths land here.
function apiNotFound() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Unknown API endpoint. See https://waitlyze.com/openapi.json for the API surface.",
      },
      message: "Unknown API endpoint. See https://waitlyze.com/openapi.json for the API surface.",
    },
    {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export const GET = apiNotFound;
export const POST = apiNotFound;
export const PUT = apiNotFound;
export const PATCH = apiNotFound;
export const DELETE = apiNotFound;
export const HEAD = apiNotFound;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
    },
  });
}
