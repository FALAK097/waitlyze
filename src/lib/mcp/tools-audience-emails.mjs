import * as z from "zod/v4";

import {
  bulkAudienceActionOp,
  importSubscribersJsonOp,
  retryVerificationOp,
} from "@/lib/api/audience-ops.mjs";
import {
  addSubscriberDirectOp,
  awardCustomPointsOp,
  cancelBroadcastOp,
  createOrUpdateBroadcastOp,
  deleteBroadcastOp,
  deleteWaitlistSubscriberOp,
  listAutomationRecipesOp,
  listEmailLogsOp,
  listSubscribersOp,
  previewBroadcastRecipientsOp,
  saveAutomationRecipeOp,
  scheduleBroadcastOp,
  sendBroadcastOp,
  sendTestEmailDirectOp,
  setAutomationStatusOp,
  subscriberReferralUrl,
  updateWaitlistSubscriberOp,
  upsertEmailTemplateOp,
} from "@/lib/api/platform-ops.mjs";
import { getCampaignPositions } from "@/lib/campaigns/referral-position.mjs";
import { loadReferralReviews } from "@/lib/campaigns/referral-review-read.mjs";
import { resolveReferralReview } from "@/lib/campaigns/referral-review.mjs";
import { findSignupByEmail } from "@/lib/campaigns/signup-lookup.mjs";
import { emailStatusLabel } from "@/lib/emails/status-label.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { requireWaitlistAccess, runTool } from "@/lib/mcp/tool-helpers.mjs";
import prisma from "@/lib/prisma.js";
import { summarizeSignupRewards } from "@/lib/referrals/rewards.mjs";

export function registerAudienceAndEmailMcpTools(server, authContext) {
  server.registerTool(
    "waitlyze_list_subscribers",
    {
      title: "List Waitlist Subscribers",
      description:
        "Paginated list of subscribers with live queue positions, points, referral counts, verification, and UTM attribution.",
      inputSchema: {
        waitlistId: z.string().min(1),
        status: z.enum(["ALL", "VERIFIED", "UNVERIFIED"]).optional().default("ALL"),
        search: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
        utmSource: z.string().optional(),
        device: z.string().optional(),
        sortBy: z.enum(["createdAt", "position", "points"]).optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, ...opts }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:read",
          "viewAudience",
          { id: true, workspaceId: true, showReferrals: true },
        );
        const result = await listSubscribersOp({ waitlist, ...opts });
        return {
          totalSignups: result.total,
          subscribers: result.items,
          pagination: {
            total: result.total,
            limit: opts.limit,
            offset: opts.offset,
            hasMore: opts.offset + result.items.length < result.total,
          },
        };
      }),
  );

  server.registerTool(
    "waitlyze_get_subscriber",
    {
      title: "Get Subscriber Details",
      description:
        "Looks up a subscriber by subscriberId or email, returning live queue position, totalSignups, referralUrl, rewardSummary, and recent point events.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriberId: z.string().optional(),
        email: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, subscriberId, email }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:read",
          "viewAudience",
          {
            id: true,
            workspaceId: true,
            publicSlug: true,
            showReferrals: true,
            customDomain: { select: { hostname: true, status: true } },
          },
        );
        if (!subscriberId && !email) {
          throw new TypeError("Provide subscriberId or email.");
        }
        const subscriber = subscriberId
          ? await prisma.signUp.findFirst({
              where: { id: subscriberId, waitListId: waitlist.id },
              include: {
                referredBy: {
                  select: {
                    referredById: true,
                    reviewStatus: true,
                    referredBy: { select: { referralCode: true } },
                  },
                },
              },
            })
          : await findSignupByEmail(prisma, waitlist.id, email);
        if (!subscriber) throw new Error("Subscriber not found.");

        const [summary, totalSignups, recentPointEvents] = await Promise.all([
          summarizeSignupRewards(prisma, waitlist.id, subscriber),
          prisma.signUp.count({ where: { waitListId: waitlist.id } }),
          prisma.pointLedger.findMany({
            where: { waitListId: waitlist.id, signUpId: subscriber.id },
            orderBy: { createdAt: "desc" },
            take: 25,
          }),
        ]);
        const host =
          waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;
        return {
          id: subscriber.id,
          email: subscriber.email,
          phone: subscriber.phone,
          referralCode: subscriber.referralCode,
          referralUrl: subscriberReferralUrl(waitlist.publicSlug, subscriber.referralCode, host),
          position: summary.position ?? null,
          totalSignups,
          points: subscriber.points ?? 0,
          referralCount: summary.referrals ?? 0,
          isVerified: Boolean(subscriber.verifiedAt),
          verifiedAt: subscriber.verifiedAt,
          marketingConsent: Boolean(
            subscriber.marketingConsentAt && !subscriber.marketingUnsubscribedAt,
          ),
          customFields: subscriber.customFields,
          rewardSummary: summary,
          recentPointEvents,
          createdAt: subscriber.createdAt,
        };
      }),
  );

  server.registerTool(
    "waitlyze_add_subscriber",
    {
      title: "Add Subscriber",
      description:
        "Adds a subscriber to a waitlist (idempotent on email), optionally auto-verifies & awards configured signup/referral points, and returns live position + totalSignups + referralUrl.",
      inputSchema: {
        waitlistId: z.string().min(1),
        email: z.string().email(),
        referralCode: z.string().optional(),
        autoVerify: z.boolean().optional().default(true),
        marketingConsent: z.boolean().optional().default(false),
        phone: z.string().optional(),
        customFields: z.record(z.string(), z.unknown()).optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, ...args }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          {
            id: true,
            workspaceId: true,
            name: true,
            publicSlug: true,
            status: true,
            showReferrals: true,
            sendEmailsToSubscribers: true,
            templateSnapshot: true,
            customDomain: { select: { hostname: true, status: true } },
          },
        );
        const result = await addSubscriberDirectOp({ waitlist, ...args });
        const host =
          waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;
        return {
          alreadyExists: result.alreadyExists,
          totalSignups: result.totalSignups,
          subscriber: {
            id: result.subscriber.id,
            email: result.subscriber.email,
            referralCode: result.subscriber.referralCode,
            referralUrl: subscriberReferralUrl(
              waitlist.publicSlug,
              result.subscriber.referralCode,
              host,
            ),
            position: result.position,
            points: result.subscriber.points,
            isVerified: Boolean(result.subscriber.verifiedAt),
            customFields: result.subscriber.customFields,
          },
          rewardSummary: result.rewardSummary,
        };
      }),
  );

  server.registerTool(
    "waitlyze_import_subscribers",
    {
      title: "Bulk Import Subscribers (JSON)",
      description: "Imports up to 500 JSON subscriber records into a waitlist in a single batch.",
      inputSchema: {
        waitlistId: z.string().min(1),
        rows: z
          .array(
            z.object({
              email: z.string(),
              verified: z.boolean().optional(),
              country: z.string().optional(),
              points: z.number().int().min(0).max(1_000_000).optional(),
              referredBy: z.string().optional(),
              utmSource: z.string().optional(),
            }),
          )
          .min(1)
          .max(500),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, rows }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          {
            id: true,
            workspaceId: true,
            name: true,
            publicSlug: true,
            showReferrals: true,
            templateSnapshot: true,
          },
        );
        const res = await importSubscribersJsonOp({ waitlist, rows });
        const totalSignups = await prisma.signUp.count({ where: { waitListId: waitlist.id } });
        return { ...res, totalSignups };
      }),
  );

  server.registerTool(
    "waitlyze_update_subscriber",
    {
      title: "Update Subscriber",
      description:
        "Updates verified status, phone, customFields, or marketingConsent for a subscriber.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriberId: z.string().min(1),
        verified: z.boolean().optional(),
        phone: z.string().nullable().optional(),
        customFields: z.record(z.string(), z.unknown()).optional(),
        marketingConsent: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, subscriberId, ...updates }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          { id: true, workspaceId: true, showReferrals: true, templateSnapshot: true },
        );
        return updateWaitlistSubscriberOp({ waitlist, subscriberId, updates });
      }),
  );

  server.registerTool(
    "waitlyze_remove_subscriber",
    {
      title: "Remove Subscriber",
      description: "Deletes a subscriber from a waitlist and returns updated live totalSignups.",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriberId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, subscriberId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          { id: true, workspaceId: true },
        );
        const res = await deleteWaitlistSubscriberOp({ waitlistId: waitlist.id, subscriberId });
        const totalSignups = await prisma.signUp.count({ where: { waitListId: waitlist.id } });
        return { ...res, totalSignups };
      }),
  );

  server.registerTool(
    "waitlyze_bulk_audience_action",
    {
      title: "Bulk Audience Action",
      description:
        "Performs bulk audience operations (offboard, resubscribe, delete, or retry_verification) on up to 200 subscriber IDs.",
      inputSchema: {
        waitlistId: z.string().min(1),
        action: z.enum(["offboard", "resubscribe", "delete", "retry_verification"]),
        subscriberIds: z.array(z.string()).min(1).max(200),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, action, subscriberIds }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          { id: true, workspaceId: true, name: true, status: true },
        );
        if (action === "retry_verification") {
          return retryVerificationOp({ waitlist, signupIds: subscriberIds });
        }
        const res = await bulkAudienceActionOp({
          waitlist,
          userId: authContext.userId,
          actorLabel: authContext.authType === "api_key" ? "API key" : "MCP",
          action,
          ids: subscriberIds,
        });
        const totalSignups = await prisma.signUp.count({ where: { waitListId: waitlist.id } });
        return { ...res, totalSignups };
      }),
  );

  server.registerTool(
    "waitlyze_award_points",
    {
      title: "Award Custom Event Points",
      description:
        "Awards points to a verified subscriber for a custom event (with idempotency key).",
      inputSchema: {
        waitlistId: z.string().min(1),
        subscriberId: z.string().optional(),
        email: z.string().optional(),
        event: z.string().min(1).max(40),
        points: z.number().int().optional(),
        idempotencyKey: z.string().optional().default("once"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, subscriberId, email, event, points, idempotencyKey }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          { id: true, workspaceId: true },
        );
        return awardCustomPointsOp({
          waitlistId: waitlist.id,
          subscriberId,
          signupId: subscriberId,
          email,
          event,
          pointsOverride: points,
          idempotencyKey,
        });
      }),
  );

  server.registerTool(
    "waitlyze_export_subscribers",
    {
      title: "Export Subscribers (Paginated)",
      description:
        "Exports up to 1000 subscribers per page as structured JSON with cursor pagination (`hasMore`, `nextOffset`).",
      inputSchema: {
        waitlistId: z.string().min(1),
        status: z.enum(["ALL", "VERIFIED", "UNVERIFIED"]).optional().default("ALL"),
        limit: z.number().int().min(1).max(1000).optional().default(500),
        offset: z.number().int().min(0).optional().default(0),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, status, limit, offset }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:read",
          "viewAudience",
          { id: true, workspaceId: true, showReferrals: true },
        );
        const result = await listSubscribersOp({
          waitlist,
          status,
          sortBy: "createdAt",
          sortOrder: "asc",
          limit,
          offset,
        });
        const nextOffset = offset + result.items.length;
        return {
          totalSignups: result.total,
          subscribers: result.items,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: nextOffset < result.total,
            nextOffset: nextOffset < result.total ? nextOffset : null,
          },
        };
      }),
  );

  server.registerTool(
    "waitlyze_get_leaderboard",
    {
      title: "Get Referral Leaderboard",
      description:
        "Returns the top referrers, live queue positions, points, and live waitlist totals.",
      inputSchema: {
        waitlistId: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional().default(10),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, limit }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "analytics:read",
          "viewAudience",
          { id: true, workspaceId: true, showReferrals: true },
        );
        const [totalSignups, verifiedSignups, grouped] = await Promise.all([
          prisma.signUp.count({ where: { waitListId: waitlist.id } }),
          prisma.signUp.count({ where: { waitListId: waitlist.id, verifiedAt: { not: null } } }),
          prisma.referral.groupBy({
            by: ["referredById"],
            where: {
              referredById: { not: null },
              reviewStatus: { in: ["CLEAR", "APPROVED"] },
              signUp: { waitListId: waitlist.id, verifiedAt: { not: null } },
              referredBy: { waitListId: waitlist.id, verifiedAt: { not: null } },
            },
            _count: { _all: true },
            orderBy: { _count: { referredById: "desc" } },
            take: limit,
          }),
        ]);
        const ids = grouped.map((g) => g.referredById).filter(Boolean);
        const [signups, positions] = await Promise.all([
          ids.length
            ? prisma.signUp.findMany({
                where: { id: { in: ids }, waitListId: waitlist.id },
                select: {
                  id: true,
                  email: true,
                  points: true,
                  referralCode: true,
                  createdAt: true,
                },
              })
            : [],
          ids.length ? getCampaignPositions(prisma, waitlist.id, ids) : new Map(),
        ]);
        const byId = new Map(signups.map((s) => [s.id, s]));
        return {
          totalSignups,
          verifiedSignups,
          leaders: grouped
            .map((g, idx) => {
              const s = byId.get(g.referredById);
              if (!s) return null;
              return {
                rank: idx + 1,
                id: s.id,
                email: s.email,
                referralCode: s.referralCode,
                verifiedReferrals: g._count._all,
                points: s.points ?? 0,
                position: positions.get(s.id) ?? null,
              };
            })
            .filter(Boolean),
        };
      }),
  );

  server.registerTool(
    "waitlyze_list_referral_reviews",
    {
      title: "List Referral Fraud Reviews",
      description: "Lists flagged or pending referral reviews for fraud moderation.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:read",
          "viewAudience",
          { id: true, workspaceId: true },
        );
        return { reviews: await loadReferralReviews(prisma, waitlist.id) };
      }),
  );

  server.registerTool(
    "waitlyze_resolve_referral_review",
    {
      title: "Approve or Exclude Flagged Referral",
      description: "Resolves a referral fraud alert by setting status to APPROVED or EXCLUDED.",
      inputSchema: {
        waitlistId: z.string().min(1),
        referralId: z.string().min(1),
        status: z.enum(["APPROVED", "EXCLUDED"]),
        resolution: z.string().min(8).max(240),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, referralId, status, resolution }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "subscribers:write",
          "manageAudience",
          { id: true, workspaceId: true },
        );
        return resolveReferralReview(prisma, {
          waitListId: waitlist.id,
          referralId,
          status,
          resolution,
          reviewedById: authContext.userId,
        });
      }),
  );

  server.registerTool(
    "waitlyze_list_broadcasts",
    {
      title: "List Marketing Broadcasts",
      description:
        "Lists broadcasts on a waitlist with status, segment, scheduledAt, sentAt, and recipientCount.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        const broadcasts = await prisma.marketingBroadcast.findMany({
          where: { waitListId: waitlist.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            subject: true,
            previewText: true,
            segment: true,
            status: true,
            scheduledAt: true,
            sentAt: true,
            recipientCount: true,
            createdAt: true,
          },
        });
        return {
          broadcasts: broadcasts.map((b) => ({
            ...b,
            statusLabel: emailStatusLabel(b.status, { draft: "Draft", sent: "Sent" }),
          })),
        };
      }),
  );

  server.registerTool(
    "waitlyze_preview_broadcast_recipients",
    {
      title: "Preview Broadcast Audience Segment",
      description:
        "Counts opted-in eligible recipients and shows masked sample emails for a segment.",
      inputSchema: {
        waitlistId: z.string().min(1),
        segment: z.string().optional().default("ALL"),
      },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId, segment }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:read",
          "viewAudience",
          { id: true, workspaceId: true },
        );
        return previewBroadcastRecipientsOp(waitlist.id, segment);
      }),
  );

  server.registerTool(
    "waitlyze_create_broadcast",
    {
      title: "Create or Update Draft Broadcast",
      description:
        "Creates (or updates if broadcastId is provided) a draft broadcast. Accepts markdown/text body or Tiptap editorDocument.",
      inputSchema: {
        waitlistId: z.string().min(1),
        broadcastId: z.string().optional(),
        name: z.string().optional(),
        subject: z.string().min(1).max(160),
        previewText: z.string().max(180).optional(),
        body: z.string().min(1),
        segment: z.string().optional().default("ALL"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, broadcastId, ...data }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true, name: true },
        );
        const broadcast = await createOrUpdateBroadcastOp({ waitlist, broadcastId, data });
        return { broadcast };
      }),
  );

  server.registerTool(
    "waitlyze_delete_broadcast",
    {
      title: "Delete Draft/Canceled Broadcast",
      description: "Deletes a draft or canceled broadcast.",
      inputSchema: {
        waitlistId: z.string().min(1),
        broadcastId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, broadcastId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return deleteBroadcastOp({ waitListId: waitlist.id, broadcastId });
      }),
  );

  server.registerTool(
    "waitlyze_send_broadcast",
    {
      title: "Send Broadcast Immediately",
      description:
        "Queues and sends a draft broadcast to opted-in segment recipients via the configured sender (enforces plan & sender checks).",
      inputSchema: {
        waitlistId: z.string().min(1),
        broadcastId: z.string().min(1),
        segment: z.string().optional().default("ALL"),
        expectedRecipientCount: z.number().int().optional(),
        exact: z.boolean().optional().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, broadcastId, segment, expectedRecipientCount, exact }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return sendBroadcastOp({
          userId: authContext.userId,
          waitlist,
          broadcastId,
          segment,
          expectedRecipientCount,
          exact,
        });
      }),
  );

  server.registerTool(
    "waitlyze_schedule_broadcast",
    {
      title: "Schedule Broadcast",
      description:
        "Schedules a draft broadcast for a future ISO-8601 timestamp (up to 90 days ahead).",
      inputSchema: {
        waitlistId: z.string().min(1),
        broadcastId: z.string().min(1),
        scheduledAt: z.string().min(1),
        segment: z.string().optional().default("ALL"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, broadcastId, scheduledAt, segment }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return scheduleBroadcastOp({
          userId: authContext.userId,
          waitlist,
          broadcastId,
          segment,
          scheduledAt,
        });
      }),
  );

  server.registerTool(
    "waitlyze_cancel_broadcast",
    {
      title: "Cancel Scheduled or Sending Broadcast",
      description: "Cancels a scheduled or in-flight broadcast.",
      inputSchema: {
        waitlistId: z.string().min(1),
        broadcastId: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    ({ waitlistId, broadcastId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return cancelBroadcastOp({ waitListId: waitlist.id, broadcastId });
      }),
  );

  server.registerTool(
    "waitlyze_list_email_templates",
    {
      title: "List Email Templates",
      description:
        "Returns transactional templates (signup, offboarding, referral-congrats, launch-invite).",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist, scope } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        const templates = await getOrCreateTemplatesForCampaign(waitlist.id, scope);
        return { templates };
      }),
  );

  server.registerTool(
    "waitlyze_upsert_email_template",
    {
      title: "Save Email Template",
      description:
        "Creates or updates a transactional email template (signup, offboarding, referral-congrats, launch-invite).",
      inputSchema: {
        waitlistId: z.string().min(1),
        templateType: z.enum(["signup", "offboarding", "referral-congrats", "launch-invite"]),
        subject: z.string().min(1).max(160),
        previewText: z.string().max(180).optional(),
        body: z.string().min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, templateType, subject, previewText, body }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        const template = await upsertEmailTemplateOp({
          waitlist,
          templateType,
          data: { subject, previewText, body },
        });
        return { template };
      }),
  );

  server.registerTool(
    "waitlyze_list_automations",
    {
      title: "List Email Automations",
      description: "Lists lifecycle automation recipes and their current version settings.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        return { automations: await listAutomationRecipesOp(waitlist.id) };
      }),
  );

  server.registerTool(
    "waitlyze_save_automation_recipe",
    {
      title: "Save Automation Recipe Content",
      description: "Saves a new version of an automation recipe configuration.",
      inputSchema: {
        waitlistId: z.string().min(1),
        recipeId: z.string().min(1),
        config: z.record(z.string(), z.unknown()),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, recipeId, config }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return saveAutomationRecipeOp({ waitlist, recipeId, data: config });
      }),
  );

  server.registerTool(
    "waitlyze_set_automation_status",
    {
      title: "Enable or Pause Automation",
      description:
        "Sets an automation recipe to ENABLED or PAUSED (canceling queued runs on pause).",
      inputSchema: {
        waitlistId: z.string().min(1),
        recipeId: z.string().min(1),
        status: z.enum(["ENABLED", "PAUSED"]),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ waitlistId, recipeId, status }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return setAutomationStatusOp({ waitlist, recipeId, status });
      }),
  );

  server.registerTool(
    "waitlyze_send_test_email",
    {
      title: "Send Test Email",
      description: "Sends a live test email for a template, broadcast, or automation recipe.",
      inputSchema: {
        waitlistId: z.string().min(1),
        kind: z.enum(["template", "broadcast", "automation"]),
        to: z.string().email(),
        targetId: z
          .string()
          .optional()
          .describe("broadcastId or recipeId for broadcast/automation"),
        templateType: z
          .enum(["signup", "offboarding", "referral-congrats", "launch-invite"])
          .optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ waitlistId, kind, to, targetId, templateType }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:write",
          "sendEmail",
          { id: true, workspaceId: true },
        );
        return sendTestEmailDirectOp({
          userId: authContext.userId,
          waitlist,
          kind,
          targetId,
          templateType,
          to,
        });
      }),
  );

  server.registerTool(
    "waitlyze_list_email_logs",
    {
      title: "List Email Delivery Logs",
      description: "Lists recent automation & broadcast email delivery outcomes on a waitlist.",
      inputSchema: { waitlistId: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    ({ waitlistId }) =>
      runTool(async () => {
        const { waitlist } = await requireWaitlistAccess(
          authContext,
          waitlistId,
          "emails:read",
          "viewCampaign",
          { id: true, workspaceId: true },
        );
        return { logs: await listEmailLogsOp(waitlist.id) };
      }),
  );
}
