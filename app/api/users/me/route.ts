import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/users/me
 * Get current user profile
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        documents: true,
                        folders: true,
                        links: true,
                        groupMemberships: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/users/me
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, image } = body;

        // Validate input
        if (name !== undefined && typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Invalid name format' },
                { status: 400 }
            );
        }

        if (image !== undefined && typeof image !== 'string') {
            return NextResponse.json(
                { error: 'Invalid image format' },
                { status: 400 }
            );
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { email: session.email },
            data: {
                ...(name !== undefined && { name }),
                ...(image !== undefined && { image }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                updatedAt: true,
            },
        });

        // Log audit action
        await prisma.auditLog.create({
            data: {
                userId: updatedUser.id,
                action: 'updated',
                resourceType: 'user',
                resourceId: updatedUser.id,
                metadata: { changes: body },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
