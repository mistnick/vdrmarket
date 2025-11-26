import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { authenticator } from "otplib";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user || !user.twoFactorSecret) {
            return NextResponse.json(
                { error: "2FA not set up" },
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
                { error: "Invalid code" },
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

        return NextResponse.json({
            success: true,
            message: "2FA enabled successfully",
        });
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return NextResponse.json(
            { error: "Failed to verify 2FA" },
            { status: 500 }
        );
    }
}
