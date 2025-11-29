import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // (don't reveal if email exists or not)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // TODO: Send email using email service
    // For now, just log the URL (in production, use Resend or similar)
    console.log(`Password reset URL for ${email}: ${resetUrl}`);

    // Send email using configured email service (SMTP, Resend, SES, etc.)
    try {
      const { sendPasswordResetEmail } = await import("@/lib/email/service");
      const emailSent = await sendPasswordResetEmail({
        to: email,
        userName: user.name || "User",
        resetLink: resetUrl,
      });

      if (emailSent) {
        console.log(`✅ Password reset email sent to ${email}`);
      } else {
        console.error(`❌ Failed to send password reset email to ${email}`);
      }
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
