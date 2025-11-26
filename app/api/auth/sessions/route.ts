import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
            include: {
                sessions: {
                    orderBy: {
                        lastActivity: "desc",
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Format sessions for frontend
        const formattedSessions = user.sessions.map((s) => ({
            id: s.id,
            device: s.device || "Unknown",
            browser: s.browser || "Unknown",
            os: s.os || "Unknown",
            ipAddress: s.ipAddress || "Unknown",
            location: s.location || "Unknown",
            lastActivity: s.lastActivity,
            createdAt: s.createdAt,
            isCurrent: false, // TODO: Need to track current session ID differently
        }));

        return NextResponse.json({ sessions: formattedSessions });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json(
            { error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}
