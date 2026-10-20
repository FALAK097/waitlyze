import { templateSnapshotSchema } from "../templates/catalog.mjs";
import { AccessError, campaignScope } from "../workspaces/service.mjs";

export class DraftRevisionConflict extends Error {
  constructor(current) {
    super("A newer page version was saved in another session.");
    this.current = current;
  }
}

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const sameSnapshot = (left, right) =>
  JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

const scopedPage = (actorId, waitListId, workspaceId) => ({
  id: waitListId,
  status: { in: ["DRAFT", "PUBLISHED", "PAUSED"] },
  ...campaignScope(actorId, "editCampaign", workspaceId),
});

export async function saveDraftSnapshot(...args) {
  return persistSnapshot(false, ...args);
}

// Only an explicit replacement action may overwrite an unreadable stored record.
export async function replaceInvalidDraftSnapshot(...args) {
  return persistSnapshot(true, ...args);
}

async function persistSnapshot(
  replaceInvalid,
  db,
  actorId,
  workspaceId,
  waitListId,
  expectedRevision,
  rawSnapshot,
) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)
    throw new Error("Invalid page version.");
  const snapshot = templateSnapshotSchema.parse(rawSnapshot);
  return db.$transaction(async (tx) => {
    const where = scopedPage(actorId, waitListId, workspaceId);
    const current = await tx.waitList.findFirst({
      where,
      select: { id: true, templateRevision: true, templateSnapshot: true },
    });
    if (!current) throw new AccessError();
    const stored = templateSnapshotSchema.safeParse(current.templateSnapshot);
    if (!replaceInvalid && !stored.success) throw stored.error;
    if (current.templateRevision !== expectedRevision) throw new DraftRevisionConflict(current);
    if (replaceInvalid && stored.success)
      throw new Error("This page is now valid. Reload before editing it.");
    if (sameSnapshot(current.templateSnapshot, snapshot)) {
      return {
        revision: current.templateRevision,
        snapshot: current.templateSnapshot,
        unchanged: true,
      };
    }
    const updated = await tx.waitList.updateMany({
      where: { ...where, templateRevision: expectedRevision },
      data: { templateSnapshot: snapshot, templateRevision: { increment: 1 } },
    });
    if (updated.count !== 1) {
      const latest = await tx.waitList.findFirst({
        where,
        select: { id: true, templateRevision: true, templateSnapshot: true },
      });
      if (!latest) throw new AccessError();
      throw new DraftRevisionConflict(latest);
    }
    if (current.templateSnapshot !== null)
      await tx.waitListRevision.create({
        data: { waitListId, revision: expectedRevision, snapshot: current.templateSnapshot },
      });
    await tx.waitListRevision.deleteMany({
      where: { waitListId, revision: { lt: Math.max(1, expectedRevision - 48) } },
    });
    return { revision: expectedRevision + 1, snapshot, unchanged: false };
  });
}
