import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreateGroupsInviteUsers } from "@/lib/vdr/authorization";
import crypto from "crypto";

// POST /api/vdr/[dataRoomId]/users/invite - Invite user to data room
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ dataRoomId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dataRoomId } = await params;

        // Check permission to invite users
        const canInvite = await canCreateGroupsInviteUsers(user.id, dataRoomId);
        if (!canInvite) {
            return NextResponse.json(
                { error: "You do not have permission to invite users" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            email,
            groupIds,
            accessType = "UNLIMITED",
            accessStartAt,
            accessEndAt,
            allowedIps,
            require2FA = false,
        } = body;

        // Validate required fields
        if (!email || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
            return NextResponse.json(
                { error: "Email and groupIds are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        // Get data room name for email
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
            select: { name: true },
        });

        if (existingUser) {
            // If user exists but is pending, resend invitation
            if (existingUser.status === "PENDING_INVITE") {
                // Generate new token
                const token = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                // Upsert invitation
                await prisma.userInvitation.upsert({
                    where: {
                        dataRoomId_email: {
                            dataRoomId,
                            email,
                        },
                    },
                    update: {
                        token,
                        expiresAt,
                        groupIds,
                    },
                    create: {
                        email,
                        dataRoomId,
                        groupIds,
                        token,
                        expiresAt,
                        createdById: user.id,
                    },
                });

                // Add to groups
                const addToGroups = groupIds.map((groupId: string) =>
                    prisma.groupMember.upsert({
                        where: {
                            groupId_userId: {
                                groupId,
                                userId: existingUser.id,
                            },
                        },
                        update: {},
                        create: {
                            groupId,
                            userId: existingUser.id,
                        },
                    })
                );
                await Promise.all(addToGroups);

                // Send invitation email
                let emailSent = true;
                let emailError: string | null = null;
                let emailMessage: string | null = null;
                
                try {
                    const { sendInvitationEmail, generateInvitationEmailContent } = await import("@/lib/vdr/email-service");
                    emailMessage = await generateInvitationEmailContent({
                        to: email,
                        inviterName: user.name || user.email,
                        dataRoomName: dataRoom?.name || "Virtual Data Room",
                        token,
                        expiresAt,
                    });
                    await sendInvitationEmail({
                        to: email,
                        inviterName: user.name || user.email,
                        dataRoomName: dataRoom?.name || "Virtual Data Room",
                        token,
                        expiresAt,
                    });
                } catch (err) {
                    console.error("Error sending invitation email:", err);
                    emailSent = false;
                    emailError = err instanceof Error ? err.message : "Failed to send email";
                }

                return NextResponse.json({
                    message: "Invitation resent successfully",
                    userId: existingUser.id,
                    existing: true,
                    emailSent,
                    emailError,
                    emailMessage: emailSent ? null : emailMessage,
                });
            }

            // Check if user is a member of any group in this dataRoom
            const existingMembershipInDataRoom = await prisma.groupMember.findFirst({
                where: {
                    userId: existingUser.id,
                    group: {
                        dataRoomId: dataRoomId,
                    },
                },
            });

            // If user exists but is NOT a member of any group in this dataRoom,
            // treat them as a new invite with PENDING status
            if (!existingMembershipInDataRoom) {
                // Generate token for new invitation
                const token = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                // Create or update invitation
                await prisma.userInvitation.upsert({
                    where: {
                        dataRoomId_email: {
                            dataRoomId,
                            email,
                        },
                    },
                    update: {
                        token,
                        expiresAt,
                        groupIds,
                    },
                    create: {
                        email,
                        dataRoomId,
                        groupIds,
                        token,
                        expiresAt,
                        createdById: user.id,
                    },
                });

                // Update user status to PENDING_INVITE for this dataRoom context
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { status: "PENDING_INVITE" },
                });

                // Add to groups with pending status
                const addToGroups = groupIds.map((groupId: string) =>
                    prisma.groupMember.upsert({
                        where: {
                            groupId_userId: {
                                groupId,
                                userId: existingUser.id,
                            },
                        },
                        update: {},
                        create: {
                            groupId,
                            userId: existingUser.id,
                        },
                    })
                );
                await Promise.all(addToGroups);

                // Send invitation email
                let emailSent = true;
                let emailError: string | null = null;
                let emailMessage: string | null = null;
                
                try {
                    const { sendInvitationEmail, generateInvitationEmailContent } = await import("@/lib/vdr/email-service");
                    emailMessage = await generateInvitationEmailContent({
                        to: email,
                        inviterName: user.name || user.email,
                        dataRoomName: dataRoom?.name || "Virtual Data Room",
                        token,
                        expiresAt,
                    });
                    await sendInvitationEmail({
                        to: email,
                        inviterName: user.name || user.email,
                        dataRoomName: dataRoom?.name || "Virtual Data Room",
                        token,
                        expiresAt,
                    });
                } catch (err) {
                    console.error("Error sending invitation email:", err);
                    emailSent = false;
                    emailError = err instanceof Error ? err.message : "Failed to send email";
                }

                return NextResponse.json({
                    message: "Invitation sent successfully",
                    userId: existingUser.id,
                    existing: true,
                    reinvited: true,
                    emailSent,
                    emailError,
                    emailMessage: emailSent ? null : emailMessage,
                });
            }

            // User is active and already in this dataRoom
            // Check if they're already in any of these specific groups
            const existingMemberships = await prisma.groupMember.findMany({
                where: {
                    userId: existingUser.id,
                    groupId: { in: groupIds },
                },
            });

            if (existingMemberships.length === groupIds.length) {
                return NextResponse.json({
                    message: "User is already a member of all selected groups",
                    userId: existingUser.id,
                    existing: true,
                    alreadyMember: true,
                });
            }

            // Add them to the groups they're not already in
            const addToGroups = groupIds.map((groupId: string) =>
                prisma.groupMember.upsert({
                    where: {
                        groupId_userId: {
                            groupId,
                            userId: existingUser.id,
                        },
                    },
                    update: {},
                    create: {
                        groupId,
                        userId: existingUser.id,
                    },
                })
            );

            await Promise.all(addToGroups);

            return NextResponse.json({
                message: "User already exists and has been added to the groups",
                userId: existingUser.id,
                existing: true,
            });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        // Create invitation
        const invitation = await prisma.userInvitation.create({
            data: {
                email,
                dataRoomId,
                groupIds,
                token,
                expiresAt,
                createdById: user.id,
            },
        });

        // Create user with PENDING_INVITE status
        const newUser = await prisma.user.create({
            data: {
                email,
                status: "PENDING_INVITE",
                accessType,
                accessStartAt: accessStartAt ? new Date(accessStartAt) : null,
                accessEndAt: accessEndAt ? new Date(accessEndAt) : null,
                allowedIps,
                twoFactorEnabled: require2FA,
            },
        });

        // Send invitation email
        let emailSent = true;
        let emailError: string | null = null;
        let emailMessage: string | null = null;
        
        try {
            const { sendInvitationEmail, generateInvitationEmailContent } = await import("@/lib/vdr/email-service");
            emailMessage = await generateInvitationEmailContent({
                to: email,
                inviterName: user.name || user.email,
                dataRoomName: dataRoom?.name || "Virtual Data Room",
                token,
                expiresAt,
            });
            await sendInvitationEmail({
                to: email,
                inviterName: user.name || user.email,
                dataRoomName: dataRoom?.name || "Virtual Data Room",
                token,
                expiresAt,
            });
        } catch (err) {
            console.error("Error sending invitation email:", err);
            emailSent = false;
            emailError = err instanceof Error ? err.message : "Failed to send email";
            // Don't fail the invitation if email fails
        }

        return NextResponse.json({
            message: "Invitation sent successfully",
            invitationId: invitation.id,
            userId: newUser.id,
            emailSent,
            emailError,
            emailMessage: emailSent ? null : emailMessage,
        }, { status: 201 });
    } catch (error) {
        console.error("Error inviting user:", error);
        return NextResponse.json(
            { error: "Failed to invite user" },
            { status: 500 }
        );
    }
}
