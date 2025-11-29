import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewActivity, getUserGroups } from "@/lib/vdr/authorization";

// GET /api/vdr/[dataRoomId]/activity - Get activity logs with filters
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const scope = searchParams.get("scope") || "self"; // self, group, all
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const action = searchParams.get("action");
        const resourceType = searchParams.get("resourceType");
        const userId = searchParams.get("userId");

        // Check permission based on scope
        if (scope === "all") {
            const canViewAll = await canViewActivity(user.id, dataRoomId, "all");
            if (!canViewAll) {
                return NextResponse.json(
                    { error: "You do not have permission to view all project activity" },
                    { status: 403 }
                );
            }
        } else if (scope === "group") {
            const canViewGroup = await canViewActivity(user.id, dataRoomId, "group");
            if (!canViewGroup) {
                return NextResponse.json(
                    { error: "You do not have permission to view group activity" },
                    { status: 403 }
                );
            }
        }

        // Build where clause
        const where: any = {};

        // Filter by resource type (document, folder, user, group, etc.)
        // For VDR, we filter activities related to this data room
        // AuditLog has dataRoomId field for filtering by DataRoom

        if (scope === "self") {
            where.userId = user.id;
        } else if (scope === "group") {
            // Get user's group members
            const groups = await getUserGroups(user.id, dataRoomId);
            const groupMemberIds: string[] = [];

            for (const group of groups) {
                const members = await prisma.groupMember.findMany({
                    where: { groupId: group.id },
                    select: { userId: true },
                });
                groupMemberIds.push(...members.map(m => m.userId));
            }

            where.userId = {
                in: [...new Set(groupMemberIds)], // Unique user IDs
            };
        }

        // Date filters
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // Action filter
        if (action) {
            where.action = action;
        }

        // Resource type filter
        if (resourceType) {
            where.resourceType = resourceType;
        }

        // Specific user filter (only for admins viewing all)
        if (userId && scope === "all") {
            where.userId = userId;
        }

        // Fetch activity logs
        const activities = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100, // Limit to 100 most recent
        });

        return NextResponse.json({
            activities,
            scope,
            filters: {
                startDate,
                endDate,
                action,
                resourceType,
                userId,
            },
        });
    } catch (error) {
        console.error("Error fetching activity:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity" },
            { status: 500 }
        );
    }
}
