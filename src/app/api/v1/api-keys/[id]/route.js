import { revokeApiKey } from '@/services/api-key';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from "next/headers";
import { campaignScope } from "@/lib/workspaces/service.mjs";

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

        const key = await prisma.apiKey.findUnique({ where: { id }, select: { userId: true, waitlistId: true } });
        if (!key) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }
        let waitlistId = null;
        if (key.waitlistId) {
            const workspaceId = (await cookies()).get("waitlyze-workspace")?.value;
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

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: { code: 'server_error', message: 'Failed to revoke API key' } }, { status: 500 });
    }
}
