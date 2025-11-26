import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
            include: {
                team: {
                    include: {
                        members: {
                            where: { userId: user.id },
                        },
                    },
                },
            },
        });

        if (!dataRoom || dataRoom.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch categories
        const categories = await prisma.qACategory.findMany({
            where: { dataRoomId },
            orderBy: { order: "asc" },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching QA categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
            include: {
                team: {
                    include: {
                        members: {
                            where: { userId: user.id },
                        },
                    },
                },
            },
        });

        if (!dataRoom || dataRoom.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const { name, description, color } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Get next order
        const lastCategory = await prisma.qACategory.findFirst({
            where: { dataRoomId },
            orderBy: { order: "desc" },
            select: { order: true },
        });

        const nextOrder = (lastCategory?.order || 0) + 1;

        // Create category
        const category = await prisma.qACategory.create({
            data: {
                dataRoomId,
                name,
                description: description || null,
                color: color || null,
                order: nextOrder,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Category with this name already exists" },
                { status: 409 }
            );
        }
        console.error("Error creating QA category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}
