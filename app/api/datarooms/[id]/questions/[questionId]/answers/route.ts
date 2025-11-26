import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendQAActivityEmail } from "@/lib/email/service";

export async function POST(
    request: NextRequest,
    {
        params,
    }: { params: Promise<{ id: string; questionId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dataRoomId, questionId } = await params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get question and verify access
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                dataRoom: {
                    include: {
                        team: {
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

        if (!question || question.dataRoomId !== dataRoomId) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (question.dataRoom.team.members.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { answerText } = body;

        if (!answerText) {
            return NextResponse.json(
                { error: "Answer text is required" },
                { status: 400 }
            );
        }

        // Create answer and update question status
        const [answer] = await prisma.$transaction([
            prisma.answer.create({
                data: {
                    questionId,
                    answerText,
                    answeredBy: user.id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.question.update({
                where: { id: questionId },
                data: { status: "answered" },
            }),
        ]);

        // Notify question asker about new answer
        try {
            const questionAsker = await prisma.user.findUnique({
                where: { id: question.askedById },
            });

            if (questionAsker && questionAsker.id !== user.id) {
                const preferences = await prisma.notificationPreference.findUnique({
                    where: { userId: questionAsker.id },
                });

                if (!preferences || preferences.emailQAActivity) {
                    const questionLink = `${process.env.NEXTAUTH_URL}/datarooms/${dataRoomId}/questions#question-${questionId}`;
                    await sendQAActivityEmail({
                        to: questionAsker.email,
                        actorName: user.name || user.email,
                        questionTitle: question.questionText.substring(0, 100) + (question.questionText.length > 100 ? "..." : ""),
                        actionType: "answer",
                        answerPreview: answerText.substring(0, 150) + (answerText.length > 150 ? "..." : ""),
                        link: questionLink,
                    });
                }
            }
        } catch (emailError) {
            console.error("Error sending Q&A answer email:", emailError);
        }

        return NextResponse.json({ answer }, { status: 201 });
    } catch (error) {
        console.error("Error creating answer:", error);
        return NextResponse.json(
            { error: "Failed to create answer" },
            { status: 500 }
        );
    }
}
