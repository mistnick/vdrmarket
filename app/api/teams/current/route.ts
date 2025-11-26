import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with team
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: {
        teams: {
          include: { team: true },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json(
        { error: "No team found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user.teams[0].team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
