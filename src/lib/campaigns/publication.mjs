import { templateSnapshotSchema } from "../templates/catalog.mjs";
import { AccessError, campaignScope } from "../workspaces/service.mjs";

export class PublicationConflict extends Error {
  constructor(message = "The page changed before this action completed.") { super(message); }
}

const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const sameSnapshot = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

const adminScope = (actorId, waitListId, workspaceId) => ({
  id: waitListId,
  ...campaignScope(actorId, "publishCampaign", workspaceId),
});

export async function publishCampaign(db, actorId, workspaceId, waitListId, expectedRevision) {
  return db.$transaction(async (tx) => {
    const where = adminScope(actorId, waitListId, workspaceId);
    const page = await tx.waitList.findFirst({ where, select: {
      id: true, status: true, templateSnapshot: true, templateRevision: true,
      publishedRevision: true,
    } });
    if (!page) throw new AccessError();
    if (page.templateRevision !== expectedRevision) throw new PublicationConflict();
    const snapshot = templateSnapshotSchema.parse(page.templateSnapshot);
    if (page.status === "PUBLISHED" && page.publishedRevision) {
      const current = await tx.waitListPublicationRevision.findUnique({
        where: { waitListId_revision: { waitListId, revision: page.publishedRevision } },
        select: { templateRevision: true, snapshot: true },
      });
      if (current?.templateRevision === page.templateRevision) return { revision: page.publishedRevision, unchanged: true };
    }
    const latest = await tx.waitListPublicationRevision.findFirst({ where: { waitListId }, orderBy: { revision: "desc" }, select: { revision: true } });
    const revision = (latest?.revision || 0) + 1;
    const created = await tx.waitListPublicationRevision.create({ data: {
      waitListId, revision, templateRevision: page.templateRevision, snapshot,
    } });
    const changed = await tx.waitList.updateMany({
      where: { ...where, templateRevision: expectedRevision, status: page.status, publishedRevision: page.publishedRevision },
      data: { status: "PUBLISHED", publishedRevision: revision, publishedTemplateRevision: page.templateRevision },
    });
    if (changed.count !== 1) throw new PublicationConflict();
    return { revision: created.revision, unchanged: false };
  });
}

export async function pauseCampaign(db, actorId, workspaceId, waitListId) {
  const where = { ...adminScope(actorId, waitListId, workspaceId), status: "PUBLISHED", publishedRevision: { not: null } };
  const changed = await db.waitList.updateMany({ where, data: { status: "PAUSED" } });
  if (changed.count !== 1) throw new PublicationConflict("This waitlist is not currently published.");
  return { paused: true };
}

export async function rollbackCampaign(db, actorId, workspaceId, waitListId) {
  return db.$transaction(async (tx) => {
    const where = adminScope(actorId, waitListId, workspaceId);
    const page = await tx.waitList.findFirst({ where, select: { id: true, status: true, publishedRevision: true, templateRevision: true, templateSnapshot: true } });
    if (!page || !page.publishedRevision) throw new AccessError();
    const previous = await tx.waitListPublicationRevision.findFirst({
      where: { waitListId, revision: { lt: page.publishedRevision } }, orderBy: { revision: "desc" },
      select: { revision: true, templateRevision: true, snapshot: true },
    });
    if (!previous) throw new PublicationConflict("There is no earlier published version to restore.");
    const restoreDraft = !sameSnapshot(page.templateSnapshot, previous.snapshot);
    const nextTemplateRevision = page.templateRevision + (restoreDraft ? 1 : 0);
    if (restoreDraft) await tx.waitListRevision.create({ data: { waitListId, revision: page.templateRevision, snapshot: page.templateSnapshot } });
    const updated = await tx.waitList.updateMany({
      where: { ...where, status: page.status, publishedRevision: page.publishedRevision, templateRevision: page.templateRevision },
      data: {
        status: page.status === "PAUSED" ? "PAUSED" : "PUBLISHED",
        publishedRevision: previous.revision,
        publishedTemplateRevision: nextTemplateRevision,
        ...(restoreDraft ? { templateSnapshot: previous.snapshot, templateRevision: nextTemplateRevision } : {}),
      },
    });
    if (updated.count !== 1) throw new PublicationConflict();
    return { revision: previous.revision, templateRevision: nextTemplateRevision, snapshot: previous.snapshot };
  });
}
