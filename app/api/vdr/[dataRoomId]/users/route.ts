import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

interface RouteParams {
    params: Promise<{ dataRoomId: string }>;
}

// GET /api/vdr/[dataRoomId]/users - List all users in a data room
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Check if data room exists
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
        });

        if (!dataRoom) {
            return NextResponse.json({ error: "Data room not found" }, { status: 404 });
        }

        // Get all users in the data room through group membership
        const groupMembers = await prisma.groupMember.findMany({
            where: {
                group: {
                    dataRoomId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        emailVerified: true,
                        createdAt: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        // Group by user and collect their group memberships
        const usersMap = new Map<string, any>();

        for (const member of groupMembers) {
            if (!usersMap.has(member.userId)) {
                usersMap.set(member.userId, {
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    image: member.user.image,
                    status: member.user.emailVerified ? "ACTIVE" : "PENDING_INVITE",
                    accessType: "FULL", // Could be determined by permissions
                    accessStartAt: member.createdAt,
                    accessEndAt: null,
                    twoFactorEnabled: false, // Would need to check 2FA status
                    isActive: true,
                    groupMemberships: [],
                });
            }

            usersMap.get(member.userId).groupMemberships.push({
                group: member.group,
            });
        }

        const users = Array.from(usersMap.values());

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
