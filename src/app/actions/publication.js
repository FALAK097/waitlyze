"use server";

import { revalidatePath } from "next/cache";

import {
  pauseCampaign,
  PublicationConflict,
  publishCampaign,
  rollbackCampaign,
} from "@/lib/campaigns/publication.mjs";
import { CustomerSenderNotConnectedError } from "@/lib/email/sender-resolution.mjs";
import { notifyWaitlistPublished } from "@/lib/emails/founder-notifications.mjs";
import prisma from "@/lib/prisma";
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";
import { sessionActor } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";

async function revalidatePublication(id) {
  const campaign = await prisma.waitList.findUnique({
    where: { id },
    select: { publicSlug: true },
  });
  revalidatePath("/waitlists");
  revalidatePath(`/waitlists/${id}`);
  if (campaign?.publicSlug) revalidatePath(`/w/${campaign.publicSlug}`);
}

async function action(run, fallback) {
  try {
    const user = await sessionActor();
    return { ok: true, ...(await run(user.id)) };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, message: "You need to be an owner or admin to change publication." };
    if (error instanceof CustomerSenderNotConnectedError)
      return {
        ok: false,
        code: error.code,
        message:
          "Connect and verify a Resend sender before publishing a waitlist that requires email confirmation.",
      };
    if (error instanceof PublicationConflict) return { ok: false, message: error.message };
    console.error(fallback, error.code || error.name);
    return { ok: false, message: "Couldn't update publication. Try again." };
  }
}

export async function publishWaitlist(id, revision) {
  if (!Number.isSafeInteger(revision) || revision < 1)
    return { ok: false, message: "Reload the page and try again." };
  // First-publish detection: only a list that was never published notifies
  // its owners - re-publishes after an edit and resumes from PAUSED stay
  // quiet on purpose. Read inside the authenticated closure: no pre-auth row
  // access, and still observed before the publish write.
  let firstPublish = false;
  const outcome = await action(async (userId) => {
    const before = await prisma.waitList.findUnique({
      where: { id },
      select: { status: true, publishedRevision: true },
    });
    firstPublish = Boolean(before) && !before.publishedRevision;
    const result = await publishCampaign(prisma, userId, undefined, id, revision);
    if (!result.unchanged) await revalidatePublication(id);
    await recordWaitlistAuditEvent(prisma, {
      userId,
      waitListId: id,
      action: AUDIT_ACTIONS.WAITLIST_PUBLISHED,
      detail: "Page published",
    });
    return result;
  }, "Waitlist publish failed");
  // Best-effort owner notice via the outbox; never affects the publish result.
  if (outcome?.ok && firstPublish) {
    try {
      await notifyWaitlistPublished(prisma, id);
    } catch (error) {
      console.error("Published notice enqueue failed", error?.message || "unknown error");
    }
  }
  return outcome;
}
export async function pauseWaitlist(id) {
  return action(async (userId) => {
    const result = await pauseCampaign(prisma, userId, undefined, id);
    await revalidatePublication(id);
    await recordWaitlistAuditEvent(prisma, {
      userId,
      waitListId: id,
      action: AUDIT_ACTIONS.WAITLIST_PAUSED,
      detail: "Signups paused",
    });
    return result;
  }, "Waitlist pause failed");
}
export async function rollbackWaitlist(id) {
  return action(async (userId) => {
    const result = await rollbackCampaign(prisma, userId, undefined, id);
    await revalidatePublication(id);
    return result;
  }, "Waitlist rollback failed");
}
