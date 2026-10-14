import { revalidatePath } from "next/cache";
import { currentWorkspace } from "@/lib/workspaces/current";
import { createWorkspaceService, AccessError } from "@/lib/workspaces/service.mjs";
import { AUDIT_ACTIONS, recordAuditEvent } from "@/lib/workspaces/audit.mjs";
import { createDraft, DraftCreationError } from "@/lib/campaigns/create-draft.mjs";
import { listTemplates } from "@/lib/templates/catalog.mjs";
import { WaitlistCreationFlow } from "@/components/product/waitlist-creation-flow";
import prisma from "@/lib/prisma";
import { ZodError } from "zod";

export const metadata = { title: "New waitlist" };

export default async function NewWaitlistPage() {
  const { user, workspace } = await currentWorkspace();
  await createWorkspaceService(prisma).requireAccess(user.id, workspace.id, "editCampaign");
  const workspaceId = workspace.id;
  async function submitDraft(_previous, formData) {
    "use server";
    try {
      const { user: actor } = await currentWorkspace();
      const draft = await createDraft(prisma, actor.id, workspaceId, {
        name: formData.get("name"), description: formData.get("description"),
        publicSlug: formData.get("publicSlug"), templateId: formData.get("templateId"), creationKey: formData.get("creationKey"),
        showReferrals: formData.get("showReferrals") === "on",
        sendEmailsToSubscribers: formData.get("sendEmailsToSubscribers") === "on",
      });
      await recordAuditEvent(prisma, { workspaceId, userId: actor.id, action: AUDIT_ACTIONS.WAITLIST_CREATED, resourceType: "waitlist", resourceId: draft.id, resourceName: String(formData.get("name") || "Untitled waitlist"), detail: "Created as a private draft" });
      revalidatePath("/(app)", "layout");
      return { id: draft.id };
    } catch (error) {
      if (error instanceof ZodError) return { message: "Check your waitlist details.", fields: error.flatten().fieldErrors };
      if (error instanceof DraftCreationError) return { message: error.message, fields: error.field ? { [error.field]: [error.message] } : {} };
      if (error instanceof AccessError) return { message: "You no longer have access to this workspace." };
      console.error("Draft creation failed", error.code || error.name);
      return { message: "Couldn't create your waitlist. Your details are still here. Try again." };
    }
  }
  return <WaitlistCreationFlow templates={listTemplates()} workspaceId={workspaceId} workspaceName={workspace.name} submitDraft={submitDraft} />;
}
