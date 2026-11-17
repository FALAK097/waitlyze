import { z } from "zod";

import { getWorkspaceEntitlements, requireCapacity } from "@/lib/billing/plans.mjs";
import { RESERVED_WAITLIST_SLUGS } from "@/lib/campaigns/create-draft.mjs";
import { pauseCampaign, publishCampaign } from "@/lib/campaigns/publication.mjs";
import { saveDraftSnapshot } from "@/lib/campaigns/save-draft-snapshot.mjs";
import { enqueueBroadcast } from "@/lib/email/broadcast-queue.mjs";
import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";
import { snapshotTemplate } from "@/lib/templates/catalog.mjs";
import { isSupportedWebhookEvent, WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/delivery.mjs";
import {
  createWebhookSecret,
  encryptSecret,
  validateWebhookUrl,
} from "@/lib/webhooks/security.mjs";
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { createApiKey, listUserApiKeys, revokeApiKey } from "@/services/api-key/index.js";

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
      annotations: { readOnlyHint: true },
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
            tools: ["waitlyze_list_webhooks", "waitlyze_create_webhook", "waitlyze_delete_webhook"],
            description:
              "Real-time webhook notifications for subscriber creation and verification.",
          },
          {
            domain: "API Keys",
            tools: ["waitlyze_list_api_keys", "waitlyze_create_api_key", "waitlyze_revoke_api_key"],
            description: "Create and revoke scoped API keys (wl2_...).",
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
      annotations: { readOnlyHint: true },
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
      annotations: { readOnlyHint: true },
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
      annotations: { readOnlyHint: true },
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
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { publicSlug: { contains: search, mode: "insensitive" } },
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
      annotations: { readOnlyHint: true },
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
      description: "Create a new waitlist campaign in the active workspace.",
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
        publishImmediately: z
          .boolean()
          .default(false)
          .describe("Whether to immediately publish the waitlist"),
      }),
    },
    async ({
      name,
      description,
      websiteUrl,
      publicSlug,
      buttonText,
      successMessage,
      workspaceId,
      publishImmediately,
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

        let finalStatus = "DRAFT";
        if (publishImmediately) {
          try {
            await publishCampaign(
              prisma,
              authContext.userId,
              wsContext.workspaceId,
              waitlist.id,
              waitlist.templateRevision,
            );
            finalStatus = "PUBLISHED";
          } catch (pubErr) {
            console.warn("Immediate publication failed:", pubErr?.message || pubErr);
          }
        }

        const baseUrl = process.env.BETTER_AUTH_URL || "https://waitlyze.com";
        return jsonContent({
          message: "Waitlist created successfully",
          waitlist: {
            id: waitlist.id,
            name: waitlist.name,
            status: finalStatus,
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
      description: "Update settings, copy, or fraud posture of an existing waitlist.",
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
      description: "Publish a draft or paused waitlist to make it live and open for signups.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to publish"),
      }),
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
      description: "Pause an active waitlist to temporarily stop accepting new signups.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to pause"),
      }),
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
      description: "Delete a waitlist and its associated draft configurations.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist to delete"),
      }),
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
      annotations: { readOnlyHint: true },
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
          ...(search ? { email: { contains: search, mode: "insensitive" } } : {}),
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
      annotations: { readOnlyHint: true },
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

        const subscriber = await prisma.$transaction(async (tx) => {
          const created = await tx.signUp.create({
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
            await tx.referral.create({
              data: {
                signUpId: created.id,
                referredById: referrerSignUp.id,
                reviewStatus: "CLEAR",
              },
            });
            if (autoVerify) {
              await tx.signUp.update({
                where: { id: referrerSignUp.id },
                data: { points: { increment: 10 } },
              });
            }
          }

          return created;
        });

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
      description: "Update subscriber details, mark verified, or update points.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subscriberId: z.string().describe("ID of the subscriber"),
        verified: z.boolean().optional().describe("Mark subscriber as verified or unverified"),
        points: z.number().int().optional().describe("Set referral points balance"),
        customFields: z.record(z.string(), z.any()).optional().describe("Update custom metadata"),
      }),
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
      description: "Remove a subscriber from the waitlist.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subscriberId: z.string().describe("ID of the subscriber to delete"),
      }),
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
      annotations: { readOnlyHint: true },
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
      annotations: { readOnlyHint: true },
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
      annotations: { readOnlyHint: true },
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
      description: "Create a new draft email broadcast for waitlist subscribers.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        subject: z.string().min(1).describe("Email subject line"),
        contentHtml: z.string().min(1).describe("HTML or text body of the email"),
        previewText: z.string().optional().describe("Snippet shown in inbox preview"),
      }),
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
      description: "Queue or send an email broadcast to eligible verified subscribers.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        broadcastId: z.string().describe("ID of the broadcast to send"),
      }),
    },
    async ({ waitlistId, broadcastId }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "sendEmail");

        const broadcast = await prisma.marketingBroadcast.findFirst({
          where: { id: broadcastId, waitListId: waitlist.id },
        });
        if (!broadcast) return errorContent("Broadcast not found.");

        const count = await prisma.$transaction(
          async (tx) => {
            return enqueueBroadcast(tx, {
              waitListId: waitlist.id,
              broadcastId: broadcast.id,
              segment: broadcast.segment || "ALL",
              exact: false,
            });
          },
          { timeout: 30000 },
        );

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
      annotations: { readOnlyHint: true },
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
            events: w.eventTypes,
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
    "waitlyze_create_webhook",
    {
      description:
        "Create a new webhook subscription to receive HTTP POST alerts on subscriber events.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        url: z.string().url().describe("Target HTTPS endpoint URL"),
        name: z.string().optional().describe("Label for the webhook subscription"),
        events: z
          .array(z.string())
          .default(["signup.created", "signup.verified"])
          .describe(
            "Events to subscribe to: signup.created, signup.verified, referral.completed, milestone.reached",
          ),
      }),
    },
    async ({ waitlistId, url, name, events }) => {
      try {
        const waitlist = await getAuthorizedWaitlist(waitlistId, "manageConnections");

        // Validate webhook URL (prevent SSRF)
        const validated = validateWebhookUrl(url);

        // Normalize and validate event types
        const normalizedEvents = (events || []).map((e) => {
          if (e === "subscriber.created") return "signup.created";
          if (e === "subscriber.verified") return "signup.verified";
          return e;
        });

        const invalidEvents = normalizedEvents.filter((e) => !isSupportedWebhookEvent(e));
        if (invalidEvents.length > 0) {
          return errorContent(
            `Unsupported webhook event(s): ${invalidEvents.join(", ")}. Supported events: ${WEBHOOK_EVENT_TYPES.join(", ")}`,
          );
        }

        const secret = createWebhookSecret();
        const { ciphertext, iv, tag } = encryptSecret(secret);

        const webhook = await prisma.webhookSubscription.create({
          data: {
            waitListId: waitlist.id,
            name: name || `Webhook ${validated.url.hostname}`,
            url: validated.url.toString(),
            eventTypes: normalizedEvents,
            enabled: true,
            secretCiphertext: ciphertext,
            secretIv: iv,
            secretTag: tag,
          },
        });

        return jsonContent({
          message:
            "Webhook created successfully. Save the signing secret now, as it cannot be displayed again.",
          webhook: {
            id: webhook.id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.eventTypes,
            status: webhook.enabled ? "ACTIVE" : "DISABLED",
            secret,
            createdAt: webhook.createdAt,
          },
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_delete_webhook",
    {
      description: "Delete a webhook subscription.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        webhookId: z.string().describe("ID of the webhook to delete"),
      }),
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
      annotations: { readOnlyHint: true },
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
    "waitlyze_create_api_key",
    {
      description: "Generate a new secret API key (wl2_...) for server-side waitlist integration.",
      inputSchema: z.object({
        waitlistId: z.string().describe("ID of the waitlist"),
        name: z.string().describe("Human readable name / label for the key"),
        scopes: z
          .array(z.string())
          .default(["waitlist:write"])
          .describe("Scopes: waitlist:read, waitlist:write"),
      }),
    },
    async ({ waitlistId, name, scopes }) => {
      try {
        if (authContext?.authType === "api_key") {
          return errorContent("Forbidden: API keys cannot create other API keys.");
        }
        const waitlist = await getAuthorizedWaitlist(waitlistId, "manageConnections");
        const record = await createApiKey({
          name,
          userId: authContext.userId,
          waitlistId: waitlist.id,
          scopes,
          db: prisma,
        });

        return jsonContent({
          message:
            "API key created successfully. Save this secret key now, as it cannot be displayed again.",
          apiKey: record.apiKey,
          keyId: record.keyId,
          name: record.name,
          scopes: record.scopes,
          waitlistId: waitlist.id,
        });
      } catch (err) {
        return errorContent(err.message);
      }
    },
  );

  server.registerTool(
    "waitlyze_revoke_api_key",
    {
      description: "Revoke an API key.",
      inputSchema: z.object({
        keyId: z.string().describe("Internal ID of the API key to revoke"),
      }),
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
}
