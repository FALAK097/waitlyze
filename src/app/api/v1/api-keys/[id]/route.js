import { revokeApiKey } from '@/services/api-key';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(_req, { params }) {
    const { id } = await params;

    try {
        const userId = await prisma.user.findFirst({
            select: {
                id: true,
            },
        });

        if (!userId) {
            return NextResponse.json({ error: { code: 'unauthorized', message: 'Authentication required' } }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ error: { code: 'invalid_input', message: 'API key ID is required' } }, { status: 400 });
        }

        const success = await revokeApiKey(id, userId.id);
        if (!success) {
            return NextResponse.json({ error: { code: 'not_found', message: 'API key not found or access denied' } }, { status: 404 });
        }

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: { code: 'server_error', message: 'Failed to revoke API key' } }, { status: 500 });
    }
}
