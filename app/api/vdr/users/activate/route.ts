import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

// POST /api/vdr/users/activate - Activate user account
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, password, name } = body;

        // Validate required fields
        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        // Find invitation by token
        const invitation = await prisma.userInvitation.findUnique({
            where: { token },
            include: {
                dataRoom: true,
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: "Invalid invitation token" },
                { status: 404 }
            );
        }

        // Check if token is expired
        if (invitation.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invitation token has expired" },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: invitation.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is already active
        if (user.status === "ACTIVE") {
            return NextResponse.json(
                { error: "User is already activated" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                name: name || user.name,
                status: "ACTIVE",
                emailVerified: new Date(),
            },
        });

        // Add user to groups from invitation
        const groupIds = invitation.groupIds as string[];
        const addToGroups = groupIds.map((groupId: string) =>
            prisma.groupMember.upsert({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: user.id,
                    },
                },
                update: {},
                create: {
                    groupId,
                    userId: user.id,
                },
            })
        );

        await Promise.all(addToGroups);

        // Delete the invitation token (one-time use)
        await prisma.userInvitation.delete({
            where: { id: invitation.id },
        });

        return NextResponse.json({
            message: "Account activated successfully",
            userId: user.id,
            dataRoomId: invitation.dataRoomId,
        });
    } catch (error) {
        console.error("Error activating user:", error);
        return NextResponse.json(
            { error: "Failed to activate account" },
            { status: 500 }
        );
    }
}
