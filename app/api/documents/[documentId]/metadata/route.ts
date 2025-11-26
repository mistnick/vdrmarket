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

        // Check access to document
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

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (document.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
