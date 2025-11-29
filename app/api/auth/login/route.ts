/**
 * Custom Login API Endpoint
 * Simple email/password authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[LOGIN API] Received login request");

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      console.log("[LOGIN API] Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    console.log("[LOGIN API] Validated email:", email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    console.log("[LOGIN API] User lookup result:", user ? `Found (id: ${user.id})` : "Not found");

    if (!user || !user.password) {
      console.log("[LOGIN API] User not found or no password set");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    console.log("[LOGIN API] Comparing passwords...");
    console.log("[LOGIN API] Input password length:", password.length);
    console.log("[LOGIN API] Stored hash prefix:", user.password.substring(0, 7));
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("[LOGIN API] Password match result:", passwordMatch);

    if (!passwordMatch) {
      console.log("[LOGIN API] Password mismatch for user:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[LOGIN API] Password verified, creating session...");

    // Create session
    await createSession(user);
    console.log("[LOGIN API] Session created successfully");

    // Clear any existing tenant cookie - user will auto-select their first tenant
    const cookieStore = await cookies();
    cookieStore.delete("current-tenant");
    console.log("[LOGIN API] Cleared tenant cookie for fresh session");

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        resourceType: "USER",
        resourceId: user.id,
        metadata: {
          method: "credentials",
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        },
      },
    }).catch(err => console.error("Failed to create audit log:", err));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    // In development, return more details
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { 
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
