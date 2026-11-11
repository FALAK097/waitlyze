import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  try {
    // Lightweight keep-alive query that exercises the database connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        error: error?.message || "Database unreachable",
        envDatabaseUrlSet: Boolean(process.env.DATABASE_URL),
        envDatabaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
        envKeys: Object.keys(process.env).filter(
          (k) => !k.includes("KEY") && !k.includes("SECRET"),
        ),
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}
