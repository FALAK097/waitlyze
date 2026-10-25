import { NextResponse } from "next/server";

import {
  PIPELINE_STAGE_KEYS,
  normalizeStageKey,
  parsePipelineStages,
  resolvePipelineStages,
} from "@/lib/pipeline/stages.mjs";
import prisma from "@/lib/prisma";
import { requireCampaign } from "@/lib/workspaces/authorize";
import { AccessError } from "@/lib/workspaces/service.mjs";

const RECENT_LIMIT = 20;

/** Stage counts plus the most recent signups for movement. */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { campaign } = await requireCampaign(id, "viewAudience");
    const [counts, recent] = await Promise.all([
      prisma.signUp.groupBy({
        by: ["pipelineStage"],
        _count: { _all: true },
        where: { waitListId: id },
      }),
      prisma.signUp.findMany({
        where: { waitListId: id },
        select: { id: true, email: true, createdAt: true, verifiedAt: true, pipelineStage: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: RECENT_LIMIT,
      }),
    ]);
    const stages = resolvePipelineStages(campaign.pipelineStages);
    const byStage = new Map(counts.map((row) => [row.pipelineStage, row._count._all]));
    return NextResponse.json({
      stages: stages.map((stage) => ({ ...stage, count: byStage.get(stage.key) ?? 0 })),
      total: counts.reduce((sum, row) => sum + row._count._all, 0),
      recent: recent.map((row) => ({
        id: row.id,
        email: row.email,
        stage: normalizeStageKey(row.pipelineStage),
        verified: Boolean(row.verifiedAt),
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error loading pipeline:", error);
    return NextResponse.json({ error: "Unable to load the pipeline." }, { status: 500 });
  }
}

/** Move one signup between stages. Manage permission only, server-side. */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await requireCampaign(id, "manageAudience");
    const body = await request.json().catch(() => null);
    const signupId = typeof body?.signupId === "string" ? body.signupId : "";
    const stage = String(body?.stage || "")
      .trim()
      .toUpperCase();
    if (!signupId) return NextResponse.json({ error: "Choose a signup." }, { status: 400 });
    if (!PIPELINE_STAGE_KEYS.includes(stage))
      return NextResponse.json({ error: "Unknown pipeline stage." }, { status: 400 });
    const signup = await prisma.signUp.findFirst({
      where: { id: signupId, waitListId: id },
      select: { id: true },
    });
    if (!signup) return NextResponse.json({ error: "Signup not found." }, { status: 404 });
    await prisma.signUp.update({ where: { id: signupId }, data: { pipelineStage: stage } });
    return NextResponse.json({ ok: true, signupId, stage });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error moving signup:", error);
    return NextResponse.json({ error: "Unable to move the signup." }, { status: 500 });
  }
}

/** Rename pipeline stages (keys stay fixed). Manage permission only. */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    await requireCampaign(id, "manageAudience");
    const body = await request.json().catch(() => null);
    const parsed = parsePipelineStages(body?.stages);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await prisma.waitList.update({ where: { id }, data: { pipelineStages: parsed.stages } });
    return NextResponse.json({ ok: true, stages: parsed.stages });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error renaming pipeline stages:", error);
    return NextResponse.json({ error: "Unable to rename the stages." }, { status: 500 });
  }
}
