import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is already enabled" },
                { status: 400 }
            );
        }

        // Generate TOTP secret
        const secret = authenticator.generateSecret();

        // Generate OTP auth URL for QR code
        const otpAuth = authenticator.keyuri(
            user.email,
            "DataRoom VDR",
            secret
        );

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(otpAuth);

        // Generate 10 recovery codes
        const recoveryCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString("hex").toUpperCase()
        );

        // Store secret temporarily (will be confirmed after verification)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorSecret: secret,
                // Don't enable yet - wait for verification
            },
        });

        // Store recovery codes (hashed for security)
        await Promise.all(
            recoveryCodes.map((code) =>
                prisma.recoveryCode.create({
                    data: {
                        code: crypto.createHash("sha256").update(code).digest("hex"),
                        userId: user.id,
                    },
                })
            )
        );

        return NextResponse.json({
            secret,
            qrCode: qrCodeDataUrl,
            recoveryCodes, // Return plain codes to user (only shown once)
        });
    } catch (error) {
        console.error("Error enabling 2FA:", error);
        return NextResponse.json(
            { error: "Failed to enable 2FA" },
            { status: 500 }
        );
    }
}
