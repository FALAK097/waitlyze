import { cookies } from "next/headers";
import Link from "next/link";

import { CreateWaitlistDialog } from "@/components/product/create-waitlist-dialog";
import prisma from "@/lib/prisma";
import { isTemplateId } from "@/lib/templates/gallery.mjs";
import {
  BLUEPRINT_COOKIE_NAME,
  getActiveToolBlueprint,
  verifyBlueprintCookieValue,
} from "@/lib/tools/blueprint.mjs";
import { getToolBySlug } from "@/lib/tools/registry.mjs";
import { currentWorkspace } from "@/lib/workspaces/current";

export const metadata = { title: "New waitlist" };

export default async function NewWaitlistPage({ searchParams }) {
  const [resolved, { workspace }, cookieStore] = await Promise.all([
    searchParams,
    currentWorkspace(),
    cookies(),
  ]);
  const template = Array.isArray(resolved?.template) ? resolved.template[0] : resolved?.template;
  const queryBlueprintId = Array.isArray(resolved?.blueprint)
    ? resolved.blueprint[0]
    : resolved?.blueprint;
  const cookieBlueprint = verifyBlueprintCookieValue(cookieStore.get(BLUEPRINT_COOKIE_NAME)?.value);
  const requestedBlueprintId = queryBlueprintId || cookieBlueprint?.id || null;
  const blueprintRecord = requestedBlueprintId
    ? await getActiveToolBlueprint(prisma, requestedBlueprintId)
    : null;
  const blueprintExpired = Boolean(queryBlueprintId && !blueprintRecord);

  const initialTemplateId = isTemplateId(blueprintRecord?.payload?.templateId)
    ? blueprintRecord.payload.templateId
    : isTemplateId(template)
      ? template
      : "simple";

  const toolMeta = blueprintRecord ? getToolBySlug(blueprintRecord.toolSlug) : null;
  const initialBlueprint = blueprintRecord
    ? {
        id: blueprintRecord.id,
        toolSlug: blueprintRecord.toolSlug,
        toolTitle: toolMeta?.shortTitle || blueprintRecord.toolSlug,
        templateId: initialTemplateId,
        campaignName: blueprintRecord.payload.campaignName || "",
        campaignDescription: blueprintRecord.payload.campaignDescription || "",
        suggestedSlug: blueprintRecord.payload.suggestedSlug || "",
        showReferrals: blueprintRecord.payload.showReferrals,
        summaryBullets: blueprintRecord.payload.summaryBullets || [],
      }
    : null;

  return (
    <section
      className="rounded-xl border border-product-border-subtle bg-product-bg-surface px-6 py-16 text-center"
      aria-labelledby="new-waitlist-title"
    >
      <h1 id="new-waitlist-title" className="mb-2! text-title">
        {initialBlueprint ? "Review and create your waitlist" : "Create a waitlist"}
      </h1>
      <p className="text-sm text-product-text-secondary">
        {initialBlueprint
          ? `Prefilled from ${initialBlueprint.toolTitle}. Review your draft settings below—nothing is published automatically.`
          : "Name the launch, then shape the page in Builder."}
      </p>
      {blueprintExpired && (
        <p
          role="status"
          className="mx-auto mt-4 max-w-md rounded-lg border border-product-border-subtle bg-product-bg-inset px-4 py-2.5 text-caption text-product-text-secondary"
        >
          That Launch Lab blueprint has expired or was already claimed. You can still create a fresh
          waitlist below.
        </p>
      )}
      <div className="mt-5">
        <CreateWaitlistDialog
          initialOpen
          initialTemplateId={initialTemplateId}
          initialBlueprint={initialBlueprint}
          workspaceId={workspace.id}
          canManageBilling={workspace.members?.[0]?.role === "OWNER"}
        />
      </div>
      <Link
        prefetch={false}
        href={initialBlueprint ? "/waitlists?dismissBlueprint=1" : "/waitlists"}
        className="mt-5 inline-block"
      >
        Back to waitlists
      </Link>
    </section>
  );
}
