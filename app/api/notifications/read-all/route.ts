import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteCachePattern, CacheKeys } from "@/lib/cache/redis-cache";

// POST /api/notifications/read-all - Mark all as read
export async function POST(request: NextRequest) {
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

        // Mark all unread notifications as read
        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                read: false,
            },
            data: {
                read: true,
            },
        });

        // Invalidate cache
        await deleteCachePattern(CacheKeys.notifications(user.id) + "*");

        return NextResponse.json({
            success: true,
            count: result.count,
        });
    } catch (error) {
        console.error("Error marking all as read:", error);
        return NextResponse.json(
            { error: "Failed to mark all as read" },
            { status: 500 }
        );
    }
}
