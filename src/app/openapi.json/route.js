import { NextResponse } from "next/server";

const BASE_URL = (process.env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");

function buildSpec() {
  const errResp = {
    description: "Error response",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", enum: [false] },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
            message: { type: "string" },
          },
        },
      },
    },
  };

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Waitlyze Public REST API",
      version: "1.3.0",
      description:
        "Complete REST API for Waitlyze: high-throughput subscriber signup & lookup, referral points, waitlist lifecycle, hosted page snapshots, form rules, referral fraud review, analytics, email templates/automations/broadcasts, webhooks, custom domains, integrations, and workspaces.",
    },
    servers: [{ url: BASE_URL, description: "Waitlyze API Host" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Waitlyze API key (wl2_<keyId>_<secret>) or OAuth 2.0 access token.",
        },
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Api-Key",
          description: "Waitlyze API key (wl2_<keyId>_<secret>).",
        },
      },
    },
    security: [{ BearerAuth: [] }, { ApiKeyHeader: [] }],
    paths: {
      "/api/waitlist": {
        get: {
          summary: "Look up subscriber by email (live position & total_signups)",
          parameters: [
            {
              name: "waitlistId",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "email",
              in: "query",
              required: true,
              schema: { type: "string", format: "email" },
            },
          ],
          responses: {
            200: {
              description: "Live subscriber position, points, referral link, and total_signups",
            },
            404: errResp,
          },
        },
        post: {
          summary: "Create or replay a waitlist signup",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["waitlistId", "email"],
                  properties: {
                    waitlistId: { type: "string" },
                    email: { type: "string", format: "email" },
                    ref: { type: "string" },
                    referralCode: { type: "string" },
                    phone: { type: "string" },
                    customFields: { type: "object", additionalProperties: true },
                    marketingConsent: { type: "boolean" },
                    utm_source: { type: "string" },
                    utm_medium: { type: "string" },
                    utm_campaign: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Subscriber created with live waitlist position & total_signups" },
            200: {
              description:
                "Existing subscriber returned idempotently with live position & total_signups",
            },
          },
        },
      },
      "/api/waitlist/points": {
        post: {
          summary: "Award custom event points to a verified subscriber",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "event"],
                  properties: {
                    email: { type: "string", format: "email" },
                    event: { type: "string" },
                    idempotencyKey: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Updated points balance" }, 400: errResp },
        },
      },
      "/api/v1/workspaces": {
        get: {
          summary: "List workspaces with live waitlist/member/signup counts",
          responses: { 200: { description: "Workspace list" } },
        },
        post: {
          summary: "Create a team workspace",
          responses: { 201: { description: "Workspace created" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "Get workspace details, plan entitlements, usage, and integrations",
          responses: { 200: { description: "Workspace detail" } },
        },
        patch: {
          summary: "Rename workspace",
          responses: { 200: { description: "Workspace updated" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/members": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "List workspace members and active invitations",
          responses: { 200: { description: "Members & invites" } },
        },
        post: {
          summary: "Invite teammate to workspace",
          responses: { 201: { description: "Invitation sent" } },
        },
        patch: {
          summary: "Change workspace member role",
          responses: { 200: { description: "Role updated" } },
        },
        delete: {
          summary: "Remove member or revoke pending invitation",
          responses: { 200: { description: "Removed" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/audit": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "List paginated workspace audit events",
          responses: { 200: { description: "Audit events" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/suppressions": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "List email suppressions",
          responses: { 200: { description: "Suppression list" } },
        },
        post: {
          summary: "Add address to suppression list",
          responses: { 201: { description: "Added" } },
        },
        delete: {
          summary: "Remove address from suppression list",
          responses: { 200: { description: "Deleted" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/integrations/resend": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "Get workspace Resend sender status",
          responses: { 200: { description: "Resend config" } },
        },
        put: {
          summary: "Connect/update workspace Resend API key & From email",
          responses: { 200: { description: "Saved" } },
        },
        delete: {
          summary: "Disconnect workspace Resend integration",
          responses: { 200: { description: "Disconnected" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/integrations/resend/test": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Send test email via workspace Resend connection",
          responses: { 200: { description: "Sent" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/integrations/resend/domains": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "List verified Resend sending domains",
          responses: { 200: { description: "Domains list" } },
        },
      },
      "/api/v1/workspaces/{workspaceId}/integrations/cloudflare-email": {
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "Get workspace Cloudflare Email Sending connection",
          responses: { 200: { description: "Config" } },
        },
        put: {
          summary: "Connect workspace Cloudflare Email Sending",
          responses: { 200: { description: "Saved" } },
        },
        delete: {
          summary: "Disconnect workspace Cloudflare Email Sending",
          responses: { 200: { description: "Disconnected" } },
        },
      },
      "/api/v1/api-keys": {
        get: { summary: "List API keys", responses: { 200: { description: "API keys" } } },
        post: {
          summary: "Create waitlist- or workspace-scoped wl2_ API key",
          responses: { 201: { description: "Key created (secret shown once)" } },
        },
      },
      "/api/v1/api-keys/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        delete: { summary: "Revoke API key", responses: { 200: { description: "Revoked" } } },
      },
      "/api/v1/waitlists": {
        get: {
          summary: "List waitlists with live totalSignups",
          responses: { 200: { description: "Waitlists" } },
        },
        post: {
          summary: "Create draft waitlist",
          responses: { 201: { description: "Waitlist created" } },
        },
      },
      "/api/v1/waitlists/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Get waitlist details with live totalSignups, verifiedSignups, customDomain",
          responses: { 200: { description: "Waitlist" } },
        },
        patch: {
          summary: "Update waitlist settings",
          responses: { 200: { description: "Updated" } },
        },
        delete: { summary: "Delete waitlist", responses: { 200: { description: "Deleted" } } },
      },
      "/api/v1/waitlists/{id}/page": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Get hosted page snapshot, form rules, and rewards",
          responses: { 200: { description: "Snapshot" } },
        },
        put: {
          summary: "Replace or patch draft snapshot",
          responses: { 200: { description: "Saved" } },
        },
        patch: {
          summary: "Patch form rules, rewards/tiers, or snapshot sections",
          responses: { 200: { description: "Updated" } },
        },
      },
      "/api/v1/waitlists/{id}/rehearsal": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Run pre-flight launch readiness rehearsal checks",
          responses: { 200: { description: "Rehearsal report" } },
        },
      },
      "/api/v1/waitlists/{id}/publish": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Publish waitlist draft snapshot live",
          responses: { 200: { description: "Published" } },
        },
      },
      "/api/v1/waitlists/{id}/pause": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: { summary: "Pause live waitlist", responses: { 200: { description: "Paused" } } },
      },
      "/api/v1/waitlists/{id}/rollback": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Rollback published snapshot to previous revision",
          responses: { 200: { description: "Rolled back" } },
        },
      },
      "/api/v1/waitlists/{id}/analytics": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Get live waitlist funnel, traffic, referral, and geo/device analytics",
          responses: { 200: { description: "Analytics" } },
        },
      },
      "/api/v1/waitlists/{id}/subscribers": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "List paginated subscribers with live positions & points",
          responses: { 200: { description: "Subscribers" } },
        },
        post: {
          summary: "Add subscriber or bulk import up to 500 JSON subscribers",
          responses: { 201: { description: "Added/imported" } },
        },
      },
      "/api/v1/waitlists/{id}/subscribers/{subscriberId}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriberId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "Get subscriber details with live totalSignups & reward progress",
          responses: { 200: { description: "Subscriber" } },
        },
        patch: {
          summary: "Update subscriber verification, phone, customFields, marketingConsent",
          responses: { 200: { description: "Updated" } },
        },
        delete: { summary: "Delete subscriber", responses: { 200: { description: "Deleted" } } },
      },
      "/api/v1/waitlists/{id}/subscribers/{subscriberId}/points": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriberId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Award custom event points to subscriber",
          responses: { 200: { description: "Points awarded" } },
        },
      },
      "/api/v1/waitlists/{id}/subscribers/batch": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Bulk offboard, resubscribe, delete, or retry verification emails",
          responses: { 200: { description: "Batch result" } },
        },
      },
      "/api/v1/waitlists/{id}/subscribers/export": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Paginated export (JSON or CSV)",
          responses: { 200: { description: "Export payload" } },
        },
      },
      "/api/v1/waitlists/{id}/referrals/reviews": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "List flagged referral fraud reviews",
          responses: { 200: { description: "Reviews" } },
        },
      },
      "/api/v1/waitlists/{id}/referrals/reviews/{referralId}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "referralId", in: "path", required: true, schema: { type: "string" } },
        ],
        patch: {
          summary: "Approve or exclude a flagged referral",
          responses: { 200: { description: "Resolved" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: { summary: "List broadcasts", responses: { 200: { description: "Broadcasts" } } },
        post: {
          summary: "Create draft broadcast",
          responses: { 201: { description: "Draft broadcast created" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/preview": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Preview eligible recipient count and masked sample emails",
          responses: { 200: { description: "Preview" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/{broadcastId}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "broadcastId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: { summary: "Get broadcast detail", responses: { 200: { description: "Broadcast" } } },
        patch: {
          summary: "Update draft broadcast",
          responses: { 200: { description: "Updated" } },
        },
        delete: {
          summary: "Delete draft/canceled broadcast",
          responses: { 200: { description: "Deleted" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/{broadcastId}/send": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "broadcastId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Queue and send broadcast immediately",
          responses: { 200: { description: "Queued" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/{broadcastId}/schedule": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "broadcastId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Schedule broadcast for a future ISO timestamp",
          responses: { 200: { description: "Scheduled" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/{broadcastId}/cancel": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "broadcastId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Cancel scheduled or sending broadcast",
          responses: { 200: { description: "Canceled" } },
        },
      },
      "/api/v1/waitlists/{id}/broadcasts/{broadcastId}/test": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "broadcastId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: { summary: "Send test broadcast email", responses: { 200: { description: "Sent" } } },
      },
      "/api/v1/waitlists/{id}/automations": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "List lifecycle automation recipes",
          responses: { 200: { description: "Automations" } },
        },
      },
      "/api/v1/waitlists/{id}/automations/{recipeId}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "recipeId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: { summary: "Get automation recipe", responses: { 200: { description: "Recipe" } } },
        patch: {
          summary: "Update automation config or ENABLED/PAUSED status",
          responses: { 200: { description: "Updated" } },
        },
      },
      "/api/v1/waitlists/{id}/automations/{recipeId}/test": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "recipeId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Send test automation email",
          responses: { 200: { description: "Sent" } },
        },
      },
      "/api/v1/waitlists/{id}/email-templates": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "List transactional email templates",
          responses: { 200: { description: "Templates" } },
        },
        put: {
          summary: "Create or update a transactional email template",
          responses: { 200: { description: "Saved" } },
        },
      },
      "/api/v1/waitlists/{id}/email-templates/test": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Send test transactional template email",
          responses: { 200: { description: "Sent" } },
        },
      },
      "/api/v1/waitlists/{id}/email-logs": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "List recent automation & broadcast delivery logs",
          responses: { 200: { description: "Logs" } },
        },
      },
      "/api/v1/waitlists/{id}/domain": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: { summary: "Get custom domain status", responses: { 200: { description: "Domain" } } },
        post: {
          summary: "Connect custom domain",
          responses: { 201: { description: "Connected" } },
        },
        patch: {
          summary: "Verify custom domain DNS",
          responses: { 200: { description: "Verified" } },
        },
        delete: { summary: "Remove custom domain", responses: { 200: { description: "Removed" } } },
      },
      "/api/v1/waitlists/{id}/email-sender": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          summary: "Get effective waitlist email sender",
          responses: { 200: { description: "Sender" } },
        },
        put: {
          summary: "Set waitlist-specific Resend API key & From email",
          responses: { 200: { description: "Saved" } },
        },
        delete: {
          summary: "Remove waitlist sender override",
          responses: { 200: { description: "Disconnected" } },
        },
      },
      "/api/v1/waitlists/{id}/email-sender/test": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        post: {
          summary: "Send test email via waitlist sender",
          responses: { 200: { description: "Sent" } },
        },
      },
      "/api/v1/waitlists/{id}/notifications/{channel}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "channel",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["slack", "discord"] },
          },
        ],
        get: {
          summary: "Get Slack/Discord channel config",
          responses: { 200: { description: "Config" } },
        },
        put: {
          summary: "Configure Slack/Discord webhook & triggers",
          responses: { 200: { description: "Saved" } },
        },
        delete: {
          summary: "Disconnect Slack/Discord channel",
          responses: { 200: { description: "Disconnected" } },
        },
      },
      "/api/v1/waitlists/{id}/notifications/{channel}/test": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "channel",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["slack", "discord"] },
          },
        ],
        post: {
          summary: "Send test Slack/Discord notification",
          responses: { 200: { description: "Sent" } },
        },
      },
      "/api/v1/waitlists/{id}/webhooks": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: { summary: "List webhooks", responses: { 200: { description: "Webhooks" } } },
        post: {
          summary: "Create webhook subscription",
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/v1/waitlists/{id}/webhooks/{subscriptionId}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriptionId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "Get webhook subscription",
          responses: { 200: { description: "Webhook" } },
        },
        patch: {
          summary: "Update webhook subscription",
          responses: { 200: { description: "Updated" } },
        },
        delete: {
          summary: "Delete webhook subscription",
          responses: { 200: { description: "Deleted" } },
        },
      },
      "/api/v1/waitlists/{id}/webhooks/{subscriptionId}/test": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriptionId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Send test webhook event",
          responses: { 200: { description: "Dispatched" } },
        },
      },
      "/api/v1/waitlists/{id}/webhooks/{subscriptionId}/rotate": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriptionId", in: "path", required: true, schema: { type: "string" } },
        ],
        post: {
          summary: "Rotate webhook signing secret",
          responses: { 200: { description: "Rotated" } },
        },
      },
      "/api/v1/waitlists/{id}/webhooks/{subscriptionId}/deliveries": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "subscriptionId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          summary: "List recent webhook delivery logs",
          responses: { 200: { description: "Deliveries" } },
        },
        post: {
          summary: "Replay a failed webhook delivery",
          responses: { 200: { description: "Replayed" } },
        },
      },
    },
  };

  // Every operation carries a stable, unique operationId — LLM function-calling
  // and client generators key on these. Public signup endpoints get semantic
  // ids; the v1 surface derives deterministic camelCase ids from method + path
  // so future operations are covered without manual bookkeeping.
  const OPERATION_ID_OVERRIDES = {
    "get /api/waitlist": "lookupSignup",
    "post /api/waitlist": "createSignup",
    "post /api/waitlist/points": "awardEventPoints",
  };

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== "object" || operation.operationId) continue;
      const override = OPERATION_ID_OVERRIDES[`${method} ${path}`];
      if (override) {
        operation.operationId = override;
        continue;
      }
      const camel = path
        .split("/")
        .filter(Boolean)
        .map((segment) =>
          segment.replace(/[{}]/g, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
        )
        .map((segment, index) =>
          index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1),
        )
        .join("");
      operation.operationId = `${method}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
    }
  }

  return spec;
}

export function GET() {
  return NextResponse.json(buildSpec(), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
