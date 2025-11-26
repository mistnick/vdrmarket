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

        const { id: teamId } = await params;

        // Get user and check team membership
        const user = await prisma.user.findUnique({
            where: { email: session.email },
            include: {
                teams: {
                    where: { teamId },
                },
            },
        });

        if (!user || user.teams.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch tags
        const tags = await prisma.tag.findMany({
            where: { teamId },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ tags });
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json(
            { error: "Failed to fetch tags" },
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

        const { id: teamId } = await params;

        // Get user and check team membership
        const user = await prisma.user.findUnique({
            where: { email: session.email },
            include: {
                teams: {
                    where: { teamId },
                },
            },
        });

        if (!user || user.teams.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const { name, color } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Tag name is required" },
                { status: 400 }
            );
        }

        // Create tag
        const tag = await prisma.tag.create({
            data: {
                teamId,
                name,
                color: color || null,
            },
        });

        return NextResponse.json({ tag }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Tag with this name already exists" },
                { status: 409 }
            );
        }
        console.error("Error creating tag:", error);
        return NextResponse.json(
            { error: "Failed to create tag" },
            { status: 500 }
        );
    }
}
