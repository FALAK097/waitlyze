import { randomBytes, randomUUID } from "node:crypto";

import * as z from "zod/v4";

import { renderWorkspaceInvitation } from "@/emails/render.jsx";
import { workspaceInvitationText } from "@/emails/text.mjs";
import {
  configureWorkspaceResendOp,
  listResendDomainsForWorkspaceOp,
  testWorkspaceResendOp,
} from "@/lib/api/infra-ops.mjs";
import { getWorkspaceEntitlements, requireCapacity } from "@/lib/billing/plans.mjs";
import { VALID_API_KEY_SCOPES } from "@/lib/db/sqlite-helpers.mjs";
import { sendPlatformEmail } from "@/lib/emails/platform.mjs";
import { env } from "@/lib/env.mjs";
import { encryptIntegrationSecret } from "@/lib/integrations/secrets.mjs";
import {
  assertScope,
  requireWaitlistAccess,
  requireWorkspaceAccess,
  runTool,
} from "@/lib/mcp/tool-helpers.mjs";
import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";
import { consumePublicBudget } from "@/lib/security/public-rate-limit.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import {
  hashInvitationToken,
  invitationExpiry,
  normalizeInvitationEmail,
  revokeWorkspaceInvitation,
} from "@/lib/workspaces/invitations.mjs";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { createApiKey, listUserApiKeys, revokeApiKey } from "@/services/api-key/index.js";

export function registerWorkspaceMcpTools(server, authContext) {
  server.registerTool(
    "waitlyze_explain_capabilities",
    {
      title: "Explain Waitlyze Capabilities",
      description:
        "Returns Waitlyze platform architecture, auth model, REST API v1 endpoints, MCP resources/prompts, scopes, and webhook events so agents can operate the entire platform without opening the dashboard.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    () =>
      runTool(async () => ({
        platform: "Waitlyze",
        mcpVersion: "0.13.0",
        auth: {
          authenticated: Boolean(authContext?.authenticated),
          authType: authContext?.authType || null,
          waitlistId: authContext?.waitlistId || null,
          workspaceId: authContext?.workspaceId || null,
          scopes: authContext?.scopes || [],
        },
        availableApiKeyScopes: Array.from(VALID_API_KEY_SCOPES),
        restApiBase: "/api/v1",
        publicSignupEndpoint: "/api/waitlist",
        resources: [
          "waitlyze://workspaces",
          "waitlyze://waitlists",
          "waitlyze://guide/workflow",
          "waitlyze://waitlists/{waitlistId}",
          "waitlyze://waitlists/{waitlistId}/page",
          "waitlyze://waitlists/{waitlistId}/analytics",
          "waitlyze://waitlists/{waitlistId}/subscribers",
          "waitlyze://waitlists/{waitlistId}/email-templates",
          "waitlyze://waitlists/{waitlistId}/automations",
          "waitlyze://workspaces/{workspaceId}",
        ],
        webhookEvents: [
          "signup.created",
          "signup.verified",
          "referral.completed",
          "reward.unlocked",
        ],
      })),
  );

  server.registerTool(
    "waitlyze_list_workspaces",
    {
      title: "List Workspaces",
      description:
        "Lists all accessible workspaces with role, plan tier, waitlist count, member count, and live total signups.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    () =>
      runTool(async () => {
        assertScope(authContext, "workspace:read");
        if (authContext.waitlistId) {
          const wl = await prisma.waitList.findUnique({
            where: { id: authContext.waitlistId },
            select: {
              workspace: { select: { id: true, name: true, personalOwnerId: true } },
            },
          });
          return { workspaces: wl?.workspace ? [wl.workspace] : [] };
        }
        const memberships = await prisma.workspaceMember.findMany({
          where: {
            userId: authContext.userId,
            ...(authContext.workspaceId ? { workspaceId: authContext.workspaceId } : {}),
          },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                personalOwnerId: true,
                createdAt: true,
                _count: { select: { waitLists: true, members: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });
        const workspaces = await Promise.all(
          memberships.map(async (m) => {
            const [entitlements, totalSignups] = await Promise.all([
              getWorkspaceEntitlements(prisma, m.workspace.id),
              prisma.signUp.count({ where: { waitList: { workspaceId: m.workspace.id } } }),
            ]);
            return {
              id: m.workspace.id,
              name: m.workspace.name,
              role: m.role,
              isPersonal: Boolean(m.workspace.personalOwnerId),
              plan: entitlements.plan,
              waitlistCount: m.workspace._count.waitLists,
              memberCount: m.workspace._count.members,
              totalSignups,
              createdAt: m.workspace.createdAt,
            };
          }),
        );
        return { workspaces };
      }),
  );

  server.registerTool(
    "waitlyze_get_workspace",
    {
      title: "Get Workspace",
      description:
        "Returns full workspace details: plan entitlements, live usage counters, and connected email integrations.",
      inputSchema: {
        workspaceId: z.string().optional().describe("Workspace ID (defaults to active workspace)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    ({ workspaceId }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          "workspace:read",
          "viewCampaign",
        );
        const [workspace, entitlements, totalSignups, verifiedSignups, integrations] =
          await Promise.all([
            prisma.workspace.findUnique({
              where: { id: ws.workspaceId },
              include: {
                _count: { select: { waitLists: true, members: true, emailSuppressions: true } },
              },
            }),
            getWorkspaceEntitlements(prisma, ws.workspaceId),
            prisma.signUp.count({ where: { waitList: { workspaceId: ws.workspaceId } } }),
            prisma.signUp.count({
              where: { waitList: { workspaceId: ws.workspaceId }, verifiedAt: { not: null } },
            }),
            prisma.workspaceIntegration.findMany({
              where: { workspaceId: ws.workspaceId },
              select: {
                provider: true,
                status: true,
                fromEmail: true,
                lastTestedAt: true,
                lastErrorCode: true,
                providerConfig: true,
              },
            }),
          ]);
        return {
          id: workspace.id,
          name: workspace.name,
          role: ws.role,
          isPersonal: Boolean(workspace.personalOwnerId),
          entitlements,
          usage: {
            waitlists: workspace._count.waitLists,
            members: workspace._count.members,
            suppressions: workspace._count.emailSuppressions,
            totalSignups,
            verifiedSignups,
          },
          integrations,
        };
      }),
  );

  server.registerTool(
    "waitlyze_create_workspace",
    {
      title: "Create Workspace",
      description:
        "Creates a new team workspace for the authenticated user (account-wide auth only).",
      inputSchema: {
        name: z.string().min(1).max(80).describe("Workspace name"),
      },
    },
    ({ name }) =>
      runTool(async () => {
        assertScope(authContext, "workspace:manage");
        if (authContext.waitlistId || authContext.workspaceId) {
          throw new Error("Creating a workspace requires an account-wide OAuth or session token.");
        }
        const workspace = await createWorkspaceService(prisma).createWorkspace(
          authContext.userId,
          name.trim(),
        );
        await recordAuditEvent(prisma, {
          workspaceId: workspace.id,
          userId: authContext.userId,
          action: AUDIT_ACTIONS.WORKSPACE_CREATED,
          resourceType: "workspace",
          resourceId: workspace.id,
          resourceName: workspace.name,
        });
        return { workspace };
      }),
  );

  server.registerTool(
    "waitlyze_update_workspace",
    {
      title: "Rename Workspace",
      description: "Renames an accessible workspace.",
      inputSchema: {
        workspaceId: z.string().optional(),
        name: z.string().min(1).max(80),
      },
      annotations: { idempotentHint: true },
    },
    ({ workspaceId, name }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          "workspace:manage",
          "manageWorkspace",
        );
        const updated = await createWorkspaceService(prisma).renameWorkspace(
          authContext.userId,
          ws.workspaceId,
          name.trim(),
        );
        await recordAuditEvent(prisma, {
          workspaceId: ws.workspaceId,
          userId: authContext.userId,
          action: AUDIT_ACTIONS.WORKSPACE_RENAMED,
          resourceType: "workspace",
          resourceId: ws.workspaceId,
          resourceName: name.trim(),
        });
        return { workspace: updated };
      }),
  );

  server.registerTool(
    "waitlyze_list_workspace_members",
    {
      title: "List Workspace Members & Invites",
      description: "Lists all workspace members, roles, and pending invitations.",
      inputSchema: { workspaceId: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    ({ workspaceId }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          "workspace:read",
          "viewCampaign",
        );
        const now = new Date();
        const [members, invitations] = await Promise.all([
          prisma.workspaceMember.findMany({
            where: { workspaceId: ws.workspaceId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          }),
          prisma.workspaceInvitation.findMany({
            where: {
              workspaceId: ws.workspaceId,
              status: { in: ["PENDING", "SEND_FAILED"] },
              expiresAt: { gt: now },
            },
            select: { id: true, emailNormalized: true, role: true, status: true, expiresAt: true },
          }),
        ]);
        return {
          members: members.map((m) => ({
            userId: m.userId,
            role: m.role,
            name: m.user.name,
            email: m.user.email,
          })),
          pendingInvitations: invitations,
        };
      }),
  );

  server.registerTool(
    "waitlyze_manage_workspace_member",
    {
      title: "Manage Workspace Member",
      description:
        "Invite a teammate, change a member's role (ADMIN/MEMBER), remove a member, or revoke an invitation.",
      inputSchema: {
        workspaceId: z.string().optional(),
        action: z.enum(["invite", "change_role", "remove_member", "revoke_invitation"]),
        email: z.string().optional().describe("Required for action='invite'"),
        role: z.enum(["MEMBER", "ADMIN"]).optional().default("MEMBER"),
        userId: z.string().optional().describe("Required for change_role / remove_member"),
        invitationId: z.string().optional().describe("Required for revoke_invitation"),
      },
    },
    ({ workspaceId, action, email, role, userId, invitationId }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          "workspace:manage",
          "manageWorkspace",
        );

        if (action === "change_role") {
          const res = await createWorkspaceService(prisma).changeWorkspaceMemberRole(
            authContext.userId,
            ws.workspaceId,
            userId,
            role,
          );
          await recordAuditEvent(prisma, {
            workspaceId: ws.workspaceId,
            userId: authContext.userId,
            action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
            resourceType: "member",
            resourceId: userId,
          });
          return res;
        }
        if (action === "remove_member") {
          const removed = await createWorkspaceService(prisma).removeWorkspaceMember(
            authContext.userId,
            ws.workspaceId,
            userId,
          );
          await recordAuditEvent(prisma, {
            workspaceId: ws.workspaceId,
            userId: authContext.userId,
            action: AUDIT_ACTIONS.MEMBER_REMOVED,
            resourceType: "member",
            resourceId: userId,
            resourceName: removed.email,
          });
          return { removed: true, ...removed };
        }
        if (action === "revoke_invitation") {
          const res = await revokeWorkspaceInvitation(prisma, {
            invitationId,
            workspaceId: ws.workspaceId,
            actorId: authContext.userId,
          });
          if (!res.success) throw new Error("Active invitation not found.");
          await recordAuditEvent(prisma, {
            workspaceId: ws.workspaceId,
            userId: authContext.userId,
            action: AUDIT_ACTIONS.INVITATION_REVOKED,
            resourceType: "invitation",
            resourceId: invitationId,
          });
          return { revoked: true, invitationId };
        }

        const normalizedEmail = normalizeInvitationEmail(email);
        if (!normalizedEmail) throw new TypeError("Valid email address is required.");
        if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
          throw new Error("Secure invitations require WEBHOOK_SECRET_ENCRYPTION_KEY.");
        }
        const actor = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId: ws.workspaceId, userId: authContext.userId },
          },
          select: { role: true, user: { select: { name: true } } },
        });
        if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) {
          throw new Error("Only admins or owners can invite members.");
        }
        if (role === "ADMIN" && actor.role !== "OWNER") {
          throw new Error("Only owners can invite admins.");
        }

        const now = new Date();
        const [entitlements, memberCount, pendingCount] = await Promise.all([
          getWorkspaceEntitlements(prisma, ws.workspaceId),
          prisma.workspaceMember.count({ where: { workspaceId: ws.workspaceId } }),
          prisma.workspaceInvitation.count({
            where: {
              workspaceId: ws.workspaceId,
              status: { in: ["PENDING", "SEND_FAILED"] },
              expiresAt: { gt: now },
            },
          }),
        ]);
        requireCapacity({
          entitlements,
          feature: "members",
          used: memberCount + pendingCount,
          message: "Upgrade workspace plan to invite more teammates.",
        });
        const token = randomBytes(32).toString("base64url");
        const tokenHash = hashInvitationToken(token);
        const encrypted = encryptIntegrationSecret(token);
        const invitation = await prisma.workspaceInvitation.create({
          data: {
            id: randomUUID(),
            workspaceId: ws.workspaceId,
            emailNormalized: normalizedEmail,
            role,
            tokenHash,
            tokenCiphertext: encrypted.secretCiphertext,
            tokenIv: encrypted.secretIv,
            tokenTag: encrypted.secretTag,
            expiresAt: invitationExpiry(now),
            createdByUserId: authContext.userId,
          },
        });
        await consumePublicBudget(prisma, {
          kind: "invitation",
          campaignId: ws.workspaceId,
          actorId: authContext.userId,
          email: normalizedEmail,
        });
        const base = new URL(env.BETTER_AUTH_URL);
        const url = new URL(
          `/accept-invitation/${encodeURIComponent(token)}`,
          base.origin,
        ).toString();
        const props = {
          inviterName: actor.user?.name || "A workspace admin",
          workspaceName: ws.workspaceName,
          role: role === "ADMIN" ? "Admin" : "Member",
          url,
        };
        const html = await renderWorkspaceInvitation(props);
        await sendPlatformEmail({
          to: normalizedEmail,
          subject: `Join ${ws.workspaceName.replace(/[\r\n]+/g, " ")} on Waitlyze`,
          html,
          text: workspaceInvitationText(props),
          idempotencyKey: `workspace-invitation-${invitation.id}-${tokenHash.slice(0, 16)}`,
        });
        await prisma.workspaceInvitation.updateMany({
          where: { id: invitation.id, status: "PENDING" },
          data: { tokenCiphertext: "", tokenIv: "", tokenTag: "" },
        });
        await recordAuditEvent(prisma, {
          workspaceId: ws.workspaceId,
          userId: authContext.userId,
          action: AUDIT_ACTIONS.MEMBER_INVITED,
          resourceType: "invitation",
          resourceId: invitation.id,
          resourceName: normalizedEmail,
        });
        return { id: invitation.id, email: normalizedEmail, role, status: "PENDING" };
      }),
  );

  server.registerTool(
    "waitlyze_list_audit_events",
    {
      title: "List Workspace Audit Events",
      description: "Lists security and operational audit events for a workspace.",
      inputSchema: {
        workspaceId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(50),
      },
      annotations: { readOnlyHint: true },
    },
    ({ workspaceId, limit }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          "workspace:read",
          "manageWorkspace",
        );
        const events = await prisma.workspaceAuditEvent.findMany({
          where: { workspaceId: ws.workspaceId },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return { events };
      }),
  );

  server.registerTool(
    "waitlyze_manage_suppressions",
    {
      title: "Manage Workspace Email Suppressions",
      description:
        "List, add, or remove bounced/complained/unsubscribed emails in the workspace suppression list.",
      inputSchema: {
        workspaceId: z.string().optional(),
        action: z.enum(["list", "add", "remove"]).default("list"),
        email: z.string().optional(),
        reason: z.enum(["BOUNCED", "COMPLAINED", "MANUAL"]).optional().default("MANUAL"),
      },
    },
    ({ workspaceId, action, email, reason }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          action === "list" ? "emails:read" : "emails:write",
          action === "list" ? "viewAudience" : "manageAudience",
        );
        if (action === "list") {
          const items = await prisma.emailSuppression.findMany({
            where: { workspaceId: ws.workspaceId },
            orderBy: { createdAt: "desc" },
            take: 100,
          });
          return { suppressions: items };
        }
        const emailInput = typeof email === "string" ? email.trim() : "";
        const normalized = normalizeSignupEmail(emailInput);
        if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          throw new TypeError("Valid email address is required.");
        }
        if (action === "add") {
          const entry = await prisma.emailSuppression.upsert({
            where: {
              workspaceId_emailNormalized: {
                workspaceId: ws.workspaceId,
                emailNormalized: normalized,
              },
            },
            update: { reason },
            create: {
              workspaceId: ws.workspaceId,
              emailNormalized: normalized,
              reason,
            },
          });
          return { added: true, entry };
        }
        const res = await prisma.emailSuppression.deleteMany({
          where: { workspaceId: ws.workspaceId, emailNormalized: normalized },
        });
        return { removed: res.count > 0, email: normalized };
      }),
  );

  server.registerTool(
    "waitlyze_list_api_keys",
    {
      title: "List API Keys",
      description:
        "Lists API keys accessible to the caller (redacted hashes; shows prefix, scopes, and target waitlist/workspace).",
      inputSchema: {
        waitlistId: z.string().optional(),
        workspaceId: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, workspaceId }) =>
      runTool(async () => {
        assertScope(authContext, "waitlist:read");
        const targetWaitlist = authContext.waitlistId || waitlistId || null;
        const targetWorkspace = authContext.workspaceId || workspaceId || null;
        const accessibleWaitlists = await prisma.waitList.findMany({
          where: targetWaitlist
            ? {
                id: targetWaitlist,
                workspace: { members: { some: { userId: authContext.userId } } },
              }
            : {
                workspace: {
                  members: { some: { userId: authContext.userId } },
                  ...(targetWorkspace ? { id: targetWorkspace } : {}),
                },
              },
          select: { id: true },
        });
        const memberships = await prisma.workspaceMember.findMany({
          where: {
            userId: authContext.userId,
            role: { in: ["OWNER", "ADMIN"] },
            ...(targetWorkspace ? { workspaceId: targetWorkspace } : {}),
          },
          select: { workspaceId: true },
        });
        const apiKeys = await listUserApiKeys(
          authContext.userId,
          accessibleWaitlists.map((w) => w.id),
          targetWaitlist ? [] : memberships.map((m) => m.workspaceId),
        );
        return { apiKeys };
      }),
  );

  server.registerTool(
    "waitlyze_create_api_key",
    {
      title: "Create API Key",
      description:
        "Creates a waitlist-scoped or workspace-scoped wl2_ API key with granular scopes (plaintext key returned once).",
      inputSchema: {
        name: z.string().min(3).max(64),
        waitlistId: z.string().optional(),
        workspaceId: z.string().optional(),
        scopes: z.array(z.string()).optional(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      },
    },
    ({ name, waitlistId, workspaceId, scopes, expiresInDays }) =>
      runTool(async () => {
        assertScope(authContext, "waitlist:manage");
        if (authContext.waitlistId) {
          throw new Error("Waitlist-scoped API keys cannot create new API keys.");
        }
        let targetWorkspaceId = workspaceId || null;
        if (waitlistId) {
          const { waitlist: wl } = await requireWaitlistAccess(
            authContext,
            waitlistId,
            "waitlist:manage",
            "manageConnections",
            { id: true, workspaceId: true },
          );
          targetWorkspaceId = wl.workspaceId;
        } else {
          const ws = await requireWorkspaceAccess(
            authContext,
            targetWorkspaceId,
            "workspace:manage",
            "manageConnections",
          );
          targetWorkspaceId = ws.workspaceId;
        }
        const effectiveScopes =
          Array.isArray(scopes) && scopes.length
            ? scopes
            : waitlistId
              ? ["waitlist:write"]
              : ["mcp:write"];
        const expiresAt = expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null;
        const apiKey = await createApiKey({
          name: name.trim(),
          userId: authContext.userId,
          waitlistId: waitlistId || null,
          workspaceId: targetWorkspaceId,
          scopes: effectiveScopes,
          expiresAt,
        });
        return { apiKey };
      }),
  );

  server.registerTool(
    "waitlyze_revoke_api_key",
    {
      title: "Revoke API Key",
      description: "Revokes an API key immediately by key ID.",
      inputSchema: { apiKeyId: z.string().min(1) },
    },
    ({ apiKeyId }) =>
      runTool(async () => {
        assertScope(authContext, "waitlist:manage");
        if (authContext.waitlistId) {
          throw new Error("Waitlist-scoped API keys cannot revoke API keys.");
        }
        const key = await prisma.apiKey.findFirst({
          where: { OR: [{ id: apiKeyId }, { keyId: apiKeyId }], revokedAt: null },
          select: { id: true, userId: true, waitlistId: true, workspaceId: true },
        });
        if (!key) throw new Error(`API key '${apiKeyId}' not found or already revoked.`);
        if (key.waitlistId) {
          await requireWaitlistAccess(
            authContext,
            key.waitlistId,
            "waitlist:manage",
            "manageConnections",
            { id: true, workspaceId: true },
          );
        } else if (key.workspaceId) {
          await requireWorkspaceAccess(
            authContext,
            key.workspaceId,
            "workspace:manage",
            "manageConnections",
          );
        } else if (key.userId !== authContext.userId) {
          throw new Error(`API key '${apiKeyId}' not found or already revoked.`);
        }
        const ok = await revokeApiKey(key.id, authContext.userId, key.waitlistId, key.workspaceId);
        if (!ok) throw new Error(`API key '${apiKeyId}' not found or already revoked.`);
        return { revoked: true, apiKeyId: key.id };
      }),
  );

  server.registerTool(
    "waitlyze_manage_workspace_email_integration",
    {
      title: "Manage Workspace Email Integration",
      description:
        "Inspect, connect, test, list Resend domains, or disconnect workspace-level Resend or Cloudflare Email sending.",
      inputSchema: {
        workspaceId: z.string().optional(),
        action: z.enum([
          "get",
          "connect_resend",
          "test_resend",
          "list_resend_domains",
          "disconnect_resend",
          "connect_cloudflare_email",
          "disconnect_cloudflare_email",
        ]),
        fromEmail: z.string().optional(),
        apiKey: z.string().optional(),
        webhookSecret: z.string().optional(),
        accountId: z.string().optional().describe("32-char Cloudflare account ID"),
        apiToken: z.string().optional().describe("Cloudflare API token"),
        testRecipientEmail: z.string().optional(),
      },
    },
    ({
      workspaceId,
      action,
      fromEmail,
      apiKey,
      webhookSecret,
      accountId,
      apiToken,
      testRecipientEmail,
    }) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          workspaceId,
          action === "get" ? "workspace:read" : "integrations:write",
          "manageConnections",
        );
        if (action === "get") {
          const rows = await prisma.workspaceIntegration.findMany({
            where: { workspaceId: ws.workspaceId },
            select: {
              provider: true,
              status: true,
              fromEmail: true,
              lastTestedAt: true,
              lastErrorCode: true,
              providerConfig: true,
              updatedAt: true,
            },
          });
          return { integrations: rows };
        }
        if (action === "connect_resend") {
          return configureWorkspaceResendOp({
            workspaceId: ws.workspaceId,
            userId: authContext.userId,
            fromEmail,
            apiKey,
            webhookSecret,
          });
        }
        if (action === "test_resend") {
          const recipient =
            typeof testRecipientEmail === "string" && testRecipientEmail.trim()
              ? testRecipientEmail.trim()
              : authContext.user?.email || "";
          if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            throw new TypeError("Enter a valid testRecipientEmail address.");
          }
          return testWorkspaceResendOp({
            workspaceId: ws.workspaceId,
            recipientEmail: recipient,
          });
        }
        if (action === "list_resend_domains") {
          return { domains: await listResendDomainsForWorkspaceOp(ws.workspaceId) };
        }
        if (action === "disconnect_resend") {
          const res = await prisma.workspaceIntegration.deleteMany({
            where: { workspaceId: ws.workspaceId, provider: "RESEND" },
          });
          return { disconnected: res.count > 0, provider: "RESEND" };
        }
        if (action === "connect_cloudflare_email") {
          if (!env.WEBHOOK_SECRET_ENCRYPTION_KEY) {
            throw new Error("Secret encryption is not configured.");
          }
          const acct = String(accountId || "").trim();
          const tok = String(apiToken || "").trim();
          const email = String(fromEmail || "").trim();
          if (!/^[a-f0-9]{32}$/i.test(acct))
            throw new TypeError("Valid 32-char Cloudflare accountId required.");
          if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
            throw new TypeError("Valid fromEmail required.");
          if (tok.length < 20) throw new TypeError("Valid Cloudflare apiToken required.");
          const secret = encryptIntegrationSecret(tok);
          const row = await prisma.workspaceIntegration.upsert({
            where: {
              workspaceId_provider: { workspaceId: ws.workspaceId, provider: "CLOUDFLARE_EMAIL" },
            },
            create: {
              workspaceId: ws.workspaceId,
              provider: "CLOUDFLARE_EMAIL",
              fromEmail: email,
              providerConfig: { accountId: acct.toLowerCase() },
              ...secret,
            },
            update: {
              fromEmail: email,
              providerConfig: { accountId: acct.toLowerCase() },
              status: "NEEDS_TEST",
              lastErrorCode: null,
              ...secret,
            },
            select: { id: true, provider: true, status: true, fromEmail: true, updatedAt: true },
          });
          return row;
        }
        const res = await prisma.workspaceIntegration.deleteMany({
          where: { workspaceId: ws.workspaceId, provider: "CLOUDFLARE_EMAIL" },
        });
        return { disconnected: res.count > 0, provider: "CLOUDFLARE_EMAIL" };
      }),
  );
}
