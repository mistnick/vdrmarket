import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
    request: NextRequest,
    {
        params,
    }: { params: Promise<{ id: string; categoryId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId, categoryId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify category ownership
        const category = await prisma.qACategory.findUnique({
            where: { id: categoryId },
            include: {
                dataRoom: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: { userId: user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (
            !category ||
            category.dataRoomId !== dataRoomId ||
            category.dataRoom.team.members.length === 0
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const { name, description, color, order } = body;

        // Update category
        const updated = await prisma.qACategory.update({
            where: { id: categoryId },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
                ...(order !== undefined && { order }),
            },
        });

        return NextResponse.json({ category: updated });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Category with this name already exists" },
                { status: 409 }
            );
        }
        console.error("Error updating QA category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    {
        params,
    }: { params: Promise<{ id: string; categoryId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId, categoryId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify category ownership
        const category = await prisma.qACategory.findUnique({
            where: { id: categoryId },
            include: {
                dataRoom: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: { userId: user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (
            !category ||
            category.dataRoomId !== dataRoomId ||
            category.dataRoom.team.members.length === 0
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        //Delete category (questions will have categoryId set to null)
        await prisma.qACategory.delete({
            where: { id: categoryId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting QA category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
