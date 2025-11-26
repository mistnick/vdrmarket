import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const signupSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1, "Name is required"),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate request body
        const validationResult = signupSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password, name } = validationResult.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                emailVerified: new Date(), // Auto-verify for now, implement email verification later
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        })

        // Create default personal workspace/team
        const teamSlug = `${name.toLowerCase().replace(/\s+/g, "-")}-${user.id.slice(0, 8)}`;
        
        const team = await prisma.team.create({
            data: {
                name: `${name}'s Workspace`,
                slug: teamSlug,
                plan: "free",
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER",
                    },
                },
            },
        });

        // Create audit log for signup
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "USER_SIGNUP",
                resourceType: "USER",
                resourceId: user.id,
                metadata: {
                    method: "credentials",
                    teamId: team.id,
                },
            },
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
