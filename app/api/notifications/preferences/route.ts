import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/notifications/preferences - Get user notification preferences
export async function GET() {
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
            include: { notificationPreference: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // If preferences don't exist, create defaults
        if (!user.notificationPreference) {
            const preferences = await prisma.notificationPreference.create({
                data: {
                    userId: user.id,
                },
            });

            return NextResponse.json({
                success: true,
                data: preferences,
            });
        }

        return NextResponse.json({
            success: true,
            data: user.notificationPreference,
        });
    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: Request) {
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

        const body = await request.json();

        // Upsert preferences (create if not exists, update if exists)
        const preferences = await prisma.notificationPreference.upsert({
            where: { userId: user.id },
            update: {
                emailEnabled: body.emailEnabled,
                emailLinkViewed: body.emailLinkViewed,
                emailDocumentShared: body.emailDocumentShared,
                emailGroupInvitation: body.emailGroupInvitation,
                emailCommentMention: body.emailCommentMention,
                emailQAActivity: body.emailQAActivity,
                inAppEnabled: body.inAppEnabled,
                desktopEnabled: body.desktopEnabled,
                digestEnabled: body.digestEnabled,
                digestFrequency: body.digestFrequency,
                digestTime: body.digestTime,
                soundEnabled: body.soundEnabled,
            },
            create: {
                userId: user.id,
                emailEnabled: body.emailEnabled ?? true,
                emailLinkViewed: body.emailLinkViewed ?? true,
                emailDocumentShared: body.emailDocumentShared ?? true,
                emailGroupInvitation: body.emailGroupInvitation ?? true,
                emailCommentMention: body.emailCommentMention ?? true,
                emailQAActivity: body.emailQAActivity ?? true,
                inAppEnabled: body.inAppEnabled ?? true,
                desktopEnabled: body.desktopEnabled ?? false,
                digestEnabled: body.digestEnabled ?? false,
                digestFrequency: body.digestFrequency ?? "daily",
                digestTime: body.digestTime ?? "09:00",
                soundEnabled: body.soundEnabled ?? true,
            },
        });

        return NextResponse.json({
            success: true,
            data: preferences,
        });
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
