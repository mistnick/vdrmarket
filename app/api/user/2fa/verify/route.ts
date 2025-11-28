/**
 * 2FA Verify API
 * Verifies the TOTP code and enables 2FA for the user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { authenticator } from "otplib";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { code } = body;

        if (!code || typeof code !== "string" || code.length !== 6) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Get user with secret
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.twoFactorSecret) {
            return NextResponse.json(
                { error: "Please setup 2FA first" },
                { status: 400 }
            );
        }

        // Verify the TOTP code
        const isValid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret,
        });

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: true,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "2FA_ENABLED",
                resourceType: "USER",
                resourceId: user.id,
                metadata: {
                    timestamp: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Two-factor authentication enabled successfully",
        });
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA code" },
            { status: 500 }
        );
    }
}
