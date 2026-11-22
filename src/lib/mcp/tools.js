import { z } from "zod";

import { getWorkspaceEntitlements, requireCapacity } from "@/lib/billing/plans.mjs";
import { RESERVED_WAITLIST_SLUGS } from "@/lib/campaigns/create-draft.mjs";
import { pauseCampaign, publishCampaign } from "@/lib/campaigns/publication.mjs";
import { saveDraftSnapshot } from "@/lib/campaigns/save-draft-snapshot.mjs";
import { parseJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import { enqueueBroadcast } from "@/lib/email/broadcast-queue.mjs";
import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";
import { SITE_URL } from "@/lib/site-metadata.js";
import { snapshotTemplate } from "@/lib/templates/catalog.mjs";
import { planLaunchReadiness } from "@/lib/tools/engines/launch-planner.mjs";
import { simulateWaitlistQueue } from "@/lib/tools/engines/queue-simulator.mjs";
import { designReferralRewards } from "@/lib/tools/engines/reward-designer.mjs";
import { recommendTemplates } from "@/lib/tools/engines/template-finder.mjs";
import { calculateViralGrowth } from "@/lib/tools/engines/viral-growth.mjs";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { listUserApiKeys, revokeApiKey } from "@/services/api-key/index.js";

import { resolveWorkspaceContext } from "./auth.js";

// Waitlist permissions that mutate state; they require a write scope.
const WRITE_PERMISSIONS = new Set([
  "editCampaign",
  "publishCampaign",
  "deleteCampaign",
  "manageAudience",
  "sendEmail",
  "manageConnections",
]);

// Public MCP review requires all three safety hints to be explicit on every tool.
const READ_ONLY_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
});

const ADDITIVE_WRITE_ANNOTATIONS = Object.freeze({
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
});

const DESTRUCTIVE_WRITE_ANNOTATIONS = Object.freeze({
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
});

const OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS = Object.freeze({
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: true,
});

function jsonContent(data) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorContent(message) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: typeof message === "string" ? message : JSON.stringify(message, null, 2),
      },
    ],
  };
}

/**
 * Register all Waitlyze MCP tools on the provided McpServer instance.
 * All tools are bound to the authenticated user/API key context.
 */
export function registerWaitlyzeTools(server, authContext) {
  // Helper to ensure authenticated
  function ensureAuth() {
    if (!authContext?.authenticated || !authContext?.userId) {
      throw new Error(authContext?.error || "Unauthorized: Valid API key or OAuth token required.");
    }
  }

  // Scope check helper
  function requireWriteScope(permission = "editCampaign") {
    ensureAuth();
    if (WRITE_PERMISSIONS.has(permission)) {
      const scopes = authContext.scopes || [];
      const hasWriteScope =
        authContext.authType === "api_key"
          ? scopes.includes("waitlist:write")
          : scopes.includes("mcp:write");
      if (!hasWriteScope) {
        throw new Error(
          `Forbidden: '${permission}' requires write access. Request the '${authContext.authType === "api_key" ? "waitlist:write" : "mcp:write"}' scope.`,
        );
      }
    }
  }

  // Helper to check waitlist access enforcing workspace role permissions and campaign scope
  async function getAuthorizedWaitlist(waitlistId, permission = "viewCampaign") {
    requireWriteScope(permission);

    if (authContext.waitlistId && authContext.waitlistId !== waitlistId) {
      throw new Error("Forbidden: Scoped API key does not have access to this waitlist.");
    }

    const waitlist = await prisma.waitList.findFirst({
      where: {
        id: waitlistId,
        ...campaignScope(authContext.userId, permission),
      },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    if (!waitlist) {
      throw new Error(`Waitlist '${waitlistId}' not found or you do not have permission.`);
    }

    return waitlist;
  }

  /* ==========================================================================
     1. DISCOVERY & CAPABILITIES
     ========================================================================== */
  server.registerTool(
    "waitlyze_explain_capabilities",
    {
      description:
        "Explain capabilities of the Waitlyze MCP server, current authentication status, active workspace, and how agents can manage waitlists, audience, email broadcasts, and analytics.",
      inputSchema: z.object({}),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      let workspaceInfo = null;
      try {
        if (authContext?.authenticated) {
          workspaceInfo = await resolveWorkspaceContext(authContext);
        }
      } catch {
        // Workspace not yet resolved
      }

      return jsonContent({
        server: "Waitlyze MCP Server",
        version: "0.10.0",
        authentication: {
          authenticated: !!authContext?.authenticated,
          authType: authContext?.authType || "unauthenticated",
          userId: authContext?.userId || null,
          userEmail: authContext?.user?.email || null,
          activeWorkspaceId: workspaceInfo?.workspaceId || null,
          activeWorkspaceName: workspaceInfo?.workspaceName || null,
        },
        supportedCapabilities: [
          {
            domain: "Workspaces",
            tools: ["waitlyze_get_workspace", "waitlyze_list_workspaces"],
            description: "Inspect workspaces, plans, and team memberships.",
          },
          {
            domain: "Waitlists",
            tools: [
              "waitlyze_list_waitlists",
              "waitlyze_get_waitlist",
              "waitlyze_create_waitlist",
              "waitlyze_update_waitlist",
              "waitlyze_publish_waitlist",
              "waitlyze_pause_waitlist",
              "waitlyze_delete_waitlist",
            ],
            description: "Full lifecycle management of waitlist campaigns.",
          },
          {
            domain: "Subscribers & Audience",
            tools: [
              "waitlyze_list_subscribers",
              "waitlyze_get_subscriber",
              "waitlyze_add_subscriber",
              "waitlyze_update_subscriber",
              "waitlyze_remove_subscriber",
              "waitlyze_export_subscribers",
            ],
            description: "Audience search, referral ranking, offboarding, and verification.",
          },
          {
            domain: "Analytics & Funnels",
            tools: ["waitlyze_get_analytics"],
            description:
              "Page views, conversion rate, viral/K-factor, daily breakdown, leaderboards.",
          },
          {
            domain: "Email Broadcasts",
            tools: [
              "waitlyze_list_broadcasts",
              "waitlyze_create_broadcast",
              "waitlyze_send_broadcast",
            ],
            description: "Create and dispatch email broadcasts to opted-in subscribers.",
          },
          {
            domain: "Webhooks",
            tools: ["waitlyze_list_webhooks", "waitlyze_delete_webhook"],
            description: "Inspect and remove webhook notifications configured in Waitlyze.",
          },
          {
            domain: "API Keys",
            tools: ["waitlyze_list_api_keys", "waitlyze_revoke_api_key"],
            description: "Inspect and revoke scoped API keys without exposing secret values.",
          },
        ],
        documentationUrl: "https://waitlyze.com/docs/mcp",
      });
    },
  );

  /* ==========================================================================
     2. WORKSPACE TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_get_workspace",
    {
      description: "Get current workspace details, subscription plan, and member count.",
      inputSchema: z.object({
        workspaceId: z
          .string()
          .optional()
          .describe("Optional workspace ID. Defaults to active workspace."),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ workspaceId }) => {
      try {
        ensureAuth();
        const wsContext = await resolveWorkspaceContext(authContext, workspaceId);
        const workspace = await prisma.workspace.findUnique({
          where: { id: wsContext.workspaceId },
          include: {
            subscription: true,
            _count: {
              select: {
                members: true,
                waitlists: true,
              },
            },
          },
        });

        if (!workspace) return errorContent("Workspace not found.");

        const totalSubscribers = await prisma.signUp.count({
          where: { waitList: { workspaceId: workspace.id } },
        });

        return jsonContent({
          id: workspace.id,
          name: workspace.name,
          plan: workspace.subscription?.plan || "FREE",
          status: workspace.subscription?.status || "ACTIVE",
          membersCount: workspace._count.members,
          waitlistsCount: workspace._count.waitlists,
          totalSubscribers,
          createdAt: workspace.createdAt,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_list_workspaces",
    {
      description: "List all workspaces accessible to the authenticated user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      try {
        ensureAuth();
        const memberships = await prisma.workspaceMember.findMany({
          where: { userId: authContext.userId },
          include: {
            workspace: {
              include: {
                subscription: true,
                _count: { select: { waitlists: true, members: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        const workspaces = memberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          role: m.role,
          plan: m.workspace.subscription?.plan || "FREE",
          waitlistsCount: m.workspace._count.waitlists,
          membersCount: m.workspace._count.members,
          isPersonal: m.workspace.personalOwnerId === authContext.userId,
        }));

        return jsonContent({ workspaces });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     3. WAITLIST TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_list_waitlists",
    {
      description: "List waitlists in a workspace with filters, subscriber counts, and status.",
      inputSchema: z.object({
        workspaceId: z.string().optional().describe("Workspace ID. Defaults to active workspace."),
        status: z
          .enum(["ALL", "DRAFT", "PUBLISHED", "PAUSED"])
          .default("ALL")
          .describe("Filter by campaign status"),
        search: z.string().optional().describe("Search waitlist names or descriptions"),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ workspaceId, status, search, limit, offset }) => {
      try {
        ensureAuth();
        const wsContext = await resolveWorkspaceContext(authContext, workspaceId);

        const where = {
          workspaceId: wsContext.workspaceId,
          ...(status !== "ALL" ? { status } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { description: { contains: search } },
                  { publicSlug: { contains: search } },
                ],
              }
            : {}),
        };

        const [total, items] = await Promise.all([
          prisma.waitList.count({ where }),
          prisma.waitList.findMany({
            where,
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              publicSlug: true,
              websiteUrl: true,
              createdAt: true,
              updatedAt: true,
              customDomain: { select: { hostname: true, status: true } },
              _count: {
                select: {
                  signUps: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
          }),
        ]);

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        const waitlists = items.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          status: w.status,
          publicSlug: w.publicSlug,
          publicUrl: w.publicSlug ? `${baseUrl}/waitlist/${w.publicSlug}` : null,
          customDomain: w.customDomain?.hostname || null,
          totalSubscribers: w._count.signUps,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        }));

        return jsonContent({ total, limit, offset, waitlists });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_get_waitlist",
    {
      description:
        "Get full details, configuration, branding, and statistics for a specific waitlist.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId);

        const [totalSubscribers, verifiedSubscribers, totalViews] = await Promise.all([
          prisma.signUp.count({ where: { waitListId: waitlist.id } }),
          prisma.signUp.count({ where: { waitListId: waitlist.id, verifiedAt: { not: null } } }),
          prisma.impression.count({ where: { waitListId: waitlist.id } }),
        ]);

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        return jsonContent({
          id: waitlist.id,
          name: waitlist.name,
          description: waitlist.description,
          status: waitlist.status,
          publicSlug: waitlist.publicSlug,
          publicUrl: waitlist.publicSlug ? `${baseUrl}/waitlist/${waitlist.publicSlug}` : null,
          websiteUrl: waitlist.websiteUrl,
          buttonText: waitlist.buttonText,
          successMessage: waitlist.successMessage,
          showReferrals: waitlist.showReferrals,
          showSocialProof: waitlist.showSocialProof,
          fraudMode: waitlist.fraudMode,
          workspaceId: waitlist.workspaceId,
          stats: {
            totalSubscribers,
            verifiedSubscribers,
            totalViews,
            conversionRate:
              totalViews > 0 ? `${((totalSubscribers / totalViews) * 100).toFixed(1)}%` : "0.0%",
          },
          createdAt: waitlist.createdAt,
          updatedAt: waitlist.updatedAt,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_create_waitlist",
    {
      description:
        "Create a new draft waitlist campaign in the active workspace. This tool never publishes the campaign.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Name of the waitlist / product"),
        description: z.string().optional().describe("Short product tagline or description"),
        websiteUrl: z.string().url().optional().describe("Company or product website URL"),
        publicSlug: z
          .string()
          .optional()
          .describe("Custom URL slug. If omitted, generated from name."),
        buttonText: z.string().default("Join the waitlist"),
        successMessage: z.string().default("Success! You're on the waitlist"),
        workspaceId: z.string().optional().describe("Workspace ID. Defaults to active workspace."),
      }),
      annotations: ADDITIVE_WRITE_ANNOTATIONS,
    },
    async ({
      name,
      description,
      websiteUrl,
      publicSlug,
      buttonText,
      successMessage,
      workspaceId,
    }) => {
      try {
        ensureAuth();
        requireWriteScope("editCampaign");
        if (authContext.waitlistId) {
          return errorContent("Forbidden: Waitlist-scoped API keys cannot create waitlists.");
        }
        const wsContext = await resolveWorkspaceContext(authContext, workspaceId);

        let slug = publicSlug;
        if (slug) {
          slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "");
          if (RESERVED_WAITLIST_SLUGS.has(slug)) {
            return errorContent(`Slug '${slug}' is a reserved address. Please choose another.`);
          }
        } else {
          slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          slug = `${slug}-${randomSuffix}`;
        }

        // Check workspace entitlements for waitlists capacity
        const [entitlements, workspaceWaitlists] = await Promise.all([
          getWorkspaceEntitlements(prisma, wsContext.workspaceId),
          prisma.waitList.count({ where: { workspaceId: wsContext.workspaceId } }),
        ]);
        requireCapacity({
          entitlements,
          feature: "waitlists",
          used: workspaceWaitlists,
          message: `The ${entitlements.plan === "FREE" ? "Free" : "Pro"} plan includes ${entitlements.waitlists} waitlist${entitlements.waitlists === 1 ? "" : "s"} per workspace. Upgrade or remove a waitlist to create another.`,
        });

        const snapshot = snapshotTemplate("simple");

        const waitlist = await prisma.waitList.create({
          data: {
            name,
            description: description || "",
            websiteUrl: websiteUrl || null,
            publicSlug: slug,
            buttonText,
            successMessage,
            status: "DRAFT",
            templateSnapshot: snapshot,
            userId: authContext.userId,
            workspaceId: wsContext.workspaceId,
          },
        });

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        return jsonContent({
          message: "Waitlist created successfully",
          waitlist: {
            id: waitlist.id,
            name: waitlist.name,
            status: "DRAFT",
            publicSlug: waitlist.publicSlug,
            publicUrl: `${baseUrl}/waitlist/${waitlist.publicSlug}`,
            workspaceId: waitlist.workspaceId,
            createdAt: waitlist.createdAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_update_waitlist",
    {
      description:
        "Overwrite selected settings, copy, or fraud posture on an existing waitlist. Unspecified fields remain unchanged.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to update"),
        name: z.string().optional(),
        description: z.string().optional(),
        websiteUrl: z.string().url().optional(),
        buttonText: z.string().optional(),
        successMessage: z.string().optional(),
        fraudMode: z.enum(["STANDARD", "STRICT"]).optional(),
        showReferrals: z.boolean().optional(),
        showSocialProof: z.boolean().optional(),
      }),
      annotations: OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, ...updates }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "editCampaign");

        const data = {};
        if (updates.name !== undefined) data.name = updates.name;
        if (updates.description !== undefined) data.description = updates.description;
        if (updates.websiteUrl !== undefined) data.websiteUrl = updates.websiteUrl;
        if (updates.buttonText !== undefined) data.buttonText = updates.buttonText;
        if (updates.successMessage !== undefined) data.successMessage = updates.successMessage;
        if (updates.fraudMode !== undefined) data.fraudMode = updates.fraudMode;
        if (updates.showReferrals !== undefined) data.showReferrals = updates.showReferrals;
        if (updates.showSocialProof !== undefined) data.showSocialProof = updates.showSocialProof;

        if (
          waitlist.templateSnapshot &&
          (updates.buttonText !== undefined || updates.successMessage !== undefined)
        ) {
          try {
            const raw =
              typeof waitlist.templateSnapshot === "string"
                ? JSON.parse(waitlist.templateSnapshot)
                : waitlist.templateSnapshot;
            const snapshot = { ...raw };
            if (updates.buttonText !== undefined && snapshot.form) {
              snapshot.form = { ...snapshot.form, buttonText: updates.buttonText.slice(0, 40) };
            }
            if (updates.successMessage !== undefined && snapshot.statusPage) {
              snapshot.statusPage = {
                ...snapshot.statusPage,
                body: updates.successMessage.slice(0, 500),
              };
            }
            await saveDraftSnapshot(
              prisma,
              authContext.userId,
              waitlist.workspaceId,
              waitlist.id,
              waitlist.templateRevision,
              snapshot,
            );
          } catch (snapshotErr) {
            console.warn(
              "Failed to sync templateSnapshot during waitlist update:",
              snapshotErr?.message || snapshotErr,
            );
          }
        }

        const updated = await prisma.waitList.update({
          where: { id: waitlistId },
          data,
        });

        return jsonContent({
          message: "Waitlist updated successfully",
          waitlist: {
            id: updated.id,
            name: updated.name,
            status: updated.status,
            fraudMode: updated.fraudMode,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_publish_waitlist",
    {
      description:
        "Publish a draft or paused waitlist, making its current content public and opening it for signups. Call only after the user explicitly asks to publish.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to publish"),
      }),
      annotations: OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "publishCampaign");
        const pubResult = await publishCampaign(
          prisma,
          authContext.userId,
          waitlist.workspaceId,
          waitlist.id,
          waitlist.templateRevision,
        );

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        return jsonContent({
          message: "Waitlist published successfully and is now accepting signups.",
          id: waitlist.id,
          revision: pubResult.revision,
          status: "PUBLISHED",
          publicUrl: `${baseUrl}/waitlist/${waitlist.publicSlug}`,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_pause_waitlist",
    {
      description:
        "Pause an active waitlist and stop new public signups until it is published again.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to pause"),
      }),
      annotations: OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "publishCampaign");
        await pauseCampaign(prisma, authContext.userId, waitlist.workspaceId, waitlist.id);

        return jsonContent({
          message: "Waitlist paused. New signups are now disabled.",
          id: waitlist.id,
          status: "PAUSED",
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_delete_waitlist",
    {
      description:
        "Permanently delete a waitlist and its associated campaign data. Call only after the user explicitly identifies the waitlist to delete.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to delete"),
      }),
      annotations: OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "deleteCampaign");
        await prisma.waitList.delete({ where: { id: waitlistId } });
        return jsonContent({ message: `Waitlist '${waitlistId}' has been deleted.` });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     4. SUBSCRIBER & AUDIENCE TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_list_subscribers",
    {
      description: "List subscribers on a waitlist with filtering, sorting, and pagination.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        status: z.enum(["ALL", "VERIFIED", "UNVERIFIED"]).default("ALL"),
        search: z.string().optional().describe("Filter by email address"),
        sortBy: z.enum(["createdAt", "points", "rank"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId, status, search, sortBy, sortOrder, limit, offset }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "viewAudience");

        const where = {
          waitListId: waitlistId,
          ...(status === "VERIFIED"
            ? { verifiedAt: { not: null } }
            : status === "UNVERIFIED"
              ? { verifiedAt: null }
              : {}),
          ...(search ? { email: { contains: search } } : {}),
        };

        const [total, subscribers] = await Promise.all([
          prisma.signUp.count({ where }),
          prisma.signUp.findMany({
            where,
            select: {
              id: true,
              email: true,
              referralCode: true,
              rank: true,
              points: true,
              country: true,
              deviceType: true,
              verifiedAt: true,
              marketingConsentAt: true,
              createdAt: true,
              _count: { select: { referrals: true } },
            },
            orderBy: { [sortBy]: sortOrder },
            take: limit,
            skip: offset,
          }),
        ]);

        const items = subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          referralCode: s.referralCode,
          position: s.rank,
          points: s.points,
          referralCount: s._count.referrals,
          isVerified: !!s.verifiedAt,
          verifiedAt: s.verifiedAt,
          marketingConsent: !!s.marketingConsentAt,
          country: s.country,
          device: s.deviceType,
          createdAt: s.createdAt,
        }));

        return jsonContent({ total, limit, offset, subscribers: items });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_get_subscriber",
    {
      description:
        "Get detailed information for a single subscriber by ID, email, or referral code.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subscriberId: z.string().optional().describe("ID of the subscriber"),
        email: z.string().email().optional().describe("Subscriber email"),
        referralCode: z.string().optional().describe("Subscriber personal referral code"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId, subscriberId, email, referralCode }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "viewAudience");

        if (!subscriberId && !email && !referralCode) {
          return errorContent("Provide subscriberId, email, or referralCode.");
        }

        const subscriber = await prisma.signUp.findFirst({
          where: {
            waitListId: waitlistId,
            ...(subscriberId ? { id: subscriberId } : {}),
            ...(email ? { emailNormalized: normalizeSignupEmail(email) } : {}),
            ...(referralCode ? { referralCode } : {}),
          },
          include: {
            _count: { select: { referrals: true } },
            referredBy: {
              include: {
                referredBy: {
                  select: { id: true, email: true, referralCode: true },
                },
              },
            },
          },
        });

        if (!subscriber) return errorContent("Subscriber not found.");

        return jsonContent({
          id: subscriber.id,
          email: subscriber.email,
          referralCode: subscriber.referralCode,
          position: subscriber.rank,
          points: subscriber.points,
          referralCount: subscriber._count.referrals,
          referredBy: subscriber.referredBy?.[0]?.referredBy?.email || null,
          isVerified: !!subscriber.verifiedAt,
          verifiedAt: subscriber.verifiedAt,
          marketingConsentAt: subscriber.marketingConsentAt,
          customFields: subscriber.customFields,
          attribution: {
            utmSource: subscriber.utmSource,
            utmMedium: subscriber.utmMedium,
            utmCampaign: subscriber.utmCampaign,
            referrer: subscriber.referrer,
          },
          device: {
            country: subscriber.country,
            city: subscriber.city,
            deviceType: subscriber.deviceType,
          },
          createdAt: subscriber.createdAt,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_add_subscriber",
    {
      description:
        "Add a new subscriber directly to the waitlist (supports referral attribution and auto-verification).",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        email: z.string().email().describe("Subscriber email address"),
        referralCode: z.string().optional().describe("Referral code of who referred this user"),
        autoVerify: z
          .boolean()
          .default(true)
          .describe("Whether to immediately mark subscriber as verified"),
        customFields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Custom metadata / form answers"),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      }),
      annotations: ADDITIVE_WRITE_ANNOTATIONS,
    },
    async ({
      waitlistId,
      email,
      referralCode,
      autoVerify,
      customFields,
      utmSource,
      utmMedium,
      utmCampaign,
    }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "manageAudience");
        const normalizedEmail = normalizeSignupEmail(email);

        // Check if subscriber already exists
        const existing = await prisma.signUp.findUnique({
          where: {
            waitListId_emailNormalized: {
              waitListId: waitlist.id,
              emailNormalized: normalizedEmail,
            },
          },
        });

        if (existing) {
          return jsonContent({
            message: "Subscriber already on the waitlist",
            alreadyExists: true,
            subscriber: {
              id: existing.id,
              email: existing.email,
              referralCode: existing.referralCode,
              position: existing.rank,
            },
          });
        }

        // Handle referrer if provided
        let referrerSignUp = null;
        if (referralCode) {
          referrerSignUp = await prisma.signUp.findFirst({
            where: { referralCode, waitListId: waitlist.id },
          });
        }

        const count = await prisma.signUp.count({ where: { waitListId: waitlist.id } });
        const now = new Date();

        const subscriber = await prisma.signUp.create({
          data: {
            waitListId: waitlist.id,
            uniqueUserId: `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            email,
            emailNormalized: normalizedEmail,
            rank: count + 1,
            points: 0,
            verifiedAt: autoVerify ? now : null,
            marketingConsentAt: null,
            customFields: customFields || null,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
          },
        });

        if (referrerSignUp) {
          await prisma.referral.create({
            data: {
              signUpId: subscriber.id,
              referredById: referrerSignUp.id,
              reviewStatus: "CLEAR",
            },
          });
          if (autoVerify) {
            await prisma.signUp.update({
              where: { id: referrerSignUp.id },
              data: { points: { increment: 10 } },
            });
          }
        }

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        return jsonContent({
          message: "Subscriber added successfully",
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            referralCode: subscriber.referralCode,
            referralUrl: `${baseUrl}/waitlist/${waitlist.publicSlug}?ref=${subscriber.referralCode}`,
            position: subscriber.rank,
            isVerified: !!subscriber.verifiedAt,
            createdAt: subscriber.createdAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_update_subscriber",
    {
      description:
        "Overwrite selected subscriber fields, verification status, or referral points. Unspecified fields remain unchanged.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subscriberId: z.string().describe("ID of the subscriber"),
        verified: z.boolean().optional().describe("Mark subscriber as verified or unverified"),
        points: z.number().int().optional().describe("Set referral points balance"),
        customFields: z.record(z.string(), z.any()).optional().describe("Update custom metadata"),
      }),
      annotations: DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, subscriberId, verified, points, customFields }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "manageAudience");

        const existing = await prisma.signUp.findFirst({
          where: { id: subscriberId, waitListId: waitlistId },
        });
        if (!existing) return errorContent("Subscriber not found.");

        const data = {};
        if (verified !== undefined) {
          data.verifiedAt = verified ? new Date() : null;
        }
        if (points !== undefined) {
          data.points = points;
        }
        if (customFields !== undefined) {
          data.customFields = customFields;
        }

        const updated = await prisma.signUp.update({
          where: { id: subscriberId },
          data,
        });

        return jsonContent({
          message: "Subscriber updated successfully",
          subscriber: {
            id: updated.id,
            email: updated.email,
            isVerified: !!updated.verifiedAt,
            points: updated.points,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_remove_subscriber",
    {
      description:
        "Permanently remove a subscriber from a waitlist. Call only after the user explicitly identifies the subscriber to remove.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subscriberId: z.string().describe("ID of the subscriber to delete"),
      }),
      annotations: DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, subscriberId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "manageAudience");
        const result = await prisma.signUp.deleteMany({
          where: { id: subscriberId, waitListId: waitlistId },
        });
        if (result.count === 0) {
          return errorContent("Subscriber not found.");
        }
        return jsonContent({ message: `Subscriber '${subscriberId}' removed from waitlist.` });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_export_subscribers",
    {
      description: "Export subscribers for a waitlist in JSON or CSV format.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        status: z.enum(["ALL", "VERIFIED", "UNVERIFIED"]).default("ALL"),
        format: z.enum(["json", "csv"]).default("json"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId, status, format }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "viewAudience");

        const where = {
          waitListId: waitlistId,
          ...(status === "VERIFIED"
            ? { verifiedAt: { not: null } }
            : status === "UNVERIFIED"
              ? { verifiedAt: null }
              : {}),
        };

        const subscribers = await prisma.signUp.findMany({
          where,
          select: {
            id: true,
            email: true,
            referralCode: true,
            rank: true,
            points: true,
            country: true,
            verifiedAt: true,
            createdAt: true,
          },
          orderBy: { rank: "asc" },
        });

        if (format === "csv") {
          const sanitizeCsvField = (value) => {
            if (value === null || value === undefined) return '""';
            let str = String(value);
            if (/^[=+\-@\t\r]/.test(str)) {
              str = `'${str}`;
            }
            return `"${str.replace(/"/g, '""')}"`;
          };
          const header = "id,email,referralCode,rank,points,country,isVerified,createdAt\n";
          const rows = subscribers
            .map(
              (s) =>
                `${sanitizeCsvField(s.id)},${sanitizeCsvField(s.email)},${sanitizeCsvField(s.referralCode)},${s.rank || ""},${s.points},${sanitizeCsvField(s.country)},${!!s.verifiedAt},${sanitizeCsvField(s.createdAt.toISOString())}`,
            )
            .join("\n");
          return jsonContent(header + rows);
        }

        return jsonContent({ total: subscribers.length, subscribers });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     5. ANALYTICS TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_get_analytics",
    {
      description:
        "Get comprehensive analytics for a waitlist: total impressions, signups, conversion rate, viral/K-factor, daily breakdown, and referral leaderboard.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        days: z
          .number()
          .int()
          .min(1)
          .max(90)
          .default(30)
          .describe("Number of past days to analyze"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId, days }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "viewCampaign");

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
          totalSignups,
          verifiedSignups,
          totalViews,
          recentSignups,
          referralsCount,
          topReferrers,
        ] = await Promise.all([
          prisma.signUp.count({ where: { waitListId: waitlist.id } }),
          prisma.signUp.count({ where: { waitListId: waitlist.id, verifiedAt: { not: null } } }),
          prisma.impression.count({ where: { waitListId: waitlist.id } }),
          prisma.signUp.findMany({
            where: { waitListId: waitlist.id, createdAt: { gte: startDate } },
            select: { createdAt: true },
          }),
          prisma.referral.count({ where: { signUp: { waitListId: waitlist.id } } }),
          prisma.signUp.findMany({
            where: { waitListId: waitlist.id, referrals: { some: {} } },
            select: {
              id: true,
              email: true,
              referralCode: true,
              _count: { select: { referrals: true } },
            },
            orderBy: { referrals: { _count: "desc" } },
            take: 5,
          }),
        ]);

        // Daily signup grouping
        const dailyMap = {};
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          dailyMap[key] = 0;
        }
        for (const s of recentSignups) {
          const key = s.createdAt.toISOString().split("T")[0];
          if (dailyMap[key] !== undefined) dailyMap[key]++;
        }

        const conversionRate =
          totalViews > 0 ? ((totalSignups / totalViews) * 100).toFixed(2) + "%" : "0.00%";
        const kFactor = totalSignups > 0 ? (referralsCount / totalSignups).toFixed(2) : "0.00";

        return jsonContent({
          waitlistId: waitlist.id,
          waitlistName: waitlist.name,
          timeframeDays: days,
          overview: {
            totalSignups,
            verifiedSignups,
            verificationRate:
              totalSignups > 0 ? `${((verifiedSignups / totalSignups) * 100).toFixed(1)}%` : "0.0%",
            totalImpressions: totalViews,
            conversionRate,
            viralKFactor: parseFloat(kFactor),
            totalReferrals: referralsCount,
          },
          dailySignups: Object.entries(dailyMap)
            .map(([date, count]) => ({ date, count }))
            .reverse(),
          topReferrers: topReferrers.map((r) => ({
            id: r.id,
            email: r.email,
            referralCode: r.referralCode,
            successfulReferrals: r._count.referrals,
          })),
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     6. EMAIL BROADCAST TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_list_broadcasts",
    {
      description: "List email marketing broadcasts created for a waitlist.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "sendEmail");

        const broadcasts = await prisma.marketingBroadcast.findMany({
          where: { waitListId: waitlistId },
          select: {
            id: true,
            subject: true,
            status: true,
            sentAt: true,
            createdAt: true,
            _count: { select: { recipients: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return jsonContent({
          waitlistId,
          broadcasts: broadcasts.map((b) => ({
            id: b.id,
            subject: b.subject,
            status: b.status,
            recipientCount: b._count.recipients,
            sentAt: b.sentAt,
            createdAt: b.createdAt,
          })),
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_create_broadcast",
    {
      description:
        "Create a draft email broadcast. This tool saves content but never sends email to subscribers.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subject: z.string().min(1).describe("Email subject line"),
        contentHtml: z.string().min(1).describe("HTML or text body of the email"),
        previewText: z.string().optional().describe("Snippet shown in inbox preview"),
      }),
      annotations: ADDITIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, subject, contentHtml, previewText }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "sendEmail");

        const broadcast = await prisma.marketingBroadcast.create({
          data: {
            waitListId: waitlist.id,
            name: subject,
            subject,
            previewText: previewText || "",
            body: contentHtml,
            renderedHtml: contentHtml,
            status: "DRAFT",
          },
        });

        return jsonContent({
          message: "Broadcast draft created",
          broadcast: {
            id: broadcast.id,
            subject: broadcast.subject,
            status: broadcast.status,
            createdAt: broadcast.createdAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_send_broadcast",
    {
      description:
        "Irreversibly queue a completed email broadcast for delivery to eligible verified subscribers. Call only after the user explicitly asks to send that broadcast.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        broadcastId: z.string().describe("ID of the broadcast to send"),
      }),
      annotations: OPEN_WORLD_DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, broadcastId }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "sendEmail");

        const broadcast = await prisma.marketingBroadcast.findFirst({
          where: { id: broadcastId, waitListId: waitlist.id },
        });
        if (!broadcast) return errorContent("Broadcast not found.");

        const count = await enqueueBroadcast(prisma, {
          waitListId: waitlist.id,
          broadcastId: broadcast.id,
          segment: broadcast.segment || "ALL",
          exact: false,
        });

        return jsonContent({
          message: "Broadcast successfully queued for dispatch.",
          broadcastId: broadcast.id,
          status: "SENDING",
          targetSubscribers: count,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     7. WEBHOOK TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_list_webhooks",
    {
      description: "List webhook subscriptions configured for a waitlist.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "manageConnections");

        const webhooks = await prisma.webhookSubscription.findMany({
          where: { waitListId: waitlistId },
          select: {
            id: true,
            name: true,
            url: true,
            eventTypes: true,
            enabled: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return jsonContent({
          webhooks: webhooks.map((w) => ({
            id: w.id,
            name: w.name,
            url: w.url,
            events: parseJsonStringArray(w.eventTypes),
            status: w.enabled ? "ACTIVE" : "DISABLED",
            createdAt: w.createdAt,
          })),
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_delete_webhook",
    {
      description:
        "Permanently delete a webhook subscription and stop future deliveries to that endpoint.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        webhookId: z.string().describe("ID of the webhook to delete"),
      }),
      annotations: DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ waitlistId, webhookId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "manageConnections");
        const result = await prisma.webhookSubscription.deleteMany({
          where: { id: webhookId, waitListId: waitlistId },
        });
        if (result.count === 0) {
          return errorContent("Webhook not found.");
        }
        return jsonContent({ message: `Webhook '${webhookId}' deleted.` });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     8. API KEY TOOLS
     ========================================================================== */
  server.registerTool(
    "waitlyze_list_api_keys",
    {
      description: "List active API keys for a waitlist.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ waitlistId }) => {
      try {
        await getAuthorizedWaitlist(waitlistId, "manageConnections");
        const keys = await listUserApiKeys(authContext.userId, [waitlistId]);

        return jsonContent({
          apiKeys: keys.map((k) => ({
            id: k.id,
            name: k.name,
            keyId: k.keyId,
            scopes: k.scopes,
            expiresAt: k.expiresAt,
            createdAt: k.createdAt,
            waitlistName: k.waitlist?.name,
          })),
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_revoke_api_key",
    {
      description:
        "Permanently revoke an API key so it can no longer authenticate. Call only after the user explicitly identifies the key to revoke.",
      inputSchema: z.object({
        keyId: z.string().describe("Internal ID of the API key to revoke"),
      }),
      annotations: DESTRUCTIVE_WRITE_ANNOTATIONS,
    },
    async ({ keyId }) => {
      try {
        ensureAuth();
        if (authContext?.authType === "api_key") {
          return errorContent("Forbidden: API keys cannot revoke API keys.");
        }

        // Look the key up first so we can authorize waitlist-scoped keys and
        // revoke them with the right waitlistId (revokeApiKey only matches
        // user-scoped keys by default).
        const key = await prisma.apiKey.findFirst({
          where: { OR: [{ id: keyId }, { keyId }] },
          select: { id: true, keyId: true, userId: true, waitlistId: true, revokedAt: true },
        });

        if (!key || key.revokedAt) {
          return errorContent("API key not found or already revoked.");
        }

        if (key.waitlistId) {
          // Waitlist-scoped keys require the caller to manage that waitlist.
          await getAuthorizedWaitlist(key.waitlistId, "manageConnections");
          const success = await revokeApiKey(key.id, authContext.userId, key.waitlistId);
          if (!success) return errorContent("API key not found or already revoked.");
          return jsonContent({ message: `API key '${key.keyId}' has been revoked.` });
        }

        // User-scoped keys can only be revoked by their owner.
        if (key.userId !== authContext.userId) {
          return errorContent("API key not found or already revoked.");
        }
        const success = await revokeApiKey(key.id, authContext.userId);
        if (!success) return errorContent("API key not found or already revoked.");
        return jsonContent({ message: `API key '${key.keyId}' has been revoked.` });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  /* ==========================================================================
     LAUNCH LAB DETERMINISTIC PLANNING TOOLS (READ-ONLY)
     ========================================================================== */
  server.registerTool(
    "calculate_viral_growth",
    {
      description:
        "Deterministically forecast direct and referred waitlist signups, effective K-factor (accounting for email verification), and +10% highest-leverage sensitivity.",
      inputSchema: z.object({
        startingList: z.number().min(0).max(50000).optional(),
        weeklyVisitors: z.number().min(50).max(100000).optional(),
        conversionRatePct: z.number().min(1).max(75).optional(),
        verificationRatePct: z.number().min(30).max(100).optional(),
        shareRatePct: z.number().min(0).max(80).optional(),
        clicksPerSharer: z.number().min(0.5).max(15).optional(),
        referredConversionPct: z.number().min(1).max(75).optional(),
        weeks: z.number().int().min(2).max(24).optional(),
        rewardCostPerReferral: z.number().min(0).max(50).optional(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const result = calculateViralGrowth(args);
      return jsonContent({
        toolUrl: `${SITE_URL}/tools/viral-coefficient-calculator`,
        formula: result.formula,
        assumptions:
          "Deterministic multi-cycle simulation with gentle 4%/week audience saturation damping; modeled scenarios, not guaranteed benchmarks.",
        summary: {
          effectiveK: result.effectiveK,
          directAdded: result.directAdded,
          referredTotal: result.referredTotal,
          totalVerified: result.totalVerified,
          referralLiftPct: result.referralLiftPct,
          estimatedRewardBudget: result.estimatedRewardBudget,
          highestLever: result.highestLever,
          recommendation: result.recommendation,
        },
        cycles: result.cycles,
        sensitivity: result.sensitivity,
      });
    },
  );

  server.registerTool(
    "simulate_waitlist_queue",
    {
      description:
        "Simulate Waitlyze's deterministic points-and-timestamp queue ranking to estimate rank jumps after 1, 3, 5, and 10 verified referrals plus Top 1% and Top 10 cutoffs.",
      inputSchema: z.object({
        waitlistSize: z.number().int().min(100).max(100000).optional(),
        pointsSignup: z.number().int().min(0).max(200).optional(),
        pointsReferral: z.number().int().min(5).max(200).optional(),
        pointsBonus: z.number().int().min(0).max(100).optional(),
        sharerSkew: z.enum(["conservative", "balanced", "viral"]).optional(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const result = simulateWaitlistQueue(args);
      return jsonContent({
        toolUrl: `${SITE_URL}/tools/waitlist-queue-simulator`,
        formula: result.formula,
        tieBreakerRule: result.tieBreakerNote,
        recommendedDisplay: result.recommendedDisplay,
        fairnessSummary: result.fairnessSummary,
        cutoffs: result.cutoffs,
        jumpCurve: result.jumpCurve,
      });
    },
  );

  server.registerTool(
    "recommend_waitlist_template",
    {
      description:
        "Score all 14 Waitlyze templates across product category, visual asset readiness, conversion motion, and brand aesthetic to recommend the top 3 layouts.",
      inputSchema: z.object({
        category: z
          .enum([
            "saas",
            "ai",
            "developer",
            "mobile",
            "creator",
            "community",
            "event",
            "commerce",
            "other",
          ])
          .optional(),
        motion: z
          .enum(["email_only", "referral_queue", "milestone_rewards", "beta_application"])
          .optional(),
        assets: z.enum(["screenshots", "demo_video", "text_only"]).optional(),
        aesthetic: z
          .enum(["clean_editorial", "dark_technical", "bold_contrast", "warm_consumer"])
          .optional(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const result = recommendTemplates(args);
      return jsonContent({
        toolUrl: `${SITE_URL}/tools/waitlist-template-finder`,
        formula: result.formula,
        recommendations: result.recommendations.map((rec) => ({
          templateId: rec.templateId,
          name: rec.name,
          score: rec.score,
          matchLabel: rec.matchLabel,
          whyItFits: rec.whyItFits,
          recommendedSections: rec.recommendedSections,
          formGuidance: rec.formGuidance,
          startUrl: `${SITE_URL}/waitlists/new?template=${rec.templateId}`,
        })),
      });
    },
  );

  server.registerTool(
    "design_referral_rewards",
    {
      description:
        "Model 1–4 referral milestone tiers across P25, P50, and P90 viral scenarios to estimate fulfillment budget exposure, effective CAC per verified referral, and fraud risk.",
      inputSchema: z.object({
        productLtv: z.number().min(5).max(10000).optional(),
        grossMarginPct: z.number().min(10).max(98).optional(),
        targetWaitlistSize: z.number().int().min(100).max(500000).optional(),
        shareRatePct: z.number().min(3).max(65).optional(),
        tiers: z
          .array(
            z.object({
              referrals: z.number().int().min(1).max(500),
              rewardType: z
                .enum([
                  "priority_queue",
                  "extended_trial",
                  "discount_pct",
                  "digital_asset",
                  "physical_swag",
                  "lifetime_deal",
                ])
                .optional(),
              label: z.string().min(1).max(110),
              unitCost: z.number().min(0).max(1000),
            }),
          )
          .max(4)
          .optional(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const result = designReferralRewards(args);
      return jsonContent({
        toolUrl: `${SITE_URL}/tools/referral-reward-calculator`,
        formula: result.formula,
        budgets: result.budgets,
        effectiveCostPerReferralP50: result.effectiveCostPerReferralP50,
        costToMarginLtvPct: result.costToMarginLtvPct,
        recommendedFraudMode: result.recommendedFraudMode,
        antiFraudRecommendations: result.antiFraudRecommendations,
        tiers: result.tiers,
      });
    },
  );

  server.registerTool(
    "plan_launch_timeline",
    {
      description:
        "Compute a 6-pillar Launch Readiness Score (0–100) and a dated critical-path launch timeline across 4 phases based on target launch date, weekly hours, and existing assets.",
      inputSchema: z.object({
        category: z
          .enum(["saas", "ai", "developer", "mobile", "creator", "event", "commerce"])
          .optional(),
        launchType: z
          .enum(["private_beta", "public_launch", "product_hunt", "developer_preview", "preorder"])
          .optional(),
        horizonDays: z.number().int().min(7).max(180).optional(),
        targetLaunchDate: z.string().optional(),
        teamSize: z.number().int().min(1).max(50).optional(),
        weeklyHours: z.number().min(2).max(80).optional(),
        existingAssets: z.array(z.string()).optional(),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const result = planLaunchReadiness(args);
      return jsonContent({
        toolUrl: `${SITE_URL}/tools/product-launch-checklist`,
        readinessScore: result.readinessScore,
        band: result.band,
        targetLaunchDate: result.inputs.targetLaunchDate,
        remainingHours: result.remainingHours,
        bandwidthWarning: result.bandwidthWarning,
        recommendedTemplateId: result.recommendedTemplateId,
        firstIncompleteTask: result.firstIncompleteTask,
        pillars: result.pillars,
        tasks: result.tasks,
      });
    },
  );
}
