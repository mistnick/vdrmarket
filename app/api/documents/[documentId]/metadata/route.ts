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

        // Check access to document via GroupMember
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
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
        }

        // Fetch metadata
        const metadata = await prisma.documentMetadata.findMany({
            where: { documentId },
            orderBy: { key: "asc" },
        });

        return NextResponse.json({ metadata });
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return NextResponse.json(
            { error: "Failed to fetch metadata" },
            { status: 500 }
        );
    }
}

export async function PUT(
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
        const { metadata } = body; // Array of { key, value, type }

        if (!Array.isArray(metadata)) {
            return NextResponse.json(
                { error: "Metadata must be an array" },
                { status: 400 }
            );
        }

        // Delete existing metadata and create new ones (bulk update)
        await prisma.$transaction([
            prisma.documentMetadata.deleteMany({
                where: { documentId },
            }),
            prisma.documentMetadata.createMany({
                data: metadata.map((item: any) => ({
                    documentId,
                    key: item.key,
                    value: String(item.value),
                    type: item.type || "text",
                })),
            }),
        ]);

        // Fetch updated metadata
        const updated = await prisma.documentMetadata.findMany({
            where: { documentId },
            orderBy: { key: "asc" },
        });

        return NextResponse.json({ metadata: updated });
    } catch (error) {
        console.error("Error updating metadata:", error);
        return NextResponse.json(
            { error: "Failed to update metadata" },
            { status: 500 }
        );
    }
}
