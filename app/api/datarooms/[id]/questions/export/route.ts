import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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

        // Get data room for name
        const dataRoom = await prisma.dataRoom.findUnique({
            where: { id: dataRoomId },
        });

        if (!dataRoom) {
            return NextResponse.json({ error: "Data room not found" }, { status: 404 });
        }

        // Get format from query
        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "excel";

        // Fetch all questions with answers
        const questions = await prisma.question.findMany({
            where: { dataRoomId },
            include: {
                category: true,
                askedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                answers: {
                    include: {
                        user: {
                            select: {
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
        });

        if (format === "excel") {
            // For Excel, we return JSON that frontend can process
            // In a real implementation, you'd use a library like exceljs
            const data = questions.map((q) => ({
                Question: q.questionText,
                Status: q.status,
                Priority: q.priority,
                Category: q.category?.name || "N/A",
                "Asked By": q.askedBy.name || q.askedBy.email,
                "Asked At": new Date(q.createdAt).toLocaleString(),
                "Answer Count": q.answers.length,
                Answers: q.answers
                    .map(
                        (a) =>
                            `${a.user.name || a.user.email}: ${a.answerText} (${new Date(
                                a.createdAt
                            ).toLocaleString()})`
                    )
                    .join(" | "),
            }));

            return NextResponse.json({
                data,
                filename: `qa-export-${dataRoom.name}-${Date.now()}.xlsx`,
            });
        } else {
            // PDF format - return structured data
            return NextResponse.json({
                dataRoom: {
                    name: dataRoom.name,
                    description: dataRoom.description,
                },
                questions: questions.map((q) => ({
                    id: q.id,
                    question: q.questionText,
                    status: q.status,
                    priority: q.priority,
                    category: q.category?.name,
                    askedBy: q.askedBy.name || q.askedBy.email,
                    askedAt: q.createdAt,
                    answers: q.answers.map((a) => ({
                        text: a.answerText,
                        answeredBy: a.user.name || a.user.email,
                        answeredAt: a.createdAt,
                    })),
                })),
                generatedAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error("Error exporting Q&A:", error);
        return NextResponse.json(
            { error: "Failed to export Q&A" },
            { status: 500 }
        );
    }
}
