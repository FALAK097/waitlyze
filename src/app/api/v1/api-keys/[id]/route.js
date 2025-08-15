import { revokeApiKey } from '@/services/api-key';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(_req, { params }) {
    const { id } = await params;

    try {
        const clerkUser = await currentUser();
        
        if (!clerkUser) {
            return NextResponse.json({ error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: {
                clerkUserId: clerkUser.id,
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

        const success = await revokeApiKey(id, user.id);
        if (!success) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: { code: 'server_error', message: 'Failed to revoke API key' } }, { status: 500 });
    }
}
