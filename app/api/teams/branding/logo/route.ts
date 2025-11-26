import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { createAuditLog } from "@/lib/utils/audit-log";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with team membership
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: {
          include: { team: true },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json(
        { error: "No team found" },
        { status: 404 }
      );
    }

    const teamMember = user.teams[0];

    // Check permissions
    if (teamMember.role !== "owner" && teamMember.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Upload to storage
    const storage = getStorageProvider();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();
    const key = `teams/${teamMember.teamId}/logo-${Date.now()}.${extension}`;

    const uploadResult = await storage.upload(key, fileBuffer, {
      contentType: file.type,
    });

    // Update team with new logo
    const updatedTeam = await prisma.team.update({
      where: { id: teamMember.teamId },
      data: { logo: uploadResult.url },
    });

    // Create audit log
    await createAuditLog({
      action: "TEAM_LOGO_UPDATED",
      userId: user.id,
      teamId: teamMember.teamId,
      resourceType: "TEAM",
      resourceId: teamMember.teamId,
      metadata: {
        logoUrl: uploadResult.url,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    return NextResponse.json({
      message: "Logo uploaded successfully",
      logoUrl: uploadResult.url,
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}
