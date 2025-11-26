/**
 * Session Info Endpoint
 * Restituisce le informazioni della sessione corrente
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Restituisci solo dati non sensibili
    return NextResponse.json({
      userId: session.userId,
      email: session.email,
      name: session.name,
      image: session.image,
    });
  } catch (error) {
    console.error("Session info error:", error);
    return NextResponse.json(
      { error: "Failed to get session info" },
      { status: 500 }
    );
  }
}
