import { NextResponse } from "next/server";

import {
  createCloudflareHostname,
  deleteCloudflareHostname,
  getCloudflareHostname,
  normalizeDomain,
} from "@/lib/domains/provider.mjs";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";

function safeDomain(row) {
  if (!row) return null;
  const hasCloudflareHostname = Boolean(row.providerId);
  return {
    id: row.id,
    hostname: row.hostname,
    // Rows created before the provider migration must not appear live merely
    // because they were verified by the former host.
    status: hasCloudflareHostname ? row.status : row.status === "ACTIVE" ? "NEEDS_DNS" : row.status,
    verification: hasCloudflareHostname ? row.verification : [],
    dnsRecords: hasCloudflareHostname
      ? row.dnsRecords
      : [
          {
            type: "CNAME",
            name: row.hostname,
            value: process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET || "customers.waitlyze.com",
          },
        ],
    lastCheckedAt: row.lastCheckedAt,
    lastErrorCode: row.lastErrorCode,
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id, "viewCampaign");
  if (access.response) return access.response;
  const domain = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  return NextResponse.json(
    { data: safeDomain(domain) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  try {
    const body = await request.json();
    const hostname = normalizeDomain(body.hostname);
    if (await prisma.customDomain.findUnique({ where: { waitListId: id } }))
      return NextResponse.json(
        { error: "Remove the current domain before connecting another." },
        { status: 409 },
      );
    const waitlist = await prisma.waitList.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    if (!waitlist?.workspaceId)
      return NextResponse.json({ error: "This waitlist is not in a workspace." }, { status: 409 });
    const reserved = await prisma.customDomain.create({
      data: { hostname, workspaceId: waitlist.workspaceId, waitListId: id, status: "NEEDS_DNS" },
    });
    let current;
    try {
      // Reuse an existing Cloudflare hostname (e.g., left behind by an
      // earlier attempt) instead of creating a duplicate.
      current =
        (await getCloudflareHostname({ providerId: null, hostname })) ||
        (await createCloudflareHostname(hostname));
    } catch (error) {
      await prisma.customDomain.delete({ where: { id: reserved.id } });
      throw error;
    }
    try {
      const row = await prisma.customDomain.update({
        where: { id: reserved.id },
        data: {
          providerId: current.id,
          status: current.status,
          verification: current.verification,
          dnsRecords: current.dnsRecords,
        },
      });
      return NextResponse.json(
        { data: safeDomain(row) },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      await deleteCloudflareHostname({ providerId: current.id, hostname }).catch(() => {});
      await prisma.customDomain.delete({ where: { id: reserved.id } }).catch(() => {});
      throw error;
    }
  } catch (error) {
    const status = error.status || (error.code === "P2002" ? 409 : 400);
    return NextResponse.json(
      { error: error.message || "Could not connect this domain." },
      { status },
    );
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  if (!existing) return NextResponse.json({ error: "No domain is connected." }, { status: 404 });
  try {
    let current = await getCloudflareHostname({
      providerId: existing.providerId,
      hostname: existing.hostname,
    });
    if (!current) current = await createCloudflareHostname(existing.hostname);
    const domain = await prisma.customDomain.update({
      where: { id: existing.id },
      data: {
        providerId: current.id,
        status: current.status,
        verification: current.verification,
        dnsRecords: current.dnsRecords,
        lastCheckedAt: new Date(),
        lastErrorCode: null,
      },
    });
    return NextResponse.json(
      { data: safeDomain(domain) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const domain = await prisma.customDomain.update({
      where: { id: existing.id },
      data: {
        status: "NEEDS_ATTENTION",
        lastCheckedAt: new Date(),
        lastErrorCode: error.status === 409 ? "PROVIDER_CONFLICT" : "PROVIDER_UNAVAILABLE",
      },
    });
    return NextResponse.json(
      { data: safeDomain(domain), error: error.message },
      { status: error.status || 502 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  if (!existing) return NextResponse.json({ error: "No domain is connected." }, { status: 404 });
  try {
    await deleteCloudflareHostname({
      providerId: existing.providerId,
      hostname: existing.hostname,
    });
    await prisma.customDomain.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not remove the domain." },
      { status: error.status || 502 },
    );
  }
}
