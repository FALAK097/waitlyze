import { randomBytes } from 'crypto';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const SALT_ROUNDS = 10;
const API_KEY_PREFIX = 'wl_';
const API_KEY_BYTES = 32;

export async function generateApiKey() {
    try {
        const randomBytesAsync = promisify(randomBytes);
        const buffer = await randomBytesAsync(API_KEY_BYTES);

        const apiKey = `${API_KEY_PREFIX}${buffer
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')}`;

        const hashedKey = await bcrypt.hash(apiKey, SALT_ROUNDS);

        return { apiKey, hashedKey };
    } catch (error) {
        console.error('Error generating API key:', error);
        throw new Error('Failed to generate API key');
    }
}

export async function createApiKey({ name, userId }) {
    try {
        const { apiKey, hashedKey } = await generateApiKey();

        const apiKeyRecord = await prisma.apiKey.create({
            data: {
                name,
                keyHash: hashedKey,
                userId,
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });

        return {
            ...apiKeyRecord,
            apiKey,
        };
    } catch (error) {
        console.error('Error creating API key:', error);
        throw new Error('Failed to create API key');
    }
}

export async function revokeApiKey(id, userId) {
    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!apiKey || apiKey.userId !== userId) {
            return false;
        }

        await prisma.apiKey.delete({
            where: { id },
        });

        return true;
    } catch (error) {
        console.error('Error revoking API key:', error);
        return false;
    }
}

export async function listUserApiKeys(userId) {
    try {
        return await prisma.apiKey.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        console.error('Error listing API keys:', error);
        throw new Error('Failed to list API keys');
    }
}
