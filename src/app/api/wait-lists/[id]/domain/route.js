import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { webhookAccess } from "@/lib/webhooks/access";
import { domainStatus, mapDnsRecords, mapVercelDomain, normalizeDomain, vercelDomain, vercelProjectPath } from "@/lib/domains/provider.mjs";

function safeDomain(row) {
  if (!row) return null;
  return { id: row.id, hostname: row.hostname, status: row.status, verification: row.verification, dnsRecords: row.dnsRecords, lastCheckedAt: row.lastCheckedAt, lastErrorCode: row.lastErrorCode };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id, "viewCampaign");
  if (access.response) return access.response;
  const domain = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  return NextResponse.json({ data: safeDomain(domain) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  try {
    const body = await request.json();
    const hostname = normalizeDomain(body.hostname);
    if (await prisma.customDomain.findUnique({ where: { waitListId: id } })) return NextResponse.json({ error: "Remove the current domain before connecting another." }, { status: 409 });
    const waitlist = await prisma.waitList.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!waitlist?.workspaceId) return NextResponse.json({ error: "This waitlist is not in a workspace." }, { status: 409 });
    const reserved = await prisma.customDomain.create({ data: { hostname, workspaceId: waitlist.workspaceId, waitListId: id, status: "NEEDS_DNS" } });
    let current;
    try { current = await vercelDomain(vercelProjectPath(hostname, "add"), { method: "POST", body: { name: hostname } }); }
    catch (error) { await prisma.customDomain.delete({ where: { id: reserved.id } }); throw error; }
    const mapped = mapVercelDomain(current);
    let dnsRecords = [];
    let providerConfig;
    try {
      providerConfig = await vercelDomain(`/v6/domains/${encodeURIComponent(hostname)}/config`);
      dnsRecords = mapDnsRecords(providerConfig, hostname);
    } catch { /* DNS guidance is optional when the provider does not return it. */ }
    const row = await prisma.customDomain.update({ where: { id: reserved.id }, data: { status: domainStatus(current, providerConfig), verification: mapped.verification, dnsRecords } });
    return NextResponse.json({ data: safeDomain(row) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error.status || (error.code === "P2002" ? 409 : 400);
    return NextResponse.json({ error: error.message || "Could not connect this domain." }, { status });
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  if (!existing) return NextResponse.json({ error: "No domain is connected." }, { status: 404 });
  try {
    try { await vercelDomain(vercelProjectPath(existing.hostname, "verify"), { method: "POST" }); }
    catch (error) { if (error.status !== 400) throw error; }
    const current = await vercelDomain(vercelProjectPath(existing.hostname));
    const mapped = mapVercelDomain(current);
    let dnsRecords = existing.dnsRecords;
    let providerConfig;
    try { providerConfig = await vercelDomain(`/v6/domains/${encodeURIComponent(existing.hostname)}/config`); dnsRecords = mapDnsRecords(providerConfig, existing.hostname); } catch {}
    const domain = await prisma.customDomain.update({ where: { id: existing.id }, data: { status: domainStatus(current, providerConfig), verification: mapped.verification, dnsRecords, lastCheckedAt: new Date(), lastErrorCode: null } });
    return NextResponse.json({ data: safeDomain(domain) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const domain = await prisma.customDomain.update({ where: { id: existing.id }, data: { status: "NEEDS_ATTENTION", lastCheckedAt: new Date(), lastErrorCode: error.status === 409 ? "PROVIDER_CONFLICT" : "PROVIDER_UNAVAILABLE" } });
    return NextResponse.json({ data: safeDomain(domain), error: error.message }, { status: error.status || 502 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const access = await webhookAccess(request, id);
  if (access.response) return access.response;
  const existing = await prisma.customDomain.findUnique({ where: { waitListId: id } });
  if (!existing) return NextResponse.json({ error: "No domain is connected." }, { status: 404 });
  try {
    await vercelDomain(vercelProjectPath(existing.hostname), { method: "DELETE" });
    await prisma.customDomain.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || "Could not remove the domain." }, { status: error.status || 502 }); }
}
