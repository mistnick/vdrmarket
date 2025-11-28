import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { AuditService } from "@/lib/audit/audit-service";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email }, include: {
                recoveryCodes: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify password
        if (!user.password) {
            return NextResponse.json(
                { error: "Cannot disable 2FA for SSO users" },
                { status: 400 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        // Disable 2FA and delete recovery codes
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                recoveryCodes: {
                    deleteMany: {},
                },
            },
        });

        // Log audit event
        await AuditService.log({
            userId: user.id,
            action: "security_settings",
            resourceType: "user",
            resourceId: user.id,
            metadata: {
                change: "2fa_disabled",
            },
        });

        return NextResponse.json({
            success: true,
            message: "2FA disabled successfully",
        });
    } catch (error) {
        console.error("Error disabling 2FA:", error);
        return NextResponse.json(
            { error: "Failed to disable 2FA" },
            { status: 500 }
        );
    }
}
