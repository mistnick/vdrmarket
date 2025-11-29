import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/auth/audit-logger";
import { getClientIP } from "@/lib/auth/session-metadata";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { type, count, viewerEmail, timestamp } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: "Security event type is required" },
        { status: 400 }
      );
    }

    // Get link to verify it exists and get data room ID
    const link = await prisma.link.findUnique({
      where: { slug },
      select: {
        id: true,
        document: {
          select: {
            id: true,
            dataRoomId: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Get client IP
    const clientIp = await getClientIP(request);

    // Create audit log for security event
    await createAuditLog({
      action: "SECURITY_VIOLATION",
      userId: undefined,
      dataRoomId: link.document.dataRoomId,
      resourceType: "document",
      resourceId: link.document.id,
      metadata: {
        linkId: link.id,
        linkSlug: slug,
        violationType: type,
        violationCount: count || 1,
        viewerEmail: viewerEmail || null,
        clientIp,
        timestamp: timestamp || new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging security event:", error);
    // Return success anyway - security logging should not block user experience
    return NextResponse.json({ success: true });
  }
}
