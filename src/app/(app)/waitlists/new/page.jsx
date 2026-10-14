import { redirect } from "next/navigation";
import { currentWorkspace } from "@/lib/workspaces/current";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { createDraft } from "@/lib/campaigns/create-draft.mjs";
import { customAlphabet } from "nanoid";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";

export const metadata = { title: "New waitlist" };

const slugAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

// Creating a waitlist drops straight into the builder: a blank private draft
// with a unique page address. Name it and style it there.
export default async function NewWaitlistPage() {
  const { user, workspace } = await currentWorkspace();
  await createWorkspaceService(prisma).requireAccess(user.id, workspace.id, "editCampaign");
  let slug = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = `untitled-${slugAlphabet()}`;
    const taken = await prisma.waitList.findUnique({ where: { publicSlug: candidate }, select: { id: true } });
    if (!taken) {
      slug = candidate;
      break;
    }
  }
  if (!slug) slug = `untitled-${randomUUID().slice(0, 8)}`;
  const draft = await createDraft(prisma, user.id, workspace.id, {
    name: "Untitled waitlist", description: "", publicSlug: slug, creationKey: randomUUID(),
  });
  await recordAuditEvent(prisma, { workspaceId: workspace.id, userId: user.id, action: AUDIT_ACTIONS.WAITLIST_CREATED, resourceType: "waitlist", resourceId: draft.id, resourceName: "Untitled waitlist", detail: "Created as a private draft" });
  redirect(`/waitlists/${draft.id}/edit`);
}
