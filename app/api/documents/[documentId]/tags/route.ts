import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const session = await getSession();

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Check access via GroupMember
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                OR: [
                    { ownerId: session.userId },
                    {
                        dataRoom: {
                            groups: {
                                some: {
                                    members: {
                                        some: {
                                            userId: session.userId,
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
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

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Check access via GroupMember with edit permissions (ADMINISTRATOR group type)
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                OR: [
                    { ownerId: session.userId },
                    {
                        dataRoom: {
                            groups: {
                                some: {
                                    type: "ADMINISTRATOR",
                                    members: {
                                        some: {
                                            userId: session.userId,
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
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

        // Verify tag belongs to same data room
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag || tag.dataRoomId !== document.dataRoomId) {
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
