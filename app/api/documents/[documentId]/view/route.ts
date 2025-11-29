import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { AuditService } from "@/lib/audit/audit-service";

interface RouteParams {
    params: Promise<{ documentId: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { documentId } = await params;
        const session = await getSession();

        if (!session?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the document via GroupMember access
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
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        // Log audit event
        await AuditService.log({
            userId: session.userId,
            dataRoomId: document.dataRoomId,
            action: "viewed",
            resourceType: "document",
            resourceId: document.id,
            metadata: {
                documentName: document.name,
                fileType: document.fileType,
            },
        });

        // Check if redirect is requested
        const { searchParams } = new URL(request.url);
        const redirect = searchParams.get("redirect") === "true";

        // Get storage provider
        const storage = getStorageProvider();

        // For document viewing, always generate base64 data URL
        // This avoids CORS and network issues with MinIO internal URLs
        let url: string;

        try {
            const fileBuffer = await storage.download(document.file);
            const base64 = Buffer.from(fileBuffer).toString("base64");
            url = `data:${document.fileType};base64,${base64}`;
        } catch (downloadError) {
            console.error("Error downloading document for view:", downloadError);
            return NextResponse.json(
                { error: "Failed to load document from storage" },
                { status: 500 }
            );
        }

        // If redirect is requested, we can't redirect to data URL
        // Instead return it as inline content
        if (redirect) {
            const fileBuffer = await storage.download(document.file);
            return new NextResponse(new Uint8Array(fileBuffer), {
                headers: {
                    "Content-Type": document.fileType,
                    "Content-Disposition": `inline; filename="${encodeURIComponent(document.name)}"`,
                },
            });
        }

        // Return the URL and document info
        return NextResponse.json({
            success: true,
            url,
            document: {
                id: document.id,
                name: document.name,
                fileType: document.fileType,
                fileSize: document.fileSize,
            },
        });
    } catch (error) {
        console.error("Error getting document view URL:", error);
        return NextResponse.json(
            { error: "Failed to get document URL" },
            { status: 500 }
        );
    }
}
