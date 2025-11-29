import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewDueDiligenceChecklist, isAdministrator } from "@/lib/vdr/authorization";

// GET /api/vdr/[dataRoomId]/due-diligence - Get checklist
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

        // Check permission
        const canView = await canViewDueDiligenceChecklist(user.id, dataRoomId);
        if (!canView) {
            return NextResponse.json(
                { error: "You do not have permission to view the due diligence checklist" },
                { status: 403 }
            );
        }

        // Get checklists for this data room
        const checklists = await prisma.dueDiligenceChecklist.findMany({
            where: { dataRoomId },
            include: {
                items: {
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(checklists);
    } catch (error) {
        console.error("Error fetching due diligence checklists:", error);
        return NextResponse.json(
            { error: "Failed to fetch checklists" },
            { status: 500 }
        );
    }
}

// POST /api/vdr/[dataRoomId]/due-diligence - Create checklist (admin only)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Only administrators can create checklists
        const isAdmin = await isAdministrator(user.id, dataRoomId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Only administrators can create checklists" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { name, description, items } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Create checklist with items
        const checklist = await prisma.dueDiligenceChecklist.create({
            data: {
                name,
                description,
                dataRoomId,
                items: items
                    ? {
                        create: items.map((item: any, index: number) => ({
                            title: item.title,
                            description: item.description,
                            order: item.order ?? index,
                        })),
                    }
                    : undefined,
            },
            include: {
                items: true,
            },
        });

        return NextResponse.json(checklist, { status: 201 });
    } catch (error) {
        console.error("Error creating checklist:", error);
        return NextResponse.json(
            { error: "Failed to create checklist" },
            { status: 500 }
        );
    }
}
