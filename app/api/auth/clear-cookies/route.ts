/**
 * Clear Auth Cookies API Endpoint
 * Used to clean up invalid JWT tokens and force re-login
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_COOKIES = [
  "authjs.session-token",
  "authjs.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.csrf-token",
  "dataroom-session",
];

export async function POST() {
  try {
    const cookieStore = await cookies();

    for (const name of AUTH_COOKIES) {
      try {
        cookieStore.delete(name);
      } catch {
        // Ignore errors
      }
    }

    return NextResponse.json({ success: true, message: "Cookies cleared" });
  } catch (error) {
    console.error("Error clearing cookies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cookies" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
