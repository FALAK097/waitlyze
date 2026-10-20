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
      return db.workspace.create({
        data: { name: name.trim(), members: { create: { userId, role: "OWNER" } } },
        select: { id: true, name: true },
      });
    },
    async deleteWorkspace(userId, workspaceId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      return db.$transaction(async (tx) => {
        const workspace = await tx.workspace.findFirst({
          where: { id: workspaceId, members: { some: { userId, role: "OWNER" } } },
          select: { id: true, name: true, personalOwnerId: true },
        });
        if (!workspace) throw new AccessError();
        if (workspace.personalOwnerId)
          throw new TypeError("The personal workspace cannot be deleted.");
        const waitlists = await tx.waitList.findMany({
          where: { workspaceId },
          select: { id: true },
        });
        const waitlistIds = waitlists.map((waitlist) => waitlist.id);
        if (waitlistIds.length) {
          await tx.apiKey.deleteMany({ where: { waitlistId: { in: waitlistIds } } });
          await tx.waitList.deleteMany({ where: { id: { in: waitlistIds } } });
        }
        await tx.workspace.delete({ where: { id: workspaceId } });
        return { id: workspace.id, name: workspace.name, waitlistCount: waitlistIds.length };
      });
    },
    async leaveWorkspace(userId, workspaceId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      return db.$transaction(async (tx) => {
        const membership = await tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId } },
          select: { role: true },
        });
        if (!membership) throw new AccessError();
        if (membership.role === "OWNER") {
          const owners = await tx.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
          if (owners < 2)
            throw new TypeError(
              "You’re the only owner. Delete the workspace or make another member an owner first.",
            );
        }
        await tx.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
        return { workspaceId };
      });
    },
    async removeWorkspaceMember(userId, workspaceId, targetUserId) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof targetUserId !== "string" || !targetUserId) throw new AccessError();
      if (targetUserId === userId)
        throw new TypeError("You cannot remove yourself from a workspace.");
      return db.$transaction(async (tx) => {
        const [actor, target] = await Promise.all([
          tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
          }),
          tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
            select: { role: true, user: { select: { name: true, email: true } } },
          }),
        ]);
        if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) throw new AccessError();
        if (!target) throw new AccessError();
        if (target.role === "OWNER") {
          const owners = await tx.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
          if (owners < 2) throw new TypeError("A workspace needs at least one owner.");
        }
        await tx.workspaceMember.delete({
          where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        });
        return { userId: targetUserId, name: target.user.name, email: target.user.email };
      });
    },
    async changeWorkspaceMemberRole(userId, workspaceId, targetUserId, role) {
      actor(userId);
      if (typeof workspaceId !== "string" || !workspaceId) throw new AccessError();
      if (typeof targetUserId !== "string" || !targetUserId) throw new AccessError();
      if (!["MEMBER", "ADMIN"].includes(role)) throw new TypeError("Choose Member or Admin.");
      if (targetUserId === userId) throw new TypeError("You cannot change your own role.");
      return db.$transaction(async (tx) => {
        const [actor, target] = await Promise.all([
          tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
          }),
          tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
            select: { role: true, user: { select: { name: true, email: true } } },
          }),
        ]);
        if (!actor || !["OWNER", "ADMIN"].includes(actor.role)) throw new AccessError();
        if (!target) throw new AccessError();
        if (role === "ADMIN" && actor.role !== "OWNER") throw new AccessError();
        if (target.role === "OWNER" && role !== "OWNER") {
          const owners = await tx.workspaceMember.count({ where: { workspaceId, role: "OWNER" } });
          if (owners < 2) throw new TypeError("A workspace needs at least one owner.");
        }
        if (target.role === role)
          return {
            userId: targetUserId,
            name: target.user.name,
            email: target.user.email,
            unchanged: true,
          };
        await tx.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
          data: { role },
        });
        return { userId: targetUserId, name: target.user.name, email: target.user.email, role };
      });
    },
    async campaign(userId, id, permission = "viewCampaign", workspaceId) {
      if (typeof id !== "string" || !id) throw new AccessError();
      const campaign = await db.waitList.findFirst({
        where: { id, ...campaignScope(userId, permission, workspaceId) },
      });
      if (!campaign) throw new AccessError();
      return campaign;
    },
    async ensurePersonal(userId) {
      actor(userId);
      // Retry serialization/unique conflicts when login and a backfill race.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          return await db.$transaction(
            async (tx) => {
              const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true },
              });
              if (!user) throw new AccessError();
              const personalName = personalWorkspaceName(user.name, user.email);
              const workspace = await tx.workspace.upsert({
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
                await tx.workspace.update({
                  where: { id: workspace.id },
                  data: { name: personalName },
                });
                workspace.name = personalName;
              }
              const membership = await tx.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
              });
              // Existing missing/revoked membership is never recreated by login/backfill.
              if (membership?.role !== "OWNER")
                throw new Error("Personal workspace ownership requires review.");
              await tx.waitList.updateMany({
                where: { userId, workspaceId: null },
                data: { workspaceId: workspace.id },
              });
              return workspace;
            },
            { isolationLevel: "Serializable" },
          );
        } catch (error) {
          if (!isWorkspaceInitializationConflict(error) || attempt === 3) throw error;
          await new Promise((resolve) => setTimeout(resolve, 10 * 2 ** attempt));
        }
      }
    },
  };
}
