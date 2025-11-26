import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
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

        if (!document || document.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch document tags
        const documentTags = await prisma.documentTag.findMany({
            where: { documentId },
            include: {
                tag: true,
            },
        });

        return NextResponse.json({
            tags: documentTags.map((dt) => dt.tag),
        });
    } catch (error) {
        console.error("Error fetching document tags:", error);
        return NextResponse.json(
            { error: "Failed to fetch tags" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
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

        if (!document || document.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const { tagId } = body;

        if (!tagId) {
            return NextResponse.json(
                { error: "Tag ID is required" },
                { status: 400 }
            );
        }

        // Verify tag belongs to same team
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.teamId !== document.teamId) {
            return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
        }

        // Add tag to document
        const documentTag = await prisma.documentTag.create({
            data: {
                documentId,
                tagId,
            },
            include: {
                tag: true,
            },
        });

        return NextResponse.json({ tag: documentTag.tag }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Tag already applied to document" },
                { status: 409 }
            );
        }
        console.error("Error adding tag:", error);
        return NextResponse.json(
            { error: "Failed to add tag" },
            { status: 500 }
        );
    }
}
