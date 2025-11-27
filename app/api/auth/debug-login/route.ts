/**
 * Debug endpoint for login testing
 * REMOVE IN PRODUCTION
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[DEBUG LOGIN] Received request for:", email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
      },
    });

    console.log("[DEBUG LOGIN] User found:", user ? "Yes" : "No");

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        debug: {
          searchedEmail: email.toLowerCase(),
        },
      });
    }

    console.log("[DEBUG LOGIN] User has password:", user.password ? "Yes" : "No");

    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: "User has no password set",
        debug: {
          userId: user.id,
          email: user.email,
          hasPassword: false,
        },
      });
    }

    // Test password
    console.log("[DEBUG LOGIN] Comparing passwords...");
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("[DEBUG LOGIN] Password match:", passwordMatch);

    // Also test with different hash method
    const storedHashFirstChars = user.password.substring(0, 7);
    
    return NextResponse.json({
      success: passwordMatch,
      debug: {
        userId: user.id,
        email: user.email,
        hasPassword: true,
        passwordMatch,
        hashType: storedHashFirstChars, // Shows $2a$10 or similar
        inputPasswordLength: password.length,
        storedHashLength: user.password.length,
        emailVerified: user.emailVerified ? true : false,
      },
    });
  } catch (error) {
    console.error("[DEBUG LOGIN] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
