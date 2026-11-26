const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GLAMA_CLAIM = {
  $schema: "https://glama.ai/mcp/schemas/connector.json",
  claim: "glama_claim_l6KGnx4tOMpAehMmUuEQF0WJcFrs_1Eh",
};

export async function GET() {
  return new Response(JSON.stringify(GLAMA_CLAIM, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
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
