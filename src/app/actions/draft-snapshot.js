"use server";

import { currentWorkspace } from "@/lib/workspaces/current";
import { AccessError } from "@/lib/workspaces/service.mjs";
import { DraftRevisionConflict, saveDraftSnapshot } from "@/lib/campaigns/save-draft-snapshot.mjs";
import prisma from "@/lib/prisma";
import { ZodError } from "zod";

export async function saveDraftPage(waitListId, expectedRevision, snapshot) {
  try {
    const { user, workspace } = await currentWorkspace();
    const result = await saveDraftSnapshot(prisma, user.id, workspace.id, waitListId, expectedRevision, snapshot);
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof DraftRevisionConflict) return {
      ok: false,
      conflict: true,
      revision: error.current.templateRevision,
      snapshot: error.current.templateSnapshot,
    };
    if (error instanceof ZodError) return { ok: false, invalid: true, message: "One or more fields need attention. Your edits are kept in this tab." };
    if (error instanceof AccessError) return { ok: false, unavailable: true, message: "This draft is no longer available in the selected workspace." };
    console.error("Draft page autosave failed", error.code || error.name);
    return { ok: false, message: "Couldn't save just now. Your edits are kept in this tab; try again." };
  }
}
