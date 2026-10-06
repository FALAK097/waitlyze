"use server";

import { sessionActor } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";
import { pauseCampaign, PublicationConflict, publishCampaign, rollbackCampaign } from "@/lib/campaigns/publication.mjs";
import prisma from "@/lib/prisma";

async function action(run, fallback) {
  try {
    const user = await sessionActor();
    return { ok: true, ...await run(user.id) };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, message: "You need to be an owner or admin to change publication." };
    if (error instanceof PublicationConflict) return { ok: false, message: error.message };
    console.error(fallback, error.code || error.name);
    return { ok: false, message: "Couldn't update publication. Try again." };
  }
}

export async function publishWaitlist(id, revision) {
  if (!Number.isSafeInteger(revision) || revision < 1) return { ok: false, message: "Reload the page and try again." };
  return action((userId) => publishCampaign(prisma, userId, undefined, id, revision), "Waitlist publish failed");
}
export async function pauseWaitlist(id) {
  return action((userId) => pauseCampaign(prisma, userId, undefined, id), "Waitlist pause failed");
}
export async function rollbackWaitlist(id) {
  return action((userId) => rollbackCampaign(prisma, userId, undefined, id), "Waitlist rollback failed");
}
