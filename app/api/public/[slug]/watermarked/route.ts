import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addWatermarkToPDF, generateWatermarkText } from "@/lib/utils/watermark";
import { getStorageProvider } from "@/lib/storage";
import { createAuditLog } from "@/lib/utils/audit-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const viewerEmail = searchParams.get("email");
    const viewerName = searchParams.get("name");
    const viewId = searchParams.get("viewId");

    // Get link with document
    const link = await prisma.link.findUnique({
      where: { slug },
      include: {
        document: {
          include: {
            dataRoom: true,
          },
        },
      },
    });

    if (!link || !link.document) {
      return NextResponse.json(
        { error: "Link or document not found" },
        { status: 404 }
      );
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Link has expired" },
        { status: 403 }
      );
    }

    // Check if document is PDF
    if (!link.document.fileType.includes("pdf")) {
      return NextResponse.json(
        { error: "Watermarking only available for PDF documents" },
        { status: 400 }
      );
    }

    // Verify viewer email if provided
    if (!viewerEmail || !viewId) {
      return NextResponse.json(
        { error: "Viewer email and view ID required" },
        { status: 400 }
      );
    }

    // Verify view exists and belongs to this viewer
    const view = await prisma.view.findFirst({
      where: {
        id: viewId,
        linkId: link.id,
        viewerEmail,
      },
    });

    if (!view) {
      return NextResponse.json(
        { error: "Invalid view or viewer" },
        { status: 403 }
      );
    }

    // Get document from storage
    const storage = getStorageProvider();
    const documentBuffer = await storage.download(link.document.file);

    // Generate watermark text
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || "Unknown IP";
    const watermarkText = `${viewerEmail} • ${ipAddress} • ${new Date().toISOString()}`;
    const watermarkedPdf = await addWatermarkToPDF(documentBuffer, { text: watermarkText, opacity: 0.3, fontSize: 20, rotation: -45, color: { r: 0.5, g: 0.5, b: 0.5 } });

    // Create audit log
    await createAuditLog({
      action: "DOCUMENT_WATERMARKED",
      userId: null,
      dataRoomId: link.document.dataRoomId,
      resourceType: "DOCUMENT",
      resourceId: link.document.id,
      metadata: {
        linkSlug: slug,
        viewerEmail,
        viewerName: viewerName || null,
        viewId,
      },
    });

    // Return watermarked PDF
    return new NextResponse(new Uint8Array(watermarkedPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${link.document.name}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error generating watermarked PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate watermarked PDF" },
      { status: 500 }
    );
  }
}
