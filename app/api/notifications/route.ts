import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
    getCacheValue,
    setCacheValue,
    deleteCachePattern,
    CacheKeys,
} from "@/lib/cache/redis-cache";

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const read = searchParams.get("read"); // 'true', 'false', or null (all)
        const type = searchParams.get("type"); // Filter by type

        // Check cache first
        const cacheKey = CacheKeys.notifications(user.id) + `:${page}:${limit}:${read}:${type}`;
        const cached = await getCacheValue<any>(cacheKey);

        if (cached) {
            return NextResponse.json(cached);
        }

        // Build filter
        const where: any = { userId: user.id };
        if (read !== null && read !== undefined) {
            where.read = read === "true";
        }
        if (type) {
            where.type = type;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: user.id, read: false },
            }),
        ]);

        const result = {
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            unreadCount,
        };

        // Cache for 30 seconds
        await setCacheValue(cacheKey, result, 30);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId, type, title, message, link, metadata } = body;

        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata: {
                    ...(metadata || {}),
                    link,
                },
            },
        });

        // Invalidate cache
        await deleteCachePattern(CacheKeys.notifications(userId) + "*");

        // TODO: Emit WebSocket event for real-time notification

        return NextResponse.json({ notification });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}
