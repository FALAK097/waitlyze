// Best-effort workspace audit log. Recording must never break the
// mutation it describes, so failures are logged and swallowed.
export async function recordAuditEvent(db, event) {
  try {
    const { workspaceId, userId, action, resourceType, resourceId, resourceName, detail } =
      event || {};
    if (!workspaceId || !action) return null;
    return await db.workspaceAuditEvent.create({
      data: {
        workspaceId,
        userId: userId || null,
        action,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        resourceName: resourceName || null,
        detail: detail || null,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Audit event failed", error?.code || error?.name || "unknown error");
    return null;
  }
}

// Waitlist-scoped mutations resolve their workspace context here so call
// sites stay one-liners.
export async function recordWaitlistAuditEvent(
  db,
  { userId, waitListId, action, detail, resourceType, resourceId, resourceName },
) {
  try {
    if (!waitListId || !action) return null;
    const waitlist = await db.waitList.findUnique({
      where: { id: waitListId },
      select: { id: true, name: true, workspaceId: true },
    });
    if (!waitlist?.workspaceId) return null;
    return await recordAuditEvent(db, {
      workspaceId: waitlist.workspaceId,
      userId,
      action,
      resourceType: resourceType || "waitlist",
      resourceId: resourceId || waitlist.id,
      resourceName: resourceName || waitlist.name || "Untitled waitlist",
      detail: detail || null,
    });
  } catch (error) {
    console.error("Audit event failed", error?.code || error?.name || "unknown error");
    return null;
  }
}

export const AUDIT_ACTIONS = Object.freeze({
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_RENAMED: "workspace.renamed",
  WORKSPACE_DELETED: "workspace.deleted",
  MEMBER_INVITED: "member.invited",
  MEMBER_REMOVED: "member.removed",
  MEMBER_LEFT: "member.left",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  INVITATION_RESENT: "invitation.resent",
  INVITATION_REVOKED: "invitation.revoked",
  MEMBER_JOINED: "member.joined",
  WAITLIST_CREATED: "waitlist.created",
  WAITLIST_DELETED: "waitlist.deleted",
  WAITLIST_PUBLISHED: "waitlist.published",
  WAITLIST_PAUSED: "waitlist.paused",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  RESEND_CONNECTED: "resend.connected",
  RESEND_DISCONNECTED: "resend.disconnected",
  BROADCAST_SENT: "broadcast.sent",
  AUDIENCE_BULK_OFFBOARDED: "audience.bulk_offboarded",
  AUDIENCE_BULK_RESUBSCRIBED: "audience.bulk_resubscribed",
  AUDIENCE_BULK_DELETED: "audience.bulk_deleted",
});
