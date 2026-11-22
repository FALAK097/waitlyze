import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-metadata";

export const revalidate = false;

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Waitlyze Public Waitlist API",
    version: "1.0.0",
    description: `${SITE_DESCRIPTION} Authenticate server-side calls with a waitlist-scoped API key via X-Api-Key or Authorization: Bearer.`,
    contact: {
      name: "Waitlyze Support",
      url: `${SITE_URL}/support`,
      email: "support@waitlyze.com",
    },
    license: {
      name: "MIT",
      url: "https://github.com/FALAK097/waitlyze",
    },
  },
  servers: [{ url: SITE_URL, description: "Production" }],
  security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
  paths: {
    "/api/waitlist": {
      post: {
        operationId: "createWaitlistSignup",
        summary: "Create a waitlist signup",
        description:
          "Add a subscriber to a published waitlist from your backend, assign a referral code, and return queue position, points, and reward progress.",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            description: "1-128 characters (A-Z, a-z, 0-9, _, -) for safe retries.",
            schema: { type: "string", pattern: "^[A-Za-z0-9_-]{1,128}$" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSignupRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Idempotent replay or existing verified signup status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupStatusResponse" },
              },
            },
          },
          201: {
            description: "Signup created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupStatusResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/ErrorResponse" },
          401: { $ref: "#/components/responses/ErrorResponse" },
          409: { $ref: "#/components/responses/ErrorResponse" },
          429: { $ref: "#/components/responses/ErrorResponse" },
        },
      },
      get: {
        operationId: "getWaitlistSignupStatus",
        summary: "Look up waitlist signup status",
        description:
          "Retrieve a subscriber's current queue position, verification state, points balance, referral count, and personal referral link.",
        parameters: [
          {
            name: "waitlistId",
            in: "query",
            required: true,
            description: "Waitlist ID linked to the API key.",
            schema: { type: "string", maxLength: 128 },
          },
          {
            name: "email",
            in: "query",
            required: true,
            description: "Subscriber email address.",
            schema: { type: "string", format: "email", maxLength: 320 },
          },
        ],
        responses: {
          200: {
            description: "Subscriber status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupStatusResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/ErrorResponse" },
          401: { $ref: "#/components/responses/ErrorResponse" },
          404: { $ref: "#/components/responses/ErrorResponse" },
          429: { $ref: "#/components/responses/ErrorResponse" },
        },
      },
    },
    "/api/waitlist/points": {
      post: {
        operationId: "awardCustomWaitlistPoints",
        summary: "Award custom referral points",
        description:
          "Credit points to a verified subscriber for a configured or explicit off-site event such as completing a survey or joining a community.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AwardPointsRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Points award result",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AwardPointsResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/ErrorResponse" },
          401: { $ref: "#/components/responses/ErrorResponse" },
          404: { $ref: "#/components/responses/ErrorResponse" },
          409: { $ref: "#/components/responses/ErrorResponse" },
          429: { $ref: "#/components/responses/ErrorResponse" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Api-Key",
        description: "Waitlist-scoped API key created in Settings -> API keys.",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Waitlist-scoped API key or OAuth 2.1 access token.",
      },
    },
    responses: {
      ErrorResponse: {
        description: "Structured JSON error response",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
          },
        },
      },
    },
    schemas: {
      CreateSignupRequest: {
        type: "object",
        required: ["waitlistId", "email"],
        properties: {
          waitlistId: { type: "string", maxLength: 128 },
          email: { type: "string", format: "email", maxLength: 320 },
          referralCode: { type: "string", description: "Optional referrer code." },
          marketingConsent: { type: "boolean", description: "Explicit marketing opt-in flag." },
          "cf-turnstile-response": {
            type: "string",
            description: "Cloudflare Turnstile token when enabled on the waitlist.",
          },
        },
      },
      SignupStatusData: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          position: { type: "integer" },
          display_position: { type: "integer" },
          points: { type: "integer" },
          referral_count: { type: "integer" },
          next_reward: { type: ["object", "null"] },
          unlocked_rewards: { type: "array", items: { type: "object" } },
          spots_to_advance: { type: "integer" },
          counts_hidden: { type: "boolean" },
          referral_code: { type: ["string", "null"] },
          referral_link: { type: "string" },
          verified: { type: "boolean" },
        },
      },
      SignupStatusResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean" },
          data: { $ref: "#/components/schemas/SignupStatusData" },
        },
      },
      AwardPointsRequest: {
        type: "object",
        required: ["waitlistId", "event"],
        properties: {
          waitlistId: { type: "string", maxLength: 128 },
          email: { type: "string", format: "email", maxLength: 320 },
          signupId: { type: "string" },
          event: { type: "string", pattern: "^[a-z0-9-]{1,40}$" },
          points: { type: "integer", minimum: 0, maximum: 100000 },
          label: { type: "string", maxLength: 80 },
          idempotencyKey: { type: "string", pattern: "^[A-Za-z0-9_-]{1,128}$" },
        },
      },
      AwardPointsResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              awarded: { type: "boolean" },
              event: { type: "string" },
              label: { type: "string" },
              points: { type: "integer" },
              balance: { type: "integer" },
            },
          },
        },
      },
      ApiError: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean" },
          error: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
};

export async function GET() {
  return new Response(JSON.stringify(openApiSpec, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/openapi+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
