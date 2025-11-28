/**
 * 2FA Setup API
 * Generates TOTP secret and QR code for enabling 2FA
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                name: true,
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

        // Check if 2FA is already enabled
        if (user.twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is already enabled" },
                { status: 400 }
            );
        }

        // Generate new secret
        const secret = authenticator.generateSecret();

        // Create otpauth URL
        const appName = "SimpleVDR";
        const otpauthUrl = authenticator.keyuri(
            user.email,
            appName,
            secret
        );

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });

        // Store the pending secret temporarily (will be confirmed on verification)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorSecret: secret,
            },
        });

        return NextResponse.json({
            success: true,
            qrCode: qrCodeDataUrl,
            secret: secret, // Show for manual entry
            otpauthUrl,
        });
    } catch (error) {
        console.error("Error setting up 2FA:", error);
        return NextResponse.json(
            { error: "Failed to setup 2FA" },
            { status: 500 }
        );
    }
}
