import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

export async function GET() {
    try {
        // Check Database connection
        await prisma.$queryRaw`SELECT 1`;

        // Check Redis connection
        await redis.ping();

        return NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'up',
                    redis: 'up',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 }
        );
    }
}
