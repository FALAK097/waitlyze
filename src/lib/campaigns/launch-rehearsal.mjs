import { templateSnapshotSchema } from "../templates/catalog.mjs";

function checksFor(waitlist, publishedSnapshot) {
  const snapshot = publishedSnapshot ?? waitlist.templateSnapshot;
  const parsed = templateSnapshotSchema.safeParse(snapshot);
  return [
    {
      key: "page_snapshot",
      label: "Page content is valid",
      passed: parsed.success,
      detail: parsed.success ? "The saved page matches its template." : "Review the page content before publishing.",
    },
    {
      key: "publication_state",
      label: "Signup state is consistent",
      passed: waitlist.status !== "PUBLISHED" || Boolean(publishedSnapshot),
      detail: waitlist.status === "PUBLISHED" && !publishedSnapshot
        ? "The published page snapshot is missing. Publish the page again after review."
        : waitlist.status === "PAUSED" ? "The paused state keeps the public signup form closed."
          : waitlist.status === "DRAFT" ? "Drafts remain private until you publish."
            : "A published page snapshot is ready.",
    },
    {
      key: "signup_form",
      label: "Email signup form is ready",
      passed: parsed.success && parsed.data.sections.some((section) => section.type === "form"),
      detail: parsed.success && parsed.data.sections.some((section) => section.type === "form")
        ? "The page has one valid signup form." : "Add a valid email signup form to continue.",
    },
  ];
}

export async function runLaunchRehearsal(db, waitListId) {
  const waitlist = await db.waitList.findUnique({
    where: { id: waitListId },
    select: { id: true, status: true, templateSnapshot: true, publishedRevision: true },
  });
  if (!waitlist) throw new Error("Waitlist not found.");

  const publication = waitlist.publishedRevision == null ? null : await db.waitListPublicationRevision.findUnique({
    where: { waitListId_revision: { waitListId, revision: waitlist.publishedRevision } },
    select: { snapshot: true },
  });
  const checks = checksFor(waitlist, publication?.snapshot ?? null);
  const checksFailed = checks.filter((check) => !check.passed).length;
  const result = await db.launchRehearsal.create({
    data: {
      waitListId,
      status: checksFailed === 0 ? "PASSED" : "NEEDS_ATTENTION",
      checksPassed: checks.length - checksFailed,
      checksFailed,
      checkResults: checks,
    },
    select: { id: true, status: true, checksPassed: true, checksFailed: true, checkResults: true, createdAt: true },
  });
  return result;
}
