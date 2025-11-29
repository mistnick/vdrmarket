import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendCommentMentionEmail } from "@/lib/email/service";

// Extract @mentions from comment text
function extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                dataRoom: {
                    include: {
                        groups: {
                            include: {
                                members: {
                                    where: { userId: user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        const hasAccessGet = document?.dataRoom.groups.some(
            (g) => g.members.length > 0
        );

        if (!document || !hasAccessGet) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch comments (only root comments, replies loaded nested)
        const comments = await prisma.comment.findMany({
            where: {
                documentId,
                parentId: null, // Only root comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        mentions: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                mentions: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                dataRoom: {
                    include: {
                        groups: {
                            include: {
                                members: {
                                    where: { userId: user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        const hasAccess = document?.dataRoom.groups.some(
            (g) => g.members.length > 0
        );

        if (!document || !hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse body
        const body = await request.json();
        const { content, parentId, isPrivate = false } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Extract @mentions
        const mentionedUsernames = extractMentions(content);

        // Find mentioned users in the same dataRoom
        const mentionedUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: mentionedUsernames.map((username) => `${username}@*`), // Simplified
                },
                groupMemberships: {
                    some: {
                        group: {
                            dataRoomId: document.dataRoomId,
                        },
                    },
                },
            },
        });

        // Create comment with mentions in transaction
        const comment = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comment.create({
                data: {
                    documentId,
                    userId: user.id,
                    content,
                    parentId: parentId || null,
                    isPrivate,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            });

            // Create mention records
            if (mentionedUsers.length > 0) {
                await tx.commentMention.createMany({
                    data: mentionedUsers.map((mu) => ({
                        commentId: newComment.id,
                        userId: mu.id,
                    })),
                });
            }

            return newComment;
        });

        // Send email notifications to mentioned users (respecting preferences)
        if (mentionedUsers.length > 0) {
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                select: { name: true },
            });

            for (const mentionedUser of mentionedUsers) {
                try {
                    // Check user's notification preferences
                    const preferences = await prisma.notificationPreference.findUnique({
                        where: { userId: mentionedUser.id },
                    });

                    if (!preferences || preferences.emailCommentMention) {
                        const commentLink = `${process.env.NEXTAUTH_URL}/documents/${documentId}#comment-${comment.id}`;
                        await sendCommentMentionEmail({
                            to: mentionedUser.email,
                            mentionerName: user.name || user.email,
                            documentName: document?.name || "a document",
                            commentPreview: content.substring(0, 150) + (content.length > 150 ? "..." : ""),
                            link: commentLink,
                        });
                    }
                } catch (emailError) {
                    console.error("Error sending comment mention email:", emailError);
                }
            }
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
