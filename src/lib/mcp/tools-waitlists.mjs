import * as z from "zod/v4";

import { getWaitlistAnalytics } from "@/lib/analytics/waitlist-analytics.mjs";
import {
  configureNotificationChannelOp,
  configureWaitlistEmailSenderOp,
  connectCustomDomainOp,
  createWebhookSubscriptionOp,
  formatSafeDomain,
  formatSafeWebhook,
  getWaitlistEmailSenderOp,
  removeCustomDomainOp,
  replayWebhookDeliveryOp,
  rotateWebhookSecretOp,
  testNotificationChannelOp,
  testWaitlistEmailSenderOp,
  testWebhookSubscriptionOp,
  updateWebhookSubscriptionOp,
  verifyCustomDomainOp,
} from "@/lib/api/infra-ops.mjs";
import {
  configureWaitlistFormRulesOp,
  configureWaitlistRewardsOp,
  createDraftWaitlistOp,
  parseTemplateSnapshotOrDefault,
  publicBaseUrl,
  updateWaitlistFieldsOp,
  updateWaitlistSnapshotOp,
  waitlistPublicUrl,
} from "@/lib/api/platform-ops.mjs";
import { runLaunchRehearsal } from "@/lib/campaigns/launch-rehearsal.mjs";
import { pauseCampaign, publishCampaign, rollbackCampaign } from "@/lib/campaigns/publication.mjs";
import { parseJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import { CHAT_TRIGGERS } from "@/lib/integrations/chat-notifiers.mjs";
import {
  assertScope,
  requireWaitlistAccess,
  requireWorkspaceAccess,
  runTool,
} from "@/lib/mcp/tool-helpers.mjs";
import prisma from "@/lib/prisma.js";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks/delivery.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { campaignScope } from "@/lib/workspaces/service.mjs";

export function registerWaitlistMcpTools(server, authContext) {
  server.registerTool(
    "waitlyze_list_waitlists",
    {
      title: "List Waitlists",
      description:
        "Lists all accessible waitlists with live totalSignups, publication status, publicUrl, and customDomain.",
      inputSchema: {
        workspaceId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(50),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    ({ workspaceId, limit }) =>
      runTool(async () => {
        assertScope(authContext, "waitlist:read");
        const where = authContext.waitlistId
          ? { id: authContext.waitlistId, ...campaignScope(authContext.userId, "viewCampaign") }
          : campaignScope(
              authContext.userId,
              "viewCampaign",
              authContext.workspaceId || workspaceId || undefined,
            );
        const rows = await prisma.waitList.findMany({
          where,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            websiteUrl: true,
            publicSlug: true,
            status: true,
            showReferrals: true,
            sendEmailsToSubscribers: true,
            templateRevision: true,
            publishedRevision: true,
            createdAt: true,
            updatedAt: true,
            customDomain: { select: { hostname: true, status: true } },
            _count: { select: { signUps: true } },
          },
        });
        return {
          waitlists: rows.map((w) => {
            const host = w.customDomain?.status === "ACTIVE" ? w.customDomain.hostname : null;
            return {
              id: w.id,
              workspaceId: w.workspaceId,
              name: w.name,
              description: w.description,
              websiteUrl: w.websiteUrl,
              publicSlug: w.publicSlug,
              publicUrl: waitlistPublicUrl(w.publicSlug, host),
              status: w.status,
              showReferrals: w.showReferrals,
              sendEmailsToSubscribers: w.sendEmailsToSubscribers,
              templateRevision: w.templateRevision,
              publishedRevision: w.publishedRevision,
              totalSignups: w._count?.signUps ?? 0,
              createdAt: w.createdAt,
            };
          }),
        };
      }),
  );

  server.registerTool(
    "waitlyze_get_waitlist",
    {
      title: "Get Waitlist Details",
      description:
        "Returns full details of a waitlist including live totalSignups, verifiedSignups, customDomain, publicUrl, and form/reward configuration.",
      inputSchema: {
        waitlistId: z.string().min(1),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:read",
          "viewCampaign",
          {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            websiteUrl: true,
            publicSlug: true,
            status: true,
            showReferrals: true,
            sendEmailsToSubscribers: true,
            templateRevision: true,
            publishedRevision: true,
            publishedTemplateRevision: true,
            templateSnapshot: true,
            createdAt: true,
            updatedAt: true,
            customDomain: {
              select: {
                hostname: true,
                status: true,
                verification: true,
                dnsRecords: true,
                lastCheckedAt: true,
                lastErrorCode: true,
              },
            },
            _count: { select: { signUps: true } },
          },
        );
        const verifiedSignups = await prisma.signUp.count({
          where: { waitListId: waitlist.id, verifiedAt: { not: null } },
        });
        const host =
          waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;
        const snapshot = parseTemplateSnapshotOrDefault(waitlist);
        return {
          id: waitlist.id,
          workspaceId: waitlist.workspaceId,
          name: waitlist.name,
          description: waitlist.description,
          websiteUrl: waitlist.websiteUrl,
          publicSlug: waitlist.publicSlug,
          publicUrl: waitlistPublicUrl(waitlist.publicSlug, host),
          fallbackPublicUrl: waitlist.publicSlug
            ? `${publicBaseUrl()}/w/${encodeURIComponent(waitlist.publicSlug)}`
            : null,
          status: waitlist.status,
          showReferrals: waitlist.showReferrals,
          sendEmailsToSubscribers: waitlist.sendEmailsToSubscribers,
          templateRevision: waitlist.templateRevision,
          publishedRevision: waitlist.publishedRevision,
          publishedTemplateRevision: waitlist.publishedTemplateRevision,
          totalSignups: waitlist._count?.signUps ?? 0,
          verifiedSignups,
          customDomain: formatSafeDomain(waitlist.customDomain),
          form: snapshot.form,
          rewards: snapshot.rewards,
          createdAt: waitlist.createdAt,
          updatedAt: waitlist.updatedAt,
        };
      }),
  );

  server.registerTool(
    "waitlyze_create_waitlist",
    {
      title: "Create Waitlist",
      description: "Creates a new draft waitlist inside an accessible workspace.",
      inputSchema: {
        workspaceId: z.string().optional(),
        name: z.string().min(1).max(120),
        description: z.string().max(1000).optional(),
        websiteUrl: z.string().optional(),
        publicSlug: z.string().optional(),
        templateId: z.string().optional(),
        showReferrals: z.boolean().optional().default(true),
        sendEmailsToSubscribers: z.boolean().optional().default(true),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    (args) =>
      runTool(async () => {
        const ws = await requireWorkspaceAccess(
          authContext,
          args.workspaceId,
          "waitlist:manage",
          "editCampaign",
        );
        return createDraftWaitlistOp({
          userId: authContext.userId,
          workspaceId: ws.workspaceId,
          name: args.name,
          description: args.description,
          websiteUrl: args.websiteUrl,
          publicSlug: args.publicSlug,
          templateId: args.templateId,
          showReferrals: args.showReferrals,
          sendEmailsToSubscribers: args.sendEmailsToSubscribers,
        });
      }),
  );

  server.registerTool(
    "waitlyze_update_waitlist",
    {
      title: "Update Waitlist Settings",
      description:
        "Updates top-level settings of a waitlist (name, description, websiteUrl, publicSlug, showReferrals, sendEmailsToSubscribers, templateId).",
      inputSchema: {
        waitlistId: z.string().min(1),
        name: z.string().optional(),
        description: z.string().optional(),
        websiteUrl: z.string().nullable().optional(),
        publicSlug: z.string().optional(),
        templateId: z.string().optional(),
        showReferrals: z.boolean().optional(),
        sendEmailsToSubscribers: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, ...updates }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "editCampaign",
          {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            websiteUrl: true,
            publicSlug: true,
            templateRevision: true,
            templateSnapshot: true,
            showReferrals: true,
            sendEmailsToSubscribers: true,
          },
        );
        return updateWaitlistFieldsOp({
          userId: authContext.userId,
          waitlist,
          updates,
        });
      }),
  );

  server.registerTool(
    "waitlyze_get_waitlist_page",
    {
      title: "Get Waitlist Page Snapshot",
      description:
        "Returns the complete hosted page builder snapshot (sections, brand, statusPage, seo, form, rewards) and revision numbers.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:read",
          "viewCampaign",
          {
            id: true,
            name: true,
            description: true,
            status: true,
            templateRevision: true,
            publishedRevision: true,
            templateSnapshot: true,
            publicationRevisions: {
              orderBy: { revision: "desc" },
              take: 1,
              select: { revision: true, snapshot: true, createdAt: true },
            },
          },
        );
        return {
          waitlistId: waitlist.id,
          status: waitlist.status,
          templateRevision: waitlist.templateRevision,
          publishedRevision: waitlist.publishedRevision,
          templateSnapshot: parseTemplateSnapshotOrDefault(waitlist),
          publishedSnapshot: waitlist.publicationRevisions?.[0]?.snapshot ?? null,
        };
      }),
  );

  server.registerTool(
    "waitlyze_update_waitlist_page",
    {
      title: "Update Waitlist Page Snapshot",
      description:
        "Saves full or partial page builder updates (sections, brand, statusPage, seo, theme, form, rewards) with optimistic revision locking.",
      inputSchema: {
        waitlistId: z.string().min(1),
        snapshot: z
          .record(z.string(), z.unknown())
          .describe("Full or partial snapshot fields to merge/save"),
        expectedRevision: z.number().int().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, snapshot, expectedRevision }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "editCampaign",
          {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            templateRevision: true,
            templateSnapshot: true,
          },
        );
        const current = parseTemplateSnapshotOrDefault(waitlist);
        const mergedSnapshot = {
          ...current,
          ...snapshot,
          ...(snapshot?.brand && typeof snapshot.brand === "object"
            ? { brand: { ...current.brand, ...snapshot.brand } }
            : {}),
          ...(snapshot?.theme && typeof snapshot.theme === "object"
            ? { theme: { ...current.theme, ...snapshot.theme } }
            : {}),
          ...(snapshot?.form && typeof snapshot.form === "object"
            ? { form: { ...current.form, ...snapshot.form } }
            : {}),
          ...(snapshot?.rewards && typeof snapshot.rewards === "object"
            ? { rewards: { ...current.rewards, ...snapshot.rewards } }
            : {}),
          ...(snapshot?.statusPage && typeof snapshot.statusPage === "object"
            ? { statusPage: { ...current.statusPage, ...snapshot.statusPage } }
            : {}),
          ...(snapshot?.seo && typeof snapshot.seo === "object"
            ? { seo: { ...current.seo, ...snapshot.seo } }
            : {}),
        };
        return updateWaitlistSnapshotOp({
          userId: authContext.userId,
          waitlist,
          snapshot: mergedSnapshot,
          expectedRevision,
        });
      }),
  );

  server.registerTool(
    "waitlyze_configure_form_rules",
    {
      title: "Configure Waitlist Form Rules",
      description:
        "Updates signup form rules: doubleOptIn, blockDisposable, collectPhone, requirePhone, customFields, marketingConsentCopy.",
      inputSchema: {
        waitlistId: z.string().min(1),
        form: z.record(z.string(), z.unknown()).describe("Form rule fields to update"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, form }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "editCampaign",
          {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            templateRevision: true,
            templateSnapshot: true,
          },
        );
        return configureWaitlistFormRulesOp({
          userId: authContext.userId,
          waitlist,
          formPatch: form,
        });
      }),
  );

  server.registerTool(
    "waitlyze_configure_rewards",
    {
      title: "Configure Referral Rewards & Tiers",
      description:
        "Configures signup/referral/streak point rules, hideCounts, customEvents, and referral milestone reward tiers.",
      inputSchema: {
        waitlistId: z.string().min(1),
        rewards: z.record(z.string(), z.unknown()).optional(),
        tiers: z.array(z.record(z.string(), z.unknown())).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, rewards, tiers }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "editCampaign",
          {
            id: true,
            workspaceId: true,
            name: true,
            description: true,
            templateRevision: true,
            templateSnapshot: true,
          },
        );
        return configureWaitlistRewardsOp({
          userId: authContext.userId,
          waitlist,
          rewardsPatch: rewards || {},
          tiers,
        });
      }),
  );

  server.registerTool(
    "waitlyze_run_launch_rehearsal",
    {
      title: "Run Launch Rehearsal Checks",
      description:
        "Runs pre-flight checks (slug, email sender, domain, copy completeness, form rules, plan capacity) before publishing live.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        return runLaunchRehearsal(prisma, waitlist.id);
      }),
  );

  server.registerTool(
    "waitlyze_publish_waitlist",
    {
      title: "Publish Waitlist Live",
      description: "Publishes the current draft snapshot so the hosted page and widgets go live.",
      inputSchema: {
        waitlistId: z.string().min(1),
        expectedRevision: z.number().int().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, expectedRevision }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "publishCampaign",
          {
            id: true,
            workspaceId: true,
            publicSlug: true,
            templateRevision: true,
            customDomain: { select: { hostname: true, status: true } },
          },
        );
        const result = await publishCampaign(
          prisma,
          authContext.userId,
          waitlist.workspaceId,
          waitlist.id,
          expectedRevision ?? waitlist.templateRevision,
        );
        const host =
          waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;
        return {
          ...result,
          publicUrl: waitlistPublicUrl(waitlist.publicSlug, host),
        };
      }),
  );

  server.registerTool(
    "waitlyze_pause_waitlist",
    {
      title: "Pause Waitlist",
      description:
        "Pauses a live waitlist (public page shows paused notice and blocks new signups).",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "publishCampaign",
          { id: true, workspaceId: true },
        );
        return pauseCampaign(prisma, authContext.userId, waitlist.workspaceId, waitlist.id);
      }),
  );

  server.registerTool(
    "waitlyze_rollback_waitlist",
    {
      title: "Rollback Published Waitlist",
      description: "Rolls back the live waitlist page to the previous published snapshot revision.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "publishCampaign",
          { id: true, workspaceId: true },
        );
        return rollbackCampaign(prisma, authContext.userId, waitlist.workspaceId, waitlist.id);
      }),
  );

  server.registerTool(
    "waitlyze_delete_waitlist",
    {
      title: "Delete Waitlist",
      description:
        "Permanently deletes a waitlist and all associated subscribers, broadcasts, and webhooks.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "waitlist:manage",
          "deleteCampaign",
          { id: true, workspaceId: true, name: true },
        );
        await prisma.waitList.delete({ where: { id: waitlist.id } });
        await recordAuditEvent(prisma, {
          workspaceId: waitlist.workspaceId,
          userId: authContext.userId,
          action: AUDIT_ACTIONS.WAITLIST_DELETED,
          resourceType: "waitlist",
          resourceId: waitlist.id,
          resourceName: waitlist.name,
        });
        return { deleted: true, waitlistId: waitlist.id };
      }),
  );

  server.registerTool(
    "waitlyze_get_analytics",
    {
      title: "Get Waitlist Analytics",
      description:
        "Returns live 15-minute & daily traffic/signup funnel, conversion rate, referral K-factor, top UTMs, countries, cities, and devices.",
      inputSchema: {
        waitlistId: z.string().min(1),
        days: z.number().int().min(1).max(90).optional().default(30),
        endDate: z.string().optional().describe("YYYY-MM-DD end date"),
        timeZone: z.string().optional().default("UTC"),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, days, endDate, timeZone }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "analytics:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        const [analytics, totalSignups, verifiedSignups] = await Promise.all([
          getWaitlistAnalytics(prisma, { waitListId: waitlist.id, days, endDate, timeZone }),
          prisma.signUp.count({ where: { waitListId: waitlist.id } }),
          prisma.signUp.count({ where: { waitListId: waitlist.id, verifiedAt: { not: null } } }),
        ]);
        return {
          ...analytics,
          liveTotals: {
            totalSignups,
            verifiedSignups,
            unverifiedSignups: Math.max(0, totalSignups - verifiedSignups),
          },
        };
      }),
  );

  server.registerTool(
    "waitlyze_manage_custom_domain",
    {
      title: "Manage Custom Domain",
      description:
        "Inspect, connect, verify DNS, or remove a custom domain for a waitlist hosted page.",
      inputSchema: {
        waitlistId: z.string().min(1),
        action: z.enum(["get", "connect", "verify", "remove"]).default("get"),
        hostname: z.string().optional().describe("Required for action='connect'"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, action, hostname }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          action === "get" ? "waitlist:read" : "waitlist:manage",
          action === "get" ? "viewCampaign" : "publishCampaign",
          { id: true, workspaceId: true },
        );
        if (action === "get") {
          const row = await prisma.customDomain.findUnique({ where: { waitListId: waitlist.id } });
          return { domain: formatSafeDomain(row) };
        }
        if (action === "connect") {
          return { domain: await connectCustomDomainOp({ waitlist, rawHostname: hostname }) };
        }
        if (action === "verify") {
          return { domain: await verifyCustomDomainOp(waitlist.id) };
        }
        return removeCustomDomainOp(waitlist.id);
      }),
  );

  server.registerTool(
    "waitlyze_manage_email_sender",
    {
      title: "Manage Waitlist Email Sender Override",
      description:
        "Inspect effective sender (waitlist vs workspace), configure waitlist-specific Resend key + From address, send test email, or remove override.",
      inputSchema: {
        waitlistId: z.string().min(1),
        action: z.enum(["get", "configure", "test", "remove"]).default("get"),
        fromEmail: z.string().optional(),
        apiKey: z.string().optional(),
        testRecipientEmail: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, action, fromEmail, apiKey, testRecipientEmail }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          action === "get" ? "emails:read" : "integrations:write",
          action === "get" ? "viewCampaign" : "manageConnections",
          { id: true, workspaceId: true },
        );
        if (action === "get") return getWaitlistEmailSenderOp(waitlist);
        if (action === "configure") {
          return configureWaitlistEmailSenderOp({
            userId: authContext.userId,
            waitlistId: waitlist.id,
            fromEmail,
            apiKey,
          });
        }
        if (action === "test") {
          return testWaitlistEmailSenderOp({
            waitlistId: waitlist.id,
            recipientEmail: testRecipientEmail,
          });
        }
        await prisma.waitlistEmailSender.deleteMany({ where: { waitListId: waitlist.id } });
        return { disconnected: true };
      }),
  );

  server.registerTool(
    "waitlyze_manage_chat_notifications",
    {
      title: "Manage Slack / Discord Notifications",
      description: "Get, configure, test, or disconnect Slack or Discord waitlist notifications.",
      inputSchema: {
        waitlistId: z.string().min(1),
        channel: z.enum(["slack", "discord"]),
        action: z.enum(["get", "configure", "test", "disconnect"]).default("get"),
        webhookUrl: z.string().optional(),
        triggers: z
          .array(z.enum(["MILESTONE_COUNTS", "VERIFIED_SIGNUP", "REWARD_TIER_UNLOCKED"]))
          .optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, channel, action, webhookUrl, triggers }) =>
      runTool(async () => {
        const provider = channel === "discord" ? "DISCORD" : "SLACK";
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          action === "get" ? "waitlist:read" : "integrations:write",
          action === "get" ? "viewCampaign" : "manageConnections",
          { id: true, workspaceId: true },
        );
        if (action === "get") {
          const row = await prisma.waitlistNotificationChannel.findUnique({
            where: { waitListId_provider: { waitListId: waitlist.id, provider } },
          });
          if (!row) {
            return { connected: false, channel, availableTriggers: CHAT_TRIGGERS, triggers: [] };
          }
          return {
            connected: true,
            id: row.id,
            channel,
            provider: row.provider,
            status: row.status,
            triggers: parseJsonStringArray(row.triggers, [CHAT_TRIGGERS[0]]),
            availableTriggers: CHAT_TRIGGERS,
            lastTestedAt: row.lastTestedAt,
            lastErrorCode: row.lastErrorCode,
          };
        }
        if (action === "configure") {
          return configureNotificationChannelOp({
            userId: authContext.userId,
            waitlistId: waitlist.id,
            channel: provider,
            webhookUrl,
            triggers,
          });
        }
        if (action === "test") {
          return testNotificationChannelOp({ waitlistId: waitlist.id, channel: provider });
        }
        await prisma.waitlistNotificationChannel.deleteMany({
          where: { waitListId: waitlist.id, provider },
        });
        return { disconnected: true, channel };
      }),
  );

  server.registerTool(
    "waitlyze_list_webhooks",
    {
      title: "List Webhooks",
      description:
        "Lists configured webhook subscriptions for a waitlist (supported events & status).",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        const subs = await prisma.webhookSubscription.findMany({
          where: { waitListId: waitlist.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            url: true,
            eventTypes: true,
            enabled: true,
            includeSubscriberData: true,
            lastDeliveredAt: true,
            createdAt: true,
          },
        });
        return {
          webhooks: subs.map((s) => formatSafeWebhook(s)),
          supportedEvents: WEBHOOK_EVENT_TYPES,
        };
      }),
  );

  server.registerTool(
    "waitlyze_create_webhook",
    {
      title: "Create Webhook Subscription",
      description: "Creates a new webhook subscription (returns signing secret once).",
      inputSchema: {
        waitlistId: z.string().min(1),
        name: z.string().min(1).max(80),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        includeSubscriberData: z.boolean().optional().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, name, url, events, includeSubscriberData }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:write",
          "manageConnections",
          { id: true, workspaceId: true },
        );
        return createWebhookSubscriptionOp({
          waitlistId: waitlist.id,
          name,
          url,
          events,
          includeSubscriberData,
        });
      }),
  );

  server.registerTool(
    "waitlyze_update_webhook",
    {
      title: "Update Webhook Subscription",
      description:
        "Updates name, url, events, enabled status, or includeSubscriberData on a webhook.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriptionId: z.string().min(1),
        name: z.string().optional(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        enabled: z.boolean().optional(),
        includeSubscriberData: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, subscriptionId, ...updates }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:write",
          "manageConnections",
          { id: true, workspaceId: true },
        );
        return updateWebhookSubscriptionOp({
          waitlistId: waitlist.id,
          subscriptionId,
          updates,
        });
      }),
  );

  server.registerTool(
    "waitlyze_test_webhook",
    {
      title: "Send Test Webhook Event",
      description: "Dispatches a live test signup.created event to a webhook subscription.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriptionId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, subscriptionId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:write",
          "manageConnections",
          { id: true, workspaceId: true },
        );
        return testWebhookSubscriptionOp({ waitlistId: waitlist.id, subscriptionId });
      }),
  );

  server.registerTool(
    "waitlyze_rotate_webhook_secret",
    {
      title: "Rotate Webhook Signing Secret",
      description:
        "Rotates the HMAC signing secret of a webhook subscription and returns the new secret once.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriptionId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, subscriptionId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:write",
          "manageConnections",
          { id: true, workspaceId: true },
        );
        return rotateWebhookSecretOp({ waitlistId: waitlist.id, subscriptionId });
      }),
  );

  server.registerTool(
    "waitlyze_manage_webhook_deliveries",
    {
      title: "List or Replay Webhook Deliveries",
      description: "Lists recent webhook delivery attempts or replays a failed delivery.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriptionId: z.string().min(1),
        action: z.enum(["list", "replay"]).default("list"),
        deliveryId: z.string().optional().describe("Required for action='replay'"),
        limit: z.number().int().min(1).max(100).optional().default(50),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, subscriptionId, action, deliveryId, limit }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          action === "replay" ? "webhooks:write" : "webhooks:read",
          action === "replay" ? "manageConnections" : "viewCampaign",
          { id: true, workspaceId: true },
        );
        if (action === "replay") {
          return replayWebhookDeliveryOp({
            waitlistId: waitlist.id,
            subscriptionId,
            deliveryId,
          });
        }
        const deliveries = await prisma.webhookDelivery.findMany({
          where: { subscriptionId, subscription: { waitListId: waitlist.id } },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            eventType: true,
            status: true,
            attempts: true,
            replayCount: true,
            responseStatus: true,
            lastErrorCode: true,
            availableAt: true,
            deliveredAt: true,
            createdAt: true,
          },
        });
        return { deliveries, parseJsonStringArray: undefined };
      }),
  );

  server.registerTool(
    "waitlyze_delete_webhook",
    {
      title: "Delete Webhook Subscription",
      description: "Permanently deletes a webhook subscription.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriptionId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, subscriptionId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "webhooks:write",
          "manageConnections",
          { id: true, workspaceId: true },
        );
        const existing = await prisma.webhookSubscription.findFirst({
          where: { id: subscriptionId, waitListId: waitlist.id },
          select: { id: true },
        });
        if (!existing) throw new Error("Webhook subscription not found.");
        await prisma.webhookSubscription.delete({ where: { id: existing.id } });
        return { deleted: true, subscriptionId: existing.id };
      }),
  );
}
