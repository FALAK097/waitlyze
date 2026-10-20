import { randomUUID } from "node:crypto";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";

import { createDraft } from "@/lib/campaigns/create-draft.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";
import { createWorkspaceService } from "@/lib/workspaces/service.mjs";

export const metadata = { title: "New waitlist" };

const slugAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

// Creating a waitlist drops straight into the builder: a blank private draft
// with a unique page address. Name it and style it there.
export default async function NewWaitlistPage() {
  const { user, workspace } = await currentWorkspace();
  const service = createWorkspaceService(prisma);
  await service.requireAccess(user.id, workspace.id, "editCampaign");
  // Reloads and double visits resume the untouched draft instead of stacking
  // blank ones. Once renamed, New creates fresh again.
  const recent = await prisma.waitList.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
      status: "DRAFT",
      name: "Untitled waitlist",
      createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recent) redirect(`/waitlists/${recent.id}`);
  let slug = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = `untitled-${slugAlphabet()}`;
    const taken = await prisma.waitList.findUnique({
      where: { publicSlug: candidate },
      select: { id: true },
    });
    if (!taken) {
      slug = candidate;
      break;
    }
  }
  if (!slug) slug = `untitled-${randomUUID().slice(0, 8)}`;
  const draft = await createDraft(prisma, user.id, workspace.id, {
    name: "Untitled waitlist",
    description: "",
    publicSlug: slug,
    creationKey: randomUUID(),
  });
  await recordAuditEvent(prisma, {
    workspaceId: workspace.id,
    userId: user.id,
    action: AUDIT_ACTIONS.WAITLIST_CREATED,
    resourceType: "waitlist",
    resourceId: draft.id,
    resourceName: "Untitled waitlist",
    detail: "Created as a private draft",
  });
  redirect(`/waitlists/${draft.id}`);
}
