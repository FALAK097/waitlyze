import { ResourceTemplate } from "@modelcontextprotocol/server";

import { getWaitlistAnalytics } from "@/lib/analytics/waitlist-analytics.mjs";
import { formatSafeDomain } from "@/lib/api/infra-ops.mjs";
import {
  listAutomationRecipesOp,
  listSubscribersOp,
  parseTemplateSnapshotOrDefault,
  publicBaseUrl,
  waitlistPublicUrl,
} from "@/lib/api/platform-ops.mjs";
import { getWorkspaceEntitlements } from "@/lib/billing/plans.mjs";
import { apiKeyHasScope } from "@/lib/campaigns/api-key.mjs";
import { getOrCreateTemplatesForCampaign } from "@/lib/emails/templates.mjs";
import { resolveWorkspaceContext } from "@/lib/mcp/auth.js";
import prisma from "@/lib/prisma.js";
import { campaignScope } from "@/lib/workspaces/service.mjs";

function resourceScope(authContext) {
  if (!authContext?.authenticated || !authContext.userId) {
    throw new Error("Unauthorized: authentication required.");
  }
  if (!apiKeyHasScope(authContext.scopes, "waitlist:read")) {
    throw new Error("Forbidden: resource requires read access.");
  }
  if (authContext.waitlistId) {
    return { id: authContext.waitlistId, ...campaignScope(authContext.userId, "viewCampaign") };
  }
  return campaignScope(authContext.userId, "viewCampaign", authContext.workspaceId || undefined);
}

async function resolveAccessibleWaitlist(authContext, waitlistId, select) {
  const scope = resourceScope(authContext);
  const waitlist = await prisma.waitList.findFirst({
    where: { id: waitlistId, ...scope },
    select,
  });
  if (!waitlist) throw new Error(`Waitlist '${waitlistId}' not found or not accessible.`);
  return { waitlist, scope };
}

function jsonResource(uri, payload) {
  return {
    contents: [
      {
        uri: String(uri),
        mimeType: "application/json",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

/**
 * Registers Waitlyze MCP resources and templates for direct context inspection.
 */
export function registerWaitlyzeResources(server, authContext) {
  server.registerResource(
    "workspaces",
    "waitlyze://workspaces",
    {
      title: "Accessible Workspaces",
      description:
        "Workspaces accessible to the authenticated actor with live plan and usage counts.",
      mimeType: "application/json",
    },
    async (uri) => {
      resourceScope(authContext);
      if (authContext.waitlistId) {
        const wl = await prisma.waitList.findUnique({
          where: { id: authContext.waitlistId },
          select: { workspace: { select: { id: true, name: true, personalOwnerId: true } } },
        });
        return jsonResource(uri, { workspaces: wl?.workspace ? [wl.workspace] : [] });
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
              _count: { select: { waitLists: true, members: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      const workspaces = await Promise.all(
        memberships.map(async (m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          role: m.role,
          isPersonal: Boolean(m.workspace.personalOwnerId),
          entitlements: await getWorkspaceEntitlements(prisma, m.workspace.id),
          waitlistCount: m.workspace._count.waitLists,
          memberCount: m.workspace._count.members,
        })),
      );
      return jsonResource(uri, { workspaces });
    },
  );

  server.registerResource(
    "waitlists",
    "waitlyze://waitlists",
    {
      title: "Waitlists",
      description: "Accessible waitlists with live total signup counts and publication state.",
      mimeType: "application/json",
    },
    async (uri) => {
      const scope = resourceScope(authContext);
      const waitlists = await prisma.waitList.findMany({
        where: scope,
        select: {
          id: true,
          workspaceId: true,
          name: true,
          publicSlug: true,
          status: true,
          showReferrals: true,
          customDomain: { select: { hostname: true, status: true } },
          _count: { select: { signUps: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return jsonResource(uri, {
        waitlists: waitlists.map((w) => {
          const host = w.customDomain?.status === "ACTIVE" ? w.customDomain.hostname : null;
          return {
            id: w.id,
            workspaceId: w.workspaceId,
            name: w.name,
            publicSlug: w.publicSlug,
            publicUrl: waitlistPublicUrl(w.publicSlug, host),
            status: w.status,
            showReferrals: w.showReferrals,
            totalSignups: w._count.signUps,
          };
        }),
      });
    },
  );

  server.registerResource(
    "agent_workflow_guide",
    "waitlyze://guide/workflow",
    {
      title: "Waitlyze Agent Workflow Guide",
      description: "Reference guide for operating Waitlyze end-to-end via MCP and REST API v1.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: String(uri),
          mimeType: "text/markdown",
          text: [
            "# Waitlyze End-to-End Agent Workflow",
            "",
            "1. **Create**: Call `create_waitlist` with workspaceId, name, publicSlug, templateId.",
            "2. **Design & Rules**: Customize sections/branding via `update_waitlist_page`, form fields & double opt-in via `configure_form_rules`, and referral tiers via `configure_rewards`.",
            "3. **Emails & Integrations**: Configure workspace Resend/Cloudflare Email or waitlist sender, edit templates (`upsert_email_template`) & automations (`save_automation_recipe`, `set_automation_status`), and attach webhooks/Slack/Discord.",
            "4. **Pre-flight & Launch**: Run `run_launch_rehearsal`, fix any blockers, then call `publish_waitlist`.",
            "5. **Operate**: Monitor live signups (`list_subscribers`, `get_waitlist_analytics`), review referral alerts (`list_referral_reviews`, `resolve_referral_review`), award custom points (`award_custom_points`), and send targeted broadcasts (`preview_broadcast_recipients` -> `send_test_email` -> `send_broadcast`).",
          ].join("\n"),
        },
      ],
    }),
  );

  server.registerResource(
    "waitlist_detail",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}", {
      list: async () => {
        const scope = resourceScope(authContext);
        const rows = await prisma.waitList.findMany({
          where: scope,
          select: { id: true, name: true },
          take: 50,
          orderBy: { createdAt: "desc" },
        });
        return {
          resources: rows.map((r) => ({
            uri: `waitlyze://waitlists/${r.id}`,
            name: r.name,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "Waitlist Detail",
      description:
        "Live waitlist details, total signups, verified signups, custom domain, and URLs.",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      const { waitlist } = await resolveAccessibleWaitlist(authContext, String(waitlistId), {
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
      });
      const verifiedSignups = await prisma.signUp.count({
        where: { waitListId: waitlist.id, verifiedAt: { not: null } },
      });
      const activeHost =
        waitlist.customDomain?.status === "ACTIVE" ? waitlist.customDomain.hostname : null;
      return jsonResource(uri, {
        ...waitlist,
        totalSignups: waitlist._count.signUps,
        verifiedSignups,
        publicUrl: waitlistPublicUrl(waitlist.publicSlug, activeHost),
        fallbackPublicUrl: waitlist.publicSlug
          ? `${publicBaseUrl()}/w/${encodeURIComponent(waitlist.publicSlug)}`
          : null,
        customDomain: formatSafeDomain(waitlist.customDomain),
      });
    },
  );

  server.registerResource(
    "waitlist_page",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}/page", { list: undefined }),
    {
      title: "Waitlist Page Builder Snapshot",
      description: "Hosted page sections, brand, form rules, and referral rewards JSON.",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      const { waitlist } = await resolveAccessibleWaitlist(authContext, String(waitlistId), {
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
          select: { revision: true, snapshot: true, publishedAt: true },
        },
      });
      const snapshot = parseTemplateSnapshotOrDefault(waitlist);
      return jsonResource(uri, {
        waitlistId: waitlist.id,
        status: waitlist.status,
        templateRevision: waitlist.templateRevision,
        publishedRevision: waitlist.publishedRevision,
        templateSnapshot: snapshot,
        publishedSnapshot: waitlist.publicationRevisions?.[0]?.snapshot ?? null,
      });
    },
  );

  server.registerResource(
    "waitlist_analytics",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}/analytics", { list: undefined }),
    {
      title: "Waitlist Analytics (30d)",
      description:
        "Live 30-day waitlist funnel, traffic sources, geography, devices, and referral metrics.",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      const { waitlist } = await resolveAccessibleWaitlist(authContext, String(waitlistId), {
        id: true,
        workspaceId: true,
      });
      const [analytics, totalSignups, verifiedSignups] = await Promise.all([
        getWaitlistAnalytics(prisma, { waitListId: waitlist.id, days: 30, timeZone: "UTC" }),
        prisma.signUp.count({ where: { waitListId: waitlist.id } }),
        prisma.signUp.count({ where: { waitListId: waitlist.id, verifiedAt: { not: null } } }),
      ]);
      return jsonResource(uri, {
        ...analytics,
        liveTotals: { totalSignups, verifiedSignups },
      });
    },
  );

  server.registerResource(
    "waitlist_subscribers",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}/subscribers", { list: undefined }),
    {
      title: "Waitlist Subscribers (Latest 50)",
      description: "Latest 50 subscribers with live queue positions, points, and referral counts.",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      const { waitlist } = await resolveAccessibleWaitlist(authContext, String(waitlistId), {
        id: true,
        workspaceId: true,
        showReferrals: true,
      });
      const res = await listSubscribersOp({ waitlist, limit: 50, offset: 0 });
      return jsonResource(uri, res);
    },
  );

  server.registerResource(
    "waitlist_email_templates",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}/email-templates", { list: undefined }),
    {
      title: "Waitlist Email Templates",
      description:
        "Transactional templates (signup, offboarding, referral-congrats, launch-invite).",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      const { scope } = await resolveAccessibleWaitlist(authContext, String(waitlistId), {
        id: true,
      });
      const templates = await getOrCreateTemplatesForCampaign(String(waitlistId), scope);
      return jsonResource(uri, { templates });
    },
  );

  server.registerResource(
    "waitlist_automations",
    new ResourceTemplate("waitlyze://waitlists/{waitlistId}/automations", { list: undefined }),
    {
      title: "Waitlist Email Automations",
      description: "Configured automation recipes and their latest version settings.",
      mimeType: "application/json",
    },
    async (uri, { waitlistId }) => {
      await resolveAccessibleWaitlist(authContext, String(waitlistId), { id: true });
      const automations = await listAutomationRecipesOp(String(waitlistId));
      return jsonResource(uri, { automations });
    },
  );

  server.registerResource(
    "workspace_detail",
    new ResourceTemplate("waitlyze://workspaces/{workspaceId}", { list: undefined }),
    {
      title: "Workspace Detail & Entitlements",
      description: "Workspace plan limits, live usage, and connected email integrations.",
      mimeType: "application/json",
    },
    async (uri, { workspaceId }) => {
      resourceScope(authContext);
      const ws = await resolveWorkspaceContext(authContext, String(workspaceId));
      const [entitlements, integrations, waitlistCount, totalSignups] = await Promise.all([
        getWorkspaceEntitlements(prisma, ws.workspaceId),
        prisma.workspaceIntegration.findMany({
          where: { workspaceId: ws.workspaceId },
          select: { provider: true, status: true, fromEmail: true, lastTestedAt: true },
        }),
        prisma.waitList.count({ where: { workspaceId: ws.workspaceId } }),
        prisma.signUp.count({ where: { waitList: { workspaceId: ws.workspaceId } } }),
      ]);
      return jsonResource(uri, {
        ...ws,
        entitlements,
        usage: { waitlistCount, totalSignups },
        integrations,
      });
    },
  );
}
