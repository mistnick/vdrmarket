import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Mark all as read
        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                read: false,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                updated: result.count,
            },
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
