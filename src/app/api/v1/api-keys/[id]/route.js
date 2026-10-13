import { revokeApiKey } from '@/services/api-key';
import { AUDIT_ACTIONS, recordWaitlistAuditEvent } from "@/lib/workspaces/audit.mjs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { campaignScope } from "@/lib/workspaces/service.mjs";
import { selectedWorkspaceId } from "@/lib/workspaces/current";

export async function DELETE(_req, { params }) {
    const { id } = await params;

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        
        if (!session) {
            return NextResponse.json({ error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: { code: 'user_not_found', message: 'User not found' } }, { status: 404 });
        }

        if (!id) {
            return NextResponse.json({ error: { code: 'invalid_input', message: 'API key ID is required' } }, { status: 400 });
        }

        const [key, workspaceId] = await Promise.all([
            prisma.apiKey.findUnique({ where: { id }, select: { userId: true, waitlistId: true, name: true, waitlist: { select: { name: true } } } }),
            selectedWorkspaceId(user.id),
        ]);
        if (!key) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }
        let waitlistId = null;
        if (key.waitlistId) {
            const accessibleWaitlist = await prisma.waitList.findFirst({
                where: { id: key.waitlistId, ...campaignScope(user.id, "manageConnections", workspaceId || undefined) },
                select: { id: true },
            });
            if (!accessibleWaitlist) {
                return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
            }
            waitlistId = accessibleWaitlist.id;
        } else if (key.userId !== user.id) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }
        const success = await revokeApiKey(id, user.id, waitlistId);
        if (!success) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }
        if (waitlistId) await recordWaitlistAuditEvent(prisma, { userId: user.id, waitListId: waitlistId, action: AUDIT_ACTIONS.API_KEY_REVOKED, resourceType: "api_key", resourceId: id, resourceName: key.name || "API key", detail: key.waitlist ? `For waitlist ${key.waitlist.name || key.waitlistId}` : "Access revoked immediately" });

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: { code: 'server_error', message: 'Failed to revoke API key' } }, { status: 500 });
    }
}
