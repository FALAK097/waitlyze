import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unsubscribeFromMarketing } from "@/lib/email/unsubscribe.mjs";

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  return NextResponse.redirect(new URL(`/unsubscribe/${encodeURIComponent(token)}`, request.url), 303);
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  const form = contentType.includes("application/x-www-form-urlencoded") ? await request.formData() : null;
  const token = request.nextUrl.searchParams.get("token") || form?.get("token");
  const unsubscribed = await unsubscribeFromMarketing(prisma, token);
  if (!unsubscribed) return NextResponse.json({ message: "Unsubscribe link is invalid." }, { status: 400 });
  if (form?.get("List-Unsubscribe") === "One-Click") return new Response(null, { status: 204 });
  if (form) {
    return NextResponse.redirect(new URL(`/unsubscribe/${encodeURIComponent(token)}?done=1`, request.url), 303);
  }
  return new Response(null, { status: 204 });
}
