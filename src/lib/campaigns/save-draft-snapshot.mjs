import { templateSnapshotSchema } from "../templates/catalog.mjs";
import { AccessError, campaignScope } from "../workspaces/service.mjs";

export class DraftRevisionConflict extends Error {
  constructor(current) {
    super("A newer page version was saved in another session.");
    this.current = current;
  }
}

const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const sameSnapshot = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

const scopedDraft = (actorId, waitListId, workspaceId) => ({
  id: waitListId,
  status: "DRAFT",
  ...campaignScope(actorId, "editCampaign", workspaceId),
});

export async function saveDraftSnapshot(db, actorId, workspaceId, waitListId, expectedRevision, rawSnapshot) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error("Invalid page version.");
  const snapshot = templateSnapshotSchema.parse(rawSnapshot);
  return db.$transaction(async (tx) => {
    const where = scopedDraft(actorId, waitListId, workspaceId);
    const current = await tx.waitList.findFirst({ where, select: { id: true, templateRevision: true, templateSnapshot: true } });
    if (!current) throw new AccessError();
    if (current.templateRevision !== expectedRevision) throw new DraftRevisionConflict(current);
    if (sameSnapshot(current.templateSnapshot, snapshot)) {
      return { revision: current.templateRevision, snapshot: current.templateSnapshot, unchanged: true };
    }
    const updated = await tx.waitList.updateMany({
      where: { ...where, templateRevision: expectedRevision },
      data: { templateSnapshot: snapshot, templateRevision: { increment: 1 } },
    });
    if (updated.count !== 1) {
      const latest = await tx.waitList.findFirst({ where, select: { id: true, templateRevision: true, templateSnapshot: true } });
      if (!latest) throw new AccessError();
      throw new DraftRevisionConflict(latest);
    }
    await tx.waitListRevision.create({
      data: { waitListId, revision: expectedRevision, snapshot: current.templateSnapshot },
    });
    await tx.waitListRevision.deleteMany({
      where: { waitListId, revision: { lt: Math.max(1, expectedRevision - 48) } },
    });
    return { revision: expectedRevision + 1, snapshot, unchanged: false };
  });
}
