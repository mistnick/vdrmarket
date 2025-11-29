import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendQAActivityEmail } from "@/lib/email/service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId,
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get data room
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
        });

        if (!dataRoom) {
            return NextResponse.json({ error: "Data room not found" }, { status: 404 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const categoryId = searchParams.get("categoryId");
        const priority = searchParams.get("priority");
        const bidderGroup = searchParams.get("bidderGroup");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        // Build where clause
        const where: any = {
            dataRoomId,
        };

        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (priority) where.priority = priority;

        // Bidder isolation: users only see questions from their bidder group
        // unless they are in ADMINISTRATOR group type
        const isAdmin = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId,
                    type: "ADMINISTRATOR",
                },
            },
        });

        if (!isAdmin && bidderGroup) {
            where.bidderGroup = bidderGroup;
        }

        // Get total count
        const total = await prisma.question.count({ where });

        // Fetch questions with relations
        const questions = await prisma.question.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
                askedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                answers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" },
            ],
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Failed to fetch questions" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check access via GroupMember
        const memberAccess = await prisma.groupMember.findFirst({
            where: {
                userId: user.id,
                group: {
                    dataRoomId,
                },
            },
        });

        if (!memberAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const {
            questionText,
            categoryId,
            priority = "normal",
            bidderGroup,
            isPrivate = false,
        } = body;

        if (!questionText) {
            return NextResponse.json(
                { error: "Question text is required" },
                { status: 400 }
            );
        }

        // Create question
        const question = await prisma.question.create({
            data: {
                dataRoomId,
                questionText,
                categoryId: categoryId || null,
                priority,
                bidderGroup: bidderGroup || null,
                isPrivate,
                askedById: user.id,
            },
            include: {
                category: true,
                askedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Notify assigned user or admins about new question
        try {
            // Find admins of the data room via ADMINISTRATOR group type
            const adminMembers = await prisma.groupMember.findMany({
                where: {
                    group: {
                        dataRoomId,
                        type: "ADMINISTRATOR",
                    },
                },
                include: {
                    user: true,
                },
            });

            for (const member of adminMembers) {
                if (member.user.id === user.id) continue; // Skip question asker

                const preferences = await prisma.notificationPreference.findUnique({
                    where: { userId: member.user.id },
                });

                if (!preferences || preferences.emailQAActivity) {
                    const questionLink = `${process.env.NEXTAUTH_URL}/datarooms/${dataRoomId}/questions`;
                    await sendQAActivityEmail({
                        to: member.user.email,
                        actorName: user.name || user.email,
                        questionTitle: questionText.substring(0, 100) + (questionText.length > 100 ? "..." : ""),
                        actionType: "question",
                        answerPreview: null,
                        link: questionLink,
                    });
                }
            }
        } catch (emailError) {
            console.error("Error sending Q&A question email:", emailError);
        }

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        console.error("Error creating question:", error);
        return NextResponse.json(
            { error: "Failed to create question" },
            { status: 500 }
        );
    }
}
