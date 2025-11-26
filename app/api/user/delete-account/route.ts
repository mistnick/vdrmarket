import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, apiLimiter } from "@/lib/rate-limit";
import { z } from "zod";

const deleteSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT"),
  password: z.string().min(1),
});

/**
 * GDPR Account Deletion Endpoint
 * Permanently deletes user account and all associated data
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiLimiter, 3);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    // Authentication
    const session = await getSession();
    if (!session || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedFields = deleteSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { password } = validatedFields.data;

    // Verify password for accounts with password
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      const bcrypt = require("bcryptjs");
      const passwordsMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordsMatch) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Create final audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETION",
        resourceType: "USER",
        resourceId: user.id,
        metadata: {
          deletionDate: new Date().toISOString(),
          email: user.email,
        },
      },
    });

    // Delete user data in correct order (respecting foreign keys)
    // 1. Delete views
    await prisma.view.deleteMany({
      where: { viewerEmail: user.email },
    });

    // 2. Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    // 3. Delete links
    await prisma.link.deleteMany({
      where: { createdBy: user.id },
    });

    // 4. Delete documents
    await prisma.document.deleteMany({
      where: { ownerId: user.id },
    });

    // 5. Delete folders
    await prisma.folder.deleteMany({
      where: { ownerId: user.id },
    });

    // 6. Remove team memberships (but don't delete teams)
    await prisma.teamMember.deleteMany({
      where: { userId: user.id },
    });

    // 7. Delete sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // 8. Delete accounts
    await prisma.account.deleteMany({
      where: { userId: user.id },
    });

    // 9. Audit logs are kept for compliance (anonymized)
    await prisma.auditLog.updateMany({
      where: { userId: user.id },
      data: {
        metadata: {
          anonymized: true,
          originalUserId: user.id,
        },
      },
    });

    // 10. Finally, delete the user
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json(
      {
        message: "Account successfully deleted",
        deletedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
