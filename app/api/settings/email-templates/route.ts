import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/settings/email-templates - Get all email templates
export async function GET() {
    try {
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const templates = await prisma.emailTemplate.findMany({
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: templates,
        });
    } catch (error) {
        console.error("Error fetching email templates:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/settings/email-templates - Create or update an email template
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, subject, htmlContent, textContent } = body;

        if (!name || !subject || !htmlContent) {
            return NextResponse.json(
                { success: false, error: "Name, subject and content are required" },
                { status: 400 }
            );
        }

        // Upsert template (create if not exists, update if exists)
        const template = await prisma.emailTemplate.upsert({
            where: { name },
            update: {
                subject,
                htmlContent,
                textContent: textContent || null,
                updatedAt: new Date(),
            },
            create: {
                name,
                subject,
                htmlContent,
                textContent: textContent || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: template,
        });
    } catch (error) {
        console.error("Error saving email template:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
