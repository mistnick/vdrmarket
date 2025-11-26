import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/utils/audit-log";

export async function PATCH(request: NextRequest) {
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

    // Check if user has permission (only owner/admin can change branding)
    if (teamMember.role !== "owner" && teamMember.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      brandColor,
      accentColor,
      customDomain,
      watermarkEnabled,
      watermarkText,
      watermarkOpacity,
    } = body;

    // Validate colors if provided
    if (brandColor && !/^#[0-9A-F]{6}$/i.test(brandColor)) {
      return NextResponse.json(
        { error: "Invalid brand color format" },
        { status: 400 }
      );
    }

    if (accentColor && !/^#[0-9A-F]{6}$/i.test(accentColor)) {
      return NextResponse.json(
        { error: "Invalid accent color format" },
        { status: 400 }
      );
    }

    // Validate watermark opacity
    if (watermarkOpacity !== undefined && (watermarkOpacity < 0.1 || watermarkOpacity > 0.9)) {
      return NextResponse.json(
        { error: "Watermark opacity must be between 0.1 and 0.9" },
        { status: 400 }
      );
    }

    // Update team branding settings
    const updatedTeam = await prisma.team.update({
      where: { id: teamMember.teamId },
      data: {
        brandColor: brandColor || undefined,
        accentColor: accentColor || undefined,
        customDomain: customDomain || undefined,
        watermarkEnabled: watermarkEnabled !== undefined ? watermarkEnabled : undefined,
        watermarkText: watermarkText || undefined,
        watermarkOpacity: watermarkOpacity !== undefined ? watermarkOpacity : undefined,
      },
    });

    // Create audit log
    await createAuditLog({
      action: "TEAM_BRANDING_UPDATED",
      userId: user.id,
      teamId: teamMember.teamId,
      resourceType: "TEAM",
      resourceId: teamMember.teamId,
      metadata: {
        changes: {
          brandColor,
          accentColor,
          customDomain,
          watermarkEnabled,
          watermarkOpacity,
        },
      },
    });

    return NextResponse.json({
      message: "Branding settings updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating branding settings:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings" },
      { status: 500 }
    );
  }
}
