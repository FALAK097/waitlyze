const permissions = Object.freeze({
  viewCampaign: ["OWNER", "ADMIN", "MEMBER"],
  editCampaign: ["OWNER", "ADMIN", "MEMBER"],
  publishCampaign: ["OWNER", "ADMIN"],
  viewAudience: ["OWNER", "ADMIN", "MEMBER"],
  manageAudience: ["OWNER", "ADMIN"],
  sendEmail: ["OWNER", "ADMIN"],
  deleteCampaign: ["OWNER", "ADMIN"],
  manageConnections: ["OWNER", "ADMIN"],
  manageOwnership: ["OWNER"],
});

export class AccessError extends Error {
  constructor(status = 404) {
    super(status === 401 ? "Sign in to continue." : "Resource not found.");
    this.status = status;
  }
}

function actor(userId) {
  if (typeof userId !== "string" || !userId) throw new AccessError(401);
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
        select: { id: true, name: true, personalOwnerId: true, members: { where: { userId }, select: { role: true } } },
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
    async campaign(userId, id, permission = "viewCampaign", workspaceId) {
      if (typeof id !== "string" || !id) throw new AccessError();
      const campaign = await db.waitList.findFirst({ where: { id, ...campaignScope(userId, permission, workspaceId) } });
      if (!campaign) throw new AccessError();
      return campaign;
    },
    async ensurePersonal(userId) {
      actor(userId);
      // Retry serialization/unique conflicts when login and a backfill race.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          return await db.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
            if (!user) throw new AccessError();
            const workspace = await tx.workspace.upsert({
              where: { personalOwnerId: userId },
              create: { name: "Personal workspace", personalOwnerId: userId, members: { create: { userId, role: "OWNER" } } },
              update: {},
            });
            const membership = await tx.workspaceMember.findUnique({
              where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
            });
            // Existing missing/revoked membership is never recreated by login/backfill.
            if (membership?.role !== "OWNER") throw new Error("Personal workspace ownership requires review.");
            await tx.waitList.updateMany({ where: { userId, workspaceId: null }, data: { workspaceId: workspace.id } });
            return workspace;
          }, { isolationLevel: "Serializable" });
        } catch (error) {
          if (!["P2034", "P2002"].includes(error.code) || attempt === 3) throw error;
        }
      }
    },
  };
}
