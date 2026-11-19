import { randomUUID } from "node:crypto";

import {
  DETACHED_CUSTOMER_ID,
  effectiveWorkspacePlan,
  getOwnedWorkspaceEntitlements,
  providerSubscriptionNeedsReview,
  requireCapacity,
} from "../billing/plans.mjs";
import { runAtomicSqlBatch, toSqliteIso } from "../db/sqlite-helpers.mjs";

function effectiveProSubscriptionSql(alias) {
  return `(
    ${alias}."plan" = 'PRO' AND (
      (${alias}."status" = 'ACTIVE' AND ${alias}."currentPeriodEnd" IS NOT NULL AND julianday(${alias}."currentPeriodEnd") > julianday('now'))
      OR (${alias}."status" IN ('PAST_DUE', 'ON_HOLD') AND (
        (${alias}."pastDueEndsAt" IS NOT NULL AND julianday(${alias}."pastDueEndsAt") > julianday('now'))
        OR (${alias}."pastDueEndsAt" IS NULL AND ${alias}."currentPeriodEnd" IS NOT NULL AND julianday(${alias}."currentPeriodEnd") > julianday('now', '-7 days'))
        OR (${alias}."pastDueEndsAt" IS NULL AND ${alias}."currentPeriodEnd" IS NULL AND ${alias}."lastEventAt" IS NOT NULL AND julianday(${alias}."lastEventAt") > julianday('now', '-7 days'))
      ))
      OR (${alias}."status" = 'CANCELLED' AND ${alias}."cancelAtPeriodEnd" = 1 AND ${alias}."currentPeriodEnd" IS NOT NULL AND julianday(${alias}."currentPeriodEnd") > julianday('now'))
    )
  )`;
}

function ownedWorkspaceCapacitySql(userId) {
  return {
    sql: `(
      (SELECT COUNT(*) FROM "workspace_members" AS om WHERE om."userId" = ? AND om."role" = 'OWNER') = 0
      OR EXISTS (
        SELECT 1
        FROM "workspace_members" AS om
        INNER JOIN "workspace_subscriptions" AS sub ON sub."workspaceId" = om."workspaceId"
        WHERE om."userId" = ?
          AND om."role" = 'OWNER'
          AND ${effectiveProSubscriptionSql("sub")}
      )
    )`,
    params: [userId, userId],
  };
}

function blockingSubscriptionSql(workspaceId) {
  return {
    sql: `EXISTS (
      SELECT 1
      FROM "workspace_subscriptions" AS sub
      WHERE sub."workspaceId" = ?
        AND (
          ${effectiveProSubscriptionSql("sub")}
          OR sub."status" IN ('ACTIVE', 'PAST_DUE', 'ON_HOLD')
          OR (sub."status" = 'CANCELLED' AND sub."cancelAtPeriodEnd" = 1 AND sub."currentPeriodEnd" IS NULL)
          OR (sub."dodoSubscriptionId" IS NOT NULL AND sub."status" NOT IN ('CANCELLED', 'EXPIRED', 'FAILED'))
          OR sub."checkoutSessionId" IS NOT NULL
          OR (
            sub."checkoutPendingUntil" IS NOT NULL
            AND julianday(sub."checkoutPendingUntil") > julianday('now')
            AND (sub."checkoutUrl" IS NOT NULL OR sub."checkoutCreationStartedAt" IS NOT NULL)
          )
        )
    )`,
    params: [workspaceId],
  };
}

const permissions = Object.freeze({
  viewCampaign: ["OWNER", "ADMIN", "MEMBER"],
  editCampaign: ["OWNER", "ADMIN", "MEMBER"],
  publishCampaign: ["OWNER", "ADMIN"],
  viewAudience: ["OWNER", "ADMIN", "MEMBER"],
  manageAudience: ["OWNER", "ADMIN"],
  sendEmail: ["OWNER", "ADMIN"],
  deleteCampaign: ["OWNER", "ADMIN"],
  manageConnections: ["OWNER", "ADMIN"],
  manageWorkspace: ["OWNER", "ADMIN"],
  manageOwnership: ["OWNER"],
});

function isWorkspaceInitializationConflict(error) {
  return (
    ["P2034", "P2002"].includes(error?.code) ||
    ["TransactionWriteConflict", "UniqueConstraintViolation"].includes(error?.cause?.kind)
  );
}

export class AccessError extends Error {
  constructor(status = 404) {
    super(status === 401 ? "Sign in to continue." : "Resource not found.");
    this.status = status;
  }
}

function actor(userId) {
  if (typeof userId !== "string" || !userId) throw new AccessError(401);
}

// Personal workspaces are named after their owner so the switcher never shows
// two identically named entries.
export function personalWorkspaceName(name, email) {
  const first = String(name || "")
    .trim()
    .split(/\s+/)[0];
  if (first) return `${first}’s workspace`;
  const handle = String(email || "")
    .split("@")[0]
    .trim();
  return handle ? `${handle}’s workspace` : "My workspace";
}

function roles(permission) {
  if (!Object.hasOwn(permissions, permission)) throw new Error("Unknown workspace permission.");
  return permissions[permission];
}

export function workspaceRoleCan(permission, role) {
  return roles(permission).includes(role);
}

// Put this predicate in the resource query itself, including nested reads/writes.
// A legacy owner fallback applies only while workspaceId is null. Once linked,
// membership is authoritative, even when a caller is the historical owner.
export function campaignScope(userId, permission, workspaceId) {
  actor(userId);
  const membership = { members: { some: { userId, role: { in: roles(permission) } } } };
  if (workspaceId !== undefined) {
    if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
    return { workspaceId, workspace: membership };
  }
  return { OR: [{ workspaceId: null, userId }, { workspace: membership }] };
}

export function createWorkspaceService(db) {
  return {
    async list(userId) {
      actor(userId);
      return db.workspace.findMany({
        where: { members: { some: { userId } } },
        select: {
          id: true,
          name: true,
          personalOwnerId: true,
          members: { where: { userId }, select: { role: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
    },
    async currentContext(userId) {
      actor(userId);
      const workspaces = await this.list(userId);
      const personal = workspaces.find((workspace) => workspace.personalOwnerId === userId);
      if (personal?.members?.[0]?.role && personal.name !== "Personal workspace") {
        return {
          personal: { id: personal.id, name: personal.name },
          workspaces,
        };
      }

      // The Neon-to-D1 cutover assigned every campaign to a workspace. Login
      // only initializes a new user's personal workspace; it never mutates
      // campaign ownership or usage counters.
      const initializedPersonal = await this.ensurePersonal(userId, { skipFastPath: true });
      return { personal: initializedPersonal, workspaces: await this.list(userId) };
    },
    async requireAccess(userId, workspaceId, permission) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      const workspace = await db.workspace.findFirst({
        where: { id: workspaceId, members: { some: { userId, role: { in: roles(permission) } } } },
        select: { id: true, name: true },
      });
      if (!workspace) throw new AccessError();
      return workspace;
    },
    async renameWorkspace(userId, workspaceId, name) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        throw new TypeError("Workspace name must contain 1 to 80 characters.");
      }
      const result = await db.workspace.updateMany({
        where: {
          id: workspaceId,
          members: { some: { userId, role: { in: roles("manageWorkspace") } } },
        },
        data: { name: name.trim() },
      });
      if (result.count !== 1) throw new AccessError();
      return { id: workspaceId, name: name.trim() };
    },
    async createWorkspace(userId, name) {
      actor(userId);
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        throw new TypeError("Workspace name must contain 1 to 80 characters.");
      }
      const trimmedName = name.trim();
      const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new AccessError();
      const entitlements = await getOwnedWorkspaceEntitlements(db, userId);
      requireCapacity({
        entitlements,
        feature: "workspaces",
        used: entitlements.ownedCount,
        message: "The Free plan includes one workspace. Upgrade to Pro to create another.",
      });

      const now = new Date();
      const nowIso = toSqliteIso(now);
      const workspaceId = randomUUID();
      const capacity = ownedWorkspaceCapacitySql(userId);

      const [workspaceInsert] = await runAtomicSqlBatch(db, [
        {
          sql: `INSERT INTO "workspaces" ("id", "name", "signupUsageCount", "createdAt", "updatedAt")
                SELECT ?, ?, 0, ?, ?
                WHERE EXISTS (SELECT 1 FROM "users" WHERE "id" = ?)
                  AND ${capacity.sql}`,
          params: [workspaceId, trimmedName, nowIso, nowIso, userId, ...capacity.params],
        },
        {
          sql: `INSERT INTO "workspace_members" ("workspaceId", "userId", "role", "createdAt")
                SELECT ?, ?, 'OWNER', ?
                WHERE EXISTS (SELECT 1 FROM "workspaces" WHERE "id" = ?)`,
          params: [workspaceId, userId, nowIso, workspaceId],
        },
      ]);

      if (workspaceInsert.changes !== 1) {
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!currentUser) throw new AccessError();
        const latestEntitlements = await getOwnedWorkspaceEntitlements(db, userId);
        requireCapacity({
          entitlements: latestEntitlements,
          feature: "workspaces",
          used: latestEntitlements.ownedCount,
          message: "The Free plan includes one workspace. Upgrade to Pro to create another.",
        });
        throw new Error("Could not create workspace.");
      }

      return { id: workspaceId, name: trimmedName };
    },
    async transferOwnership(userId, workspaceId, targetUserId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof targetUserId !== "string" || !targetUserId) throw new AccessError();
      if (targetUserId === userId) throw new TypeError("You already own this workspace.");

      async function loadValidatedTransferState() {
        const workspace = await db.workspace.findUnique({
          where: { id: workspaceId },
          select: { id: true },
        });
        if (!workspace) throw new AccessError();
        const [ownerMembership, targetMembership] = await Promise.all([
          db.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
          }),
          db.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
            select: { role: true, user: { select: { name: true, email: true } } },
          }),
        ]);
        if (!ownerMembership || ownerMembership.role !== "OWNER") throw new AccessError();
        if (!targetMembership) {
          throw new TypeError("That person is not a member of this workspace.");
        }
        if (targetMembership.role === "OWNER") {
          return { unchanged: true, targetMembership };
        }
        const [targetEntitlements, subscription] = await Promise.all([
          getOwnedWorkspaceEntitlements(db, targetUserId),
          db.workspaceSubscription.findUnique({
            where: { workspaceId },
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
              pastDueEndsAt: true,
              cancelAtPeriodEnd: true,
              lastEventAt: true,
              dodoCustomerId: true,
              dodoSubscriptionId: true,
              checkoutSessionId: true,
              checkoutUrl: true,
              checkoutPendingUntil: true,
              checkoutCreationStartedAt: true,
            },
          }),
        ]);
        const checkNow = new Date();
        const isProWorkspace = effectiveWorkspacePlan(subscription, checkNow) === "PRO";
        // The billing portal is keyed to the paying customer, so handing a live
        // subscription to someone else would expose the payer's saved payment
        // details and invoices. Billing has to end (or move) before ownership does.
        if (
          isProWorkspace ||
          providerSubscriptionNeedsReview(subscription) ||
          subscription?.checkoutSessionId ||
          (subscription?.checkoutPendingUntil &&
            subscription.checkoutPendingUntil > checkNow &&
            (subscription.checkoutUrl || subscription.checkoutCreationStartedAt))
        ) {
          throw new TypeError(
            "This workspace has a Pro subscription or open checkout billed to you. Cancel it and wait for the paid period to end before transferring ownership.",
          );
        }
        requireCapacity({
          entitlements: targetEntitlements,
          feature: "workspaces",
          used: targetEntitlements.ownedCount,
          message:
            "That member already owns a workspace on the Free plan. Free allows one owned workspace.",
        });
        return { unchanged: false, targetMembership };
      }

      const initialState = await loadValidatedTransferState();
      if (initialState.unchanged) {
        return {
          userId: targetUserId,
          name: initialState.targetMembership.user.name,
          email: initialState.targetMembership.user.email,
          unchanged: true,
        };
      }

      const now = new Date();
      const nowIso = toSqliteIso(now);
      const targetCapacity = ownedWorkspaceCapacitySql(targetUserId);
      const blockedSub = blockingSubscriptionSql(workspaceId);

      const transferGuardSql = `
        EXISTS (SELECT 1 FROM "workspace_members" WHERE "workspaceId" = ? AND "userId" = ? AND "role" = 'OWNER')
        AND EXISTS (SELECT 1 FROM "workspace_members" WHERE "workspaceId" = ? AND "userId" = ? AND "role" != 'OWNER')
        AND ${targetCapacity.sql}
        AND NOT ${blockedSub.sql}
      `;
      const transferGuardParams = [
        workspaceId,
        userId,
        workspaceId,
        targetUserId,
        ...targetCapacity.params,
        ...blockedSub.params,
      ];

      // Detach the lapsed payer and swap both roles in one guarded statement.
      // Updating both memberships together prevents a concurrent transfer from
      // demoting the caller unless this batch also promotes the target.
      const [, transferResult] = await runAtomicSqlBatch(db, [
        {
          sql: `UPDATE "workspace_subscriptions"
                SET "dodoCustomerId" = ?, "updatedAt" = ?
                WHERE "workspaceId" = ?
                  AND ("dodoCustomerId" IS NOT NULL OR "dodoSubscriptionId" IS NOT NULL)
                  AND ${transferGuardSql}`,
          params: [DETACHED_CUSTOMER_ID, nowIso, workspaceId, ...transferGuardParams],
        },
        {
          sql: `UPDATE "workspace_members"
                SET "role" = CASE
                  WHEN "userId" = ? THEN 'OWNER'
                  WHEN "userId" = ? THEN 'ADMIN'
                  ELSE "role"
                END
                WHERE "workspaceId" = ?
                  AND "userId" IN (?, ?)
                  AND ${transferGuardSql}`,
          params: [targetUserId, userId, workspaceId, targetUserId, userId, ...transferGuardParams],
        },
      ]);

      if (transferResult.changes !== 2) {
        const latestState = await loadValidatedTransferState();
        if (latestState.unchanged) {
          throw new AccessError();
        }
        throw new Error("Could not transfer workspace ownership.");
      }

      return {
        userId: targetUserId,
        name: initialState.targetMembership.user.name,
        email: initialState.targetMembership.user.email,
      };
    },
    async deleteWorkspace(userId, workspaceId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      const workspace = await db.workspace.findFirst({
        where: { id: workspaceId, members: { some: { userId, role: "OWNER" } } },
        select: { id: true, name: true, personalOwnerId: true },
      });
      if (!workspace) throw new AccessError();
      if (workspace.personalOwnerId) throw new TypeError("Your first workspace cannot be deleted.");
      const subscription = await db.workspaceSubscription.findUnique({
        where: { workspaceId },
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          pastDueEndsAt: true,
          cancelAtPeriodEnd: true,
          lastEventAt: true,
          dodoSubscriptionId: true,
          checkoutUrl: true,
          checkoutSessionId: true,
          checkoutPendingUntil: true,
          checkoutCreationStartedAt: true,
        },
      });
      const hasPendingCheckout =
        subscription?.checkoutSessionId ||
        (subscription?.checkoutPendingUntil &&
          subscription.checkoutPendingUntil > new Date() &&
          (subscription?.checkoutUrl || subscription?.checkoutCreationStartedAt));
      if (
        hasPendingCheckout ||
        (subscription?.dodoSubscriptionId &&
          !["EXPIRED", "FAILED", "CANCELLED"].includes(subscription.status))
      )
        throw new TypeError(
          "Cancel or finish this workspace's subscription and any pending checkout before deleting the workspace.",
        );
      // A workspace that still holds Pro access cannot be deleted: recreating it
      // would reset the lifetime signup counter and mint fresh Free allowances.
      if (effectiveWorkspacePlan(subscription, new Date()) === "PRO") {
        const paidThroughDate = subscription?.currentPeriodEnd || subscription?.pastDueEndsAt;
        const paidThrough =
          paidThroughDate instanceof Date
            ? new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(paidThroughDate)
            : "the end of the paid period";
        throw new TypeError(
          `This workspace still has Pro access through ${paidThrough}. Cancel renewal and wait until the paid period ends before deleting it, or contact support.`,
        );
      }
      const waitlists = await db.waitList.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      const waitlistIds = waitlists.map((waitlist) => waitlist.id);
      if (waitlistIds.length) {
        await db.apiKey.deleteMany({ where: { waitlistId: { in: waitlistIds } } });
        await db.waitList.deleteMany({ where: { id: { in: waitlistIds } } });
      }
      await db.workspace.delete({ where: { id: workspaceId } });
      return { id: workspace.id, name: workspace.name, waitlistCount: waitlistIds.length };
    },
    async leaveWorkspace(userId, workspaceId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      const membership = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { role: true },
      });
      if (!membership) throw new AccessError();
      if (membership.role === "OWNER") {
        const owners = await db.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
        if (owners < 2)
          throw new TypeError(
            "You’re the only owner. Make another member an owner first, or delete the workspace.",
          );
      }
      await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
      return { workspaceId };
    },
    async removeWorkspaceMember(userId, workspaceId, targetUserId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof targetUserId !== "string" || !targetUserId) throw new AccessError();
      if (targetUserId === userId)
        throw new TypeError("You cannot remove yourself from a workspace.");
      const [actorMembership, target] = await Promise.all([
        db.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
          select: { role: true },
        }),
        db.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
          select: { role: true, user: { select: { name: true, email: true } } },
        }),
      ]);
      if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role))
        throw new AccessError();
      if (!target) throw new AccessError();
      // Admins manage members, never owners.
      if (target.role === "OWNER" && actorMembership.role !== "OWNER") throw new AccessError();
      if (target.role === "OWNER") {
        const owners = await db.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
        if (owners < 2) throw new TypeError("A workspace needs at least one owner.");
      }
      await db.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      });
      return { userId: targetUserId, name: target.user.name, email: target.user.email };
    },
    async changeWorkspaceMemberRole(userId, workspaceId, targetUserId, role) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof targetUserId !== "string" || !targetUserId) throw new AccessError();
      if (!["MEMBER", "ADMIN"].includes(role)) throw new TypeError("Choose Member or Admin.");
      if (targetUserId === userId) throw new TypeError("You cannot change your own role.");
      const [actorMembership, target] = await Promise.all([
        db.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
          select: { role: true },
        }),
        db.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
          select: { role: true, user: { select: { name: true, email: true } } },
        }),
      ]);
      if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role))
        throw new AccessError();
      if (!target) throw new AccessError();
      if (role === "ADMIN" && actorMembership.role !== "OWNER") throw new AccessError();
      if (target.role === "OWNER" && actorMembership.role !== "OWNER") throw new AccessError();
      if (target.role === "OWNER" && role !== "OWNER") {
        const owners = await db.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
        if (owners < 2) throw new TypeError("A workspace needs at least one owner.");
      }
      if (target.role === role)
        return {
          userId: targetUserId,
          name: target.user.name,
          email: target.user.email,
          unchanged: true,
        };
      await db.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        data: { role },
      });
      return { userId: targetUserId, name: target.user.name, email: target.user.email, role };
    },
    async campaign(userId, id, permission = "viewCampaign", workspaceId) {
      if (typeof id !== "string" || !id) throw new AccessError();
      const campaign = await db.waitList.findFirst({
        where: { id, ...campaignScope(userId, permission, workspaceId) },
      });
      if (!campaign) throw new AccessError();
      return campaign;
    },
    async ensurePersonal(userId, { skipFastPath = false } = {}) {
      actor(userId);
      if (!skipFastPath) {
        const personal = await db.workspace.findUnique({
          where: { personalOwnerId: userId },
          select: {
            id: true,
            name: true,
            members: { where: { userId }, select: { role: true }, take: 1 },
          },
        });
        if (personal?.members?.[0]?.role && personal.name !== "Personal workspace") {
          const { id, name } = personal;
          return { id, name };
        }
      }

      // Retry unique conflicts when concurrent login requests race initialization.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
          });
          if (!user) throw new AccessError();
          const personalName = personalWorkspaceName(user.name, user.email);
          const workspace = await db.workspace.upsert({
            where: { personalOwnerId: userId },
            create: {
              name: personalName,
              personalOwnerId: userId,
              members: { create: { userId, role: "OWNER" } },
            },
            update: {},
            select: { id: true, name: true },
          });
          // One-time rename for workspaces still carrying the old generic default.
          if (workspace.name === "Personal workspace") {
            await db.workspace.update({
              where: { id: workspace.id },
              data: { name: personalName },
            });
            workspace.name = personalName;
          }
          const membership = await db.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
          });
          // Existing missing/revoked membership is never recreated by login/backfill.
          if (!membership) throw new Error("Personal workspace ownership requires review.");
          return workspace;
        } catch (error) {
          if (!isWorkspaceInitializationConflict(error) || attempt === 3) throw error;
          await new Promise((resolve) => setTimeout(resolve, 10 * 2 ** attempt));
        }
      }
    },
  };
}
